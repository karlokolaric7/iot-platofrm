import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin client for background processing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("Device Data Landing:", JSON.stringify(payload, null, 2));

    const devEui = payload.deviceInfo?.devEui || payload.devEui;
    const object = payload.object; // This is the payload decoded by the ChirpStack codec

    if (!devEui) {
      return NextResponse.json({ error: "Missing devEui" }, { status: 400 });
    }

    // 1. Find the device in our local registry (case-insensitive)
    const { data: device, error: deviceErr } = await supabase
      .from('devices')
      .select('id, workspace_id')
      .ilike('dev_eui', devEui)
      .single();

    if (deviceErr || !device) {
      console.warn(`Device not recognized in registry: ${devEui}`);
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // 2. Insert into device_logs for the Live Payload Debugger
    const { error: logErr } = await supabase
      .from('device_logs')
      .insert({
        device_id: device.id,
        dev_eui: devEui,
        event_type: payload.deduplicationId ? 'uplink' : 'event',
        f_port: payload.fPort || 0,
        f_cnt: payload.fCnt || 0,
        raw_payload: payload,
        created_at: new Date().toISOString()
      });

    if (logErr) {
      console.error("Error inserting device log:", logErr);
    }

    // 3. Fetch all fields for this device in one batch for optimized mapping
    const { data: fields } = await supabase
      .from('fields')
      .select('id, name, alias')
      .eq('device_id', device.id);

    // 3. Check for our platform's custom payload decoder
    let decodedObject = payload.object || {};
    const { data: decoder } = await supabase
      .from('payload_decoders')
      .select('code')
      .eq('device_id', device.id)
      .eq('is_active', true)
      .maybeSingle();

    if (decoder?.code && payload.data) {
      try {
        console.log(`Executing custom decoder for device: ${devEui}`);
        // 1. Convert Base64 payload to bytes
        const bytes = Buffer.from(payload.data, 'base64');
        const bytesArray = Array.from(bytes);
        const port = payload.fPort || 1;

        // 2. Wrap script and try multiple standard entry points
        // We try: Decoder(bytes, port), Decode(port, bytes), decodeUplink({bytes, fPort})
        const wrapper = `
          ${decoder.code}
          function __runDecoder(bytes, port) {
            if (typeof Decoder === 'function') return Decoder(bytes, port);
            if (typeof Decode === 'function') return Decode(port, bytes);
            if (typeof decodeUplink === 'function') return decodeUplink({ bytes, fPort: port });
            return null;
          }
        `;

        // eslint-disable-next-line no-new-func
        const fn = new Function("bytes", "port", `${wrapper}; return __runDecoder(bytes, port);`);
        let result = fn(bytesArray, port);
        
        // 3. Normalize result (Milesight often returns { data: { ... } })
        if (result && typeof result === 'object') {
          if ('data' in result && result.data && typeof result.data === 'object' && !('co2' in result)) {
            result = result.data;
          }
          decodedObject = { ...decodedObject, ...result };
          console.log("Custom decoder result:", JSON.stringify(result));
        }
      } catch (err: any) {
        console.error("Custom Decoder Error:", err.message);
        await supabase.from('device_logs').insert({
          device_id: device.id,
          dev_eui: devEui,
          event_type: 'error',
          raw_payload: { error: "Decoder failed", details: err.message },
          created_at: new Date().toISOString()
        });
      }
    }

    // 4. Map the decoded keys to our platform "Fields"
    const measurements: any[] = [];
    if (decodedObject && fields) {
      // Create a case-insensitive map of aliases/names to field IDs
      const fieldMap = new Map();
      fields.forEach(f => {
        if (f.alias) fieldMap.set(f.alias.toLowerCase(), f.id);
        if (f.name) fieldMap.set(f.name.toLowerCase(), f.id);
      });
      
      for (const [key, value] of Object.entries(decodedObject)) {
        const normalizedKey = key.toLowerCase();
        const fieldId = fieldMap.get(normalizedKey);

        if (fieldId && (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string')) {
          // Handle numeric conversion
          let numericValue: number;
          if (typeof value === 'boolean') {
            numericValue = value ? 1 : 0;
          } else if (typeof value === 'string') {
            numericValue = parseFloat(value);
            if (isNaN(numericValue)) continue;
          } else {
            numericValue = value;
          }

          measurements.push({
            device_id: device.id,
            field_id: fieldId,
            value: numericValue,
            time: new Date().toISOString(),
            metadata: { 
              rssi: payload.rxInfo?.[0]?.rssi, 
              snr: payload.rxInfo?.[0]?.snr,
              fCnt: payload.fCnt,
              fPort: payload.fPort
            }
          });
        }
      }

      if (measurements.length > 0) {
        const { error: insertErr } = await supabase
          .from('measurements')
          .insert(measurements);
        
        if (insertErr) {
          console.error("Failed to save measurements:", insertErr);
        }
      }
    }

    // Update last_seen for the device
    await supabase
      .from('devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', device.id);

    return NextResponse.json({ 
      success: true, 
      processed: measurements.length,
      decoder_run: !!decoder?.code
    });
  } catch (err: any) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
