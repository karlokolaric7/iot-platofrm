"use client";

import React, { useState, useEffect, useRef } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { useParams, useRouter } from "next/navigation";
import { 
  useCurrentUser, 
  useUpdateProfile, 
  useDevices, 
  useGateways, 
  useRules 
} from "@/hooks/use-iot-data";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const AVATAR_PRESETS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=IoT1",
  "https://api.dicebear.com/7.x/identicon/svg?seed=IoT2",
  "https://api.dicebear.com/7.x/shapes/svg?seed=IoT3",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=IoT4",
  "https://api.dicebear.com/7.x/micah/svg?seed=IoT5",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=IoT6",
];

export function TopHeader() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { data: user } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const workspaceId = (params?.workspaceId as string) || "";

  // Dropdown / Popover states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAppsOpen, setIsAppsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Search Palette states
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch lists for Command Palette search
  const { data: devices = [] } = useDevices(workspaceId);
  const { data: gateways = [] } = useGateways(workspaceId);
  const { data: rules = [] } = useRules(workspaceId);

  // Profile Form States
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Notifications State (Interactive tracking)
  const [notifications, setNotifications] = useState([
    { id: "1", unread: true },
    { id: "2", unread: true },
    { id: "3", unread: true },
  ]);

  // Dynamically compute translation mapping and respect active dismissals
  const translatedNotifications = [
    { 
      id: "1", 
      title: language === "hr" ? "Pristupnik je aktivan" : "Gateway Online", 
      message: language === "hr" ? "GTW-EU-NORTH-02 je uspješno spojen i u mreži." : "GTW-EU-NORTH-02 successfully provisioned and online.", 
      time: language === "hr" ? "Upravo sada" : "Just now", 
      type: "success", 
      unread: notifications.find(n => n.id === "1")?.unread ?? false 
    },
    { 
      id: "2", 
      title: language === "hr" ? "Uređaj je izvan mreže" : "Device Offline", 
      message: language === "hr" ? "MILESIGHT CO2 javlja kašnjenje telemetrije." : "MILESIGHT CO2 reporting telemetry delay.", 
      time: language === "hr" ? "Prije 2 sata" : "2 hours ago", 
      type: "error", 
      unread: notifications.find(n => n.id === "2")?.unread ?? false 
    },
    { 
      id: "3", 
      title: language === "hr" ? "Pravilo aktivirano" : "Rule Triggered", 
      message: language === "hr" ? "Prekoračen je prag koncentracije CO2." : "Co2 concentration threshold exceeded.", 
      time: language === "hr" ? "Prije 5 sati" : "5 hours ago", 
      type: "warning", 
      unread: notifications.find(n => n.id === "3")?.unread ?? false 
    },
  ].filter(n => notifications.some(orig => orig.id === n.id));

  // Load current user profile details when editing
  useEffect(() => {
    if (user?.profile) {
      setFullName(user.profile.full_name || "");
      setAvatarUrl(user.profile.avatar_url || "");
    }
  }, [user, isEditProfileOpen]);

  // Keybind for Ctrl+K search palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("header-search-input");
        searchInput?.focus();
        setSearchFocused(true);
      }
      if (e.key === "Escape") {
        setSearchFocused(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle outside click to close Search Dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Handle Save Profile
  async function handleSaveProfile() {
    if (!user?.id) return;
    setIsSavingProfile(true);
    try {
      await updateProfile.mutateAsync({
        id: user.id,
        full_name: fullName,
        avatar_url: avatarUrl,
      });
      toast.success(language === "hr" ? "Profil je uspješno ažuriran!" : "Profile updated successfully!");
      setIsEditProfileOpen(false);
    } catch (err) {
      toast.error(language === "hr" ? "Neuspjelo ažuriranje profila." : "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  // Handle Sign Out
  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      toast.success(language === "hr" ? "Uspješna odjava." : "Signed out successfully.");
      router.push("/auth");
    } catch (err) {
      toast.error(language === "hr" ? "Neuspjela odjava." : "Failed to sign out.");
    }
  }

  // Notifications logic
  const unreadCount = translatedNotifications.filter(n => n.unread).length;
  const dismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success(language === "hr" ? "Obavijest je uklonjena" : "Notification cleared");
  };
  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    toast.success(language === "hr" ? "Sve obavijesti su označene kao pročitane" : "All notifications marked as read");
  };

  // Live filter Command Palette list
  const filteredDevices = searchQuery
    ? devices.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : devices.slice(0, 3);
  const filteredGateways = searchQuery
    ? gateways.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : gateways.slice(0, 2);
  const filteredRules = searchQuery
    ? rules.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : rules.slice(0, 2);

  return (
    <>
      <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
        
        {/* Left Search / Hamburger section */}
        <div className="flex items-center gap-4 flex-1">
          <SidebarTrigger className="-ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100" />
          
          <div ref={searchContainerRef} className="relative w-96 hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input 
              id="header-search-input"
              className="w-full bg-slate-100 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg pl-10 pr-16 py-2 text-sm text-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-500 outline-none" 
              placeholder={t("header.searchPlaceholder")} 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm">Ctrl</kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm">K</kbd>
            </div>

            {/* Live Command Palette Dropdown */}
            {searchFocused && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col max-h-[380px] animate-in fade-in slide-in-from-top-2 duration-250">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <span>{language === "hr" ? "Pretraga radnog prostora" : "Workspace Command Palette"}</span>
                  <span className="text-[10px] lowercase text-slate-500 font-normal">{language === "hr" ? "Esc za zatvaranje" : "Esc to close"}</span>
                </div>
                
                <div className="overflow-y-auto p-2 space-y-3">
                  {/* Devices Section */}
                  <div>
                    <h3 className="px-2 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t("sidebar.devices")}</h3>
                    {filteredDevices.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-slate-400 italic">{language === "hr" ? "Nema podudarnih uređaja" : "No devices match"}</p>
                    ) : (
                      filteredDevices.map(d => (
                        <div 
                          key={d.id}
                          className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                          onClick={() => {
                            router.push(`/${workspaceId}/devices/${d.id}`);
                            setSearchFocused(false);
                            setSearchQuery("");
                          }}
                        >
                          <span className="material-symbols-outlined text-[16px] text-slate-400">router</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{d.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{d.description || (language === "hr" ? "LoRaWAN Uređaj" : "LoRaWAN Device")}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Gateways Section */}
                  <div>
                    <h3 className="px-2 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t("sidebar.gateways")}</h3>
                    {filteredGateways.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-slate-400 italic">{language === "hr" ? "Nema podudarnih pristupnika" : "No gateways match"}</p>
                    ) : (
                      filteredGateways.map(g => (
                        <div 
                          key={g.id}
                          className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                          onClick={() => {
                            router.push(`/${workspaceId}/gateways`);
                            setSearchFocused(false);
                            setSearchQuery("");
                          }}
                        >
                          <span className="material-symbols-outlined text-[16px] text-slate-400">hub</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{g.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">EUI: {g.eui || "N/A"}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Rules Section */}
                  <div>
                    <h3 className="px-2 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t("sidebar.ruleEngine")}</h3>
                    {filteredRules.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-slate-400 italic">{language === "hr" ? "Nema podudarnih pravila" : "No rules match"}</p>
                    ) : (
                      filteredRules.map(r => (
                        <div 
                          key={r.id}
                          className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                          onClick={() => {
                            router.push(`/${workspaceId}/rules`);
                            setSearchFocused(false);
                            setSearchQuery("");
                          }}
                        >
                          <span className="material-symbols-outlined text-[16px] text-slate-400">bolt</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{r.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{r.description || (language === "hr" ? "Aktivno pravilo" : "Active Rule")}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Tools section */}
        <div className="flex items-center gap-2 sm:gap-4 relative">
          
          {/* Notifications Button Popover */}
          <div className="relative">
            <button 
              className="relative p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center cursor-pointer"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsProfileOpen(false);
                setIsAppsOpen(false);
              }}
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-rose-500 rounded-full border border-white dark:border-slate-950 flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsNotificationsOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t("header.notifications")}</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">{t("header.markAllRead")}</button>
                    )}
                  </div>
                  <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                    {translatedNotifications.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-[40px] mb-2">notifications_off</span>
                        <p className="text-xs text-slate-500 font-semibold">{language === "hr" ? "Nema obavijesti" : "No notifications"}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{language === "hr" ? "Obavijestit ćemo vas o statusnim događajima uređaja." : "We will notify you of device status events."}</p>
                      </div>
                    ) : (
                      translatedNotifications.map(n => (
                        <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex gap-3 relative group">
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? "bg-indigo-600" : "bg-transparent"}`}></span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{n.title}</p>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">{n.message}</p>
                          </div>
                          <button 
                             onClick={(e) => dismissNotification(n.id, e)}
                             className="absolute right-2 top-2 p-1 text-slate-300 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button 
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center hidden sm:flex cursor-pointer"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <span className="material-symbols-outlined text-[20px] dark:hidden">dark_mode</span>
            <span className="material-symbols-outlined text-[20px] hidden dark:block">light_mode</span>
          </button>

          {/* Help & Documentation Button */}
          <button 
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center hidden sm:flex cursor-pointer"
            onClick={() => setIsHelpOpen(true)}
          >
            <span className="material-symbols-outlined text-[20px]">help</span>
          </button>

          {/* Apps Grid Launcher */}
          <div className="relative">
            <button 
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center cursor-pointer"
              onClick={() => {
                setIsAppsOpen(!isAppsOpen);
                setIsProfileOpen(false);
                setIsNotificationsOpen(false);
              }}
            >
              <span className="material-symbols-outlined text-[20px]">apps</span>
            </button>

            {isAppsOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsAppsOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">{language === "hr" ? "Pokretač integriranih aplikacija" : "Integrated App Launchpad"}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* ChirpStack Link */}
                    <a 
                      href="http://localhost:8080" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 bg-indigo-50/40 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded-xl flex flex-col items-center text-center hover:border-indigo-300 dark:hover:border-indigo-900 transition-all group"
                    >
                      <span className="material-symbols-outlined text-[24px] text-indigo-600 dark:text-indigo-400 mb-2 transition-transform group-hover:scale-110">cell_tower</span>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">ChirpStack</span>
                      <span className="text-[9px] text-slate-400 mt-1 leading-none">Port 8080</span>
                    </a>

                    {/* Supabase Link */}
                    <a 
                      href="http://localhost:54323" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 bg-emerald-50/40 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded-xl flex flex-col items-center text-center hover:border-emerald-300 dark:hover:border-emerald-900 transition-all group"
                    >
                      <span className="material-symbols-outlined text-[24px] text-emerald-600 dark:text-emerald-400 mb-2 transition-transform group-hover:scale-110">database</span>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Supabase</span>
                      <span className="text-[9px] text-slate-400 mt-1 leading-none">Port 54323</span>
                    </a>

                    {/* Mailpit Link */}
                    <a 
                      href="http://localhost:54324" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 bg-amber-50/40 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded-xl flex flex-col items-center text-center hover:border-amber-300 dark:hover:border-amber-900 transition-all group"
                    >
                      <span className="material-symbols-outlined text-[24px] text-amber-600 dark:text-amber-400 mb-2 transition-transform group-hover:scale-110">mail</span>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Mailpit</span>
                      <span className="text-[9px] text-slate-400 mt-1 leading-none">Port 54324</span>
                    </a>

                    {/* API Docs Link */}
                    <a 
                      href={`/${workspaceId}/api`}
                      className="p-3 bg-slate-50/40 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded-xl flex flex-col items-center text-center hover:border-indigo-200 dark:hover:border-slate-700 transition-all group"
                    >
                      <span className="material-symbols-outlined text-[24px] text-slate-600 dark:text-slate-400 mb-2 transition-transform group-hover:scale-110">key</span>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{t("sidebar.apiSettings")}</span>
                      <span className="text-[9px] text-slate-400 mt-1 leading-none">{language === "hr" ? "Platforma" : "Platform"}</span>
                    </a>

                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 sm:mx-2 hidden sm:block"></div>
          
          {/* User Profile Dropdown Menu */}
          <div className="relative">
            <button 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsNotificationsOpen(false);
                setIsAppsOpen(false);
              }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold overflow-hidden border border-indigo-200 dark:border-slate-800">
                {user?.profile?.avatar_url ? (
                  <img src={user.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[14px]">person</span>
                )}
              </div>
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-40 p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Account detail Header */}
                  <div className="px-3.5 py-3 border-b border-slate-100 dark:border-slate-800/50">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none">{t("header.currentAccount")}</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-1.5">{user?.profile?.full_name || (language === "hr" ? "Korisnik IoT platforme" : "IoT Platform Developer")}</p>
                    <p className="text-xs text-slate-500 truncate leading-normal">{user?.email}</p>
                  </div>
                  
                  {/* Action items */}
                  <div className="py-1">
                    <button 
                      onClick={() => {
                        setIsEditProfileOpen(true);
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg text-left transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">manage_accounts</span>
                      {t("header.editProfile")}
                    </button>
                    <button 
                      onClick={() => {
                        router.push(`/${workspaceId}/settings`);
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg text-left transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">settings_accessibility</span>
                      {t("header.workspaceSettings")}
                    </button>
                  </div>

                  <div className="w-full h-px bg-slate-100 dark:bg-slate-800/50 my-1"></div>

                  {/* Sign Out item */}
                  <div className="pb-0.5">
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 rounded-lg text-left transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-rose-500 text-[18px]">logout</span>
                      {t("header.signOut")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* User Profile Edit Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditOpenProfile => setIsEditProfileOpen(setIsEditOpenProfile)}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-indigo-950 dark:text-indigo-50 font-bold">{t("header.editProfileTitle")}</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">{t("header.editProfileDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            
            {/* Live Preview Avatar */}
            <div className="flex flex-col items-center justify-center gap-2 border border-dashed border-slate-200 dark:border-slate-800 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-200 dark:border-indigo-900 shadow-md flex items-center justify-center bg-white dark:bg-slate-800">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[36px] text-slate-400">person</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">{t("header.liveAvatar")}</p>
            </div>

            {/* Profile Inputs */}
            <div className="space-y-3">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-fullname" className="text-xs font-bold text-slate-600 dark:text-slate-400">{t("header.fullName")}</Label>
                <Input 
                  id="edit-fullname" 
                  className="h-10 text-sm" 
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-avatarurl" className="text-xs font-bold text-slate-600 dark:text-slate-400">{t("header.avatarUrl")}</Label>
                <Input 
                  id="edit-avatarurl" 
                  className="h-10 text-sm" 
                  placeholder="https://example.com/photo.png"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Pre-set Dicebear Avatars */}
            <div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">{t("header.chooseAvatar")}</p>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_PRESETS.map((preset, index) => (
                  <button 
                    key={index}
                    onClick={() => setAvatarUrl(preset)}
                    className={`h-11 w-11 rounded-lg border-2 overflow-hidden flex items-center justify-center bg-indigo-50/20 dark:bg-slate-800 hover:scale-105 transition-all cursor-pointer ${
                      avatarUrl === preset ? "border-indigo-600 shadow-md shadow-indigo-100" : "border-slate-100 dark:border-slate-800/80 hover:border-slate-300"
                    }`}
                  >
                    <img src={preset} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            </div>

          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>{t("header.cancel")}</Button>
            <Button onClick={handleSaveProfile} disabled={isSavingProfile || !fullName}>
              {isSavingProfile ? t("header.saving") : t("header.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help shortcuts Documentation Dialog */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-indigo-950 dark:text-indigo-50 font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">help</span>
              {language === "hr" ? "Centar za pomoć IoT platforme" : "IoT Platform Assistance Center"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              {language === "hr" ? "Vodič kroz radni prostor, ključne navigacijske naredbe i aktivni prečaci." : "Workspace guide tips, key navigation commands, and active developer shortcuts."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">
                {language === "hr" ? "Tipkovnički prečaci" : "Keyboard Shortcuts"}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300">{language === "hr" ? "Otvori pretragu naredbi" : "Open Command Search Palette"}</span>
                  <div className="flex gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded shadow-sm text-[10px]">Ctrl</kbd>
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded shadow-sm text-[10px]">K</kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300">{language === "hr" ? "Zatvori otvorene dijaloge / preklope" : "Close open Dialogs / Overlays"}</span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded shadow-sm text-[10px]">Esc</kbd>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">
                {language === "hr" ? "Reference za programere" : "Developer References"}
              </h3>
              <div className="space-y-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                <p className="flex items-center gap-2 leading-relaxed"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> {language === "hr" ? "Konfigurirajte LoRaWAN pristupnike i uređaje unutar izbornika Pokretača aplikacija." : "Provision LoRaWAN Gateways and devices inside the ChirpStack App Launcher menu."}</p>
                <p className="flex items-center gap-2 leading-relaxed"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {language === "hr" ? "Izradite akcije pravila unutar Sustava pravila za prosljeđivanje upozorenja kada vrijednosti prekorače granice." : "Create Rule Actions inside the Rule Engine to forward alerts when device fields overflow."}</p>
                <p className="flex items-center gap-2 leading-relaxed"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {language === "hr" ? "Izvezite zapise baze podataka o telemetriji i događajima kao CSV unutar nadzorne ploče." : "Export database records of telemetry and events as CSV inside the Platform Dashboard."}</p>
              </div>
            </div>

            <div className="border border-dashed border-indigo-100 dark:border-indigo-900/30 p-3 rounded-xl bg-indigo-50/10 dark:bg-indigo-950/5 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-indigo-950 dark:text-indigo-200">{language === "hr" ? "Trenutni ID radnog prostora" : "Current Workspace ID"}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[200px] mt-1">{workspaceId}</p>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(workspaceId);
                  toast.success(language === "hr" ? "ID radnog prostora kopiran u međuspremnik!" : "Workspace ID copied to clipboard!");
                }}
                className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-bold hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                {language === "hr" ? "Kopiraj ID" : "Copy ID"}
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsHelpOpen(false)}>{language === "hr" ? "Gotovo i zatvori" : "Done & Close"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
