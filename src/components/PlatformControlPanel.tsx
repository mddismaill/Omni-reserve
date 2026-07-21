import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Building2, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  PauseCircle, 
  Ban, 
  Search, 
  Filter, 
  Plus, 
  Save, 
  Clock, 
  RefreshCw, 
  UserX, 
  Sliders, 
  Sparkles, 
  Eye, 
  Edit3, 
  AlertCircle, 
  Scale, 
  Flag,
  ChevronDown,
  Info,
  Check
} from 'lucide-react';
import { 
  User as UserType, 
  VenueModerationItem, 
  ComplianceViolation, 
  LegalPolicySettings, 
  VenueStatus, 
  InfractionSeverity, 
  InfractionStatus 
} from '../types';

interface PlatformControlPanelProps {
  user: UserType;
  venues: VenueModerationItem[];
  setVenues: React.Dispatch<React.SetStateAction<VenueModerationItem[]>>;
  violations: ComplianceViolation[];
  setViolations: React.Dispatch<React.SetStateAction<ComplianceViolation[]>>;
  legalSettings: LegalPolicySettings;
  setLegalSettings: React.Dispatch<React.SetStateAction<LegalPolicySettings>>;
  onOpenTermsModal: () => void;
  onAddNotification: (title: string, message: string, type: 'reminder' | 'offer' | 'status') => void;
}

