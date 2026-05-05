import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Database, Json } from '@/lib/supabase/database.types';
import { useEffect } from 'react';

const supabase = createClient();

const workspaceCache = new Map<string, string>();

async function getWorkspaceId(slugOrId: string) {
  if (!slugOrId) return slugOrId;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  if (isUUID) return slugOrId;
  
  // Check cache
  if (workspaceCache.has(slugOrId)) return workspaceCache.get(slugOrId)!;

  const { data } = await supabase.from('workspaces').select('id').eq('slug', slugOrId).maybeSingle();
  if (!data?.id) throw new Error("Workspace not found");
  
  workspaceCache.set(slugOrId, data.id);
  return data.id;
}

// --- Workspace Hooks ---

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
}

export function useWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId) ? 'id' : 'slug', workspaceId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useChirpstackGateways() {
  return useQuery({
    queryKey: ["chirpstack-gateways"],
    queryFn: async () => {
      const res = await fetch("/api/chirpstack/gateways");
      if (!res.ok) throw new Error("Failed to fetch ChirpStack status");
      return res.json();
    },
    refetchInterval: 10000,
  });
}

export function useChirpstackDevices() {
  return useQuery({
    queryKey: ["chirpstack-devices"],
    queryFn: async () => {
      const res = await fetch("/api/chirpstack/devices");
      if (!res.ok) throw new Error("Failed to fetch ChirpStack devices status");
      return res.json();
    },
    refetchInterval: 10000,
  });
}

export function useChirpstackDevice(devEui: string) {
  return useQuery({
    queryKey: ["chirpstack-device", devEui],
    queryFn: async () => {
      if (!devEui) return null;
      const res = await fetch(`/api/chirpstack/devices/${devEui}`);
      if (!res.ok) throw new Error("Failed to fetch ChirpStack device status");
      return res.json();
    },
    enabled: !!devEui,
    refetchInterval: 10000,
  });
}



