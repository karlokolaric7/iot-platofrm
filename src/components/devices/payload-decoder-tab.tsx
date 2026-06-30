"use client";

import { useState, useEffect } from "react";
import type { PayloadDecoder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  RotateCcw, 
  Save, 
  Code2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Binary, 
  Eye, 
  Check, 
  HelpCircle,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUpsertDecoder } from "@/hooks/use-iot-data";

interface PayloadDecoderTabProps {
  deviceId: string;
  decoder?: PayloadDecoder;
}

// ==========================================
// PRESETS & TEMPLATES
// ==========================================
const DECODER_PRESETS = [
  {
    name: "Simple Temp & Humidity",
    description: "Decodes 2-byte temperature (signed) and 2-byte humidity",
    code: `// Simple Temperature & Humidity Decoder
// Input: bytes (array of numbers), port (number)
// Output: object with telemetry fields
function Decode(port, bytes) {
  // Byte 0-1: Temperature (signed, multiplied by 100)
  const tempRaw = (bytes[0] << 8) | bytes[1];
  // Handle negative temperatures (two's complement)
  const temperature = tempRaw > 32767 ? (tempRaw - 65536) / 100.0 : tempRaw / 100.0;
  
  // Byte 2-3: Humidity (multiplied by 100)
  const humidity = ((bytes[2] << 8) | bytes[3]) / 100.0;

  return {
    temperature: Number(temperature.toFixed(2)),
    humidity: Number(humidity.toFixed(2))
  };
}`,
    payload: "0B B8 17 70", // 30.00°C, 60.00%
    format: "hex" as const
  },
  {
    name: "Digital Input & Battery",
    description: "Decodes 1-byte battery level and 1-byte digital input state",
    code: `// Digital Input & Battery Voltage Decoder
function Decode(port, bytes) {
  // Byte 0: Battery voltage in decivolts (e.g., 36 = 3.6V)
  const battery = bytes[0] / 10.0;
  
  // Byte 1: Digital input state (0 = OFF, 1 = ON)
  const state = bytes[1] === 1 ? 1 : 0;

  return {
    battery_voltage: battery,
    digital_state: state
  };
}`,
    payload: "24 01", // 3.6V, state 1 (ON)
    format: "hex" as const
  },
  {
    name: "Tektelic Smart Room Sensor",
    description: "Decodes battery, temperature, humidity, and motion",
    code: `// Tektelic Smart Room Sensor Decoder
// Decodes standard TLM (Telemetry) packets
function Decode(port, bytes) {
  const decoded = {};
  
  for (let i = 0; i < bytes.length; ) {
    const label = bytes[i];
    
    if (label === 0x0A) { // Battery voltage
      decoded.battery_voltage = bytes[i+1] * 0.01 + 2.0; // Volts
      i += 2;
    } else if (label === 0x0B) { // Temperature
      const temp = (bytes[i+1] << 8) | bytes[i+2];
      // Signed 16-bit
      decoded.temperature = (temp > 32767 ? temp - 65536 : temp) * 0.1;
      i += 3;
    } else if (label === 0x0C) { // Relative Humidity
      decoded.humidity = bytes[i+1] * 0.5;
      i += 2;
    } else if (label === 0x0D) { // Motion (PIR)
      decoded.motion = bytes[i+1] === 0xFF ? 1 : 0;
      i += 2;
    } else {
      i++; // Skip unknown label
    }
  }
  
  return decoded;
}`,
    payload: "0A 96 0B 00 E6 0C 78 0D FF", // Battery: 3.5V, Temp: 23.0°C, Humidity: 60%, Motion: 1
    format: "hex" as const
  }
];

const FALLBACK_SCRIPT = DECODER_PRESETS[0].code;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function hexToBase64(hex: string): string {
  try {
    const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
    const matches = cleanHex.match(/.{1,2}/g);
    if (!matches) return "";
    const bytes = new Uint8Array(matches.map(byte => parseInt(byte, 16)));
    return btoa(String.fromCharCode(...bytes));
  } catch {
    return "";
  }
}

