import { Json } from "./supabase/database.types";

// ========================
// Workspace / Multi-tenancy
// ========================
export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  avatarUrl?: string;
  joinedAt: string;
}

// ========================
// Devices
// ========================
export type DeviceStatus = "online" | "offline" | "warning" | "unknown";
export type DeviceType = "LoRaWAN" | "MQTT" | "HTTP" | "Custom";
export type ConnectivityType = "lorawan" | "mqtt" | "http_webhook" | "custom";

export interface Device {
  id: string;
  workspaceId: string;
  name: string;
  serialNumber?: string;
  devEui?: string;
  deviceType: DeviceType;
  connectivity: ConnectivityType;
  status: DeviceStatus;
  latitude?: number;
  longitude?: number;
  tags: string[];
  description?: string;
  lastSeen?: string;
  createdAt: string;
}

// ========================
// Custom Fields
// ========================
export type FieldType = "number" | "string" | "boolean" | "location" | "json";

export interface DeviceField {
  id: string;
  device_id: string;
  name: string;
  alias: string;
  unit?: string;
  type: string;
  color?: string;
  show_on_dashboard: boolean;
  last_value?: string | number | boolean;
  last_value_at?: string;
}

// ========================
// Payload Decoders
// ========================
export interface PayloadDecoder {
  id: string;
  device_id: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ========================
// Measurements (time-series)
// ========================
export interface Measurement {
  id: string;
  device_id: string;
  field_id: string;
  value: number | string | boolean;
  time: string;
}

// ========================
// Gateways
// ========================
export type GatewayType = "LoRaWAN" | "TTN" | "ChirpStack" | "Custom";

export interface Gateway {
  id: string;
  workspaceId: string;
  name: string;
  type: GatewayType;
  eui?: string;
  status: DeviceStatus;
  connectedDevices: number;
  lastSeen?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

// ========================
// Rule Engine
// ========================
export type RuleConditionOperator = "gt" | "lt" | "eq" | "gte" | "lte" | "neq";
export type RuleActionType = "email" | "webhook" | "sms" | "in_app";

export interface RuleCondition {
  fieldId: string;
  fieldName: string;
  operator: RuleConditionOperator;
  value: number | string;
}

export interface RuleAction {
  type: RuleActionType;
  target: string; // email address, webhook URL, etc.
  message?: string;
}

export interface Rule {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  enabled: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  triggerCount: number;
  lastTriggered?: string;
  createdAt: string;
}

// ========================
// Dashboards
// ========================
export type WidgetType =
  | "line_chart"
  | "gauge"
  | "status_bubble"
  | "map"
  | "button"
  | "value_display"
  | "bar_chart";

export interface WidgetConfig {
  color?: string;
  unit?: string;
  min?: number;
  max?: number;
  label?: string;
  refreshInterval?: number;
}

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  type: string;
  title: string;
  device_id?: string;
  field_id?: string;
  config: Json;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Dashboard {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  layout: Json;
  settings: Json;
  widgets: DashboardWidget[];
  created_at: string;
  updated_at: string;
}
