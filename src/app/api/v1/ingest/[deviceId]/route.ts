import { createClient } from '@/lib/supabase/server';
import { executeDecoder } from '@/lib/decoder-sandbox';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  
  try {
    const supabase = await createClient();
    const payload = await request.json();

    // 1. Fetch device and its active decoder
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select(`
        id, 
        workspace_id,
        payload_decoders (
          code,
          is_active
        )
      `)
      .eq('id', deviceId)
      .single();

    if (deviceError || !device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // 2. Decode the payload
    let decodedData = payload.data || {};
    const activeDecoder = (device.payload_decoders as any)?.find((d: any) => d.is_active);

    if (activeDecoder && payload.raw) {
      const result = executeDecoder(activeDecoder.code, payload.raw);
      if (result.error) {
        console.warn('Decoder error:', result.error);
        // We still continue or log it as an error measurement
      } else {
        decodedData = { ...decodedData, ...result.data };
      }
    }

    // 3. Map fields and insert measurements
    const { data: fields } = await supabase
      .from('fields')
      .select('id, alias')
      .eq('device_id', deviceId);

    const measurements = Object.entries(decodedData).map(([alias, value]) => {
      const field = fields?.find(f => f.alias === alias);
      if (!field) return null;
      
      return {
        device_id: deviceId,
        field_id: field.id,
        time: payload.timestamp || new Date().toISOString(),
        value: Number(value),
      };
    }).filter(Boolean);

    if (measurements.length > 0) {
      const { error: insertError } = await supabase
        .from('measurements')
        .insert(measurements as any);

      if (insertError) throw insertError;
    }

    // 4. Update device status
    await supabase
      .from('devices')
      .update({ last_seen: new Date().toISOString(), status: 'online' })
      .eq('id', deviceId);

    return NextResponse.json({ success: true, count: measurements.length });
  } catch (error: any) {
    console.error('Ingestion error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
