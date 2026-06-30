"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileDown, Languages, BookOpen, CheckCircle2 } from "lucide-react";

export default function ManualPage() {
  const [lang, setLang] = useState<"en" | "hr">("en");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Print Stylesheet Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide sidebar, top header, and interactive controls */
          aside, 
          header, 
          nav, 
          [data-sidebar],
          .no-print,
          button {
            display: none !important;
          }
          /* Reset layout padding and backgrounds */
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
          /* Page break styling */
          .page-break {
            page-break-before: always;
          }
          h1, h2, h3 {
            color: black !important;
            page-break-after: avoid;
          }
        }
      `}} />

      {/* Header Controls (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            {lang === "en" ? "User Manual" : "Korisnički priručnik"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "en" 
              ? "Step-by-step guide to onboarding and managing your IoT devices." 
              : "Korak-po-korak vodič za integraciju i upravljanje vašim IoT uređajima."}
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

      {/* Manual Content */}
      <Card className="print-content shadow-lg border bg-card/50 backdrop-blur-md">
        <CardContent className="p-8 sm:p-12 space-y-10">
          
          {/* English Version */}
          {lang === "en" && (
            <div className="space-y-12">
              <div className="text-center border-b pb-8">
                <h2 className="text-3xl font-extrabold tracking-tight text-primary">IoT Platform</h2>
                <p className="text-lg text-muted-foreground mt-2">Enterprise User Manual & Onboarding Guide</p>
              </div>

              {/* Section 1 */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground border-b pb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                  Account Creation & Sign In
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  To access the platform, you must create an account or sign in with your existing credentials:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Navigate to the login page (<code className="bg-muted px-1.5 py-0.5 rounded text-xs">/auth</code>).</li>
                  <li>Toggle the form to <strong>Sign Up</strong> to register a new account, or enter your email and password to <strong>Sign In</strong>.</li>
                  <li>For new accounts, check your email inbox and click the confirmation link to activate your account.</li>
                  <li>Upon logging in, the platform will automatically redirect you to your primary workspace dashboard.</li>
                </ul>
              </section>

              {/* Section 2 */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground border-b pb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                  Workspace Management
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Workspaces are completely isolated environments separating devices, dashboards, and member access:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Create Workspace:</strong> Click the workspace switcher dropdown in the sidebar, click <strong>Create New Workspace</strong>, enter a name, and submit. A custom URL slug is automatically generated.</li>
                  <li><strong>Switch Workspaces:</strong> Use the sidebar switcher dropdown to transition instantly between your active workspaces.</li>
                  <li><strong>Delete Workspace:</strong> Navigate to <strong>Settings</strong>, scroll to the <em>Danger Zone</em>, and click <strong>Delete Workspace</strong>. This action is permanent and deletes all associated devices and telemetry.</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground border-b pb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
                  Adding Gateways
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Gateways act as LoRaWAN base stations, receiving radio packets and forwarding them to the network server:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Navigate to the <strong>Gateways</strong> page in the sidebar.</li>
                  <li>The page automatically polls connected gateway statuses.</li>
                  <li><strong>Online (Green):</strong> Indicates active packet forwarding.</li>
                  <li><strong>Offline (Red):</strong> Indicates the gateway has not checked in for over 1 hour. Immediate power and network diagnostics are required.</li>
                </ul>
              </section>

              {/* Section 4 */}
              <section className="space-y-4 page-break">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground border-b pb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">4</span>
                  Adding Devices & Custom Fields
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Onboard your LoRaWAN end-nodes to start recording data:
                </p>
                <div className="space-y-3 pl-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Step A: Registering the Device
                  </h4>
                  <p className="text-muted-foreground pl-6">
                    Go to <strong>Devices</strong>, click <strong>Add Device</strong>, enter a friendly Name, DevEUI, AppEUI, and AppKey, and submit.
                  </p>
                  
                  <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Step B: Mapping Decoder Fields
                  </h4>
                  <p className="text-muted-foreground pl-6">
                    Click the device from the list, open the <strong>Fields</strong> tab, and map payload parameters (e.g. mapping parameter <code className="bg-muted px-1 rounded">temp</code> to Alias <code className="bg-muted px-1 rounded">Temperature</code> and Unit <code className="bg-muted px-1 rounded">°C</code>). Once mapped, the platform records historical values.
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground border-b pb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">5</span>
                  Creating & Managing Dashboards
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Dashboards provide customized real-time visualizations using drag-and-drop widgets:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Navigate to <strong>Dashboards</strong>, click <strong>Create Dashboard</strong>, name it, and submit.</li>
                  <li>Click <strong>Edit Layout</strong> in the top right to unlock customization mode.</li>
                  <li>Click <strong>Add Widget</strong> and choose:
                    <ul className="list-circle pl-6 mt-1 space-y-1">
                      <li><strong>Value Display:</strong> Displays latest reading + 24-hour mini sparkline.</li>
                      <li><strong>Line Chart:</strong> Historical trend graph with timeframe ranges.</li>
                      <li><strong>Bar Chart:</strong> Great for comparative metrics (e.g. daily water volume).</li>
                      <li><strong>Status Indicator:</strong> Visual state indicator (Online/Offline/Alert).</li>
                    </ul>
                  </li>
                  <li>Configure the widget by selecting the target device and field.</li>
                  <li>Drag the widget headers to move them; use the bottom-right corner handles to resize.</li>
                  <li>Click <strong>Save Layout</strong> to save the configuration permanently.</li>
                </ul>
              </section>

              {/* Section 6 */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground border-b pb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">6</span>
                  Automation Rules & Alerts
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Configure alerts and external webhooks to respond to telemetry anomalies:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Navigate to <strong>Rule Engine</strong> and click <strong>Create Rule</strong>.</li>
                  <li>Define the trigger condition (e.g. <em>If Temperature is Greater Than (&gt;) 30°C</em>).</li>
                  <li>Select the actions: generating an in-app alert, sending emails, or triggering external API webhooks.</li>
                  <li>Monitor triggered events on the <strong>Alerts</strong> page. You can click <strong>Resolve</strong> on individual alerts or click <strong>Clear All</strong> to flush the history.</li>
                </ul>
              </section>
            </div>
          )}

          {/* Croatian Version */}
          {lang === "hr" && (
            <div className="space-y-12">
              <div className="text-center border-b pb-8">
                <h2 className="text-3xl font-extrabold tracking-tight text-primary">IoT Platforma</h2>
                <p className="text-lg text-muted-foreground mt-2">Korisnički priručnik i vodič za integraciju</p>
              </div>

              {/* Sekcija 1 */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground border-b pb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                  Stvaranje računa i prijava
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Za pristup platformi potrebno je stvoriti račun ili se prijaviti s postojećim vjerodajnicama:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Posjetite stranicu za prijavu (<code className="bg-muted px-1.5 py-0.5 rounded text-xs">/auth</code>).</li>
                  <li>Odaberite <strong>Registracija</strong> (Sign Up) za novi račun ili unesite e-mail i lozinku te kliknite <strong>Prijava</strong> (Sign In).</li>
                  <li>Za nove račune, potvrdite e-mail adresu klikom na poveznicu u pristigloj pošti kako biste aktivirali račun.</li>
                  <li>Nakon prijave, platforma će vas automatski preusmjeriti na nadzornu ploču vašeg primarnog radnog prostora.</li>
                </ul>
              </section>

              {/* Sekcija 2 */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground border-b pb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                  Upravljanje radnim prostorima
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Radni prostori (Workspaces) su potpuno izolirana okruženja koja razdvajaju uređaje, nadzorne ploče i članove tima:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Stvaranje radnog prostora:</strong> Kliknite na padajući izbornik za promjenu radnog prostora u bočnoj traci, kliknite <strong>Stvori novi radni prostor</strong>, unesite naziv i potvrdite. URL slug se automatski generira.</li>
                  <li><strong>Promjena radnog prostora:</strong> Koristite padajući izbornik na bočnoj traci za brzi prijelaz između aktivnih radnih prostora.</li>
                  <li><strong>Brisanje radnog prostora:</strong> Otvorite <strong>Postavke</strong> (Settings) u bočnoj traci, skrolajte do <em>Opasne zone</em> i kliknite <strong>Obriši radni prostor</strong>. Ova akcija je trajna i briše sve uređaje i telemetriju.</li>
                </ul>
              </section>

              {/* Sekcija 3 */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground border-b pb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
                  Dodavanje gatewaya
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Gatewayi djeluju kao bazne stanice za LoRaWAN mrežu, primajući radijske pakete od senzora i prosljeđujući ih mrežnom poslužitelju:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Idite na stranicu <strong>Gatewayi</strong> (Gateways) u bočnoj traci.</li>
                  <li>Stranica automatski provjerava status povezanih gatewaya.</li>
                  <li><strong>Aktivan (Zeleno):</strong> Označava aktivno prosljeđivanje paketa.</li>
                  <li><strong>Neaktivan (Crveno):</strong> Označava da gateway nije komunicirao više od 1 sata. Potrebno je provjeriti napajanje i mrežnu povezivost.</li>
                </ul>
              </section>

              {/* Sekcija 4 */}
              <section className="space-y-4 page-break">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground border-b pb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">4</span>
                  Dodavanje uređaja i prilagođenih polja
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Dodajte svoje LoRaWAN senzore kako biste započeli s prikupljanjem podataka:
                </p>
                <div className="space-y-3 pl-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Korak A: Registracija uređaja
                  </h4>
                  <p className="text-muted-foreground pl-6">
                    Otvorite <strong>Uređaji</strong> (Devices), kliknite <strong>Dodaj uređaj</strong>, unesite naziv, DevEUI, AppEUI i AppKey, te potvrdite.
                  </p>
                  
                  <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Korak B: Mapiranje polja dekodera
                  </h4>
                  <p className="text-muted-foreground pl-6">
                    Kliknite na uređaj s popisa, otvorite karticu <strong>Polja</strong> (Fields) i mapirajte parametre iz dekodera (npr. parametar <code className="bg-muted px-1 rounded">temp</code> mapirajte u Alias <code className="bg-muted px-1 rounded">Temperatura</code> i mjernu jedinicu <code className="bg-muted px-1 rounded">°C</code>). Nakon mapiranja, sustav započinje s povijesnim bilježenjem vrijednosti.
                  </p>
                </div>
              </section>

              {/* Sekcija 5 */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground border-b pb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">5</span>
                  Stvaranje i upravljanje nadzornim pločama
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Nadzorne ploče (Dashboards) omogućuju prilagođeni prikaz podataka u realnom vremenu:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Otvorite <strong>Nadzorne ploče</strong>, kliknite <strong>Stvori nadzornu ploču</strong>, unesite naziv i potvrdite.</li>
                  <li>Kliknite <strong>Uredi izgled</strong> (Edit Layout) u gornjem desnom kutu kako biste otključali uređivanje.</li>
                  <li>Kliknite <strong>Dodaj widget</strong> i odaberite:
                    <ul className="list-circle pl-6 mt-1 space-y-1">
                      <li><strong>Prikaz vrijednosti (Value Display):</strong> Prikazuje zadnje očitanje + minijaturni 24-satni grafikon trenda.</li>
                      <li><strong>Linijski grafikon (Line Chart):</strong> Prikaz povijesnih kretanja s odabirom vremenskog raspona.</li>
                      <li><strong>Stupčasti grafikon (Bar Chart):</strong> Odlično za usporedbu potrošnje (npr. dnevni volumen vode).</li>
                      <li><strong>Indikator statusa:</strong> Vizualni prikaz stanja (Aktivan/Neaktivan/Upozorenje).</li>
                    </ul>
                  </li>
                  <li>Konfigurirajte widget odabirom željenog uređaja i mjernog polja.</li>
                  <li>Povucite zaglavlje widgeta kako biste ga premjestili; koristite donji desni kut za promjenu veličine.</li>
                  <li>Kliknite <strong>Spremi izgled</strong> (Save Layout) kako biste trajno pohranili konfiguraciju.</li>
                </ul>
              </section>

              {/* Sekcija 6 */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground border-b pb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">6</span>
                  Pravila automatizacije i upozorenja
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Postavite uvjete i kanale obavijesti kako biste automatski reagirali na odstupanja u telemetriji:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Otvorite <strong>Rule Engine</strong> i kliknite <strong>Stvori pravilo</strong>.</li>
                  <li>Definirajte uvjet okidanja (npr. <em>Ako je Temperatura veća od (&gt;) 30°C</em>).</li>
                  <li>Odaberite akcije: stvaranje internog upozorenja, slanje e-maila ili okidanje vanjskog API webhooka.</li>
                  <li>Pratite aktivirana upozorenja na stranici <strong>Upozorenja</strong> (Alerts). Možete kliknuti <strong>Riješi</strong> (Resolve) na pojedinačnom upozorenju ili <strong>Očisti sve</strong> (Clear All) za brisanje cijele povijesti.</li>
                </ul>
              </section>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
