// ChirpStack v4 REST API Client

const CHIRPSTACK_API_URL = process.env.CHIRPSTACK_API_URL || "http://localhost:8080";
const CHIRPSTACK_API_KEY = process.env.CHIRPSTACK_API_KEY || "";

async function chirpstackFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${CHIRPSTACK_API_URL}/api${endpoint}`;
  
  // Add a 5-second timeout to prevent the Next.js server from hanging infinitely
  // if ChirpStack is unreachable or dropping connections.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        "Grpc-Metadata-Authorization": `Bearer ${CHIRPSTACK_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ChirpStack API Error (${response.status}): ${errorText}`);
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('ChirpStack API request timed out after 5 seconds.');
    }
    throw error;
  }
}

export const chirpstack = {
  // Gateways
  getGateways: (limit = 100, offset = 0) => 
    chirpstackFetch(`/gateways?limit=${limit}&offset=${offset}`),
  
  getGateway: (id: string) => 
    chirpstackFetch(`/gateways/${id}`),

  // Devices
  getDevices: (applicationId: string, limit = 100, offset = 0) =>
    chirpstackFetch(`/devices?applicationId=${applicationId}&limit=${limit}&offset=${offset}`),

  getDevice: (devEui: string) =>
    chirpstackFetch(`/devices/${devEui}`),

  // Applications
  getApplications: (tenantId: string, limit = 100, offset = 0) =>
    chirpstackFetch(`/applications?tenantId=${tenantId}&limit=${limit}&offset=${offset}`),

  getTenants: (limit = 100, offset = 0) =>
    chirpstackFetch(`/tenants?limit=${limit}&offset=${offset}`),

  getDeviceProfiles: (tenantId: string, limit = 100, offset = 0) =>
    chirpstackFetch(`/device-profiles?tenantId=${tenantId}&limit=${limit}&offset=${offset}`),

  // Create
  createGateway: (gateway: any) =>
    chirpstackFetch(`/gateways`, {
      method: "POST",
      body: JSON.stringify({ gateway }),
    }),

  deleteGateway: (gatewayId: string) =>
    chirpstackFetch(`/gateways/${gatewayId}`, {
      method: "DELETE",
    }),

  createApplication: (application: any) =>
    chirpstackFetch(`/applications`, {
      method: "POST",
      body: JSON.stringify({ application }),
    }),

  createDevice: (device: any) =>
    chirpstackFetch(`/devices`, {
      method: "POST",
      body: JSON.stringify({ device }),
    }),

  deleteDevice: (devEui: string) =>
    chirpstackFetch(`/devices/${devEui}`, {
      method: "DELETE",
    }),

  createDeviceProfile: (deviceProfile: any) =>
    chirpstackFetch(`/device-profiles`, {
      method: "POST",
      body: JSON.stringify({ deviceProfile }),
    }),

  createDeviceKeys: (devEui: string, deviceKeys: any) =>
    chirpstackFetch(`/devices/${devEui}/keys`, {
      method: "POST",
      body: JSON.stringify({ deviceKeys }),
    }),

  // Integrations
  getHttpIntegration: (applicationId: string) =>
    chirpstackFetch(`/applications/${applicationId}/integrations/http`),

  createHttpIntegration: (applicationId: string, integration: any) =>
    chirpstackFetch(`/applications/${applicationId}/integrations/http`, {
      method: "POST",
      body: JSON.stringify({ integration }),
    }),

  updateHttpIntegration: (applicationId: string, integration: any) =>
    chirpstackFetch(`/applications/${applicationId}/integrations/http`, {
      method: "PUT",
      body: JSON.stringify({ integration }),
    }),
};
