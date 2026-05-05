import { chirpstack } from "@/lib/chirpstack";

export async function getProvisioningContext() {
  // 1. Get Tenant
  const tenants = await chirpstack.getTenants();
  const tenant = tenants.result?.[0];
  if (!tenant) throw new Error("No tenant found in ChirpStack. Please create one first.");

  // 2. Get/Create Application
  let apps = await chirpstack.getApplications(tenant.id);
  let app = apps.result?.[0];
  
  if (!app) {
    console.log("Creating default application in ChirpStack...");
    const created = await chirpstack.createApplication({
      name: "IoT Platform Default",
      description: "Default application for devices added via the platform",
      tenantId: tenant.id
    });
    app = { id: created.id, name: "IoT Platform Default" };
  }

  // 3. Get/Create Device Profile
  let profiles = await chirpstack.getDeviceProfiles(tenant.id);
  let profile = profiles.result?.[0];

  if (!profile) {
    console.log("Creating default device profile...");
    const created = await chirpstack.createDeviceProfile({
      name: "LoRaWAN 1.0.3 OTAA",
      tenantId: tenant.id,
      region: "EU868",
      macVersion: "LORAWAN_1_0_3",
      regParamsRevision: "A",
      supportsOtaa: true,
    });
    profile = { id: created.id, name: "LoRaWAN 1.0.3 OTAA" };
  }

  // 4. Ensure HTTP Integration for uplink data
  // Use env var for host, fall back to known local network IP
  const hostIp = process.env.PLATFORM_HOST_IP || "192.168.100.233";
  const platformPort = process.env.PLATFORM_PORT || "3001";
  const webhookUrl = `http://${hostIp}:${platformPort}/api/chirpstack/webhook`;

  const integration = {
    applicationId: app.id,
    encoding: "JSON",
    eventEndpointUrl: webhookUrl,
    headers: {},
  };

  try {
    const response = await chirpstack.getHttpIntegration(app.id);
    const existing = response.integration;
    
    // Only update if the URL has changed
    if (existing?.eventEndpointUrl !== webhookUrl) {
      await chirpstack.updateHttpIntegration(app.id, integration);
      console.log("HTTP Integration updated to:", webhookUrl);
    }
  } catch (err) {
    console.log("Creating default HTTP Integration in ChirpStack:", webhookUrl);
    await chirpstack.createHttpIntegration(app.id, integration);
  }

  return {
    tenantId: tenant.id,
    applicationId: app.id,
    deviceProfileId: profile.id
  };
}