export function useCurrentUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      return { ...user, profile };
    },
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, slug }: { name: string; slug: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Create workspace
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({
          name,
          slug,
          owner_id: user.id,
        })
        .select()
        .single();
      
      if (wsError) throw wsError;

      // 2. Add as owner member
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'owner',
        });
      
      if (memberError) throw memberError;

      return workspace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Database['public']['Tables']['workspaces']['Update'] & { id: string }) => {
      const { data, error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspace', data.id] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

// --- Device Hooks ---

export function useDevices(workspaceId: string) {
  return useQuery({
    queryKey: ['devices', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devices')
        .select('*, fields(*)')
        .eq('workspace_id', await getWorkspaceId(workspaceId))
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
}

export function useDevice(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId],
    queryFn: async () => {
      if (!deviceId) return null;
      const { data, error } = await supabase
        .from('devices')
        .select('*, fields(*), payload_decoders(*)')
        .eq('id', deviceId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!deviceId,
  });
}

export function useUpdateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Database['public']['Tables']['devices']['Update'] & { id: string }) => {
      const { data, error } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['device', data.id] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

// --- Measurement Hooks ---

export function useLatestMeasurements(deviceId: string) {
  return useQuery({
    queryKey: ['measurements', 'latest', deviceId],
    queryFn: async () => {
      if (!deviceId) return [];
      const { data, error } = await supabase
        .from('measurements')
        .select('*, fields(alias)')
        .eq('device_id', deviceId)
        .order('time', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!deviceId,
    refetchInterval: 5000, 
  });
}

export function useHistoricalData(deviceId: string, fieldId: string, range: string) {
  return useQuery({
    queryKey: ['measurements', 'history', deviceId, fieldId, range],
    queryFn: async () => {
      if (!deviceId || !fieldId) return [];

      let fromDate = new Date();
      switch (range) {
        case '1h': fromDate.setHours(fromDate.getHours() - 1); break;
        case '24h': fromDate.setHours(fromDate.getHours() - 24); break;
        case '7d': fromDate.setDate(fromDate.getDate() - 7); break;
        case '30d': fromDate.setDate(fromDate.getDate() - 30); break;
        default: fromDate.setHours(fromDate.getHours() - 24);
      }

      const { data, error } = await supabase
        .from('measurements')
        .select('time, value')
        .eq('device_id', deviceId)
        .eq('field_id', fieldId)
        .gte('time', fromDate.toISOString())
        .order('time', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!deviceId && !!fieldId,
  });
}

// --- Device Log Hooks ---

export function useLatestDeviceLogs(deviceId: string) {
  return useQuery({
    queryKey: ['device_logs', 'latest', deviceId],
    queryFn: async () => {
      if (!deviceId) return [];
      const { data, error } = await supabase
        .from('device_logs')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!deviceId,
    refetchInterval: 5000, 
  });
}

// --- Gateway Hooks ---

export function useAddGateway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gateway: Omit<Database['public']['Tables']['gateways']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
      const actualId = await getWorkspaceId(gateway.workspace_id);
      
      // 1. Insert into Supabase
      const { data, error } = await supabase
        .from('gateways')
        .insert({ ...gateway, workspace_id: actualId })
        .select()
        .single();
      
      if (error) throw error;

      // 2. Provision in ChirpStack if it's a LoRaWAN gateway
      if (gateway.type === 'lorawan' && gateway.eui) {
        try {
          const res = await fetch('/api/chirpstack/provision-gateway', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: data.id,
              eui: gateway.eui,
              name: gateway.name,
              workspaceId: gateway.workspace_id
            }),
          });
          
          if (!res.ok) {
            const err = await res.json();
            console.warn("ChirpStack provisioning failed:", err.message);
            // We don't throw here to avoid failing the whole UI flow if ChirpStack is just down,
            // but we could. For now, we just log it.
          }
        } catch (err) {
          console.error("Failed to call provisioning API:", err);
        }
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gateways', data.workspace_id] });
    },
  });
}

export function useGateways(workspaceId: string) {
  return useQuery({
    queryKey: ['gateways', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gateways')
        .select('*')
        .eq('workspace_id', await getWorkspaceId(workspaceId))
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
}

export function useGateway(gatewayId: string) {
  return useQuery({
    queryKey: ['gateway', gatewayId],
    queryFn: async () => {
      if (!gatewayId) return null;
      const { data, error } = await supabase
        .from('gateways')
        .select('*')
        .eq('id', gatewayId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!gatewayId,
  });
}

export function useUpdateGateway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Database['public']['Tables']['gateways']['Update']> & { id: string }) => {
      const { data, error } = await supabase
        .from('gateways')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gateway', data.id] });
      queryClient.invalidateQueries({ queryKey: ['gateways', data.workspace_id] });
    },
  });
}

export function useDeleteGateway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eui, workspaceId }: { id: string; eui?: string | null; workspaceId: string }) => {
      // 1. Delete from ChirpStack if EUI exists
      if (eui) {
        try {
          await fetch(`/api/chirpstack/provision-gateway?eui=${eui}`, {
            method: "DELETE",
          });
        } catch (err) {
          console.warn("ChirpStack deletion failed, continuing with DB removal", err);
        }
      }

      // 2. Delete from Supabase
      const { error } = await supabase
        .from('gateways')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, workspaceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gateways', data.workspaceId] });
      queryClient.removeQueries({ queryKey: ['gateway', data.id] });
    },
  });
}

// --- Dashboard Hooks ---

export function useDashboards(workspaceId: string) {
  return useQuery({
    queryKey: ['dashboards', workspaceId],
    queryFn: async () => {
      const actualWorkspaceId = await getWorkspaceId(workspaceId);
      const { data, error } = await supabase
        .from('dashboards')
        .select('*')
        .eq('workspace_id', actualWorkspaceId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
}

export function useDashboard(dashboardId: string) {
  return useQuery({
    queryKey: ['dashboard', dashboardId],
    queryFn: async () => {
      if (!dashboardId) return null;
      const { data, error } = await supabase
        .from('dashboards')
        .select('*, widgets(*)')
        .eq('id', dashboardId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!dashboardId,
  });
}

export function useCreateDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dashboard: Database['public']['Tables']['dashboards']['Insert']) => {
      const actualWorkspaceId = await getWorkspaceId(dashboard.workspace_id as string);
      
      const { data, error } = await supabase
        .from('dashboards')
        .insert({ ...dashboard, workspace_id: actualWorkspaceId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });
}

export function useDeleteDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string, workspaceId: string }) => {
      const { error } = await supabase
        .from('dashboards')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, workspaceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
      queryClient.removeQueries({ queryKey: ['dashboard', data.id] });
    },
  });
}

