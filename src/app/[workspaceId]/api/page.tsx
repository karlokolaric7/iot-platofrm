"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Key, Plus, Copy, Trash2, Eye, EyeOff, ShieldCheck, Terminal } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";

interface ApiToken {
  id: string;
  name: string;
  token: string;
  lastUsed: string | null;
  createdAt: string;
}

const MOCK_TOKENS: ApiToken[] = [
  {
    id: "tk-1",
    name: "Production Gateway",
    token: "at_live_a1b2c3d4e5f6g7h8",
    lastUsed: "2024-03-15T14:30:00Z",
    createdAt: "2024-01-10T09:00:00Z",
  },
  {
    id: "tk-2",
    name: "Mobile App Integration",
    token: "at_live_z9y8x7w6v5u4t3s2",
    lastUsed: null,
    createdAt: "2024-03-01T11:20:00Z",
  },
];

export default function ApiSettingsPage() {
  const [tokens, setTokens] = useState<ApiToken[]>(MOCK_TOKENS);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const { t, language } = useLanguage();

  const toggleTokenVisibility = (id: string) => {
    setShowTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success(t("api.tokenCopied"));
  };

  const handleDelete = (id: string) => {
    if (confirm(t("api.confirmRevoke"))) {
      setTokens((prev) => prev.filter((t) => t.id !== id));
      toast.success(t("api.tokenRevoked"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("api.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("api.desc")}
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t("api.createNewToken")}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Token Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Key className="h-4 w-4" />
              {t("api.accessTokensTitle")}
            </CardTitle>
            <CardDescription>
              {t("api.accessTokensDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("api.tokenNameHead")}</TableHead>
                  <TableHead>{t("api.keyHead")}</TableHead>
                  <TableHead>{t("api.lastUsedHead")}</TableHead>
                  <TableHead>{t("api.createdHead")}</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell className="font-medium">{token.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                          {showTokens[token.id] ? token.token : "••••••••••••••••••••"}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleTokenVisibility(token.id)}
                        >
                          {showTokens[token.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopy(token.token)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {token.lastUsed ? new Date(token.lastUsed).toLocaleDateString(language === "hr" ? "hr-HR" : "en-US") : t("gateways.never")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(token.createdAt).toLocaleDateString(language === "hr" ? "hr-HR" : "en-US")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(token.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Integration Help */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                {t("api.bestPracticesTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p className="text-muted-foreground">
                {t("api.bestPracticesDesc")}
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                <li>{t("api.practice1")}</li>
                <li>{t("api.practice2")}</li>
                <li>{t("api.practice3")}</li>
                <li>{t("api.practice4")}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                {language === "hr" ? "Primjer integracije" : "Integration Example"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{t("api.exampleCurl")}</p>
                <div className="relative">
                  <pre className="block bg-slate-950 p-3 rounded-lg text-[10px] text-slate-300 font-mono overflow-x-auto border border-slate-800 leading-relaxed">
{`curl -X POST https://api.iot-platform.io/v1/ingest \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"device_id": "d-123", "data": {"temp": 22}}'`}
                  </pre>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-white hover:bg-white/10"
                    onClick={() => {
                      navigator.clipboard.writeText(`curl -X POST https://api.iot-platform.io/v1/ingest \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"device_id": "d-123", "data": {"temp": 22}}'`);
                      toast.success(t("api.commandCopied"));
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
