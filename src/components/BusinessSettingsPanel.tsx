import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  Sparkles, 
  Clock, 
  DollarSign, 
  Sliders, 
  Tags, 
  MapPin, 
  Layers, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  Info,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  TrendingUp,
  Percent
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

// Centralized Business Config Interface
export interface BusinessConfig {
  enable3D: boolean;
  openingTime: string;
  closingTime: string;
  timeStep: number; // 15, 30, 60
  advanceBookingDays: number; // 30, 60, 90
  requireDeposit: boolean;
  standardDeposit: number;
  vipUpcharge: number;
  vipUpchargeType: "flat" | "multiplier";
  categories: string[];
  serviceRadius: number; // in km
}

interface BusinessSettingsPanelProps {
  businessId: string;
  businessName: string;
  onSaveSettings: (config: BusinessConfig) => void;
}

const DEFAULT_CATEGORIES = [
  "Grill / Steaks / BBQ",
  "French Atelier",
  "Beauty Salon",
  "Wellness",
  "Spa & Therapeutics",
  "Sushi & Asian",
  "Italian Bistro",
  "Boutique Cafe"
];

export default function BusinessSettingsPanel({
  businessId,
  businessName,
  onSaveSettings
}: BusinessSettingsPanelProps) {
  const { t, i18n } = useTranslation();
  
  // Loading and initial values states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Settings Form State
  const [config, setConfig] = useState<BusinessConfig>({
    enable3D: true,
    openingTime: "09:00",
    closingTime: "23:00",
    timeStep: 30,
    advanceBookingDays: 30,
    requireDeposit: true,
    standardDeposit: 1500,
    vipUpcharge: 1000,
    vipUpchargeType: "flat",
    categories: ["French Atelier", "Wellness"],
    serviceRadius: 15
  });

  // Fetch current settings on load
  useEffect(() => {
    setLoading(true);
    // Fetch from real-time API
    fetch(`/api/business/settings/${businessId}`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Settings not found");
      })
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to localStorage if API fails or first-time setup
        const localData = localStorage.getItem(`business_settings_${businessId}`);
        if (localData) {
          try {
            setConfig(JSON.parse(localData));
          } catch (e) {
            console.error("Failed to parse local config:", e);
          }
        }
        setLoading(false);
      });
  }, [businessId]);

  const handleToggle3D = () => {
    setConfig(prev => ({ ...prev, enable3D: !prev.enable3D }));
  };

  const handleToggleDeposit = () => {
    setConfig(prev => ({ ...prev, requireDeposit: !prev.requireDeposit }));
  };

  const handleCategoryToggle = (category: string) => {
    setConfig(prev => {
      const active = prev.categories.includes(category);
      const updated = active 
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories: updated };
    });
  };

  const handleReset = () => {
    const defaultSettings: BusinessConfig = {
      enable3D: true,
      openingTime: "09:00",
      closingTime: "23:00",
      timeStep: 30,
      advanceBookingDays: 30,
      requireDeposit: true,
      standardDeposit: 1500,
      vipUpcharge: 1000,
      vipUpchargeType: "flat",
      categories: businessId === "lotus-spa" ? ["Wellness", "Spa & Therapeutics"] : ["French Atelier"],
      serviceRadius: 15
    };
    setConfig(defaultSettings);
    toast.success("Form fields reset to operational standards.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Save to server first, then local storage, then lift state to parent
    fetch(`/api/business/settings/${businessId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to save settings to servers.");
        return res.json();
      })
      .then((savedData) => {
        // Save to local storage for instant client-side reload
        localStorage.setItem(`business_settings_${businessId}`, JSON.stringify(savedData));
        // Lift to parent database/state wrapper
        onSaveSettings(savedData);
        toast.success("Business Configuration successfully saved!", {
          description: "All reservation rules and layouts are updated in real-time."
        });
        setSaving(false);
      })
      .catch(err => {
        console.error("Save settings error:", err);
        // Fallback: save locally anyway so user doesn't lose progress
        localStorage.setItem(`business_settings_${businessId}`, JSON.stringify(config));
        onSaveSettings(config);
        toast.success("Saved successfully (local storage offline mode).");
        setSaving(false);
      });
  };

  if (loading) {
    return (
      <div className="w-full bg-[#16191F]/80 border border-white/5 p-12 rounded-3xl flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
        <span className="text-xs text-white/50 tracking-wider font-mono font-bold uppercase animate-pulse">
          Loading SaaS config blocks...
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      {/* Brand Header Block */}
      <div className="bg-[#16191F] rounded-3xl p-6 border border-white/5 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-teal-500/10 text-teal-400 border border-teal-500/15 text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-lg">
              SaaS Panel
            </span>
            <span className="text-white/40 font-mono text-[11px]">ID: {businessId}</span>
          </div>
          <h2 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-teal-400" />
            {i18n.language === "ru" ? `Конфигурация бизнеса: ${businessName}` : `Business Configuration: ${businessName}`}
          </h2>
          <p className="text-xs text-white/50 max-w-xl">
            Control operational limits, 3D visibility, standard/VIP deposits, display niche tags, and mapping footprints in a unified system.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto shrink-0 z-10">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 md:flex-none py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-white/60" />
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 md:flex-none py-2.5 px-6 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/10"
          >
            {saving ? (
              <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BLOCK 1: 3D Visibility & Map Footprint */}
        <div className="bg-[#16191F] rounded-3xl p-6 border border-white/5 space-y-5 relative">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <div className="p-2 bg-teal-500/10 border border-teal-500/15 rounded-xl text-teal-400">
              <Sparkles className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-black text-xs uppercase text-white tracking-wider">
                1. 🌐 Interactive 3D Hall Visibility
              </h3>
              <p className="text-[10px] text-white/40">Manage client reservation preview channels</p>
            </div>
          </div>

          <div className="bg-[#090A0D]/50 border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">
                  Enable Interactive 3D Hall Booking
                </span>
                <p className="text-[10px] text-white/50 leading-relaxed max-w-[280px]">
                  When active, clients view and select tables using the Three.js floor plan. When disabled, the system falls back cleanly to standard list view.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggle3D}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.enable3D ? "bg-teal-500" : "bg-white/10"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#16191F] shadow-lg ring-0 transition duration-200 ease-in-out ${
                    config.enable3D ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="pt-3 border-t border-white/5 flex gap-3 items-start text-[10px] text-white/40 font-mono leading-relaxed bg-black/20 p-3 rounded-xl">
              <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>
                {config.enable3D 
                  ? "STATUS: Three.js context active. System will initialize luxury physical space coordinates." 
                  : "STATUS: 2D lists enforced. Bypassing GPU shader loads for high-efficiency loading."}
              </span>
            </div>
          </div>

          {/* SERVICE RADIUS & ROUTING */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono font-extrabold text-white/40 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                Custom Local Service Radius
              </label>
              <span className="font-mono text-xs font-black text-teal-400 bg-teal-500/10 border border-teal-500/15 px-2 py-0.5 rounded-lg">
                {config.serviceRadius} km
              </span>
            </div>
            <p className="text-[10px] text-white/50">
              Defines the local routing and logistics footprint of your establishment on our interactive map hub index.
            </p>
            <div className="space-y-1">
              <input
                type="range"
                min="1"
                max="50"
                value={config.serviceRadius}
                onChange={e => setConfig({ ...config, serviceRadius: parseInt(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-white/30 px-0.5">
                <span>1 km (Local Area)</span>
                <span>25 km</span>
                <span>50 km (Regional Hub)</span>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCK 2: Core Operational Rules & Timeline Parameters */}
        <div className="bg-[#16191F] rounded-3xl p-6 border border-white/5 space-y-5">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <div className="p-2 bg-teal-500/10 border border-teal-500/15 rounded-xl text-teal-400">
              <Clock className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-display font-black text-xs uppercase text-white tracking-wider">
                2. 📅 Core Operational Rules & Timeline
              </h3>
              <p className="text-[10px] text-white/40">Configure operational bounds and scheduling steps</p>
            </div>
          </div>

          {/* Operating hours pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[9px] font-mono font-extrabold text-white/40 uppercase tracking-wider">
                Opening Time
              </label>
              <input
                type="time"
                value={config.openingTime}
                onChange={e => setConfig({ ...config, openingTime: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-teal-500 font-mono"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[9px] font-mono font-extrabold text-white/40 uppercase tracking-wider">
                Closing Time
              </label>
              <input
                type="time"
                value={config.closingTime}
                onChange={e => setConfig({ ...config, closingTime: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-teal-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Time-slot Interval Step */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono font-extrabold text-white/40 uppercase tracking-wider">
              Time-slot Interval Step
            </label>
            <p className="text-[10px] text-white/50 mb-2">
              The duration increment clients can choose between adjacent booking reservations.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map(step => (
                <button
                  type="button"
                  key={step}
                  onClick={() => setConfig({ ...config, timeStep: step })}
                  className={`py-2 px-3 border rounded-xl text-xs font-bold font-mono transition cursor-pointer flex flex-col items-center justify-center ${
                    config.timeStep === step
                      ? "bg-teal-500 border-teal-400 text-black"
                      : "bg-[#090A0D] border-white/10 text-white/70 hover:bg-[#090A0D]/80 hover:text-white"
                  }`}
                >
                  <span className="text-[13px] font-black">{step}</span>
                  <span className={`text-[8px] font-normal uppercase ${config.timeStep === step ? 'text-black/60' : 'text-white/40'}`}>Minutes</span>
                </button>
              ))}
            </div>
          </div>

          {/* Maximum Advance Booking Window */}
          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono font-extrabold text-white/40 uppercase tracking-wider">
                Maximum Advance Booking Window
              </label>
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/15 px-2 py-0.5 rounded-lg">
                {config.advanceBookingDays} Days
              </span>
            </div>
            <p className="text-[10px] text-white/50">
              The furthest date boundary in advance that clients are permitted to register reservations.
            </p>
            <div className="space-y-1">
              <input
                type="range"
                min="7"
                max="90"
                step="7"
                value={config.advanceBookingDays}
                onChange={e => setConfig({ ...config, advanceBookingDays: parseInt(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-white/30 px-0.5">
                <span>1 Week</span>
                <span>30 Days (~1 Month)</span>
                <span>60 Days (~2 Months)</span>
                <span>90 Days (~1 Quarter)</span>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCK 3: Deposit Requirements & Financial Safeguards */}
        <div className="bg-[#16191F] rounded-3xl p-6 border border-white/5 space-y-5 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <div className="p-2 bg-teal-500/10 border border-teal-500/15 rounded-xl text-teal-400">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-display font-black text-xs uppercase text-white tracking-wider">
                3. 💰 Deposit Requirements & Financial Safeguards
              </h3>
              <p className="text-[10px] text-white/40">Secure transactions and manage no-show liabilities</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-[#090A0D]/50 border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white block">
                    Global Deposit Safeguard
                  </span>
                  <p className="text-[10px] text-white/50 leading-relaxed">
                    Require pre-payment or deposit hold from clients to finalize slots.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleDeposit}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.requireDeposit ? "bg-teal-500" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#16191F] shadow-lg ring-0 transition duration-200 ease-in-out ${
                      config.requireDeposit ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 border-t border-white/5 flex gap-3 items-start text-[10px] text-white/40 font-mono bg-black/20 p-3 rounded-xl leading-relaxed">
                <ShieldCheck className="w-4.5 h-4.5 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  {config.requireDeposit 
                    ? "PROTECTED: Escrow framework active. Reduced guest no-shows by 92%." 
                    : "UNPROTECTED: Reservation is unsecured. Guests can cancel last-minute without penalties."}
                </span>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <AnimatePresence mode="wait">
                {config.requireDeposit ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {/* Standard Table Deposit Amount */}
                    <div className="bg-[#090A0D] p-4.5 border border-white/5 rounded-2xl space-y-2 text-left">
                      <label className="block text-[9px] font-mono font-extrabold text-white/40 uppercase tracking-wider">
                        Standard Table Deposit Amount
                      </label>
                      <p className="text-[10px] text-white/50">
                        The deposit required for a standard reservation (in Russian Rubles).
                      </p>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-extrabold text-white/30">
                          ₽
                        </span>
                        <input
                          type="number"
                          value={config.standardDeposit}
                          onChange={e => setConfig({ ...config, standardDeposit: parseInt(e.target.value) || 0 })}
                          className="w-full pl-8 pr-4 py-2.5 bg-[#16191F] border border-white/10 rounded-xl text-sm font-mono font-extrabold text-teal-400 outline-none focus:border-teal-500"
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    {/* VIP Premium Upcharge Category */}
                    <div className="bg-[#090A0D] p-4.5 border border-white/5 rounded-2xl space-y-2 text-left">
                      <label className="block text-[9px] font-mono font-extrabold text-white/40 uppercase tracking-wider">
                        VIP Premium Upcharge Modifier
                      </label>
                      <p className="text-[10px] text-white/50">
                        Extra pricing factor or flat deposit hold applied to high-tier / VIP table categories.
                      </p>
                      <div className="grid grid-cols-3 gap-1 mb-1.5">
                        <button
                          type="button"
                          onClick={() => setConfig({ ...config, vipUpchargeType: "flat" })}
                          className={`py-1 text-[9px] uppercase font-bold rounded-lg border transition ${
                            config.vipUpchargeType === "flat"
                              ? "bg-teal-500 border-teal-400 text-black"
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                          }`}
                        >
                          Flat Hold
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfig({ ...config, vipUpchargeType: "multiplier" })}
                          className={`py-1 text-[9px] uppercase font-bold rounded-lg border transition ${
                            config.vipUpchargeType === "multiplier"
                              ? "bg-teal-500 border-teal-400 text-black"
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                          }`}
                        >
                          Multiplier
                        </button>
                        <div className="flex items-center justify-center text-[9px] font-mono text-white/30">
                          {config.vipUpchargeType === "flat" ? "₽ Addon" : "x Factor"}
                        </div>
                      </div>

                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-extrabold text-white/30">
                          {config.vipUpchargeType === "flat" ? "₽" : "x"}
                        </span>
                        <input
                          type="number"
                          step={config.vipUpchargeType === "multiplier" ? "0.1" : "100"}
                          value={config.vipUpcharge}
                          onChange={e => setConfig({ ...config, vipUpcharge: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-8 pr-4 py-2.5 bg-[#16191F] border border-white/10 rounded-xl text-sm font-mono font-extrabold text-amber-400 outline-none focus:border-amber-500"
                          min="0"
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-full bg-white/5 border border-white/5 border-dashed rounded-2xl flex items-center justify-center p-6 text-center text-white/40 text-xs font-mono"
                  >
                    Deposits disabled. Standard and VIP bookings are absolutely free.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* BLOCK 4: Metadata, Venue Branding, & Tagging */}
        <div className="bg-[#16191F] rounded-3xl p-6 border border-white/5 space-y-5 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <div className="p-2 bg-teal-500/10 border border-teal-500/15 rounded-xl text-teal-400">
              <Tags className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-display font-black text-xs uppercase text-white tracking-wider">
                4. 📋 Metadata, Venue Branding, & Tagging
              </h3>
              <p className="text-[10px] text-white/40">Align your display niches and categorize on search feeds</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-mono font-extrabold text-white/40 uppercase tracking-wider">
              Business Display Categories
            </label>
            <p className="text-[10px] text-white/50">
              Select all tags that represent your establishment. Customers use these tags to filter the Superapp directory.
            </p>

            <div className="flex flex-wrap gap-2">
              {DEFAULT_CATEGORIES.map(category => {
                const isActive = config.categories.includes(category);
                return (
                  <button
                    type="button"
                    key={category}
                    onClick={() => handleCategoryToggle(category)}
                    className={`py-1.5 px-3 rounded-full text-xs font-bold border transition duration-150 cursor-pointer ${
                      isActive
                        ? "bg-teal-500 border-teal-400 text-black shadow-md shadow-teal-500/10"
                        : "bg-[#090A0D] border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {isActive ? "✓ " : ""} {category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