export default function PlatformControlPanel({
  user,
  venues,
  setVenues,
  violations,
  setViolations,
  legalSettings,
  setLegalSettings,
  onOpenTermsModal,
  onAddNotification
}: PlatformControlPanelProps) {
  // Main Tab State: 'controls' (Venue Moderation & Violations) vs 'legal' (Terms & Legal Control Center)
  const [mainTab, setMainTab] = useState<'controls' | 'legal'>('controls');

  // Sub-tab for controls: 'venues' vs 'violations'
  const [controlSubTab, setControlSubTab] = useState<'venues' | 'violations'>('venues');

  // Venue Filters
  const [venueSearch, setVenueSearch] = useState('');
  const [venueStatusFilter, setVenueStatusFilter] = useState<string>('all');
  const [venueModuleFilter, setVenueModuleFilter] = useState<string>('all');

  // Violations Filters
  const [violationSearch, setViolationSearch] = useState('');
  const [violationSeverityFilter, setViolationSeverityFilter] = useState<string>('all');
  const [violationStatusFilter, setViolationStatusFilter] = useState<string>('all');

  // Moderation Action Modal State
  const [selectedVenueForAction, setSelectedVenueForAction] = useState<VenueModerationItem | null>(null);
  const [actionType, setActionType] = useState<'Suspend' | 'Ban' | null>(null);
  const [reasonPreset, setReasonPreset] = useState<string>('Violation of Section 3.2 of Terms & Conditions: Unilateral Booking Cancellation');
  const [customReason, setCustomReason] = useState<string>('');

  // Ticket Modal State
  const [selectedViolationForResolve, setSelectedViolationForResolve] = useState<ComplianceViolation | null>(null);
  const [resolutionNoteInput, setResolutionNoteInput] = useState<string>('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // New Ticket Form State
  const [newTicketVenueId, setNewTicketVenueId] = useState<string>('');
  const [newTicketType, setNewTicketType] = useState<'Unilateral Cancellation' | 'Price Manipulation' | 'No-Show Fraud' | 'Quality Complaint' | 'Policy Infraction'>('Unilateral Cancellation');
  const [newTicketSeverity, setNewTicketSeverity] = useState<InfractionSeverity>('High');
  const [newTicketReportedBy, setNewTicketReportedBy] = useState<string>('System Audit');
  const [newTicketDesc, setNewTicketDesc] = useState<string>('');

  // Legal Control Center Edit State
  const [legalForm, setLegalForm] = useState<LegalPolicySettings>({ ...legalSettings });
  const [legalSubTab, setLegalSubTab] = useState<'terms' | 'privacy' | 'business' | 'customer' | 'disclaimer'>('terms');
  const [isLegalSaved, setIsLegalSaved] = useState(false);

  // Filtered Venues
  const filteredVenues = venues.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(venueSearch.toLowerCase()) || 
                          v.ownerName.toLowerCase().includes(venueSearch.toLowerCase()) ||
                          v.ownerEmail.toLowerCase().includes(venueSearch.toLowerCase());
    const matchesStatus = venueStatusFilter === 'all' || v.status === venueStatusFilter;
    const matchesModule = venueModuleFilter === 'all' || v.module === venueModuleFilter;
    return matchesSearch && matchesStatus && matchesModule;
  });

  // Filtered Violations
  const filteredViolations = violations.filter((v) => {
    const matchesSearch = v.venueName.toLowerCase().includes(violationSearch.toLowerCase()) ||
                          v.ticketNumber.toLowerCase().includes(violationSearch.toLowerCase()) ||
                          v.description.toLowerCase().includes(violationSearch.toLowerCase());
    const matchesSeverity = violationSeverityFilter === 'all' || v.severity === violationSeverityFilter;
    const matchesStatus = violationStatusFilter === 'all' || v.status === violationStatusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Analytics Metrics
  const activeCount = venues.filter(v => v.status === 'Active').length;
  const reviewCount = venues.filter(v => v.status === 'Under Review').length;
  const suspendedCount = venues.filter(v => v.status === 'Suspended' || v.status === 'Banned').length;
  const openViolationsCount = violations.filter(v => v.status === 'Open' || v.status === 'Investigating').length;

  // Handle Approve Action
  const handleApproveVenue = (venue: VenueModerationItem) => {
    setVenues(prev => prev.map(v => v.id === venue.id ? { ...v, status: 'Active', statusReason: undefined } : v));
    onAddNotification(
      'Venue Status Approved',
      `Venue "${venue.name}" has been approved and reinstated to Active status.`,
      'status'
    );
  };

  // Handle Confirm Moderation Action (Suspend / Ban)
  const handleConfirmModerationAction = () => {
    if (!selectedVenueForAction || !actionType) return;
    const finalReason = customReason.trim() ? customReason.trim() : reasonPreset;

    const newStatus: VenueStatus = actionType === 'Suspend' ? 'Suspended' : 'Banned';

    setVenues(prev => prev.map(v => {
      if (v.id === selectedVenueForAction.id) {
        return {
          ...v,
          status: newStatus,
          statusReason: finalReason
        };
      }
      return v;
    }));

    // Auto-create a compliance log entry for this action
    const newViolation: ComplianceViolation = {
      id: `vio-${Date.now()}`,
      ticketNumber: `VIO-2026-${Math.floor(100 + Math.random() * 900)}`,
      venueId: selectedVenueForAction.id,
      venueName: selectedVenueForAction.name,
      reportedBy: `Platform Owner (${user.name})`,
      type: 'Policy Infraction',
      severity: actionType === 'Ban' ? 'Critical' : 'High',
      description: `Venue ${actionType.toLowerCase()}ed by Platform Owner. Reason: ${finalReason}`,
      status: 'Action Taken',
      createdAt: new Date().toISOString().split('T')[0],
      resolutionNote: `Enforced ${actionType} action on ${new Date().toLocaleDateString()}`
    };

    setViolations(prev => [newViolation, ...prev]);

    onAddNotification(
      `Venue ${actionType}ed`,
      `Venue "${selectedVenueForAction.name}" status changed to ${newStatus}. Reason logged.`,
      'status'
    );

    // Reset Modal
    setSelectedVenueForAction(null);
    setActionType(null);
    setCustomReason('');
  };

  // Handle Create Violation Ticket
  const handleCreateViolationTicket = () => {
    const venue = venues.find(v => v.id === newTicketVenueId);
    if (!venue || !newTicketDesc.trim()) return;

    const ticket: ComplianceViolation = {
      id: `vio-${Date.now()}`,
      ticketNumber: `VIO-2026-${Math.floor(100 + Math.random() * 900)}`,
      venueId: venue.id,
      venueName: venue.name,
      reportedBy: newTicketReportedBy || 'System Audit',
      type: newTicketType,
      severity: newTicketSeverity,
      description: newTicketDesc,
      status: 'Open',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setViolations(prev => [ticket, ...prev]);
    onAddNotification('Compliance Ticket Opened', `Ticket ${ticket.ticketNumber} created for venue "${venue.name}".`, 'reminder');

    setShowNewTicketModal(false);
    setNewTicketVenueId('');
    setNewTicketDesc('');
  };

  // Handle Resolve Ticket
  const handleConfirmResolveTicket = () => {
    if (!selectedViolationForResolve) return;

    setViolations(prev => prev.map(v => {
      if (v.id === selectedViolationForResolve.id) {
        return {
          ...v,
          status: 'Resolved',
          resolutionNote: resolutionNoteInput.trim() || 'Resolved by Platform Owner audit review.'
        };
      }
      return v;
    }));

    onAddNotification('Ticket Resolved', `Ticket ${selectedViolationForResolve.ticketNumber} resolved.`, 'status');
    setSelectedViolationForResolve(null);
    setResolutionNoteInput('');
  };

  // Handle Save Legal Settings
  const handleSaveLegalSettings = () => {
    setLegalSettings({
      ...legalForm,
      lastUpdated: new Date().toISOString().split('T')[0]
    });

    setIsLegalSaved(true);
    setTimeout(() => setIsLegalSaved(false), 3000);

    onAddNotification(
      'Legal Terms Updated',
      `Terms & Conditions updated to version ${legalForm.version}. Require Re-acceptance: ${legalForm.requireReacceptance ? 'ENABLED' : 'DISABLED'}.`,
      'status'
    );
  };

  return (
    <div className="space-y-8" id="platform-controls-module">
      
      {/* Top Banner Header */}
      <div className="bg-[#161920] border border-white/10 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Creator / Super Admin Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white flex items-center gap-3">
              Platform Controls & Governance
              <span className="text-xs px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
                {legalSettings.version}
              </span>
            </h1>
            <p className="text-white/60 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Super-admin governance control panel for venue moderation, policy enforcement, compliance violations tracking, and legal framework editing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenTermsModal}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition flex items-center gap-2 shadow-sm"
            >
              <Eye className="w-4 h-4 text-teal-400" />
              <span>Preview Live Terms Modal</span>
            </button>

            <div className="px-4 py-2.5 rounded-xl bg-[#1D222E] border border-white/10 text-xs text-white/80 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Compliance: <strong className="text-emerald-400">99.2%</strong></span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Platform Controls vs Terms & Legal) */}
        <div className="flex items-center gap-2 mt-8 border-t border-white/10 pt-6">
          <button
            onClick={() => setMainTab('controls')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2.5 ${
              mainTab === 'controls'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>1. Venue Moderation & Compliance Log</span>
          </button>

          <button
            onClick={() => setMainTab('legal')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2.5 ${
              mainTab === 'legal'
                ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/20'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>2. Terms & Conditions & Legal Center</span>
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: VENUE MODERATION & COMPLIANCE LOG ==================== */}
      {mainTab === 'controls' && (
        <div className="space-y-8">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#161920] border border-white/10 rounded-2xl p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-white/50 block font-mono">Total Registered Venues</span>
                <span className="text-2xl font-display font-black text-white mt-1 block">{venues.length}</span>
                <span className="text-[10px] text-teal-400 font-mono mt-1 block">Tabletop + Bookly + Stays</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#161920] border border-white/10 rounded-2xl p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-white/50 block font-mono">Active & Verified</span>
                <span className="text-2xl font-display font-black text-emerald-400 mt-1 block">{activeCount}</span>
                <span className="text-[10px] text-emerald-400/80 font-mono mt-1 block">100% Operational</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#161920] border border-white/10 rounded-2xl p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-white/50 block font-mono">Suspended / Banned</span>
                <span className="text-2xl font-display font-black text-red-400 mt-1 block">{suspendedCount}</span>
                <span className="text-[10px] text-red-400/80 font-mono mt-1 block">{reviewCount} Under Review</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <Ban className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#161920] border border-white/10 rounded-2xl p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-white/50 block font-mono">Open Compliance Tickets</span>
                <span className="text-2xl font-display font-black text-amber-400 mt-1 block">{openViolationsCount}</span>
                <span className="text-[10px] text-amber-400/80 font-mono mt-1 block">Requires Owner Review</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Sub-tabs toggle */}
          <div className="bg-[#161920] border border-white/10 rounded-2xl p-2 flex items-center gap-2 max-w-md">
            <button
              onClick={() => setControlSubTab('venues')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                controlSubTab === 'venues'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Venue Moderation ({venues.length})</span>
            </button>

            <button
              onClick={() => setControlSubTab('violations')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                controlSubTab === 'violations'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Flag className="w-4 h-4 text-amber-400" />
              <span>Compliance Log ({violations.length})</span>
            </button>
          </div>

          {/* SUB-SECTION 1: VENUE MODERATION TABLE */}
          {controlSubTab === 'venues' && (
            <div className="bg-[#161920] border border-white/10 rounded-3xl p-6 text-white space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-white">Registered Venue Moderation Panel</h3>
                  <p className="text-xs text-white/50">Manage venue operational status across Tabletop restaurants, Bookly service providers, and Stay properties.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/40" />
                    <input
                      type="text"
                      placeholder="Search venue or owner..."
                      value={venueSearch}
                      onChange={(e) => setVenueSearch(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-teal-500 w-48 sm:w-60"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={venueStatusFilter}
                    onChange={(e) => setVenueStatusFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="all" className="bg-[#161920]">All Statuses</option>
                    <option value="Active" className="bg-[#161920]">Active</option>
                    <option value="Under Review" className="bg-[#161920]">Under Review</option>
                    <option value="Suspended" className="bg-[#161920]">Suspended</option>
                    <option value="Banned" className="bg-[#161920]">Banned</option>
                  </select>

                  {/* Module Filter */}
                  <select
                    value={venueModuleFilter}
                    onChange={(e) => setVenueModuleFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="all" className="bg-[#161920]">All Modules</option>
                    <option value="tabletop" className="bg-[#161920]">Tabletop (Dining)</option>
                    <option value="bookly" className="bg-[#161920]">Bookly (Services)</option>
                    <option value="stay" className="bg-[#161920]">Stays (Hotels)</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#12151B]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-white/60 font-mono border-b border-white/10 text-[11px]">
                      <th className="p-4 font-bold">Venue Name & Category</th>
                      <th className="p-4 font-bold">Owner Contact</th>
                      <th className="p-4 font-bold">Module</th>
                      <th className="p-4 font-bold">Status Badge</th>
                      <th className="p-4 font-bold">Compliance Score</th>
                      <th className="p-4 font-bold text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {filteredVenues.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-white/40">
                          No venues match the selected moderation filters.
                        </td>
                      </tr>
                    ) : (
                      filteredVenues.map((v) => {
                        let statusBadge = (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        );

                        if (v.status === 'Under Review') {
                          statusBadge = (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px] inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Under Review
                            </span>
                          );
                        } else if (v.status === 'Suspended') {
                          statusBadge = (
                            <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-bold text-[10px] inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              Suspended
                            </span>
                          );
                        } else if (v.status === 'Banned') {
                          statusBadge = (
                            <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold text-[10px] inline-flex items-center gap-1">
                              <Ban className="w-3 h-3 text-rose-400" />
                              Banned
                            </span>
                          );
                        }

                        return (
                          <tr key={v.id} className="hover:bg-white/[0.02] transition">
                            <td className="p-4 font-semibold text-white">
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{v.name}</span>
                                {v.verifiedBadge && (
                                  <span className="text-teal-400" title="Verified Business">✓</span>
                                )}
                              </div>
                              <span className="text-[10px] text-white/50 block font-mono">{v.category} • ⭐ {v.rating}</span>
                            </td>

                            <td className="p-4">
                              <span className="block text-white font-medium">{v.ownerName}</span>
                              <span className="block text-[10px] text-white/40 font-mono">{v.ownerEmail}</span>
                            </td>

                            <td className="p-4 font-mono text-[11px] uppercase">
                              <span className={`px-2 py-0.5 rounded border ${
                                v.module === 'tabletop' 
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' 
                                  : v.module === 'bookly'
                                    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                                    : 'bg-teal-500/10 text-teal-300 border-teal-500/20'
                              }`}>
                                {v.module}
                              </span>
                            </td>

                            <td className="p-4">
                              {statusBadge}
                              {v.statusReason && (
                                <span className="text-[10px] text-red-300/80 block mt-1 font-mono italic max-w-xs truncate" title={v.statusReason}>
                                  Reason: {v.statusReason}
                                </span>
                              )}
                            </td>

                            <td className="p-4 font-mono">
                              <span className={`font-bold ${v.complianceScore >= 90 ? 'text-emerald-400' : v.complianceScore >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
                                {v.complianceScore}%
                              </span>
                              <span className="text-[10px] text-white/40 block">Last Audit: {v.lastAuditDate}</span>
                            </td>

                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {v.status !== 'Active' && (
                                  <button
                                    onClick={() => handleApproveVenue(v)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] transition flex items-center gap-1"
                                    title="Approve / Re-activate Venue"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Approve
                                  </button>
                                )}

                                {v.status !== 'Suspended' && v.status !== 'Banned' && (
                                  <button
                                    onClick={() => {
                                      setSelectedVenueForAction(v);
                                      setActionType('Suspend');
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-bold text-[11px] transition flex items-center gap-1"
                                    title="Suspend Venue"
                                  >
                                    <PauseCircle className="w-3.5 h-3.5" />
                                    Suspend
                                  </button>
                                )}

                                {v.status !== 'Banned' && (
                                  <button
                                    onClick={() => {
                                      setSelectedVenueForAction(v);
                                      setActionType('Ban');
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-bold text-[11px] transition flex items-center gap-1"
                                    title="Ban Venue"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    Ban
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-SECTION 2: COMPLIANCE VIOLATIONS LOG */}
          {controlSubTab === 'violations' && (
            <div className="bg-[#161920] border border-white/10 rounded-3xl p-6 text-white space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    Compliance Violations & Policy Infractions Log
                  </h3>
                  <p className="text-xs text-white/50">Track customer complaints, unilateral cancellations, no-show fraud, and platform policy disputes.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowNewTicketModal(true)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    Log New Ticket
                  </button>

                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/40" />
                    <input
                      type="text"
                      placeholder="Search ticket or venue..."
                      value={violationSearch}
                      onChange={(e) => setViolationSearch(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-500 w-48 sm:w-56"
                    />
                  </div>

                  <select
                    value={violationSeverityFilter}
                    onChange={(e) => setViolationSeverityFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="all" className="bg-[#161920]">All Severities</option>
                    <option value="Critical" className="bg-[#161920]">Critical</option>
                    <option value="High" className="bg-[#161920]">High</option>
                    <option value="Medium" className="bg-[#161920]">Medium</option>
                    <option value="Low" className="bg-[#161920]">Low</option>
                  </select>

                  <select
                    value={violationStatusFilter}
                    onChange={(e) => setViolationStatusFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="all" className="bg-[#161920]">All Statuses</option>
                    <option value="Open" className="bg-[#161920]">Open</option>
                    <option value="Investigating" className="bg-[#161920]">Investigating</option>
                    <option value="Resolved" className="bg-[#161920]">Resolved</option>
                    <option value="Action Taken" className="bg-[#161920]">Action Taken</option>
                  </select>
                </div>
              </div>

              {/* Tickets Table */}
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#12151B]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-white/60 font-mono border-b border-white/10 text-[11px]">
                      <th className="p-4 font-bold">Ticket #</th>
                      <th className="p-4 font-bold">Venue</th>
                      <th className="p-4 font-bold">Infraction Type</th>
                      <th className="p-4 font-bold">Severity</th>
                      <th className="p-4 font-bold">Reported By & Description</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {filteredViolations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-white/40">
                          No compliance violations match the filters.
                        </td>
                      </tr>
                    ) : (
                      filteredViolations.map((ticket) => {
                        let severityBadge = (
                          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono text-[10px] font-bold">
                            Low
                          </span>
                        );
                        if (ticket.severity === 'Medium') {
                          severityBadge = (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold">
                              Medium
                            </span>
                          );
                        } else if (ticket.severity === 'High') {
                          severityBadge = (
                            <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 font-mono text-[10px] font-bold">
                              High
                            </span>
                          );
                        } else if (ticket.severity === 'Critical') {
                          severityBadge = (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-mono text-[10px] font-bold animate-pulse">
                              Critical
                            </span>
                          );
                        }

                        let statusBadge = (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px]">
                            {ticket.status}
                          </span>
                        );
                        if (ticket.status === 'Resolved') {
                          statusBadge = (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                              Resolved
                            </span>
                          );
                        } else if (ticket.status === 'Action Taken') {
                          statusBadge = (
                            <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-[10px]">
                              Action Enforced
                            </span>
                          );
                        }

                        return (
                          <tr key={ticket.id} className="hover:bg-white/[0.02] transition">
                            <td className="p-4 font-mono font-bold text-teal-300">
                              {ticket.ticketNumber}
                              <span className="text-[10px] text-white/40 block font-normal">{ticket.createdAt}</span>
                            </td>

                            <td className="p-4 font-semibold text-white">
                              {ticket.venueName}
                            </td>

                            <td className="p-4 font-mono text-[11px] text-amber-300">
                              {ticket.type}
                            </td>

                            <td className="p-4">
                              {severityBadge}
                            </td>

                            <td className="p-4 max-w-xs">
                              <span className="text-[10px] text-white/50 block font-mono">By: {ticket.reportedBy}</span>
                              <p className="text-xs text-white/80 line-clamp-2 mt-0.5">{ticket.description}</p>
                              {ticket.resolutionNote && (
                                <p className="text-[10px] text-emerald-400 block mt-1 font-mono">Note: {ticket.resolutionNote}</p>
                              )}
                            </td>

                            <td className="p-4">
                              {statusBadge}
                            </td>

                            <td className="p-4 text-right">
                              {ticket.status !== 'Resolved' ? (
                                <button
                                  onClick={() => {
                                    setSelectedViolationForResolve(ticket);
                                    setResolutionNoteInput(ticket.resolutionNote || '');
                                  }}
                                  className="px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-300 font-bold text-[11px] transition"
                                >
                                  Resolve Ticket
                                </button>
                              ) : (
                                <span className="text-[10px] text-white/30 font-mono">Closed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: TERMS & CONDITIONS & LEGAL CONTROL CENTER ==================== */}
      {mainTab === 'legal' && (
        <div className="bg-[#161920] border border-white/10 rounded-3xl p-6 sm:p-8 text-white space-y-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Scale className="w-6 h-6 text-teal-400" />
                <h2 className="text-xl font-display font-bold text-white">Legal Control Center & Policy Editor</h2>
              </div>
              <p className="text-xs text-white/50">Edit platform terms, business rules, customer rules, and toggle forced re-acceptance triggers.</p>
            </div>

            <div className="flex items-center gap-3">
              {isLegalSaved && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                  <Check className="w-4 h-4" /> Policy Version Published!
                </span>
              )}

              <button
                type="button"
                onClick={handleSaveLegalSettings}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-black font-extrabold text-xs transition flex items-center gap-2 shadow-lg shadow-teal-500/20"
              >
                <Save className="w-4 h-4" />
                <span>Save & Publish Policy Version</span>
              </button>
            </div>
          </div>

          {/* Configuration Settings Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-[#12151B] border border-white/10">
            {/* Version control */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-white/70 font-bold block uppercase tracking-wider">
                Active Policy Version String
              </label>
              <input
                type="text"
                value={legalForm.version}
                onChange={(e) => setLegalForm({ ...legalForm, version: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                placeholder="e.g. v2.4 - July 2026"
              />
              <span className="text-[10px] text-white/40 block">Last Saved: {legalForm.lastUpdated}</span>
            </div>

            {/* Re-acceptance Toggle */}
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-amber-300 block flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Require Mandatory Re-acceptance
                </span>
                <p className="text-[11px] text-white/60 mt-1 leading-normal">
                  Forces all clients, business owners, and staff to confirm updated terms on next interaction.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setLegalForm({ ...legalForm, requireReacceptance: !legalForm.requireReacceptance })}
                className={`w-12 h-6 rounded-full transition-colors p-1 relative flex items-center ${
                  legalForm.requireReacceptance ? 'bg-amber-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-black transition-transform ${
                    legalForm.requireReacceptance ? 'translate-x-6 bg-black' : 'translate-x-0 bg-white'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Text Editor Navigation Tabs */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto pb-2">
              {[
                { id: 'terms' as const, label: 'Full Terms & Conditions' },
                { id: 'privacy' as const, label: 'Privacy Policy' },
                { id: 'business' as const, label: 'Business Venue Rules' },
                { id: 'customer' as const, label: 'Customer Rules' },
                { id: 'disclaimer' as const, label: 'Platform Disclaimer' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLegalSubTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    legalSubTab === tab.id
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-Editor Textareas */}
            {legalSubTab === 'terms' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/60 font-mono">
                  <span>Editor: Terms & Conditions</span>
                  <span>{legalForm.termsAndConditions.length} chars</span>
                </div>
                <textarea
                  rows={14}
                  value={legalForm.termsAndConditions}
                  onChange={(e) => setLegalForm({ ...legalForm, termsAndConditions: e.target.value })}
                  className="w-full bg-[#12151B] border border-white/10 rounded-2xl p-4 text-xs font-mono text-white/90 focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>
            )}

            {legalSubTab === 'privacy' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/60 font-mono">
                  <span>Editor: Privacy Policy</span>
                  <span>{legalForm.privacyPolicy.length} chars</span>
                </div>
                <textarea
                  rows={14}
                  value={legalForm.privacyPolicy}
                  onChange={(e) => setLegalForm({ ...legalForm, privacyPolicy: e.target.value })}
                  className="w-full bg-[#12151B] border border-white/10 rounded-2xl p-4 text-xs font-mono text-white/90 focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>
            )}

            {legalSubTab === 'business' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/60 font-mono">
                  <span>Editor: Business Operator Rules</span>
                  <span>{legalForm.businessRules.length} chars</span>
                </div>
                <textarea
                  rows={14}
                  value={legalForm.businessRules}
                  onChange={(e) => setLegalForm({ ...legalForm, businessRules: e.target.value })}
                  className="w-full bg-[#12151B] border border-white/10 rounded-2xl p-4 text-xs font-mono text-white/90 focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>
            )}

            {legalSubTab === 'customer' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/60 font-mono">
                  <span>Editor: Customer & No-Show Rules</span>
                  <span>{legalForm.customerRules.length} chars</span>
                </div>
                <textarea
                  rows={14}
                  value={legalForm.customerRules}
                  onChange={(e) => setLegalForm({ ...legalForm, customerRules: e.target.value })}
                  className="w-full bg-[#12151B] border border-white/10 rounded-2xl p-4 text-xs font-mono text-white/90 focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>
            )}

            {legalSubTab === 'disclaimer' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/60 font-mono">
                  <span>Editor: Platform Disclaimer</span>
                  <span>{legalForm.disclaimer.length} chars</span>
                </div>
                <textarea
                  rows={14}
                  value={legalForm.disclaimer}
                  onChange={(e) => setLegalForm({ ...legalForm, disclaimer: e.target.value })}
                  className="w-full bg-[#12151B] border border-white/10 rounded-2xl p-4 text-xs font-mono text-white/90 focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL: MODERATION REASON INPUT (Suspend/Ban) ==================== */}
      <AnimatePresence>
        {selectedVenueForAction && actionType && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161920] border border-white/10 rounded-3xl p-6 w-full max-w-lg text-white space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${actionType === 'Ban' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {actionType === 'Ban' ? <Ban className="w-6 h-6" /> : <PauseCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base">Enforce {actionType} Status</h3>
                    <p className="text-xs text-white/50">Venue: <strong className="text-white">{selectedVenueForAction.name}</strong></p>
                  </div>
                </div>

                <button onClick={() => setSelectedVenueForAction(null)} className="p-2 text-white/40 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-mono text-white/70 block mb-1 font-bold">Select Policy Violation Template</label>
                  <select
                    value={reasonPreset}
                    onChange={(e) => setReasonPreset(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Violation of Section 3.2 of Terms & Conditions: Unilateral Booking Cancellation" className="bg-[#161920]">
                      Violation 3.2: Unilateral Booking Cancellation
                    </option>
                    <option value="Violation of Section 1.4: In-App Surcharging & Price Discrepancy" className="bg-[#161920]">
                      Violation 1.4: Price Discrepancy & Extra Surcharges
                    </option>
                    <option value="Violation of Section 1.1: Artificial Inventory Closure & Double Booking" className="bg-[#161920]">
                      Violation 1.1: Artificial Inventory Closure & Double Booking
                    </option>
                    <option value="Customer Quality Complaints & Safety Policy Infraction" className="bg-[#161920]">
                      Quality Complaints & Safety Infraction
                    </option>
                    <option value="Custom Reason Below" className="bg-[#161920]">
                      Custom Specific Reason...
                    </option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-white/70 block mb-1 font-bold">Detailed Reason Note</label>
                  <textarea
                    rows={3}
                    placeholder="Provide additional details regarding this enforcement action..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedVenueForAction(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmModerationAction}
                  className={`px-5 py-2 rounded-xl font-extrabold text-xs text-black transition flex items-center gap-1.5 ${
                    actionType === 'Ban' ? 'bg-red-500 hover:bg-red-400' : 'bg-amber-500 hover:bg-amber-400'
                  }`}
                >
                  Confirm {actionType} Action
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL: LOG NEW COMPLIANCE TICKET ==================== */}
      <AnimatePresence>
        {showNewTicketModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161920] border border-white/10 rounded-3xl p-6 w-full max-w-lg text-white space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="font-display font-bold text-base flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  Log Compliance Infraction Ticket
                </h3>
                <button onClick={() => setShowNewTicketModal(false)} className="p-2 text-white/40 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-mono text-white/70 block mb-1 font-bold">Select Target Venue</label>
                  <select
                    value={newTicketVenueId}
                    onChange={(e) => setNewTicketVenueId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="" className="bg-[#161920]">-- Choose Venue --</option>
                    {venues.map(v => (
                      <option key={v.id} value={v.id} className="bg-[#161920]">{v.name} ({v.category})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-white/70 block mb-1 font-bold">Infraction Type</label>
                    <select
                      value={newTicketType}
                      onChange={(e) => setNewTicketType(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Unilateral Cancellation" className="bg-[#161920]">Unilateral Cancellation</option>
                      <option value="Price Manipulation" className="bg-[#161920]">Price Manipulation</option>
                      <option value="No-Show Fraud" className="bg-[#161920]">No-Show Fraud</option>
                      <option value="Quality Complaint" className="bg-[#161920]">Quality Complaint</option>
                      <option value="Policy Infraction" className="bg-[#161920]">Policy Infraction</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-mono text-white/70 block mb-1 font-bold">Severity Level</label>
                    <select
                      value={newTicketSeverity}
                      onChange={(e) => setNewTicketSeverity(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Low" className="bg-[#161920]">Low</option>
                      <option value="Medium" className="bg-[#161920]">Medium</option>
                      <option value="High" className="bg-[#161920]">High</option>
                      <option value="Critical" className="bg-[#161920]">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-mono text-white/70 block mb-1 font-bold">Reported By</label>
                  <input
                    type="text"
                    value={newTicketReportedBy}
                    onChange={(e) => setNewTicketReportedBy(e.target.value)}
                    placeholder="e.g. Customer (Alex M.) or System Audit"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-mono text-white/70 block mb-1 font-bold">Infraction Description</label>
                  <textarea
                    rows={3}
                    value={newTicketDesc}
                    onChange={(e) => setNewTicketDesc(e.target.value)}
                    placeholder="Detailed explanation of the incident..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCreateViolationTicket}
                  disabled={!newTicketVenueId || !newTicketDesc.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-extrabold text-xs transition"
                >
                  Log Compliance Ticket
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL: RESOLVE COMPLIANCE TICKET ==================== */}
      <AnimatePresence>
        {selectedViolationForResolve && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161920] border border-white/10 rounded-3xl p-6 w-full max-w-lg text-white space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="font-display font-bold text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                  Resolve Compliance Ticket #{selectedViolationForResolve.ticketNumber}
                </h3>
                <button onClick={() => setSelectedViolationForResolve(null)} className="p-2 text-white/40 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-white/70">
                  Venue: <strong className="text-white">{selectedViolationForResolve.venueName}</strong>
                </p>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-white/80">
                  <span className="font-mono text-amber-300 font-bold block mb-1">{selectedViolationForResolve.type}</span>
                  <p>{selectedViolationForResolve.description}</p>
                </div>

                <div>
                  <label className="font-mono text-white/70 block mb-1 font-bold">Resolution Note / Audit Outcome</label>
                  <textarea
                    rows={3}
                    placeholder="Detail the resolution steps taken or mediation result..."
                    value={resolutionNoteInput}
                    onChange={(e) => setResolutionNoteInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedViolationForResolve(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmResolveTicket}
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Mark Ticket Resolved
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
