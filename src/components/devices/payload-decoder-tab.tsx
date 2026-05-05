"use client";

import { useState } from "react";
import type { PayloadDecoder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Play, RotateCcw, Save, Code2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUpsertDecoder } from "@/hooks/use-iot-data";

interface PayloadDecoderTabProps {
  deviceId: string;
  decoder?: PayloadDecoder;
}

const FALLBACK_SCRIPT = `// Payload Decoder
// Input: bytes (Uint8Array or number[]), port (number)
// Output: object with field names as keys
//
// Example: decode a 2-byte temperature value
function Decoder(bytes, port) {
  const raw = (bytes[0] << 8) | bytes[1];
  const temperature = raw / 100.0;

  return {
    temperature: temperature,
  };
}`;

const TEST_PAYLOAD = "1A 2B 3C 4D";

function runDecoder(script: string, hexPayload: string): { result?: unknown; error?: string } {
  try {
    const bytes = hexPayload
      .trim()
      .split(/\s+/)
      .map((h) => parseInt(h, 16))
      .filter((n) => !isNaN(n));
    // eslint-disable-next-line no-new-func
    const fn = new Function("bytes", "port", `${script}; return Decoder(bytes, port);`);
    const result = fn(bytes, 1);
    return { result };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export function PayloadDecoderTab({ deviceId, decoder }: PayloadDecoderTabProps) {
  const [code, setCode] = useState(decoder?.code ?? FALLBACK_SCRIPT);
  const [isActive, setIsActive] = useState(decoder?.is_active ?? true);
  const [testPayload, setTestPayload] = useState(TEST_PAYLOAD);
  const [testResult, setTestResult] = useState<{ result?: unknown; error?: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  const upsertDecoder = useUpsertDecoder();

  function handleScriptChange(value: string) {
    setCode(value);
    setDirty(true);
    setTestResult(null);
  }

  function handleTest() {
    const result = runDecoder(code, testPayload);
    setTestResult(result);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Payload Decoder</h3>
          <p className="text-sm text-muted-foreground">
            Write a JavaScript function to parse raw device payloads into structured field data.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="decoder-enabled"
              checked={isActive}
              onCheckedChange={(v) => {
                setIsActive(v);
                setDirty(true);
              }}
            />
            <Label htmlFor="decoder-enabled" className="cursor-pointer text-sm">
              {isActive ? "Active" : "Disabled"}
            </Label>
          </div>
          {dirty && (
            <>
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave} className="gap-2">
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Code Editor */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Decoder Script</span>
            {dirty && (
              <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">
                Unsaved
              </Badge>
            )}
          </div>
          <div className="relative rounded-xl overflow-hidden border bg-[#1e1e2e] dark:bg-[#1e1e2e]">
            <div className="absolute top-0 left-0 right-0 h-8 bg-[#181825] flex items-center px-4 gap-2 z-10">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
              <span className="ml-2 text-xs text-white/40 font-mono">decoder.js</span>
            </div>
            <textarea
              className={cn(
                "w-full h-72 pt-10 px-4 pb-4 font-mono text-xs resize-none outline-none",
                "text-[#cdd6f4] bg-transparent"
              )}
              value={code}
              onChange={(e) => handleScriptChange(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Test Panel */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Test Decoder</div>
          <div className="rounded-xl border p-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Test Payload (hex)</Label>
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 font-mono text-xs rounded-md border bg-muted px-3 py-2 outline-none focus:ring-1 focus:ring-ring"
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  placeholder="A8 B1 00 FF..."
                />
              </div>
              <p className="text-xs text-muted-foreground">Space-separated hex bytes</p>
            </div>
            <Button
              size="sm"
              className="w-full gap-2"
              variant="outline"
              onClick={handleTest}
            >
              <Play className="h-3.5 w-3.5" />
              Run Test
            </Button>

            {testResult && (
              <div
                className={cn(
                  "rounded-lg border p-3 space-y-2",
                  testResult.error
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-emerald-500/30 bg-emerald-500/5"
                )}
              >
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  {testResult.error ? (
                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                  {testResult.error ? "Error" : "Success"}
                </div>
                <pre className="text-xs font-mono overflow-auto whitespace-pre-wrap break-words text-foreground/80">
                  {testResult.error
                    ? testResult.error
                    : JSON.stringify(testResult.result, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="rounded-xl border p-4 space-y-2">
            <p className="text-xs font-medium">Tips</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Function must be named <code className="font-mono bg-muted px-1 rounded">Decoder</code></li>
              <li>• Return an object with field names as keys</li>
              <li>• <code className="font-mono bg-muted px-1 rounded">bytes</code> is an array of integers</li>
              <li>• <code className="font-mono bg-muted px-1 rounded">port</code> is the LoRaWAN FPort</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
