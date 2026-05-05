import type {
  Workspace,
  WorkspaceMember,
  Device,
  DeviceField,
  PayloadDecoder,
  Gateway,
  Rule,
  Dashboard,
} from "@/lib/types";

// ========================
// Workspaces
// ========================
export const MOCK_WORKSPACES: Workspace[] = [
  {
    id: "ws-1",
    name: "Acme Industrial",
    slug: "acme-industrial",
    description: "Main factory floor monitoring",
    plan: "pro",
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "ws-2",
    name: "Smart City Pilot",
    slug: "smart-city-pilot",
    description: "Urban environmental sensing project",
    plan: "starter",
    createdAt: "2025-03-02T09:00:00Z",
  },
];

export const ACTIVE_WORKSPACE = MOCK_WORKSPACES[0];

// ========================
// Members
// ========================
export const MOCK_MEMBERS: WorkspaceMember[] = [
  {
    id: "m-1",
    workspaceId: "ws-1",
    userId: "u-1",
    name: "Alex Miller",
    email: "alex.miller@acme.com",
    role: "owner",
    joinedAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "m-2",
    workspaceId: "ws-1",
    userId: "u-2",
    name: "Sandra Koch",
    email: "s.koch@acme.com",
    role: "admin",
    joinedAt: "2025-01-20T09:30:00Z",
  },
  {
    id: "m-3",
    workspaceId: "ws-1",
    userId: "u-3",
    name: "Luca Novak",
    email: "l.novak@acme.com",
    role: "member",
    joinedAt: "2025-02-10T14:00:00Z",
  },
  {
    id: "m-4",
    workspaceId: "ws-1",
    userId: "u-4",
    name: "Yuki Tanaka",
    email: "y.tanaka@acme.com",
    role: "viewer",
    joinedAt: "2025-03-01T08:00:00Z",
  },
];

// ========================
// Devices
// ========================
export const MOCK_DEVICES: Device[] = [
  {
    id: "dev-1",
    workspaceId: "ws-1",
    name: "Boiler Room Sensor #1",
    serialNumber: "SN-00143",
    devEui: "A8404157A1EAD1CF",
    deviceType: "LoRaWAN",
    connectivity: "lorawan",
    status: "online",
    tags: ["boiler", "temperature", "zone-a"],
    description: "Monitors temperature and pressure in the main boiler room.",
    lastSeen: "2026-03-16T07:45:00Z",
    createdAt: "2025-02-01T12:00:00Z",
  },
  {
    id: "dev-2",
    workspaceId: "ws-1",
    name: "Warehouse Humidity Node",
    serialNumber: "SN-00187",
    devEui: "B74012A3C0FE9821",
    deviceType: "LoRaWAN",
    connectivity: "lorawan",
    status: "online",
    tags: ["warehouse", "humidity", "zone-b"],
    lastSeen: "2026-03-16T07:44:30Z",
    createdAt: "2025-02-05T10:00:00Z",
  },
  {
    id: "dev-3",
    workspaceId: "ws-1",
    name: "Main Gate Access Logger",
    serialNumber: "SN-00220",
    deviceType: "MQTT",
    connectivity: "mqtt",
    status: "offline",
    tags: ["access", "gate", "security"],
    lastSeen: "2026-03-14T22:10:00Z",
    createdAt: "2025-02-10T09:00:00Z",
  },
  {
    id: "dev-4",
    workspaceId: "ws-1",
    name: "Compressor Vibration Monitor",
    serialNumber: "SN-00301",
    devEui: "CC80E123AF104D56",
    deviceType: "LoRaWAN",
    connectivity: "lorawan",
    status: "warning",
    tags: ["compressor", "vibration", "zone-a", "critical"],
    lastSeen: "2026-03-16T07:30:00Z",
    createdAt: "2025-03-01T08:00:00Z",
  },
  {
    id: "dev-5",
    workspaceId: "ws-1",
    name: "Roof Weather Station",
    serialNumber: "SN-00388",
    deviceType: "HTTP",
    connectivity: "http_webhook",
    status: "online",
    tags: ["weather", "outdoor", "roof"],
    lastSeen: "2026-03-16T07:43:00Z",
    createdAt: "2025-03-08T15:00:00Z",
  },
  {
    id: "dev-6",
    workspaceId: "ws-1",
    name: "Assembly Line Counter",
    serialNumber: "SN-00412",
    deviceType: "MQTT",
    connectivity: "mqtt",
    status: "online",
    tags: ["assembly", "counter", "zone-c"],
    lastSeen: "2026-03-16T07:46:00Z",
    createdAt: "2025-03-10T11:00:00Z",
  },
];