export function useDeviceDashboard(deviceId: string, workspaceId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['device-dashboard', deviceId],
    queryFn: async () => {
      if (!deviceId) return null;
      
      // Try to find an existing dashboard for this device
      const { data: existing, error } = await supabase
        .from('dashboards')
        .select('*, widgets(*)')
        .eq('settings->>deviceId', deviceId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (existing) return existing;

      // If none exists, create a default one
      // Get actual workspace UUID first
      const actualWorkspaceId = await getWorkspaceId(workspaceId);

      // 1. Fetch device fields to see which ones to show
      const { data: fields } = await supabase
        .from('fields')
        .select('*')
        .eq('device_id', deviceId)
        .eq('show_on_dashboard', true);

      // 2. Insert the dashboard
      const { data: dashboard, error: createError } = await supabase
        .from('dashboards')
        .insert({
          name: `Overview: ${deviceId.slice(0, 8)}`,
          workspace_id: actualWorkspaceId,
          settings: { deviceId, type: 'device' },
        })
        .select()
        .single();

      if (createError) throw createError;

      // 3. Create default widgets if fields exist
      if (fields && fields.length > 0) {
        const defaultWidgets = fields.map((field, index) => ({
          dashboard_id: dashboard.id,
          device_id: deviceId,
          field_id: field.id,
          type: 'value_display',
          title: field.alias || field.name,
          config: { color: field.color || '#3b82f6', unit: field.unit || '' },
          x: (index % 3) * 4,
          y: Math.floor(index / 3) * 2,
          w: 4,
          h: 2
        }));

        await supabase.from('widgets').insert(defaultWidgets);
      }

      // Return the dashboard with basic empty widgets for immediate local render
      // The query will eventually re-fetch if needed, but we can return what we have
      return { ...dashboard, widgets: [] };
    },
    enabled: !!deviceId && !!workspaceId,
  });
}

// --- Field Hooks ---

export function useAddField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (field: Database['public']['Tables']['fields']['Insert']) => {
      const { data, error } = await supabase
        .from('fields')
        .insert(field)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['device', data.device_id] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

export function useUpdateField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Database['public']['Tables']['fields']['Update'] & { id: string }) => {
      const { data, error } = await supabase
        .from('fields')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['device', data.device_id] });
    },
  });
}

export function useDeleteField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, deviceId }: { id: string; deviceId: string }) => {
      const { error } = await supabase
        .from('fields')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, deviceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['device', data.deviceId] });
    },
  });
}

// --- Widget Hooks ---

export function useAddWidget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (widget: Database['public']['Tables']['widgets']['Insert']) => {
      const { data, error } = await supabase
        .from('widgets')
        .insert(widget)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', data.dashboard_id] });
      queryClient.invalidateQueries({ queryKey: ['device-dashboard'] });
    },
  });
}

export function useUpdateWidget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Database['public']['Tables']['widgets']['Update'] & { id: string }) => {
      const { data, error } = await supabase
        .from('widgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', data.dashboard_id] });
      queryClient.invalidateQueries({ queryKey: ['device-dashboard'] });
    },
  });
}

export function useDeleteWidget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dashboardId }: { id: string; dashboardId: string }) => {
      const { error } = await supabase
        .from('widgets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, dashboardId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', data.dashboardId] });
      queryClient.invalidateQueries({ queryKey: ['device-dashboard'] });
    },
  });
}

// --- Decoder Hooks ---

export function useUpsertDecoder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ device_id, code, is_active }: { device_id: string; code: string; is_active: boolean }) => {
      // Check if decoder exists first
      const { data: existing } = await supabase
        .from('payload_decoders')
        .select('id')
        .eq('device_id', device_id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('payload_decoders')
          .update({ code, is_active, updated_at: new Date().toISOString() })
          .eq('device_id', device_id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('payload_decoders')
          .insert({ device_id, code, is_active })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['device', data.device_id] });
    },
  });
}

export function useUpdateWidgetLayouts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (layouts: { id: string, x: number, y: number, w: number, h: number }[]) => {
      const promises = layouts.map(l => 
        supabase.from('widgets').update({ x: l.x, y: l.y, w: l.w, h: l.h }).eq('id', l.id)
      );
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error).map(r => r.error);
      if (errors.length > 0) throw errors[0];
      return true;
    },
    onSuccess: () => {
      // Opt-out of full invalidation to avoid jumpy UI during dragging
    },
  });
}

