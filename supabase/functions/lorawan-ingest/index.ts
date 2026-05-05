// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.11.0"

// @ts-ignore
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'http://host.docker.internal:54321'
// @ts-ignore
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req: Request) => {
  try {
    const payload = await req.json()
    console.log("Received ChirpStack payload:", JSON.stringify(payload, null, 2))

    const devEui = payload.deviceInfo?.devEui
    const object = payload.object // The decoded payload from ChirpStack codec

    if (!devEui) {
      return new Response(JSON.stringify({ error: "Missing devEui" }), { status: 400 })
    }

    // 1. Find the device
    const { data: device, error: deviceErr } = await supabase
      .from('devices')
      .select('id, workspace_id')
      .ilike('dev_eui', devEui)
      .single()

    if (deviceErr || !device) {
      console.error(`Device not found for DevEUI: ${devEui}`, deviceErr)
      return new Response(JSON.stringify({ error: "Device not found" }), { status: 404 })
    }

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
          return new Response(JSON.stringify({ error: "Insert failed" }), { status: 500 })
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
              await supabase.from('alerts').insert({
                workspace_id: device.workspace_id,
                device_id: device.id,
                rule_id: rule.id,
                severity: 'warning',
                title: rule.name,
                message: triggerMessage || rule.description || "Threshold exceeded",
              })

              // Update Rule Stats (we don't have triggerCount in DB schema yet based on migration 20240316, 
              // but we can update updated_at or just skip if field missing)
              // Actually, migration 20240316 doesn't have trigger_count.
              // I'll just update updated_at for now.
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
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
