"use client";

import { useLatestDeviceLogs, useRealtimeDeviceLogs } from "@/hooks/use-iot-data";
import { 
  Terminal, 
  ChevronRight, 
  Clock, 
  Database,
  ArrowRight,
  RefreshCcw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function DeviceDebugLogs({ deviceId }: { deviceId: string }) {
  useRealtimeDeviceLogs(deviceId);
  const { data: logs = [], isLoading } = useLatestDeviceLogs(deviceId);

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">Live Payload Debugger</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-medium border border-emerald-500/20">
              <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
              Syncing
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3 font-mono text-sm scrollbar-thin scrollbar-thumb-slate-800">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-slate-500 space-x-2">
            <RefreshCcw className="h-4 w-4 animate-spin" />
            <span>Scanning for uplinks...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2 opacity-50">
             <Clock className="h-8 w-8 stroke-[1px]" />
             <span>Waiting for device join or uplink...</span>
          </div>
        ) : (
          logs.map((log: any, i: number) => (
            <div key={log.id} className="group animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex items-start gap-3">
                <span className="text-[10px] text-slate-600 pt-1 shrink-0">
                  {format(new Date(log.created_at), "HH:mm:ss.SSS")}
                </span>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] h-4 bg-emerald-500/5 text-emerald-400 border-emerald-500/20 font-bold px-1.5 uppercase">
                      {log.event_type}
                    </Badge>
                    {(log.f_port !== null && log.f_port !== undefined) && (
                      <span className="text-[10px] text-slate-500 font-bold">FPort: {log.f_port}</span>
                    )}
                    {(log.f_cnt !== null && log.f_cnt !== undefined) && (
                      <span className="text-[10px] text-slate-500 font-bold">FCnt: {log.f_cnt}</span>
                    )}
                    {log.data_base64 && (
                      <>
                        <ArrowRight className="h-3 w-3 text-slate-700" />
                        <span className="text-emerald-400 font-bold truncate max-w-[200px]">{log.data_base64}</span>
                      </>
                    )}
                  </div>
                  
                  {log.raw_payload && (
                    <div className="mt-1 p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 overflow-x-auto whitespace-pre group-hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-2 mb-1 border-b border-slate-800 pb-1 text-slate-500 uppercase text-[9px] font-bold">
                        <Database className="h-3 w-3" />
                        Raw Payload
                      </div>
                      {JSON.stringify(log.raw_payload, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
