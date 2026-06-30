"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "hr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    sidebar: {
      overview: "Overview",
      devices: "Devices",
      gateways: "Gateways",
      ruleEngine: "Rule Engine",
      dataExplorer: "Data Explorer",
      alerts: "Alerts",
      members: "Members",
      apiSettings: "API Settings",
      digitalTwin: "Digital Twin",
      workspace: "Workspace",
      support: "Support",
      account: "Account",
      signOut: "Sign Out Account",
      workspaces: "Workspaces",
      active: "Active",
      addWorkspace: "Add Workspace",
      userManual: "User Manual",
      capabilities: "Platform Capabilities"
    },
    header: {
      searchPlaceholder: "Search devices, alerts, rules... (Ctrl+K)",
      helpShortcuts: "Help & Shortcuts",
      helpDesc: "Quick keyboard commands to navigate the platform seamlessly.",
      close: "Close",
      action: "Action",
      key: "Key",
      openSearch: "Open quick search",
      createDashboard: "Create new dashboard",
      toggleHelp: "Toggle help guide",
      developerApps: "Developer Apps",
      devDesc: "Quick launch local Docker environment links.",
      notifications: "Notifications Center",
      markAllRead: "Mark all read",
      unreadNotifications: "unread",
      profile: "Profile Settings",
      currentAccount: "Current Account",
      editProfile: "Edit Profile Settings",
      workspaceSettings: "Workspace Settings",
      signOut: "Sign Out Account",
      fullName: "Full Name",
      email: "Account Email",
      chooseAvatar: "Choose preset avatar",
      saving: "Saving changes...",
      saveChanges: "Save Changes",
      cancel: "Cancel"
    },
    dashboard: {
      overview: "Platform Overview",
      realTime: "Real-time infrastructure monitoring and fleet status",
      exportReport: "Export Report",
      globalSites: "Global Sites",
      activeNodes: "Active Nodes",
      totalDevices: "Total Devices",
      online: "ONLINE",
      activeAlerts: "Active Alerts",
      msgRate: "Message Rate",
      msgDay: "MSG/DAY",
      aggregatedTelemetry: "Aggregated Telemetry",
      networkTraffic: "Network traffic and data ingestion rates",
      systemActivity: "System Activity",
      viewAll: "View All",
      searchDashboards: "Search dashboards...",
      newDashboard: "New Dashboard",
      createDashboardTitle: "Create Dashboard",
      createDashboardDesc: "Deploy a custom-configured dashboards space for fleet visualizers.",
      dashboardName: "Dashboard Name",
      dashboardDesc: "Dashboard Description",
      dashboardDescPlaceholder: "Optional brief description of this dashboards canvas.",
      create: "Create Dashboard",
      widgets: "WIDGETS",
      modified: "Modified",
      noDashboards: "No Dashboards Created",
      noDashboardsDesc: "Build your first dashboards layout to begin visualizing live sensor feeds.",
      createFirst: "Create your first dashboard"
    },
    exporter: {
      title: "Telemetry Report Compiler",
      desc: "Configure your data parameters and compile a customized CSV or JSON export of your device fleet.",
      format: "Report Output Format",
      csv: "CSV Report",
      csvDesc: "Excel / Spreadsheet Compatible",
      json: "JSON Schema",
      jsonDesc: "Developer API Interface",
      timeWindow: "Time Window Scale",
      deviceScope: "Telemetry Device Scope",
      allFleet: "All Fleet Devices",
      cancel: "Cancel",
      compile: "Compile & Download File",
      generating: "Generating Stream...",
      compiling: "Compiling workspace telemetry...",
      querying: "Querying active telemetry indexes...",
      analyzing: "Analyzing device metrics & alerts...",
      structuring: "Structuring final data tables...",
      building: "Building file payload streams..."
    }
  },
  hr: {
    sidebar: {
      overview: "Pregled",
      devices: "Uređaji",
      gateways: "Pristupnici",
      ruleEngine: "Sustav pravila",
      dataExplorer: "Istraživač podataka",
      alerts: "Upozorenja",
      members: "Članovi",
      apiSettings: "API Postavke",
      digitalTwin: "Digitalni blizanac",
      workspace: "Radni prostor",
      support: "Podrška",
      account: "Korisnički račun",
      signOut: "Odjava s računa",
      workspaces: "Radni prostori",
      active: "Aktivno",
      addWorkspace: "Dodaj radni prostor",
      userManual: "Korisnički priručnik",
      capabilities: "Mogućnosti platforme"
    },
    header: {
      searchPlaceholder: "Pretraži uređaje, upozorenja, pravila... (Ctrl+K)",
      helpShortcuts: "Pomoć i prečaci",
      helpDesc: "Brzi prečaci na tipkovnici za lakše kretanje platformom.",
      close: "Zatvori",
      action: "Akcija",
      key: "Tipka",
      openSearch: "Otvori brzu pretragu",
      createDashboard: "Izradi novu nadzornu ploču",
      toggleHelp: "Prikaži / sakrij pomoć",
      developerApps: "Razvojni alati",
      devDesc: "Brze veze za lokalna Docker okruženja.",
      notifications: "Centar za obavijesti",
      markAllRead: "Označi sve pročitano",
      unreadNotifications: "nepročitano",
      profile: "Postavke profila",
      currentAccount: "Trenutni račun",
      editProfile: "Uredi postavke profila",
      workspaceSettings: "Postavke radnog prostora",
      signOut: "Odjavi se s računa",
      fullName: "Ime i prezime",
      email: "E-pošta računa",
      chooseAvatar: "Odaberi profilni avatar",
      saving: "Spremanje promjena...",
      saveChanges: "Spremi promjene",
      cancel: "Odustani"
    },
    dashboard: {
      overview: "Pregled platforme",
      realTime: "Praćenje infrastrukture u stvarnom vremenu i status flote",
      exportReport: "Izvezi izvještaj",
      globalSites: "Lokacije",
      activeNodes: "Aktivni čvorovi",
      totalDevices: "Ukupno uređaja",
      online: "AKTIVNO",
      activeAlerts: "Aktivna upozorenja",
      msgRate: "Brzina poruka",
      msgDay: "PORUKE/DAN",
      aggregatedTelemetry: "Zbrojna telemetrija",
      networkTraffic: "Mrežni promet i brzina unosa podataka",
      systemActivity: "Aktivnosti sustava",
      viewAll: "Prikaži sve",
      searchDashboards: "Pretraži nadzorne ploče...",
      newDashboard: "Nova nadzorna ploča",
      createDashboardTitle: "Izradi nadzornu ploču",
      createDashboardDesc: "Postavite prilagođeni prostor nadzorne ploče za vizualizaciju flote.",
      dashboardName: "Naziv nadzorne ploče",
      dashboardDesc: "Opis nadzorne ploče",
      dashboardDescPlaceholder: "Dodatni kratki opis ove nadzorne ploče.",
      create: "Izradi nadzornu ploču",
      widgets: "METRIKA",
      modified: "Ažurirano",
      noDashboards: "Nema izrađenih nadzornih ploča",
      noDashboardsDesc: "Izradite svoju prvu nadzornu ploču kako biste započeli vizualizaciju senzora.",
      createFirst: "Izradite prvu nadzornu ploču"
    },
    exporter: {
      title: "Sastavljač telemetrijskog izvještaja",
      desc: "Konfigurirajte parametre podataka i sastavite prilagođeni CSV ili JSON izvoz za vašu flotu uređaja.",
      format: "Izlazni format izvještaja",
      csv: "CSV Izvještaj",
      csvDesc: "Kompatibilno s Excelom i tablicama",
      json: "JSON Shema",
      jsonDesc: "Razvojno API sučelje",
      timeWindow: "Vremenski prozor",
      deviceScope: "Obuhvat uređaja",
      allFleet: "Svi uređaji flote",
      cancel: "Odustani",
      compile: "Sastavi i preuzmi datoteku",
      generating: "Generiranje datoteke...",
      compiling: "Sastavljanje telemetrije...",
      querying: "Pretraživanje aktivnih telemetrijskih indeksa...",
      analyzing: "Analiza metrika uređaja i upozorenja...",
      structuring: "Strukturiranje završnih tablica podataka...",
      building: "Izgradnja toka podataka datoteke..."
    }
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("platform-lang") as Language;
    if (savedLanguage === "en" || savedLanguage === "hr") {
      setLanguageState(savedLanguage);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("platform-lang", lang);
  };

  const t = (keyPath: string): string => {
    if (!mounted) return keyPath.split(".").pop() || keyPath;
    
    const keys = keyPath.split(".");
    let current: any = translations[language];
    
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to English lookup if key missing in Croatian
        let engCurrent: any = translations.en;
        for (const engKey of keys) {
          if (engCurrent && engCurrent[engKey] !== undefined) {
            engCurrent = engCurrent[engKey];
          } else {
            return keys.pop() || keyPath;
          }
        }
        return typeof engCurrent === "string" ? engCurrent : (keys.pop() || keyPath);
      }
    }
    
    return typeof current === "string" ? current : (keys.pop() || keyPath);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