// ========================
// Device Fields
// ========================
export const MOCK_FIELDS: DeviceField[] = [
  { id: "f-1", deviceId: "dev-1", name: "temperature", alias: "Temperature", unit: "°C", type: "number", color: "#ef4444", showOnDashboard: true, lastValue: 87.3, lastValueAt: "2026-03-16T07:45:00Z" },
  { id: "f-2", deviceId: "dev-1", name: "pressure", alias: "Pressure", unit: "bar", type: "number", color: "#3b82f6", showOnDashboard: true, lastValue: 4.2, lastValueAt: "2026-03-16T07:45:00Z" },
  { id: "f-3", deviceId: "dev-1", name: "battery", alias: "Battery Level", unit: "%", type: "number", color: "#22c55e", showOnDashboard: false, lastValue: 72, lastValueAt: "2026-03-16T07:45:00Z" },
  { id: "f-4", deviceId: "dev-2", name: "humidity", alias: "Humidity", unit: "%", type: "number", color: "#06b6d4", showOnDashboard: true, lastValue: 63.5, lastValueAt: "2026-03-16T07:44:30Z" },
  { id: "f-5", deviceId: "dev-2", name: "temperature", alias: "Temperature", unit: "°C", type: "number", color: "#f59e0b", showOnDashboard: true, lastValue: 21.8, lastValueAt: "2026-03-16T07:44:30Z" },
  { id: "f-6", deviceId: "dev-4", name: "vibration_x", alias: "Vibration X-axis", unit: "mm/s", type: "number", color: "#a855f7", showOnDashboard: true, lastValue: 12.7, lastValueAt: "2026-03-16T07:30:00Z" },
  { id: "f-7", deviceId: "dev-4", name: "vibration_y", alias: "Vibration Y-axis", unit: "mm/s", type: "number", color: "#ec4899", showOnDashboard: true, lastValue: 9.1, lastValueAt: "2026-03-16T07:30:00Z" },
  { id: "f-8", deviceId: "dev-5", name: "wind_speed", alias: "Wind Speed", unit: "km/h", type: "number", color: "#14b8a6", showOnDashboard: true, lastValue: 23.4, lastValueAt: "2026-03-16T07:43:00Z" },
  { id: "f-9", deviceId: "dev-5", name: "rain_mm", alias: "Rainfall", unit: "mm", type: "number", color: "#6366f1", showOnDashboard: true, lastValue: 0.0, lastValueAt: "2026-03-16T07:43:00Z" },
  { id: "f-10", deviceId: "dev-6", name: "count", alias: "Unit Count", unit: "units", type: "number", color: "#10b981", showOnDashboard: true, lastValue: 4812, lastValueAt: "2026-03-16T07:46:00Z" },
];

// ========================
// Payload Decoders
// ========================
export const MOCK_DECODERS: PayloadDecoder[] = [
  {
    id: "pd-1",
    deviceId: "dev-1",
    name: "LoRaWAN Boiler Decoder",
    enabled: true,
    script: `// Boiler Sensor Payload Decoder
// Input: bytes (Uint8Array), port (number)
// Output: object with field names as keys

function Decoder(bytes, port) {
  const temperature = ((bytes[0] << 8) | bytes[1]) / 100.0;
  const pressure = ((bytes[2] << 8) | bytes[3]) / 1000.0;
  const battery = bytes[4];

  return {
    temperature: temperature,
    pressure: pressure,
    battery: battery,
  };
}`,
    createdAt: "2025-02-01T12:00:00Z",
    updatedAt: "2025-03-10T09:30:00Z",
  },
  {
    id: "pd-2",
    deviceId: "dev-2",
    name: "Humidity Node Decoder",
    enabled: true,
    script: `// Humidity/Temp Sensor Payload Decoder
function Decoder(bytes, port) {
  const humidity = ((bytes[0] << 8) | bytes[1]) / 100.0;
  const temperature = (((bytes[2] << 8) | bytes[3]) - 4000) / 100.0;

  return {
    humidity: humidity,
    temperature: temperature,
  };
}`,
    createdAt: "2025-02-05T10:00:00Z",
    updatedAt: "2025-02-05T10:00:00Z",
  },
];

// ========================
// Gateways
// ========================
export const MOCK_GATEWAYS: Gateway[] = [
  {
    id: "gw-1",
    workspaceId: "ws-1",
    name: "Factory North Gateway",
    type: "LoRaWAN",
    eui: "AA0B0C0D0E0F0001",
    status: "online",
    connectedDevices: 4,
    lastSeen: "2026-03-16T07:46:00Z",
    createdAt: "2025-01-20T09:00:00Z",
  },
  {
    id: "gw-2",
    workspaceId: "ws-1",
    name: "TTN Integration - EU868",
    type: "TTN",
    eui: "BB0B0C0D0E0F0002",
    status: "online",
    connectedDevices: 2,
    lastSeen: "2026-03-16T07:40:00Z",
    createdAt: "2025-02-15T14:00:00Z",
  },
  {
    id: "gw-3",
    workspaceId: "ws-1",
    name: "Warehouse MQTT Broker",
    type: "Custom",
    status: "offline",
    connectedDevices: 0,
    lastSeen: "2026-03-13T18:00:00Z",
    createdAt: "2025-03-05T11:00:00Z",
  },
];

