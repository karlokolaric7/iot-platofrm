// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.11.0"

// ─── Supabase Client ────────────────────────────────────────────────────────
// @ts-ignore
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'http://host.docker.internal:54321'
// @ts-ignore
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
// @ts-ignore
const AUTO_REGISTER = Deno.env.get('TEKTELIC_AUTO_REGISTER') === 'true' || true
// @ts-ignore
const STRESS_TEST_WORKSPACE_ID = Deno.env.get('STRESS_TEST_WORKSPACE_ID') || '248dba02-3aab-4584-8501-d8a73455b147'

const supabase = createClient(supabaseUrl, supabaseKey)

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Attempts to decode a Base64 raw payload using the device's registered
 * JS decoder from the payload_decoders table.
 * Returns decoded key-value pairs or null if no decoder / decode fails.
 */
async function tryBase64Decode(
  deviceId: string,
  base64Payload: string,
  fPort: number
): Promise<Record<string, number> | null> {
  try {
    const { data: decoderRow } = await supabase
      .from('payload_decoders')
      .select('code')
      .eq('device_id', deviceId)
      .eq('is_active', true)
      .single()

    if (!decoderRow?.code) return null

    // Convert Base64 to byte array
    const binaryStr = atob(base64Payload)
    const bytes = Array.from(binaryStr, (ch) => ch.charCodeAt(0))

    // Execute the user's JS decoder in a sandboxed Function constructor
    const decoder = new Function('bytes', 'fPort', `
      "use strict";
      ${decoderRow.code}
      if (typeof Decode === 'function') return Decode(fPort, bytes);
      if (typeof decodeUplink === 'function') {
        const result = decodeUplink({ bytes, fPort });
        return result?.data || result || {};
      }
      return {};
    `)

    const result = decoder(bytes, fPort)

    if (!result || typeof result !== 'object') return null

    // Filter to only numeric values (measurements)
    const numeric: Record<string, number> = {}
    for (const [k, v] of Object.entries(result)) {
      if (typeof v === 'number') numeric[k] = v
    }

    return Object.keys(numeric).length > 0 ? numeric : null
  } catch (err) {
    console.warn(`[tektelic-ingest] Decoder execution failed for device ${deviceId}:`, err)
    return null
  }
}

/**
 * Auto-registers an unknown device in the stress-test workspace.
 * Only runs when AUTO_REGISTER=true and STRESS_TEST_WORKSPACE_ID is set.
 */
async function autoRegisterDevice(devEui: string): Promise<{ id: string; workspace_id: string } | null> {
  if (!AUTO_REGISTER || !STRESS_TEST_WORKSPACE_ID) return null

  console.log(`[tektelic-ingest] Auto-registering unknown device: ${devEui}`)

  const upperEui = devEui.toUpperCase()
  let deviceName = `Tektelic ${devEui}`
  let deviceDescription = 'Auto-registered during Tektelic stress test'

  if (upperEui.startsWith('000709')) {
    deviceName = `Axioma Qalcosonic W1 Watermeter (${devEui.slice(-6)})`
    deviceDescription = 'Auto-registered Axioma Qalcosonic W1 Watermeter'
  } else if (upperEui.startsWith('24E124')) {
    deviceName = `Milesight VS133 People Counter (${devEui.slice(-6)})`
    deviceDescription = 'Auto-registered Milesight VS133 People Counter'
  }

  const { data: newDevice, error } = await supabase
    .from('devices')
    .insert({
      workspace_id: STRESS_TEST_WORKSPACE_ID,
      name: deviceName,
      description: deviceDescription,
      dev_eui: devEui,
      connectivity: 'lorawan',
      type: 'generic',
      status: 'online',
    })
    .select('id, workspace_id')
    .single()

  if (error) {
    console.error(`[tektelic-ingest] Auto-register failed for ${devEui}:`, error)
    return null
  }

  // Auto-assign the correct active decoder to this device based on vendor prefix
  try {
    let targetDeviceId: string | null = null
    const upperEui = devEui.toUpperCase()

    if (upperEui.startsWith('000709')) {
      // Axioma Qalcosonic
      targetDeviceId = 'ebf1c20c-f099-4711-a040-dee475f447c1'
    } else if (upperEui.startsWith('24E124')) {
      // Milesight
      targetDeviceId = '88fb00e0-1c9e-4591-8f9c-c80b7b2ac3b1'
    }

    let activeDecoderCode: string | null = null

    if (targetDeviceId) {
      const { data: specificDecoder } = await supabase
        .from('payload_decoders')
        .select('code')
        .eq('device_id', targetDeviceId)
        .eq('is_active', true)
        .maybeSingle()
      
      if (specificDecoder?.code) {
        activeDecoderCode = specificDecoder.code
      }
    }

    if (!activeDecoderCode) {
      // Fallback: get the first active decoder
      const { data: fallbackDecoder } = await supabase
        .from('payload_decoders')
        .select('code')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()
      
      if (fallbackDecoder?.code) {
        activeDecoderCode = fallbackDecoder.code
      }
    }

    if (activeDecoderCode) {
      await supabase.from('payload_decoders').insert({
        device_id: newDevice.id,
        code: activeDecoderCode,
        is_active: true
      })
      console.log(`[tektelic-ingest] Auto-assigned active decoder to device ${devEui}`)
    }
  } catch (decErr) {
    console.error(`[tektelic-ingest] Failed to auto-assign decoder for ${devEui}:`, decErr)
  }

  return newDevice
}

