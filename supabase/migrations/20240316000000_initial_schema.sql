-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table (Linked to Auth/Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' NOT NULL,
  owner_id UUID REFERENCES auth.users NOT NULL,
  settings JSONB DEFAULT '{}'::JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Workspace Members (Multi-tenancy Link)
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' NOT NULL, -- owner, admin, member, viewer
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(workspace_id, user_id)
);

-- 4. Devices Table
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  dev_eui TEXT, -- External Unique Identifier (for LoRaWAN, etc.)
  serial_number TEXT,
  connectivity TEXT DEFAULT 'mqtt' NOT NULL, -- lorawan, mqtt, http_webhook, custom
  type TEXT DEFAULT 'generic' NOT NULL,
  status TEXT DEFAULT 'offline' NOT NULL,
  tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  last_seen TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'::JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Fields Table (Data points per device)
CREATE TABLE IF NOT EXISTS public.fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  alias TEXT NOT NULL,
  type TEXT DEFAULT 'number' NOT NULL, -- number, boolean, string
  unit TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(device_id, alias)
);

-- 6. Payload Decoders
CREATE TABLE IF NOT EXISTS public.payload_decoders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Measurements (Time-series Data)
-- Ideally this would be a TimescaleDB hypertable, but standard PostgreSQL works for initial scaffolding
CREATE TABLE IF NOT EXISTS public.measurements (
  id BIGSERIAL PRIMARY KEY,
  time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  device_id UUID REFERENCES public.devices ON DELETE CASCADE NOT NULL,
  field_id UUID REFERENCES public.fields ON DELETE CASCADE NOT NULL,
  value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Indices for performance
CREATE INDEX idx_measurements_device_time ON public.measurements(device_id, time DESC);
CREATE INDEX idx_measurements_field_time ON public.measurements(field_id, time DESC);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payload_decoders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Simplified for development)
-- User can see their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Members can see their workspace
CREATE POLICY "Members can view workspace" ON public.workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspaces.id AND user_id = auth.uid()
    )
  );

-- Members can see device data within their workspace
CREATE POLICY "Members can view devices" ON public.devices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = devices.workspace_id AND user_id = auth.uid()
    )
  );

-- 8. Dashboards
CREATE TABLE IF NOT EXISTS public.dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB DEFAULT '[]'::JSONB NOT NULL,
  settings JSONB DEFAULT '{}'::JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Widgets
CREATE TABLE IF NOT EXISTS public.widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID REFERENCES public.dashboards ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- line_chart, gauge, value, status
  title TEXT NOT NULL,
  config JSONB DEFAULT '{}'::JSONB NOT NULL,
  device_id UUID REFERENCES public.devices ON DELETE SET NULL,
  field_id UUID REFERENCES public.fields ON DELETE SET NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  w INTEGER NOT NULL,
  h INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indices
CREATE INDEX idx_dashboards_workspace_id ON public.dashboards(workspace_id);
CREATE INDEX idx_widgets_dashboard_id ON public.widgets(dashboard_id);

-- Enable RLS
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Members can view dashboards" ON public.dashboards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = dashboards.workspace_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can view widgets" ON public.widgets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dashboards d
      JOIN public.workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE d.id = widgets.dashboard_id AND wm.user_id = auth.uid()
    )
  );
-- 10. Gateways
CREATE TABLE IF NOT EXISTS public.gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- lorawan, mqtt, custom
  eui TEXT,
  status TEXT DEFAULT 'unknown' NOT NULL, -- online, offline, warning, unknown
  last_seen TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'::JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. Rules
CREATE TABLE IF NOT EXISTS public.rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  condition JSONB NOT NULL,
  actions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. Alerts
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces ON DELETE CASCADE NOT NULL,
  device_id UUID REFERENCES public.devices ON DELETE CASCADE,
  rule_id UUID REFERENCES public.rules ON DELETE SET NULL,
  severity TEXT DEFAULT 'info' NOT NULL, -- info, warning, critical
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indices
CREATE INDEX idx_gateways_workspace_id ON public.gateways(workspace_id);
CREATE INDEX idx_rules_workspace_id ON public.rules(workspace_id);
CREATE INDEX idx_alerts_workspace_id ON public.alerts(workspace_id);
CREATE INDEX idx_alerts_device_id ON public.alerts(device_id);

-- Enable RLS
ALTER TABLE public.gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Members can view gateways" ON public.gateways
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = gateways.workspace_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can view rules" ON public.rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = rules.workspace_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can view alerts" ON public.alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = alerts.workspace_id AND user_id = auth.uid()
    )
  );
