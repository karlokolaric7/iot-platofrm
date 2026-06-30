// Shared utility for sending alert notifications via Email (Resend), SMS (Twilio), and Webhooks (Slack, Discord, Custom)

export async function sendAlertNotifications(
  rule: any,
  alert: any,
  deviceName: string
) {
  const actionsContainer = rule.actions;
  if (!actionsContainer || !Array.isArray(actionsContainer.actions)) {
    console.log(`[notification-sender] No valid actions array found for rule: ${rule.name}`);
    return;
  }

  const actions = actionsContainer.actions;
  console.log(`[notification-sender] Processing ${actions.length} actions for rule: ${rule.name}`);

  for (const action of actions) {
    try {
      if (action.type === 'email') {
        await sendEmail(action.target, rule, alert, deviceName);
      } else if (action.type === 'sms') {
        await sendSMS(action.target, rule, alert, deviceName);
      } else if (action.type === 'webhook') {
        await sendWebhook(action.target, rule, alert, deviceName);
      } else {
        console.log(`[notification-sender] In-App or unsupported action type: ${action.type}`);
      }
    } catch (err: any) {
      console.error(`[notification-sender] Error executing action of type ${action.type}:`, err.message || err);
    }
  }
}

async function sendEmail(to: string, rule: any, alert: any, deviceName: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("[notification-sender] RESEND_API_KEY is not set. Skipping email dispatch.");
    return;
  }

  // Resend requires verified sender domain. If none, onboarding@resend.dev is used.
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
  const subject = `🚨 [${alert.severity.toUpperCase()}] Alert: ${rule.name}`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="background-color: #4f46e5; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700;">Chameleon IoT Alert</h2>
      </div>
      <div style="padding: 24px; background-color: #ffffff;">
        <p style="margin-top: 0; font-size: 16px; font-weight: 650; color: #1e293b;">
          Rule "${rule.name}" has been triggered.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #64748b; width: 100px; font-size: 14px;">Device:</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${deviceName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #64748b; font-size: 14px;">Message:</td>
            <td style="padding: 8px 0; color: #e11d48; font-size: 14px; font-weight: 600;">${alert.message}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #64748b; font-size: 14px;">Severity:</td>
            <td style="padding: 8px 0; font-size: 14px;">
              <span style="background-color: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 11px;">
                ${alert.severity}
              </span>
            </td>
          </tr>
        </table>
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          This is an automated notification from your Chameleon IoT Platform.
        </p>
      </div>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: `Chameleon IoT <${fromEmail}>`,
      to: [to],
      subject,
      html
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend API returned status ${res.status}: ${errText}`);
  }
  console.log(`[notification-sender] Email sent successfully to ${to}`);
}

async function sendSMS(to: string, rule: any, alert: any, deviceName: string) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER");

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("[notification-sender] Twilio credentials are not fully configured. Skipping SMS dispatch.");
    return;
  }

  const messageBody = `🚨 [Chameleon IoT] ALERT: ${rule.name} on ${deviceName}. Details: ${alert.message}`;

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      To: to,
      From: fromNumber,
      Body: messageBody
    }).toString()
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Twilio API returned status ${res.status}: ${errText}`);
  }
  console.log(`[notification-sender] SMS sent successfully to ${to}`);
}

async function sendWebhook(targetUrl: string, rule: any, alert: any, deviceName: string) {
  let payload: any = {};
  const isDiscord = targetUrl.includes("discord.com");
  const isSlack = targetUrl.includes("hooks.slack.com");

  if (isDiscord) {
    // Rich Discord Embed
    payload = {
      content: null,
      embeds: [
        {
          title: `🚨 [${alert.severity.toUpperCase()}] Alert: ${rule.name}`,
          description: alert.message,
          color: alert.severity === "critical" ? 15158332 : 15105536, // Red vs Orange
          fields: [
            { name: "Device", value: deviceName, inline: true },
            { name: "Severity", value: alert.severity.toUpperCase(), inline: true }
          ],
          footer: { text: "Chameleon IoT Platform" },
          timestamp: new Date().toISOString()
        }
      ]
    };
  } else if (isSlack) {
    // Rich Slack Block Message
    payload = {
      text: `🚨 *[${alert.severity.toUpperCase()}] Alert: ${rule.name}*`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🚨 *[${alert.severity.toUpperCase()}] Alert Triggered: ${rule.name}*`
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Device:*\n${deviceName}` },
            { type: "mrkdwn", text: `*Severity:*\n${alert.severity.toUpperCase()}` }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Message:*\n${alert.message}`
          }
        }
      ]
    };
  } else {
    // Standard Custom Webhook JSON
    payload = {
      event: "alert.triggered",
      alert: {
        id: alert.id,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        created_at: alert.created_at || new Date().toISOString()
      },
      device: {
        name: deviceName
      },
      rule: {
        id: rule.id,
        name: rule.name,
        description: rule.description
      }
    };
  }

  const res = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Webhook target returned status ${res.status}: ${errText}`);
  }
  console.log(`[notification-sender] Webhook delivered successfully to ${targetUrl}`);
}