// --- Rule Hooks ---

export function useRules(workspaceId: string) {
  return useQuery({
    queryKey: ['rules', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
}

export function useToggleRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('rules')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rules', data.workspace_id] });
    },
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Database['public']['Tables']['rules']['Insert']) => {
      const { data, error } = await supabase
        .from('rules')
        .insert(rule)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rules', data.workspace_id] });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase
        .from('rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, workspaceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rules', data.workspaceId] });
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...rule }: { id: string } & Database['public']['Tables']['rules']['Update']) => {
      const { data, error } = await supabase
        .from('rules')
        .update(rule)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rules', data.workspace_id] });
    },
  });
}

// --- Alert Hooks ---

export function useAlerts(workspaceId: string) {
  return useQuery({
    queryKey: ['alerts', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*, devices(name)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alerts', data.workspace_id] });
    },
  });
}

// --- Mutation Hooks ---

export function useCreateGateway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gateway: Database['public']['Tables']['gateways']['Insert']) => {
      const actualWorkspaceId = await getWorkspaceId(gateway.workspace_id);

      // 1. Provision in ChirpStack
      try {
        await fetch("/api/chirpstack/provision-gateway", {
          method: "POST",
          body: JSON.stringify({
            name: gateway.name,
            eui: gateway.eui,
            description: (gateway as any).description,
            workspaceId: actualWorkspaceId
          })
        });
      } catch (err) {
        console.warn("ChirpStack provisioning failed, but continuing with database save", err);
      }

      // 2. Save to Supabase
      const { data, error } = await supabase
        .from('gateways')
        .insert({ ...gateway, workspace_id: actualWorkspaceId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gateways', data.workspace_id] });
    },
  });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (device: Database['public']['Tables']['devices']['Insert']) => {
      const actualWorkspaceId = await getWorkspaceId(device.workspace_id);

      // 1. Provision in ChirpStack if it's LoRaWAN
      if (device.connectivity === 'lorawan' && device.dev_eui) {
        const res = await fetch("/api/chirpstack/provision-device", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: device.name,
            devEui: device.dev_eui,
            appEui: (device as any).app_eui || null,
            appKey: (device as any).app_key || null,
            description: device.description,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(`ChirpStack provisioning failed: ${err.error || "Unknown error"}`);
        }
      }

      // 2. Save to Supabase (strip app_key — never stored for security)
      const { app_key, app_eui, ...supabaseData } = device as any;
      const { data, error } = await supabase
        .from('devices')
        .insert({ ...supabaseData, app_eui, workspace_id: actualWorkspaceId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['devices', data.workspace_id] });
      queryClient.invalidateQueries({ queryKey: ['chirpstack-devices'] });
    },
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, devEui, workspaceId }: { id: string; devEui?: string | null; workspaceId: string }) => {
      // 1. Delete from ChirpStack if we have a devEui
      if (devEui) {
        try {
          await fetch(`/api/chirpstack/provision-device?devEui=${encodeURIComponent(devEui)}`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.warn('ChirpStack device deletion failed, continuing with DB removal', err);
        }
      }

      // 2. Delete from Supabase
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, workspaceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['devices', data.workspaceId] });
      queryClient.removeQueries({ queryKey: ['device', data.id] });
      queryClient.invalidateQueries({ queryKey: ['chirpstack-devices'] });
    },
  });
}


export function useSaveDashboardLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, layout }: { id: string; layout: Json }) => {
      const { data, error } = await supabase
        .from('dashboards')
        .update({ layout })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', data.id] });
    },
  });
}

// --- Realtime Hooks ---

export function useRealtimeMeasurements(deviceId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!deviceId) return;

    const channel = supabase
      .channel(`device-measurements-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'measurements',
          filter: `device_id=eq.${deviceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['measurements', 'latest', deviceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, queryClient]);
}

export function useRealtimeDeviceLogs(deviceId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!deviceId) return;

    const channel = supabase
      .channel(`device-logs-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'device_logs',
          filter: `device_id=eq.${deviceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['device_logs', 'latest', deviceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, queryClient]);
}
