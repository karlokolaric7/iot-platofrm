"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileDown, Languages, Landmark, Clock, Activity, CheckCircle2, ShieldAlert, Cpu, Network, Sliders, Database, Bell, Eye, Lock, Layers, Plus, Mail, ArrowRight, Check } from "lucide-react";

export default function CapabilitiesPage() {
  const [lang, setLang] = useState<"en" | "hr">("en");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Print Stylesheet Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          aside, 
          header, 
          nav, 
          [data-sidebar],
          .no-print,
          button,
          .interactive-badge {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .print-content {
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          .page-break {
            page-break-before: always;
          }
          h1, h2, h3, h4 {
            color: black !important;
            page-break-after: avoid;
          }
          p, li, span, td, th {
            color: #1a1a1a !important;
          }
          .mockup-container {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            color: black !important;
          }
          .mockup-text {
            color: #0f172a !important;
          }
          .mockup-subtext {
            color: #475569 !important;
          }
          .mockup-svg-path {
            stroke: #4f46e5 !important;
          }
          .mockup-svg-grid {
            stroke: #e2e8f0 !important;
          }
        }
      `}} />

      {/* Header Controls (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" />
            {lang === "en" ? "Capabilities & ROI" : "Mogućnosti i ROI"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "en" 
              ? "Comprehensive business value, target audience, and interactive interface preview." 
              : "Sveobuhvatna poslovna vrijednost, ciljana publika i interaktivni pregled sučelja."}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setLang(lang === "en" ? "hr" : "en")}
          >
            <Languages className="h-4 w-4 text-primary" />
            {lang === "en" ? "Prevedi na Hrvatski" : "Switch to English"}
          </Button>
          <Button className="gap-2 shadow-md" onClick={handlePrint}>
            <FileDown className="h-4 w-4" />
            {lang === "en" ? "Export as PDF" : "Izvezi u PDF"}
          </Button>
        </div>
      </div>

      {/* Document Content */}
      <Card className="print-content shadow-lg border bg-card/50 backdrop-blur-md">
        <CardContent className="p-8 sm:p-12 space-y-12">
          
          {/* English Version */}
          {lang === "en" && (
            <div className="space-y-16 text-foreground">
              <div className="text-center border-b pb-8">
                <h2 className="text-4xl font-extrabold tracking-tight text-primary">IoT Platform Capabilities</h2>
                <p className="text-lg text-muted-foreground mt-2 font-light">Whitepaper: Enterprise Business Value, Technical Features & UI Architecture</p>
              </div>

              {/* Introduction */}
              <section className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground">1. Executive Overview</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The <strong>Chameleon IoT Platform</strong> is a next-generation, secure, multi-tenant solution designed for enterprise-grade device orchestration, telemetry ingestion, and process automation. By natively integrating with low-power wide-area networks (LPWAN) like LoRaWAN, the platform enables organizations to capture physical-world data (such as temperature, energy, vibration, and flow) and translate it into real-time operational decisions.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Through its robust integration with <strong>ChirpStack</strong> and <strong>Tektelic Network Servers</strong>, the platform serves as a central nervous system for hardware deployments, abstracting complex sensor protocols into a clean, drag-and-drop dashboard builder and a logic-driven automation engine.
                </p>
              </section>

              {/* Business Value & ROI */}
              <section className="space-y-6">
                <h3 className="text-2xl font-bold text-foreground">2. Business Value & ROI</h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="flex gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 h-fit text-primary shrink-0"><Landmark className="h-5 w-5" /></div>
                    <div>
                      <h4 className="font-bold text-foreground">Financial Savings</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        <strong>Preventative Maintenance:</strong> Monitoring mechanical vibrations and temperature spikes allows companies to service equipment before catastrophic failures occur, avoiding emergency repair costs.
                        <br /><br />
                        <strong>Resource Conservation:</strong> Real-time flow and leak detection prevent expensive utility losses and minimize structural water damage in facilities.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 h-fit text-primary shrink-0"><Clock className="h-5 w-5" /></div>
                    <div>
                      <h4 className="font-bold text-foreground">Time & Labor Optimization</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        <strong>Automated Logging:</strong> Manual inspections are replaced by continuous, automated telemetry logging, eliminating human transcription errors and saving hundreds of hours of labor.
                        <br /><br />
                        <strong>Targeted Dispatch:</strong> Maintenance technicians are only dispatched when the platform identifies an active anomaly, optimizing fleet operations.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Detailed Features & Step-by-Step Mockups */}
              <div className="space-y-16 page-break">
                <h3 className="text-3xl font-extrabold text-foreground border-b pb-2">3. Detailed Feature Catalog & Interface Tour</h3>

                {/* Feature 1: Authentication */}
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Feature 1: Secure Authentication & Role-Based Access
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The platform secures all user actions using Supabase GoTrue authentication. Users must log in to obtain JWT tokens which are validated on every subsequent database and API request. Row Level Security policies ensure that users can only access resources they have explicit permission to view.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Step 1:</strong> Visit <code className="bg-muted px-1 rounded">/auth</code> and choose Sign In or Sign Up.</p>
                    <p><strong>Step 2:</strong> Enter your email credentials. If registering, verify your email via the confirmation link.</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6 flex justify-center">
                    <div className="w-full max-w-sm border border-slate-800 bg-slate-900/40 rounded-lg p-6 space-y-4">
                      <div className="text-center">
                        <h5 className="mockup-text text-white font-bold text-lg">Sign In</h5>
                        <p className="text-xs text-slate-400">Enter your credentials to access the platform</p>
                      </div>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase">Email Address</span>
                          <div className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300">operator@company.com</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase">Password</span>
                          <div className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-500">••••••••••••</div>
                        </div>
                      </div>
                      <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded shadow-lg transition-colors">Sign In</button>
                    </div>
                  </div>
                </div>

                {/* Feature 2: Workspaces */}
                <div className="space-y-4 page-break">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Feature 2: Multi-Tenant Workspace Isolation
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Workspaces act as virtual barriers separating companies or departments. The database enforces isolation using RLS policies, while the frontend layout components prevent unauthorized cross-workspace URL access by checking membership server-side.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Step 1:</strong> Use the switcher dropdown in the sidebar to view your active workspaces.</p>
                    <p><strong>Step 2:</strong> Click "Create New Workspace" to deploy a separate environment with its own dashboards and devices.</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-4 max-w-md mx-auto">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Select Workspace</span>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between p-2 bg-indigo-950/30 border border-indigo-500/30 rounded cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">Z</div>
                            <span className="mockup-text text-xs font-semibold text-white">Zagreb Factory (Main)</span>
                          </div>
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase">Active</span>
                        </div>
                        <div className="flex items-center justify-between p-2 hover:bg-slate-800/30 border border-slate-800 rounded cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">S</div>
                            <span className="mockup-text text-xs font-semibold text-slate-300">Split Distribution Center</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 p-2 border border-dashed border-slate-800 rounded hover:bg-slate-900/50 cursor-pointer text-xs text-indigo-400 font-semibold">
                          <Plus className="h-3.5 w-3.5" /> Create New Workspace
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 3: Gateways */}
                <div className="space-y-4 page-break">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Feature 3: Gateway Health & Heartbeat Monitoring
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Gateways receive LoRaWAN radio packets and forward them to the network server. The platform monitors gateway connections by checking the time difference of the last received uplink.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Step 1:</strong> Navigate to the Gateways tab in the sidebar.</p>
                    <p><strong>Step 2:</strong> View the list, MAC addresses, and status indicators (Online / Offline).</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <div className="border border-slate-800 bg-slate-900/40 rounded-lg overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-850 bg-slate-900/80 text-slate-400">
                            <th className="p-3">Gateway Name</th>
                            <th className="p-3">MAC Address / EUI</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Last Uplink</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-900">
                            <td className="p-3 font-semibold text-white">Zagreb Main Kona</td>
                            <td className="p-3 text-slate-400">0080E1150002A3FF</td>
                            <td className="p-3"><span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase"><div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online</span></td>
                            <td className="p-3 text-slate-400">2 mins ago</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-semibold text-white">Split AP Backup</td>
                            <td className="p-3 text-slate-400">0080E1150002B4CC</td>
                            <td className="p-3"><span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase">Offline</span></td>
                            <td className="p-3 text-slate-400">3 hours ago</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Feature 4: Devices */}
                <div className="space-y-4 page-break">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    Feature 4: LoRaWAN Device Registry
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Onboarding end-nodes requires registering unique LoRaWAN keys (DevEUI, AppEUI, AppKey). The platform utilizes these keys to authenticate and decrypt data packets sent by the sensors.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Step 1:</strong> Navigate to Devices and click "Add Device".</p>
                    <p><strong>Step 2:</strong> Enter the device name and hex keys, then click Submit to register.</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <div className="max-w-md mx-auto border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-3 text-xs">
                      <span className="font-bold text-white text-sm">Register New Device</span>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <span className="text-slate-400">Device Name:</span>
                          <input type="text" className="col-span-2 bg-slate-950 border border-slate-800 rounded p-1 text-slate-300" value="Cold Storage Temp 01" readOnly />
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <span className="text-slate-400">Device EUI:</span>
                          <input type="text" className="col-span-2 bg-slate-950 border border-slate-800 rounded p-1 text-slate-300" value="70B3D57ED004E3A1" readOnly />
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <span className="text-slate-400">AppKey:</span>
                          <input type="text" className="col-span-2 bg-slate-950 border border-slate-800 rounded p-1 text-slate-500" value="••••••••••••••••••••••••••••••••" readOnly />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button className="px-3 py-1 bg-slate-800 text-slate-300 rounded">Cancel</button>
                        <button className="px-3 py-1 bg-indigo-600 text-white rounded">Submit</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 5: Field Mapping */}
                <div className="space-y-4 page-break">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Feature 5: Dynamic Payload Field Mapping
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Decoded JSON payloads often contain short variable names (e.g. `t`). The Field Mapping system maps these keys to friendly Aliases (e.g. "Temperature") and Units (e.g. "°C") without database schema modifications.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Step 1:</strong> Open a device and navigate to the "Fields" tab.</p>
                    <p><strong>Step 2:</strong> Match the incoming JSON key with a custom alias and measurement unit.</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-4 text-xs">
                      <span className="font-bold text-white mb-2 block">Payload Field Mapping Configuration</span>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-slate-400 font-bold border-b border-slate-800 pb-1 mb-2">
                          <span>JSON Sensor Key</span>
                          <span>Human-Friendly Alias</span>
                          <span>Measurement Unit</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <code className="text-indigo-400 font-semibold bg-slate-950 p-1 rounded w-fit">temp_c</code>
                          <input type="text" className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-300" value="Ambient Temperature" readOnly />
                          <input type="text" className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-300" value="°C" readOnly />
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <code className="text-indigo-400 font-semibold bg-slate-950 p-1 rounded w-fit">hum_pct</code>
                          <input type="text" className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-300" value="Relative Humidity" readOnly />
                          <input type="text" className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-300" value="%" readOnly />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 6: Dashboard */}
                <div className="space-y-4 page-break">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Sliders className="h-5 w-5" />
                    Feature 6: Interactive Dashboard Builder
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The platform's dashboard features a responsive grid layout. Users can customize their visualization panel by adding, resizing, and positioning telemetry widgets.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Step 1:</strong> Open a dashboard and click "Edit Layout".</p>
                    <p><strong>Step 2:</strong> Drag and drop widgets to arrange, resize them using the corner handle, and click "Save Layout".</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">Dashboard: HVAC Overview</span>
                        <span className="px-2 py-1 bg-indigo-600 text-white rounded font-bold cursor-pointer">Edit Layout</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-slate-800 bg-slate-950 rounded p-3 space-y-2 cursor-move">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Value Widget: Temp</span>
                            <span className="material-symbols-outlined text-[12px]">drag_indicator</span>
                          </div>
                          <span className="mockup-text text-xl font-bold text-white block">22.8 °C</span>
                        </div>
                        <div className="border border-slate-800 bg-slate-950 rounded p-3 space-y-2 cursor-move">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Status Widget: Node 1</span>
                            <span className="material-symbols-outlined text-[12px]">drag_indicator</span>
                          </div>
                          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-emerald-400" /> ONLINE</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 7: Rule Engine */}
                <div className="space-y-4 page-break">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Feature 7: Real-Time Rule Engine
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Evaluates incoming telemetry packets in real-time. If a sensor value exceeds a configured threshold, the engine immediately dispatches actions like sending emails or triggering external API webhooks.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Step 1:</strong> Navigate to the Rule Engine page and click "Create Rule".</p>
                    <p><strong>Step 2:</strong> Define the trigger condition (IF) and the action (THEN), then click Save.</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <div className="max-w-md mx-auto border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-3 text-xs">
                      <span className="font-bold text-white">Rule Builder</span>
                      <div className="p-3 bg-slate-950 border border-slate-850 rounded space-y-2">
                        <span className="text-[10px] text-rose-500 font-bold uppercase">IF (Trigger)</span>
                        <p className="text-slate-300">Device <code className="bg-slate-900 p-1 text-white rounded">Cold Storage Temp 01</code> is <code className="bg-slate-900 p-1 text-white rounded">Temperature &gt; 4.0 °C</code></p>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-850 rounded space-y-2">
                        <span className="text-[10px] text-indigo-400 font-bold uppercase">THEN (Action)</span>
                        <p className="text-slate-300">Send Email Notification to <code className="bg-slate-900 p-1 text-white rounded">admin@company.com</code></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 8: Alerts */}
                <div className="space-y-4 page-break">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    Feature 8: Centralized Alerts Console
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Active anomalies are logged in the central Alerts table. Users can track the alarm lifecycle and acknowledge or resolve them to keep a clean operational audit trail.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Step 1:</strong> Open the Alerts page to view active and resolved alarms.</p>
                    <p><strong>Step 2:</strong> Click "Resolve" on an active alarm to log the resolution timestamp.</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <div className="border border-slate-850 bg-slate-900/40 rounded-lg overflow-hidden text-xs">
                      <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center">
                        <span className="font-bold text-white">Active Alerts Feed</span>
                        <span className="text-[10px] text-rose-400 font-bold animate-pulse">2 UNRESOLVED</span>
                      </div>
                      <div className="p-3 border-b border-slate-900 bg-rose-950/10 flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /><span className="mockup-text text-white font-bold">Cold Storage Temp 01 Overheat</span></div>
                          <p className="text-[10px] text-slate-400">Triggered: Temperature is 5.2 °C (Threshold &gt; 4.0 °C) • 10m ago</p>
                        </div>
                        <button className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded">Resolve</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 9: Member Collaboration */}
                <div className="space-y-4 page-break">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Feature 9: Workspace Team Collaboration
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Allows administrators to securely invite colleagues to a workspace. Invited members receive tokenized signup links, linking them to the target workspace with defined permissions.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Step 1:</strong> Navigate to the Members tab and click "Invite Member".</p>
                    <p><strong>Step 2:</strong> Enter the email address. Once registered, manage their role using the table dropdown.</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-4 text-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">Workspace Members</span>
                        <div className="flex gap-2">
                          <input type="text" className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 w-48" value="colleague@company.com" readOnly />
                          <button className="px-3 py-1 bg-indigo-600 text-white rounded font-bold">Invite</button>
                        </div>
                      </div>
                      <div className="border-t border-slate-850 pt-2 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">manager@company.com</span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">Owner</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">technician@company.com</span>
                          <select className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-slate-300" defaultValue="member"><option value="admin">Admin</option><option value="member">Member</option><option value="viewer">Viewer</option></select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Croatian Version */}
          {lang === "hr" && (
            <div className="space-y-16 text-foreground">
              <div className="text-center border-b pb-8">
                <h2 className="text-4xl font-extrabold tracking-tight text-primary">Mogućnosti IoT Platforme</h2>
                <p className="text-lg text-muted-foreground mt-2 font-light">Bijeli papir: Poslovna vrijednost, tehničke značajke i arhitektura sučelja</p>
              </div>

              {/* Uvod */}
              <section className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground">1. Izvršni pregled</h3>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Chameleon IoT Platforma</strong> je napredno, sigurno, višekorisničko (multi-tenant) rješenje dizajnirano za orkestraciju uređaja, prikupljanje telemetrije i automatizaciju procesa. Kroz nativnu integraciju s mrežama niske potrošnje i širokog dometa (LPWAN) poput LoRaWAN-a, platforma omogućuje organizacijama prikupljanje fizičkih podataka (temperatura, energija, vibracije, protok) i njihovo pretvaranje u operativne odluke u stvarnom vremenu.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Integracijom s <strong>ChirpStack</strong> i <strong>Tektelic</strong> mrežnim poslužiteljima, platforma služi kao središnji živčani sustav za hardverske instalacije, prevodeći složene senzorske protokole u jednostavan vizualni sustav i automatizirani rad.
                </p>
              </section>

              {/* Poslovna vrijednost */}
              <section className="space-y-6">
                <h3 className="text-2xl font-bold text-foreground">2. Poslovna vrijednost i ROI</h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="flex gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 h-fit text-primary shrink-0"><Landmark className="h-5 w-5" /></div>
                    <div>
                      <h4 className="font-bold text-foreground">Financijske uštede</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        <strong>Prediktivno održavanje:</strong> Praćenje vibracija i temperature strojeva omogućuje servisiranje prije nego što dođe do kvara, čime se izbjegavaju neplanirani zastoje i visoki troškovi hitnih popravaka.
                        <br /><br />
                        <strong>Očuvanje resursa:</strong> Detekcija curenja vode i plina u stvarnom vremenu sprječava visoke komunalne račune i štete na objektima.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 h-fit text-primary shrink-0"><Clock className="h-5 w-5" /></div>
                    <div>
                      <h4 className="font-bold text-foreground">Optimizacija rada i vremena</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        <strong>Automatsko bilježenje:</strong> Ručni obilasci zamijenjeni su kontinuiranim slanjem telemetrije, čime se eliminiraju ljudske pogreške i štedi vrijeme.
                        <br /><br />
                        <strong>Ciljanje na teren:</strong> Tehničari se šalju na lokacije isključivo kada sustav zabilježi odstupanje od nominalnih vrijednosti.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Detaljne značajke i korak po korak vodič */}
              <div className="space-y-16 page-break">
                <h3 className="text-3xl font-extrabold text-foreground border-b pb-2">3. Detaljan katalog značajki i obilazak sučelja</h3>

                {/* Feature 1: Autentifikacija */}
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Značajka 1: Sigurna autentifikacija i razine pristupa
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Platforma osigurava sve korisničke akcije koristeći Supabase GoTrue autentifikaciju. Korisnici se prijavljuju kako bi dobili JWT tokene koji se provjeravaju pri svakom upitu bazi. Sigurnosna pravila na razini baze (RLS) osiguravaju pristup isključivo dopuštenim podacima.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Korak 1:</strong> Posjetite <code className="bg-muted px-1 rounded">/auth</code> i odaberite Prijavu ili Registraciju.</p>
                    <p><strong>Korak 2:</strong> Unesite e-mail i lozinku. Ukoliko se registrirate, potvrdite račun preko e-mail poveznice.</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6 flex justify-center">
                    <div className="w-full max-w-sm border border-slate-800 bg-slate-900/40 rounded-lg p-6 space-y-4">
                      <div className="text-center">
                        <h5 className="mockup-text text-white font-bold text-lg">Prijava</h5>
                        <p className="text-xs text-slate-400">Unesite podatke za pristup platformi</p>
                      </div>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase">E-mail adresa</span>
                          <div className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300">operater@tvrtka.hr</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase">Lozinka</span>
                          <div className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-500">••••••••••••</div>
                        </div>
                      </div>
                      <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded shadow-lg transition-colors">Prijavi se</button>
                    </div>
                  </div>
                </div>

                {/* Feature 2: Radni prostori */}
                <div className="space-y-4 page-break">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Značajka 2: Izolacija radnih prostora (Multi-Tenancy)
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Radni prostori djeluju kao virtualne barijere koje odvajaju klijente ili odjele. Baza podataka sprječava neželjeni pristup podacima kroz RLS pravila, dok sučelje sprječava pristup promjenom URL-a provjeravajući članstvo na poslužitelju.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Korak 1:</strong> Otvorite padajući izbornik na bočnoj traci za pregled aktivnih prostora.</p>
                    <p><strong>Korak 2:</strong> Kliknite "Stvori novi radni prostor" za postavljanje novog odvojenog okruženja.</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-4 max-w-md mx-auto">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Odaberi radni prostor</span>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between p-2 bg-indigo-950/30 border border-indigo-500/30 rounded cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">T</div>
                            <span className="mockup-text text-xs font-semibold text-white">Tvornica Zagreb (Glavna)</span>
                          </div>
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase">Aktivno</span>
                        </div>
                        <div className="flex items-center justify-between p-2 hover:bg-slate-800/30 border border-slate-800 rounded cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">D</div>
                            <span className="mockup-text text-xs font-semibold text-slate-300">Distributivni centar Split</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 p-2 border border-dashed border-slate-800 rounded hover:bg-slate-900/50 cursor-pointer text-xs text-indigo-400 font-semibold">
                          <Plus className="h-3.5 w-3.5" /> Stvori novi radni prostor
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 3: Gateways */}
                <div className="space-y-4 page-break">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Značajka 3: Praćenje aktivnosti gatewaya
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pristupnici (gatewayi) prosljeđuju pakete senzora. Sustav prati njihovu aktivnost analizirajući vrijeme zadnje primljene poruke.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Korak 1:</strong> Idite na stranicu "Gatewayi" na bočnoj traci.</p>
                    <p><strong>Korak 2:</strong> Provjerite popis, MAC adrese i statuse (Aktivan / Neaktivan).</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <div className="border border-slate-800 bg-slate-900/40 rounded-lg overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-850 bg-slate-900/80 text-slate-400">
                            <th className="p-3">Naziv gatewaya</th>
                            <th className="p-3">MAC Adresa / EUI</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Zadnja poruka</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-900">
                            <td className="p-3 font-semibold text-white">Zagreb Glavni Kona</td>
                            <td className="p-3 text-slate-400">0080E1150002A3FF</td>
                            <td className="p-3"><span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase"><div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Aktivan</span></td>
                            <td className="p-3 text-slate-400">prije 2 min</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-semibold text-white">Split AP Rezerva</td>
                            <td className="p-3 text-slate-400">0080E1150002B4CC</td>
                            <td className="p-3"><span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase">Neaktivan</span></td>
                            <td className="p-3 text-slate-400">prije 3 sata</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Feature 4: Uređaji */}
                <div className="space-y-4 page-break">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    Značajka 4: Registar LoRaWAN uređaja
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Dodavanje senzora zahtijeva unos jedinstvenih ključeva (DevEUI, AppEUI, AppKey) koji služe za provjeru autentičnosti i enkripciju podataka.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Korak 1:</strong> Otvorite Uređaje i kliknite "Dodaj uređaj".</p>
                    <p><strong>Korak 2:</strong> Unesite naziv i hex ključeve te kliknite Spremi.</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <div className="max-w-md mx-auto border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-3 text-xs">
                      <span className="font-bold text-white text-sm">Registracija novog uređaja</span>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <span className="text-slate-400">Naziv:</span>
                          <input type="text" className="col-span-2 bg-slate-950 border border-slate-800 rounded p-1 text-slate-300" value="Senzor temperature Hladnjača 1" readOnly />
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <span className="text-slate-400">Device EUI:</span>
                          <input type="text" className="col-span-2 bg-slate-950 border border-slate-800 rounded p-1 text-slate-300" value="70B3D57ED004E3A1" readOnly />
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <span className="text-slate-400">AppKey:</span>
                          <input type="text" className="col-span-2 bg-slate-950 border border-slate-800 rounded p-1 text-slate-500" value="••••••••••••••••••••••••••••••••" readOnly />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button className="px-3 py-1 bg-slate-800 text-slate-300 rounded">Odustani</button>
                        <button className="px-3 py-1 bg-indigo-600 text-white rounded">Spremi</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 5: Mapiranje polja */}
                <div className="space-y-4 page-break">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Značajka 5: Dinamičko mapiranje polja dekodera
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sirovi podaci često dolaze sa skraćenim nazivima. Sustav omogućuje mapiranje tih ključeva u jasne nazive (Aliase) i mjerne jedinice.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Korak 1:</strong> Kliknite na uređaj i otvorite karticu "Polja".</p>
                    <p><strong>Korak 2:</strong> Povežite sirovi JSON ključ s prilagođenim nazivom i mjernom jedinicom.</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-4 text-xs">
                      <span className="font-bold text-white mb-2 block">Konfiguracija mapiranja polja</span>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-slate-400 font-bold border-b border-slate-800 pb-1 mb-2">
                          <span>JSON Ključ senzora</span>
                          <span>Razumljiv naziv (Alias)</span>
                          <span>Mjerna jedinica</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <code className="text-indigo-400 font-semibold bg-slate-950 p-1 rounded w-fit">temp_c</code>
                          <input type="text" className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-300" value="Temperatura okoline" readOnly />
                          <input type="text" className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-300" value="°C" readOnly />
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <code className="text-indigo-400 font-semibold bg-slate-950 p-1 rounded w-fit">hum_pct</code>
                          <input type="text" className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-300" value="Relativna vlaga" readOnly />
                          <input type="text" className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-300" value="%" readOnly />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 6: Dashboard */}
                <div className="space-y-4 page-break">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Sliders className="h-5 w-5" />
                    Značajka 6: Prilagodljive nadzorne ploče
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sučelje nadzorne ploče omogućuje slaganje elemenata po želji. Korisnici mogu dodavati i raspoređivati widgete za vizualizaciju podataka.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Korak 1:</strong> Otvorite nadzornu ploču i kliknite "Uredi izgled".</p>
                    <p><strong>Korak 2:</strong> Premjestite widgete povlačenjem, promijenite im veličinu i kliknite "Spremi izgled".</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">Nadzorna ploča: Pregled HVAC-a</span>
                        <span className="px-2 py-1 bg-indigo-600 text-white rounded font-bold cursor-pointer">Uredi izgled</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-slate-800 bg-slate-950 rounded p-3 space-y-2 cursor-move">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Vrijednost: Temp</span>
                            <span className="material-symbols-outlined text-[12px]">drag_indicator</span>
                          </div>
                          <span className="mockup-text text-xl font-bold text-white block">22.8 °C</span>
                        </div>
                        <div className="border border-slate-800 bg-slate-950 rounded p-3 space-y-2 cursor-move">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Status: Čvor 1</span>
                            <span className="material-symbols-outlined text-[12px]">drag_indicator</span>
                          </div>
                          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-emerald-400" /> AKTIVAN</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 7: Rule Engine */}
                <div className="space-y-4 page-break">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Značajka 7: Automatizirani sustav pravila
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Automatska provjera telemetrije u stvarnom vremenu. Ukoliko vrijednost prijeđe zadanu granicu, sustav šalje e-mail obavijesti ili pokreće vanjske API webhookove.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Korak 1:</strong> Otvorite "Sustav pravila" i kliknite "Stvori pravilo".</p>
                    <p><strong>Korak 2:</strong> Definirajte uvjet (AKO) i akciju (TADA) te spremite pravilo.</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <div className="max-w-md mx-auto border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-3 text-xs">
                      <span className="font-bold text-white">Kreator pravila</span>
                      <div className="p-3 bg-slate-950 border border-slate-850 rounded space-y-2">
                        <span className="text-[10px] text-rose-500 font-bold uppercase">AKO (Uvjet)</span>
                        <p className="text-slate-300">Uređaj <code className="bg-slate-900 p-1 text-white rounded">Hladnjača 1</code> ima vrijednost <code className="bg-slate-900 p-1 text-white rounded">Temperatura &gt; 4.0 °C</code></p>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-850 rounded space-y-2">
                        <span className="text-[10px] text-indigo-400 font-bold uppercase">TADA (Akcija)</span>
                        <p className="text-slate-300">Pošalji e-mail obavijest na adresu <code className="bg-slate-900 p-1 text-white rounded">administrator@tvrtka.hr</code></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 8: Upozorenja */}
                <div className="space-y-4 page-break">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    Značajka 8: Središnja konzola upozorenja
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sva aktivirana upozorenja bilježe se na jednom mjestu. Korisnici mogu pratiti status alarma te ih označiti riješenima nakon intervencije na terenu.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Korak 1:</strong> Otvorite stranicu "Upozorenja" za pregled aktivnih alarma.</p>
                    <p><strong>Korak 2:</strong> Kliknite "Riješi" kako biste zabilježili vrijeme otklanjanja kvara.</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <div className="border border-slate-850 bg-slate-900/40 rounded-lg overflow-hidden text-xs">
                      <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center">
                        <span className="font-bold text-white font-sans">Aktivna upozorenja</span>
                        <span className="text-[10px] text-rose-400 font-bold animate-pulse">2 NERIJEŠENO</span>
                      </div>
                      <div className="p-3 border-b border-slate-900 bg-rose-950/10 flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /><span className="mockup-text text-white font-bold">Pregrijavanje Hladnjača 1</span></div>
                          <p className="text-[10px] text-slate-400">Izmjereno: Temperatura je 5.2 °C (Uvjet &gt; 4.0 °C) • prije 10 min</p>
                        </div>
                        <button className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded">Riješi</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 9: Članovi */}
                <div className="space-y-4 page-break">
                  <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Značajka 9: Suradnja i pozivanje članova tima
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Omogućuje administratorima slanje pozivnica kolegama. Pozvani članovi dobivaju sigurne poveznice za registraciju nakon čega se automatski pridružuju radnom prostoru.
                  </p>
                  <div className="pl-4 border-l-2 border-slate-700 space-y-1 text-xs text-muted-foreground">
                    <p><strong>Korak 1:</strong> Otvorite karticu "Članovi" i kliknite "Pozovi člana".</p>
                    <p><strong>Korak 2:</strong> Unesite e-mail adresu. Nakon njihove registracije, prilagodite im ulogu kroz tablicu.</p>
                  </div>
                  {/* Mockup */}
                  <div className="mockup-container rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-4 text-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">Članovi radnog prostora</span>
                        <div className="flex gap-2">
                          <input type="text" className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 w-48" value="kolega@tvrtka.hr" readOnly />
                          <button className="px-3 py-1 bg-indigo-600 text-white rounded font-bold">Pozovi</button>
                        </div>
                      </div>
                      <div className="border-t border-slate-850 pt-2 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">voditelj@tvrtka.hr</span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">Vlasnik</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">tehnicar@tvrtka.hr</span>
                          <select className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-slate-300" defaultValue="member"><option value="admin">Admin</option><option value="member">Član</option><option value="viewer">Pregledatelj</option></select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