/**
 * Evaluates active rules for the workspace and inserts alerts if triggered.
 */
async function evaluateRules(
  workspaceId: string,
  deviceId: string,
  measurements: Array<{ field_id: string; value: number }>
) {
  const { data: rules } = await supabase
    .from('rules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)

  if (!rules || rules.length === 0) return

  for (const rule of rules) {
    const conditions = (rule.condition as any)?.conditions || []

    for (const condition of conditions) {
      const measurement = measurements.find((m) => m.field_id === condition.fieldId)
      if (!measurement) continue

      const val = measurement.value
      const threshold = condition.value as number
      const op = condition.operator

      let match = false
      if (op === 'gt') match = val > threshold
      else if (op === 'lt') match = val < threshold
      else if (op === 'eq') match = val === threshold
      else if (op === 'gte') match = val >= threshold
      else if (op === 'lte') match = val <= threshold
      else if (op === 'neq') match = val !== threshold

      if (match) {
        console.log(`[tektelic-ingest] Rule triggered: ${rule.name}`)
        await supabase.from('alerts').insert({
          workspace_id: workspaceId,
          device_id: deviceId,
          rule_id: rule.id,
          severity: 'warning',
          title: rule.name,
          message: `${condition.fieldName} is ${val}, which is ${op} ${threshold}`,
        })
        break // One alert per rule per message
      }
    }
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  console.log('[tektelic-ingest] Received payload:', JSON.stringify(body, null, 2))

  const stats = { received: 0, inserted: 0, skipped: 0, errors: 0 }

  // 1. Detect and parse format
  const messagesToProcess: Array<{
    devEui: string
    ts: number
    fPort: number | null
    fCount: number | null
    bytesVal: any
    preDecodedSensorFields?: Record<string, unknown>
    metadata: {
      rssi: number | null
      snr: number | null
      gatewayCount: number | null
      dataRate: string | null
    }
  }> = []

  if (body && typeof body === 'object') {
    if ('payloadMetaData' in body && 'payload' in body) {
      // New Tektelic JSON format
      const meta = body.payloadMetaData || {}
      const devEui = meta.deviceMetaData?.deviceEUI
      if (devEui) {
        const gateway = meta.gatewayMetaDataList?.[0]
        const rssi = gateway?.rxInfo?.rssi ?? null
        const snr = gateway?.rxInfo?.loRaSNR ?? null
        const gatewayCount = meta.gatewayMetaDataList?.length ?? null
        let dataRate = null
        const drObj = gateway?.rxInfo?.dataRate
        if (drObj) {
          dataRate = `${drObj.modulation}_SF${drObj.spreadFactor}_BW${drObj.bandwidth}`
        }

        messagesToProcess.push({
          devEui,
          ts: Date.now(), // Fallback to current time
          fPort: meta.fport ?? null,
          fCount: meta.fcount ?? null,
          bytesVal: body.payload?.bytes,
          metadata: {
            rssi,
            snr,
            gatewayCount,
            dataRate
          }
        })
      }
    } else {
      // Old Tektelic format: Record<DevEUI, Message[]>
      for (const [devEui, messages] of Object.entries(body)) {
        if (!Array.isArray(messages)) continue
        for (const msg of messages) {
          const { ts, values } = msg || {}
          if (!values) continue
          
          const sensorFields: Record<string, unknown> = {}
          const metadata: Record<string, unknown> = {}
          for (const [key, value] of Object.entries(values)) {
            if (key.startsWith('ns') && key.length > 2 && key[2] === key[2].toUpperCase()) {
              metadata[key] = value
            } else {
              sensorFields[key] = value
            }
          }

          messagesToProcess.push({
            devEui,
            ts: ts || Date.now(),
            fPort: (metadata.nsFPort as number) ?? null,
            fCount: (metadata.nsFCount as number) ?? null,
            bytesVal: metadata.nsRawPayload,
            preDecodedSensorFields: Object.keys(sensorFields).length > 0 ? sensorFields : undefined,
            metadata: {
              rssi: (metadata.nsRssi as number) ?? null,
              snr: (metadata.nsSnr as number) ?? null,
              gatewayCount: (metadata.nsGatewayCount as number) ?? null,
              dataRate: (metadata.nsDataRate as string) ?? null
            }
          })
        }
      }
    }
  }

  // 2. Process messages
  for (const item of messagesToProcess) {
    stats.received++
    const { devEui, ts, fPort, fCount, bytesVal, preDecodedSensorFields, metadata } = item

    // Look up the device by EUI
    let device: { id: string; workspace_id: string } | null = null

    const { data: foundDevice } = await supabase
      .from('devices')
      .select('id, workspace_id')
      .ilike('dev_eui', devEui)
      .single()

    if (foundDevice) {
      device = foundDevice
    } else {
      // Try auto-registration if enabled
      device = await autoRegisterDevice(devEui)
      if (!device) {
        console.warn(`[tektelic-ingest] Device not found and auto-register off: ${devEui}`)
        stats.skipped++
        continue
      }
    }

    // Update device last_seen and status
    await supabase
      .from('devices')
      .update({ last_seen: new Date().toISOString(), status: 'online' })
      .eq('id', device.id)

    const timestamp = ts ? new Date(ts).toISOString() : new Date().toISOString()

    // Parse bytes to get base64 string
    let base64Payload: string | null = null
    let rawBytes: number[] = []

    if (typeof bytesVal === 'string') {
      // Could be "[3,-46,...]" or a base64 string
      if (bytesVal.trim().startsWith('[')) {
        try {
          rawBytes = JSON.parse(bytesVal).map((x: number) => x & 0xFF)
          base64Payload = btoa(String.fromCharCode(...rawBytes))
        } catch {
          console.error(`[tektelic-ingest] Failed to parse bytes string array: ${bytesVal}`)
        }
      } else {
        // Assume base64 string
        base64Payload = bytesVal
      }
    } else if (Array.isArray(bytesVal)) {
      rawBytes = bytesVal.map((x: number) => x & 0xFF)
      base64Payload = btoa(String.fromCharCode(...rawBytes))
    }

    // ── Log the raw message regardless ─────────────────────────────────
    const { error: logErr } = await supabase.from('device_logs').insert({
      device_id: device.id,
      dev_eui: devEui,
      event_type: 'uplink',
      f_port: fPort,
      f_cnt: fCount,
      data_base64: base64Payload,
      object: preDecodedSensorFields || null,
      rx_info: {
        rssi: metadata.rssi,
        snr: metadata.snr,
        gatewayCount: metadata.gatewayCount,
        dataRate: metadata.dataRate,
      },
      raw_payload: body,
    })

    if (logErr) {
      console.error('[tektelic-ingest] device_logs insert error:', logErr)
      stats.errors++
    }

    // ── Two-pass Decode ────────────────────────────────────────────────
    let decodedFields: Record<string, unknown> = {}

    // Pass 1: Use pre-decoded sensor values if available
    if (preDecodedSensorFields && Object.keys(preDecodedSensorFields).length > 0) {
      decodedFields = preDecodedSensorFields
      console.log(`[tektelic-ingest] Using pre-decoded values for ${devEui}:`, decodedFields)
    }
    // Pass 2: Fall back to device's JS decoder on base64Payload
    else if (base64Payload) {
      console.log(`[tektelic-ingest] Attempting Base64 decode for ${devEui}`)
      const decoded = await tryBase64Decode(
        device.id,
        base64Payload,
        fPort ?? 0
      )
      if (decoded) {
        decodedFields = decoded
        console.log(`[tektelic-ingest] Base64 decode succeeded for ${devEui}:`, decodedFields)
      } else {
        console.warn(`[tektelic-ingest] No decoder available or decode failed for ${devEui}, skipping measurements`)
      }
    }

    // ── Insert Measurements ────────────────────────────────────────────
    if (Object.keys(decodedFields).length === 0) {
      stats.skipped++
      continue
    }

    const measurementsToInsert: Array<{ device_id: string; field_id: string; value: number; time: string }> = []

    for (const [key, value] of Object.entries(decodedFields)) {
      if (typeof value !== 'number') continue

      // Look up field. If it doesn't exist, auto-create it!
      let { data: field } = await supabase
        .from('fields')
        .select('id')
        .eq('device_id', device.id)
        .eq('alias', key)
        .single()

      if (!field) {
        console.log(`[tektelic-ingest] Field '${key}' not found for device ${device.id}. Auto-creating it...`)
        const { data: newField, error: fieldErr } = await supabase
          .from('fields')
          .insert({
            device_id: device.id,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            alias: key,
            type: 'number',
          })
          .select('id')
          .single()

        if (!fieldErr && newField) {
          field = newField
        } else {
          console.error(`[tektelic-ingest] Failed to auto-create field '${key}':`, fieldErr)
        }
      }

      if (field) {
        measurementsToInsert.push({
          device_id: device.id,
          field_id: field.id,
          value,
          time: timestamp,
        })
      }
    }

    if (measurementsToInsert.length > 0) {
      const { error: measureErr } = await supabase
        .from('measurements')
        .insert(measurementsToInsert)

      if (measureErr) {
        console.error('[tektelic-ingest] measurements insert error:', measureErr)
        stats.errors++
      } else {
        stats.inserted += measurementsToInsert.length
        // ── Rule Engine ────────────────────────────────────────────────
        await evaluateRules(device.workspace_id, device.id, measurementsToInsert)
      }
    } else {
      stats.skipped++
    }
  }

  console.log('[tektelic-ingest] Done:', stats)
  return new Response(JSON.stringify({ success: true, ...stats }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