function base64ToHex(b64: string): string {
  try {
    const binary = atob(b64);
    const hex = [];
    for (let i = 0; i < binary.length; i++) {
      const h = binary.charCodeAt(i).toString(16).toUpperCase();
      hex.push(h.padStart(2, '0'));
    }
    return hex.join(' ');
  } catch {
    return "";
  }
}

function parseHex(hex: string): number[] {
  return hex
    .trim()
    .split(/\s+/)
    .map((h) => parseInt(h, 16))
    .filter((n) => !isNaN(n));
}

function parseBase64(b64: string): number[] {
  try {
    const binary = atob(b64);
    const bytes = [];
    for (let i = 0; i < binary.length; i++) {
      bytes.push(binary.charCodeAt(i));
    }
    return bytes;
  } catch {
    return [];
  }
}

export function PayloadDecoderTab({ deviceId, decoder }: PayloadDecoderTabProps) {
  const [code, setCode] = useState(decoder?.code ?? FALLBACK_SCRIPT);
  const [isActive, setIsActive] = useState(decoder?.is_active ?? true);
  
  // Playground States
  const [payloadFormat, setPayloadFormat] = useState<"hex" | "base64">("hex");
  const [testPayload, setTestPayload] = useState(DECODER_PRESETS[0].payload);
  const [testPort, setTestPort] = useState<number>(10);
  const [parsedBytes, setParsedBytes] = useState<number[]>([]);
  const [hoveredByte, setHoveredByte] = useState<{ value: number; index: number } | null>(null);
  
  // Results
  const [testResult, setTestResult] = useState<{ result?: Record<string, unknown>; error?: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);

  const upsertDecoder = useUpsertDecoder();

  // Update parsed bytes whenever payload or format changes
  useEffect(() => {
    if (payloadFormat === "hex") {
      setParsedBytes(parseHex(testPayload));
    } else {
      setParsedBytes(parseBase64(testPayload));
    }
  }, [testPayload, payloadFormat]);

  // Format toggling helper
  function handleFormatChange(newFormat: "hex" | "base64") {
    if (newFormat === payloadFormat) return;
    if (newFormat === "base64") {
      const b64 = hexToBase64(testPayload);
      setTestPayload(b64);
    } else {
      const hex = base64ToHex(testPayload);
      setTestPayload(hex);
    }
    setPayloadFormat(newFormat);
  }

  function handleScriptChange(value: string) {
    setCode(value);
    setDirty(true);
    setTestResult(null);
  }

  function applyPreset(preset: typeof DECODER_PRESETS[0]) {
    setCode(preset.code);
    setTestPayload(preset.payload);
    setPayloadFormat(preset.format);
    setDirty(true);
    setTestResult(null);
    toast.success(`Applied '${preset.name}' preset`);
  }

  function handleTest() {
    try {
      const bytes = parsedBytes;
      
      // Execute in a clean sandbox context
      const sandbox = {
        decodeToString: (b: number[]) => String.fromCharCode(...b),
        bytes,
        port: testPort
      };

      // Wrap code and execute Decode(port, bytes) or decodeUplink({ bytes, fPort })
      const fn = new Function("bytes", "port", `
        "use strict";
        ${code}
        if (typeof Decode === 'function') return Decode(port, bytes);
        if (typeof decodeUplink === 'function') {
          const res = decodeUplink({ bytes, fPort: port });
          return res?.data || res || {};
        }
        throw new Error("No 'Decode(port, bytes)' or 'decodeUplink(input)' function found in script.");
      `);

      const result = fn(bytes, testPort);
      
      if (!result || typeof result !== 'object') {
        throw new Error("Decoder must return a JSON object containing key-value fields.");
      }

      // Filter to fields to display
      const cleanResult: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(result)) {
        if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') {
          cleanResult[k] = v;
        }
      }

      setTestResult({ result: cleanResult });
      toast.success("Test executed successfully");
    } catch (e: any) {
      setTestResult({ error: e.message || String(e) });
      toast.error("Decoder test failed");
    }
  }

  async function handleSave() {
    try {
      await upsertDecoder.mutateAsync({
        device_id: deviceId,
        code,
        is_active: isActive
      });
      setDirty(false);
      toast.success("Decoder saved successfully");
    } catch (err) {
      toast.error("Failed to save decoder");
    }
  }

  function handleReset() {
    setCode(decoder?.code ?? FALLBACK_SCRIPT);
    setIsActive(decoder?.is_active ?? true);
    setDirty(false);
    setTestResult(null);
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col h-full font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/60 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
              <Cpu className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Live Decoder Debugger</h3>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            Write JavaScript to translate raw binary payloads into human-readable fields.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200/40">
            <Switch
              id="decoder-enabled"
              checked={isActive}
              onCheckedChange={(v) => {
                setIsActive(v);
                setDirty(true);
              }}
            />
            <Label htmlFor="decoder-enabled" className="cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
              {isActive ? "Active" : "Disabled"}
            </Label>
          </div>
          
          {dirty && (
            <div className="flex items-center gap-2 animate-fade-in">
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-2 h-9 text-xs font-bold">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave} className="gap-2 h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-5 flex-1">
        
        {/* Left Column: Code Editor & Presets */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          
          {/* Presets and Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>Select a preset template to start:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DECODER_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
                  title={preset.description}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Editor Container */}
          <div className="flex-1 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <Code2 className="h-4 w-4 text-slate-400" />
                <span>JavaScript Editor</span>
              </div>
              {dirty && (
                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 animate-pulse">
                  Unsaved Changes
                </Badge>
              )}
            </div>
            
            {/* Glassmorphic Code Editor */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#0f0f16] dark:bg-[#0f0f16] flex flex-col h-[450px]">
              <div className="absolute top-0 left-0 right-0 h-9 bg-[#161622] flex items-center justify-between px-4 z-10 border-b border-slate-800/40">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-[10px] font-bold text-slate-500 font-mono">decoder.js</span>
                </div>
                <span className="text-[10px] font-bold text-indigo-400 font-mono">ES6 Sandbox</span>
              </div>
              
              <div className="flex flex-1 pt-9 overflow-hidden">
                {/* Line Numbers */}
                <div className="w-10 bg-[#161622]/40 border-r border-slate-800/20 text-right pr-2.5 select-none py-4 font-mono text-[11px] text-slate-600 leading-6 overflow-hidden h-full">
                  <div style={{ transform: `translateY(-${scrollTop}px)` }} className="transition-transform duration-75">
                    {Array.from({ length: Math.max(code.split("\n").length, 15) }).map((_, i) => (
                      <div key={i} className="h-6">{i + 1}</div>
                    ))}
                  </div>
                </div>
                <textarea
                  className={cn(
                    "flex-1 p-4 font-mono text-[12px] resize-none outline-none leading-6 bg-transparent select-text overflow-y-auto",
                    "text-indigo-100 placeholder-slate-700 w-full h-full"
                  )}
                  value={code}
                  onChange={(e) => handleScriptChange(e.target.value)}
                  onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
                  spellCheck={false}
                  placeholder="// Write your JavaScript Decoder function here..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Ingestion Testing & Live Byte Analyzer */}
        <div className="lg:col-span-2 flex flex-col space-y-5">
          
          <div className="bg-slate-50 dark:bg-slate-800/25 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 space-y-4 flex-1 flex flex-col">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Binary className="h-4 w-4 text-indigo-500" />
              Live Test Playground
            </h4>

            {/* Format Toggle */}
            <div className="grid grid-cols-2 gap-1 bg-slate-200/50 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => handleFormatChange("hex")}
                className={cn(
                  "py-1.5 text-xs font-bold rounded-md transition-all",
                  payloadFormat === "hex" 
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                Hex Payload
              </button>
              <button
                onClick={() => handleFormatChange("base64")}
                className={cn(
                  "py-1.5 text-xs font-bold rounded-md transition-all",
                  payloadFormat === "base64" 
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                Base64 Payload
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-slate-500">Payload Input</Label>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {payloadFormat === "hex" ? "Space-separated bytes" : "Standard Base64 string"}
                  </span>
                </div>
                <input
                  className="w-full font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-950 dark:text-slate-50 shadow-2xs"
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  placeholder={payloadFormat === "hex" ? "e.g. 0A 96 0B" : "e.g. CpY="}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-500">LoRaWAN FPort</Label>
                <input
                  type="number"
                  min="1"
                  max="223"
                  className="w-full font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-950 dark:text-slate-50"
                  value={testPort}
                  onChange={(e) => setTestPort(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            {/* Visual Byte Explorer */}
            {parsedBytes.length > 0 && (
              <div className="space-y-2 border-t border-slate-200/50 dark:border-slate-800/60 pt-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    Interactive Byte Analyzer
                  </Label>
                  <span className="text-[10px] font-bold text-indigo-500">{parsedBytes.length} bytes</span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 p-2 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 rounded-xl min-h-[44px]">
                  {parsedBytes.map((byte, idx) => (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredByte({ value: byte, index: idx })}
                      onMouseLeave={() => setHoveredByte(null)}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold cursor-help transition-all shadow-3xs border",
                        hoveredByte?.index === idx
                          ? "bg-indigo-600 border-indigo-600 text-white scale-110"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-800"
                      )}
                    >
                      {byte.toString(16).toUpperCase().padStart(2, "0")}
                    </div>
                  ))}
                </div>

                {/* Byte Detail Hover Card */}
                <div className="h-10">
                  {hoveredByte ? (
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-lg px-3 py-1.5 flex justify-between items-center text-[10px] font-mono text-indigo-700 dark:text-indigo-300 animate-fade-in">
                      <span><strong>Byte [{hoveredByte.index}]:</strong></span>
                      <span>Dec: {hoveredByte.value}</span>
                      <span>Hex: 0x{hoveredByte.value.toString(16).toUpperCase().padStart(2, "0")}</span>
                      <span>Bin: {hoveredByte.value.toString(2).padStart(8, "0")}</span>
                      {hoveredByte.value >= 32 && hoveredByte.value <= 126 && (
                        <span>Char: '{String.fromCharCode(hoveredByte.value)}'</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 italic flex items-center justify-center h-full gap-1">
                      <HelpCircle className="h-3 w-3" />
                      Hover over any byte above to inspect its numerical structures.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Run Button */}
            <Button
              onClick={handleTest}
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white h-10 font-bold text-xs shadow-sm mt-auto"
            >
              <Play className="h-4 w-4" />
              Run Sandbox Test
            </Button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="animate-slide-up">
              {testResult.error ? (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>Compilation or Execution Error</span>
                  </div>
                  <pre className="text-xs font-mono overflow-auto max-h-28 whitespace-pre-wrap break-all text-rose-700 dark:text-rose-300/80 bg-rose-500/10 p-2 rounded-lg border border-rose-500/10">
                    {testResult.error}
                  </pre>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Successful Decoded Output</span>
                  </div>
                  
                  {/* Decoded Table */}
                  {testResult.result && Object.keys(testResult.result).length > 0 ? (
                    <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-3xs">
                      <table className="w-full border-collapse text-[11px] text-left">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                            <th className="p-2.5 font-bold text-slate-500">Telemetry Field</th>
                            <th className="p-2.5 font-bold text-slate-500">Decoded Value</th>
                            <th className="p-2.5 font-bold text-slate-500">Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(testResult.result).map(([field, val]) => (
                            <tr key={field} className="border-b border-slate-100 dark:border-slate-850 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                              <td className="p-2.5 font-mono font-bold text-slate-700 dark:text-slate-350">{field}</td>
                              <td className="p-2.5 font-semibold text-indigo-600 dark:text-indigo-400">{String(val)}</td>
                              <td className="p-2.5">
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                                  typeof val === 'number' && "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/30",
                                  typeof val === 'string' && "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 border border-sky-200/30",
                                  typeof val === 'boolean' && "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400 border border-teal-200/30"
                                )}>
                                  {typeof val}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic p-2 text-center">
                      Decoder executed successfully but returned an empty object.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
