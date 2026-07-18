import React, { createContext, useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, 
  Lock, 
  Sliders, 
  HelpCircle, 
  Check, 
  UserCheck, 
  Eye, 
  Sparkles, 
  ArrowRight, 
  Building,
  User,
  ExternalLink,
  ChevronRight,
  Database,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { Table } from "../types";
import Tabletop3DViewer from "./Tabletop3DViewer";
import SmartBookingBridge from "./SmartBookingBridge";

// --- Multi-Tenant Identity Interface ---
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  currentRole: 'business_owner' | 'manager' | 'platform_client';
  associatedBusinessId: string; // Tenant Isolation ID
}

interface AuthContextType {
  user: AuthUser | null;
  loginAs: (role: 'business_owner' | 'manager' | 'platform_client', businessId?: string) => void;
  logout: () => void;
}

// Create the multi-tenant secure AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize with a mock business owner user of "tenant-restaurant-alpha"
  const [user, setUser] = useState<AuthUser | null>({
    id: "usr-alpha-101",
    name: "Alex Rivera",
    email: "alex@riverabistro.com",
    currentRole: "business_owner",
    associatedBusinessId: "tenant-restaurant-alpha"
  });

  const loginAs = (role: 'business_owner' | 'manager' | 'platform_client', businessId = "tenant-restaurant-alpha") => {
    const names = {
      business_owner: "Alex Rivera (Owner)",
      manager: "Jordan Lee (Manager)",
      platform_client: "Sarah Jenkins (Client)"
    };
    const emails = {
      business_owner: "alex@riverabistro.com",
      manager: "jordan@riverabistro.com",
      platform_client: "sarah.j@gmail.com"
    };

    setUser({
      id: `usr-${role}-${Math.floor(Math.random() * 1000)}`,
      name: names[role],
      email: emails[role],
      currentRole: role,
      associatedBusinessId: businessId
    });

    toast.success(`Identity switched to ${names[role]} [Tenant: ${businessId}]`);
  };

  const logout = () => {
    setUser(null);
    toast.info("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, loginAs, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Secure hook for fetching the current multi-tenant user
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// --- Strict RBAC Guard Wrapper Component ---
interface RBACGuardProps {
  allowedRoles: Array<'business_owner' | 'manager' | 'platform_client'>;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RBACGuard({ allowedRoles, fallback, children }: RBACGuardProps) {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user || !allowedRoles.includes(user.currentRole)) {
    // If fallback is provided, use it, otherwise render the polished Access Denied UI
    if (fallback) return <>{fallback}</>;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="w-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-[#0C0E12] border border-red-500/10 rounded-2xl text-center space-y-6 shadow-2xl relative overflow-hidden"
        id="rbac-access-denied-container"
      >
        {/* Glow ambient effects */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Hazard alert box */}
        <div className="relative flex items-center justify-center w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
          <ShieldAlert className="w-8 h-8" />
          <div className="absolute inset-0 rounded-2xl border border-red-400/20 animate-pulse" />
        </div>

        <div className="max-w-md space-y-2">
          <h3 className="text-lg font-black text-white/90 tracking-tight font-sans">
            {t("rbac.accessDeniedTitle", "Administrative Guard Activated")}
          </h3>
          <p className="text-xs text-white/50 leading-relaxed font-sans">
            Your current security clearance level (
            <span className="font-mono text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded">
              {user?.currentRole || "anonymous"}
            </span>
            ) is insufficient to initialize administrative components. Canvas rendering and webGL contexts have been suppressed to prevent data leakage.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-white/30 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
          <Lock className="w-3.5 h-3.5 text-red-500/60" />
          <span>TENANT_ISOLATION_ZONE: STRICT_ENFORCEMENT</span>
        </div>
      </motion.div>
    );
  }

  // If authorized, safely render children (which includes Three.js canvases, etc.)
  return <>{children}</>;
}


// --- Main Demonstration & Layout Division Component ---
export function SmartRbacDemo() {
  const { user, loginAs } = useAuth();
  const { i18n } = useTranslation();

  // Selected Demo tab: Dashboard (Owner/Manager settings) or Client Reservation View
  const [currentRoute, setCurrentRoute] = useState<'dashboard' | 'reserve'>('dashboard');
  
  // Mock floor plan data representing Multi-Tenant setups
  const [tenantLayouts, setTenantLayouts] = useState<Record<string, Table[]>>({
    "tenant-restaurant-alpha": [
      { id: "alpha-1", number: 1, capacity: 2, x: 200, y: 150, width: 80, height: 80, shape: 'circle', type: 'standard', room: 'main', price: 50 },
      { id: "alpha-2", number: 2, capacity: 4, x: 400, y: 150, width: 90, height: 90, shape: 'rect', type: 'vip', room: 'main', price: 120 },
      { id: "alpha-3", number: 3, capacity: 6, x: 300, y: 350, width: 120, height: 80, shape: 'rect', type: 'window', room: 'main', price: 150 },
      { id: "alpha-4", number: 4, capacity: 2, x: 550, y: 300, width: 80, height: 80, shape: 'circle', type: 'terrace', room: 'main', price: 60 }
    ],
    "tenant-restaurant-beta": [
      { id: "beta-1", number: 10, capacity: 4, x: 150, y: 200, width: 90, height: 90, shape: 'rect', type: 'standard', room: 'main', price: 75 },
      { id: "beta-2", number: 11, capacity: 8, x: 450, y: 200, width: 140, height: 90, shape: 'rect', type: 'vip', room: 'main', price: 200 },
      { id: "beta-3", number: 12, capacity: 2, x: 300, y: 380, width: 80, height: 80, shape: 'circle', type: 'terrace', room: 'main', price: 55 }
    ]
  });

  const [guestsCount, setGuestsCount] = useState(4);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedTables, setSelectedTables] = useState<Table[]>([]);

  // Active business context (Tenant Isolation)
  const activeTenantId = user?.associatedBusinessId || "tenant-restaurant-alpha";
  const currentTables = tenantLayouts[activeTenantId] || [];

  // Handle saving the customized floor plan layout (Updates state in isolation)
  const handleUpdateTables = (updated: Table[]) => {
    setTenantLayouts(prev => ({
      ...prev,
      [activeTenantId]: updated
    }));
    toast.success("Floor plan vectors committed successfully to cloud database.");
  };

  const handleBookTableInstant = () => {
    if (!selectedTable) return;
    toast.success(
      i18n.language === "ru"
        ? `Столик №${selectedTable.number} успешно забронирован на ваше имя!`
        : `Table #${selectedTable.number} has been reserved successfully!`
    );
  };

  return (
    <div className="space-y-6" id="smart-rbac-demo-root">
      {/* 1. Header Control Panel / Identity Simulation Hub */}
      <div className="bg-[#0B0D11] border border-white/5 rounded-2xl p-5 md:p-6 space-y-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-black text-white/95 flex items-center gap-2">
              <Building className="w-5 h-5 text-teal-400" />
              <span>Multi-Tenant Security Hub</span>
            </h2>
            <p className="text-xs text-white/50 max-w-xl">
              Simulate enterprise RBAC and tenant isolation in real-time. Switch roles or swap tenant databases below to inspect strict view partition rules.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrentRoute('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                currentRoute === 'dashboard' 
                  ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/10' 
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Dashboard Route</span>
            </button>
            <button
              onClick={() => setCurrentRoute('reserve')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                currentRoute === 'reserve' 
                  ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/10' 
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Reserve View Route</span>
            </button>
          </div>
        </div>

        {/* Identity & Role Selector Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Identity Info Panel */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-sm shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 text-left">
              <span className="block text-[10px] font-bold text-white/30 uppercase tracking-wider font-mono">Current Identity</span>
              <span className="block text-xs font-black text-white/80">{user?.name || "Anonymous User"}</span>
              <span className="inline-block text-[9px] font-mono font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.2 rounded mt-0.5">
                {user?.currentRole || "no_role"}
              </span>
            </div>
          </div>

          {/* Secure Tenant ID Isolation Badge */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 text-left">
              <span className="block text-[10px] font-bold text-white/30 uppercase tracking-wider font-mono">Isolated Business Context</span>
              <span className="block text-xs font-black text-white/80 font-mono text-indigo-300">{activeTenantId}</span>
              <span className="block text-[9px] text-white/40">Owner A cannot view Owner B's schemas.</span>
            </div>
          </div>

          {/* Simulate Switching Identities Controls */}
          <div className="space-y-2">
            <span className="block text-[10px] font-bold text-white/30 uppercase tracking-wider font-mono text-left">Simulate Identity Switch</span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => loginAs('business_owner', 'tenant-restaurant-alpha')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition border ${
                  user?.currentRole === 'business_owner' && activeTenantId === 'tenant-restaurant-alpha'
                    ? 'bg-teal-500/15 border-teal-500 text-teal-300'
                    : 'bg-white/5 border-transparent text-white/50 hover:text-white'
                }`}
              >
                Owner Alpha
              </button>
              <button
                onClick={() => loginAs('manager', 'tenant-restaurant-beta')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition border ${
                  user?.currentRole === 'manager' && activeTenantId === 'tenant-restaurant-beta'
                    ? 'bg-teal-500/15 border-teal-500 text-teal-300'
                    : 'bg-white/5 border-transparent text-white/50 hover:text-white'
                }`}
              >
                Manager Beta
              </button>
              <button
                onClick={() => loginAs('platform_client', 'tenant-restaurant-alpha')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition border ${
                  user?.currentRole === 'platform_client'
                    ? 'bg-teal-500/15 border-teal-500 text-teal-300'
                    : 'bg-white/5 border-transparent text-white/50 hover:text-white'
                }`}
              >
                Client User
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Routes Workspace Partition */}
      <AnimatePresence mode="wait">
        {currentRoute === 'dashboard' ? (
          /* Route A: Protected Business Dashboard Route */
          <motion.div
            key="dashboard-route"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-r from-[#0C0E12] to-[#12161F] p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-left space-y-1">
                <span className="text-[10px] font-extrabold font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
                  Protected Module Gate
                </span>
                <h3 className="text-sm font-black text-white/90">/dashboard/settings — 3D Floor Plan Builder</h3>
                <p className="text-xs text-white/40">
                  Only authorized personnel (Owners & Managers) may load administrative interactive editor states and transform meshes.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>RBAC Allowed: Owner, Manager</span>
              </div>
            </div>

            {/* Render with RBAC guard protection wrapping the interactive setup */}
            <RBACGuard allowedRoles={['business_owner', 'manager']}>
              <div className="bg-[#090A0D] rounded-2xl border border-white/5 overflow-hidden p-4 relative min-h-[500px]">
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                    <span className="text-xs font-black font-mono text-white/80">3D EDITOR MODE INITIALIZED (ACTIVE GL CONTEXT)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-teal-400 bg-teal-500/5 px-2.5 py-1 rounded-lg border border-teal-500/10">
                    <span>Snapping: 0.5 units</span>
                  </div>
                </div>

                <div className="w-full h-[450px] relative bg-black/40 rounded-xl overflow-hidden border border-white/5">
                  <Tabletop3DViewer
                    tables={currentTables}
                    selectedRoom="main"
                    selectedTable={selectedTable}
                    selectedTables={selectedTables}
                    onSelectTable={(t) => {
                      setSelectedTable(t);
                      setSelectedTables([t]);
                    }}
                    bookedTableIds={[]}
                    partySizeFilter={0}
                    tableTypeFilter="all"
                    tableSearchQuery=""
                    isEditable={true} // Full Editor enabled inside the Guard!
                    onUpdateTables={handleUpdateTables}
                  />
                </div>
              </div>
            </RBACGuard>
          </motion.div>
        ) : (
          /* Route B: Public Client Booking Route */
          <motion.div
            key="booking-route"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-r from-[#0C0E12] to-[#12161F] p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-left space-y-1">
                <span className="text-[10px] font-extrabold font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 uppercase tracking-wider">
                  Public Client Route
                </span>
                <h3 className="text-sm font-black text-white/90">/reserve/{activeTenantId} — Smart Swapping Engine</h3>
                <p className="text-xs text-white/40">
                  Read-only reservation workspace optimized for quick booking, utilizing the 1-click swap rule.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">Simulate Guests:</span>
                <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                  {[2, 4, 6].map(count => (
                    <button
                      key={count}
                      onClick={() => setGuestsCount(count)}
                      className={`w-7 h-7 rounded-md font-mono text-xs font-bold transition ${
                        guestsCount === count 
                          ? 'bg-teal-500 text-black font-black' 
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Render the clean, client-facing auto-allocation booking stage */}
            <div className="bg-[#090A0D] rounded-2xl border border-white/5 overflow-hidden p-4 relative min-h-[500px]">
              <div className="w-full h-[450px] relative bg-black/40 rounded-xl overflow-hidden border border-white/5">
                <SmartBookingBridge
                  tables={currentTables}
                  selectedRoom="main"
                  selectedTable={selectedTable}
                  setSelectedTable={setSelectedTable}
                  selectedTables={selectedTables}
                  setSelectedTables={setSelectedTables}
                  bookedTableIds={[]}
                  partySizeFilter={0}
                  tableTypeFilter="all"
                  tableSearchQuery=""
                  isEditable={false} // READ-ONLY view guarantees no transform controls or gizmos render!
                  onUpdateTables={handleUpdateTables}
                  guestsCount={guestsCount}
                  setGuestsCount={setGuestsCount}
                  onBookTable={handleBookTableInstant}
                  tableActionLoading={false}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
