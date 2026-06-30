// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.11.0"
import { ipLimiter, deviceLimiter } from "../_shared/rate-limiter.ts"
import { sendAlertNotifications } from "../_shared/notification-sender.ts"

// @ts-ignore
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'http://host.docker.internal:54321'
// @ts-ignore
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req: Request) => {
  let device: any = null
  let payload: any = null
  try {
    // ─── IP-based Rate Limiting ───────────────────────────────────────────────
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const ipCheck = ipLimiter.consume(ip)
    if (!ipCheck.allowed) {
      console.warn(`[lorawan-ingest] Rate limit exceeded for IP: ${ip}`)
      return new Response(JSON.stringify({ error: 'Too Many Requests' }), { 
        status: 429, 
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(ipCheck.resetMs / 1000).toString() 
        } 
      })
    }

    // ─── Token Verification ────────────────────────────────────────────────────
    const url = new URL(req.url)
    const queryToken = url.searchParams.get('token')
    const headerToken = req.headers.get('x-ingest-token') || 
                        req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')

    const expectedToken = Deno.env.get('INGEST_TOKEN')

    if (expectedToken) {
      if (queryToken !== expectedToken && headerToken !== expectedToken) {
        console.warn('[lorawan-ingest] Unauthorized request: Invalid or missing token')
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or missing token' }), { status: 401 })
      }
    }

    payload = await req.json()
    console.log("Received ChirpStack payload:", JSON.stringify(payload, null, 2))

    const devEui = payload.deviceInfo?.devEui
    const object = payload.object // The decoded payload from ChirpStack codec

    if (!devEui) {
      return new Response(JSON.stringify({ error: "Missing devEui" }), { status: 400 })
    }

    // ─── DevEUI-based Rate Limiting ───────────────────────────────────────────
    const deviceCheck = deviceLimiter.consume(devEui)
    if (!deviceCheck.allowed) {
      console.warn(`[lorawan-ingest] Rate limit exceeded for DevEUI: ${devEui}`)
      return new Response(JSON.stringify({ error: 'Too Many Requests' }), { 
        status: 429, 
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(deviceCheck.resetMs / 1000).toString() 
        } 
      })
    }

    // 1. Find the device
    const { data: foundDevice, error: deviceErr } = await supabase
      .from('devices')
      .select('id, workspace_id, name')
      .ilike('dev_eui', devEui)
      .single()

    if (deviceErr || !foundDevice) {
      console.error(`Device not found for DevEUI: ${devEui}`, deviceErr)
      
      // Log to DLQ
      try {
        await supabase.from('failed_ingest_logs').insert({
          dev_eui: devEui,
          event_type: 'lorawan',
          f_port: payload?.fPort || payload?.deviceInfo?.fPort || null,
          f_cnt: payload?.fCnt || null,
          raw_payload: payload,
          error_message: `Device not found for DevEUI: ${devEui}`,
          device_id: null,
          workspace_id: null,
        })
      } catch (logErr) {
        console.error("[lorawan-ingest] Failed to write to failed_ingest_logs:", logErr)
      }

      return new Response(JSON.stringify({ error: `Device not found for DevEUI: ${devEui}` }), { status: 404 })
    }
    device = foundDevice

    // 2. Insert into device_logs regardless of fields
    const { error: logErr } = await supabase
      .from('device_logs')
      .insert({
        device_id: device.id,
        dev_eui: devEui,
        event_type: 'uplink',
        f_port: payload.fPort || payload.deviceInfo?.fPort,
        f_cnt: payload.fCnt,
        data_base64: payload.data,
        object: object || null,
        rx_info: payload.rxInfo || null,
        tx_info: payload.txInfo || null,
        raw_payload: payload
      })

    if (logErr) {
      console.error("Error inserting device log:", logErr)
    }

    // 3. Process fields and measurements
    const measurements = []

    if (object) {
      const entries = Object.entries(object)

      for (const [key, value] of entries) {
        // Find field matching the alias
        const { data: field } = await supabase
          .from('fields')
          .select('id')
          .eq('device_id', device.id)
          .eq('alias', key)
          .single()

        if (field && typeof value === 'number') {
          measurements.push({
            device_id: device.id,
            field_id: field.id,
            value: value,
            time: new Date().toISOString()
          })
        }
      }

      if (measurements.length > 0) {
        const { error: insertErr } = await supabase
          .from('measurements')
          .insert(measurements)
        
        if (insertErr) {
          console.error("Error inserting measurements:", insertErr)
          throw new Error(`Failed to insert measurements: ${insertErr.message}`)
        }

        // 4. Rule Engine Evaluation
        const { data: rules } = await supabase
          .from('rules')
          .select('*')
          .eq('workspace_id', device.workspace_id)
          .eq('is_active', true)

        if (rules && rules.length > 0) {
          for (const rule of rules) {
            const conditions = (rule.condition as any)?.conditions || []
            let ruleTriggered = false
            let triggerMessage = ""

            for (const condition of conditions) {
              const measurement = measurements.find(m => m.field_id === condition.fieldId)
              if (measurement) {
                const val = measurement.value as number
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
                  ruleTriggered = true
                  triggerMessage = `${condition.fieldName} is ${val}, which is ${op} ${threshold}`
                  break
                }
              }
            }

            if (ruleTriggered) {
              console.log(`Rule triggered: ${rule.name}`)
              
              // Create Alert record
              const { data: alert, error: alertErr } = await supabase
                .from('alerts')
                .insert({
                  workspace_id: device.workspace_id,
                  device_id: device.id,
                  rule_id: rule.id,
                  severity: 'warning',
                  title: rule.name,
                  message: triggerMessage || rule.description || "Threshold exceeded",
                })
                .select()
                .single()

              if (!alertErr && alert) {
                sendAlertNotifications(rule, alert, device.name).catch((err) => {
                  console.error('[lorawan-ingest] Failed to send alert notifications:', err)
                })
              }

              await supabase.from('rules').update({
                updated_at: new Date().toISOString()
              }).eq('id', rule.id)
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, count: measurements.length }), { status: 200 })
  } catch (err: any) {
    console.error("Ingest Exception:", err)

    // Insert into failed_ingest_logs (DLQ)
    try {
      const devEui = payload?.deviceInfo?.devEui || null
      await supabase.from('failed_ingest_logs').insert({
        dev_eui: devEui,
        event_type: 'lorawan',
        f_port: payload?.fPort || payload?.deviceInfo?.fPort || null,
        f_cnt: payload?.fCnt || null,
        raw_payload: payload || { error: 'Failed to parse raw payload or request crashed before parsing' },
        error_message: err.message || String(err),
        device_id: device?.id || null,
        workspace_id: device?.workspace_id || null,
      })
    } catch (logErr) {
      console.error("[lorawan-ingest] Failed to write to failed_ingest_logs:", logErr)
    }

    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