// ========================
// Rules
// ========================
export const MOCK_RULES: Rule[] = [
  {
    id: "rule-1",
    workspaceId: "ws-1",
    name: "Boiler Overtemperature Alert",
    description: "Trigger alert when boiler temperature exceeds safe operating limit",
    enabled: true,
    conditions: [{ fieldId: "f-1", fieldName: "Temperature", operator: "gt", value: 95 }],
    actions: [
      { type: "email", target: "alex.miller@acme.com", message: "ALERT: Boiler temperature exceeded 95°C!" },
      { type: "webhook", target: "https://hooks.acme.com/alerts", message: "boiler_overtemp" },
    ],
    triggerCount: 3,
    lastTriggered: "2026-03-10T14:22:00Z",
    createdAt: "2025-02-01T12:00:00Z",
  },
  {
    id: "rule-2",
    workspaceId: "ws-1",
    name: "High Vibration Warning",
    description: "Warn if compressor vibration exceeds 10 mm/s",
    enabled: true,
    conditions: [{ fieldId: "f-6", fieldName: "Vibration X-axis", operator: "gt", value: 10 }],
    actions: [{ type: "in_app", target: "team", message: "Compressor vibration level is elevated." }],
    triggerCount: 12,
    lastTriggered: "2026-03-16T07:30:00Z",
    createdAt: "2025-03-01T08:00:00Z",
  },
  {
    id: "rule-3",
    workspaceId: "ws-1",
    name: "Device Offline Notification",
    description: "Notify when main gate logger goes offline",
    enabled: false,
    conditions: [],
    actions: [{ type: "email", target: "s.koch@acme.com" }],
    triggerCount: 1,
    createdAt: "2025-02-20T10:00:00Z",
  },
];

// ========================
// Dashboards
// ========================
export const MOCK_DASHBOARDS: Dashboard[] = [
  {
    id: "dash-1",
    workspaceId: "ws-1",
    name: "Factory Overview",
    description: "Main operational dashboard for factory floor",
    isPublic: false,
    widgets: [
      {
        id: "w-1",
        dashboardId: "dash-1",
        type: "gauge",
        title: "Boiler Temperature",
        deviceId: "dev-1",
        fieldId: "f-1",
        config: { min: 0, max: 120, color: "#ef4444", unit: "°C" },
        layout: { x: 0, y: 0, w: 4, h: 6 },
      },
      {
        id: "w-2",
        dashboardId: "dash-1",
        type: "value_display",
        title: "Boiler Pressure",
        deviceId: "dev-1",
        fieldId: "f-2",
        config: { color: "#3b82f6" },
        layout: { x: 4, y: 0, w: 2, h: 4 },
      },
      {
        id: "w-3",
        dashboardId: "dash-1",
        type: "line_chart",
        title: "Humidity History",
        deviceId: "dev-2",
        fieldId: "f-4",
        config: { color: "#06b6d4" },
        layout: { x: 0, y: 6, w: 6, h: 6 },
      },
      {
        id: "w-4",
        dashboardId: "dash-1",
        type: "status_bubble",
        title: "Production Line",
        deviceId: "dev-6",
        fieldId: "f-10",
        config: { label: "Running" },
        layout: { x: 6, y: 0, w: 3, h: 3 },
      },
    ],
    createdAt: "2025-02-01T12:00:00Z",
    updatedAt: "2026-03-15T08:00:00Z",
  },
  {
    id: "dash-2",
    workspaceId: "ws-1",
    name: "Boiler Room Detail",
    description: "Detailed monitoring for boiler room sensors",
    isPublic: false,
    widgets: [
      {
        id: "w-5",
        dashboardId: "dash-2",
        type: "line_chart",
        title: "Temperature Trends",
        deviceId: "dev-1",
        fieldId: "f-1",
        config: { color: "#ef4444" },
        layout: { x: 0, y: 0, w: 12, h: 8 },
      },
    ],
    createdAt: "2025-03-01T10:00:00Z",
    updatedAt: "2026-03-16T07:00:00Z",
  },
];

// ========================
// Utility helpers
// ========================
export function getDeviceFields(deviceId: string): DeviceField[] {
  return MOCK_FIELDS.filter((f) => f.deviceId === deviceId);
}

export function getDeviceDecoder(deviceId: string): PayloadDecoder | undefined {
  return MOCK_DECODERS.find((d) => d.deviceId === deviceId);
}
