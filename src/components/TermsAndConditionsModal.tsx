import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Download, 
  Printer, 
  Lock,
  Sparkles,
  ChevronRight,
  Scale,
  TrendingUp
} from 'lucide-react';
import { LegalPolicySettings } from '../types';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  legalSettings: LegalPolicySettings;
  onAccept?: () => void;
  forced?: boolean;
  userAcceptedVersion?: string;
}

export default function TermsAndConditionsModal({
  isOpen,
  onClose,
  legalSettings,
  onAccept,
  forced = false,
  userAcceptedVersion
}: TermsAndConditionsModalProps) {
  const [activeTab, setActiveTab] = useState<'business' | 'customer' | 'disclaimer' | 'full' | 'privacy' | 'crowdfunding'>('business');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isUpToDate = userAcceptedVersion === legalSettings.version;

  const handlePrint = () => {
    window.print();
  };

  const handleAccept = () => {
    if (onAccept) onAccept();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#12151B] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-white"
        >
          {/* Header */}
          <div className="p-6 bg-[#181C24] border-b border-white/10 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-display font-bold text-white tracking-tight">
                    OmniReserve Legal & Compliance Framework
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[11px] font-mono font-bold">
                    {legalSettings.version}
                  </span>
                </div>
                <p className="text-xs text-white/50">
                  Updated: {legalSettings.lastUpdated} | Mandatory platform terms for clients and venue operators
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
                title="Print Policy Document"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>

              {!forced && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Forced Notice Banner if re-acceptance required */}
          {forced && (
            <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Policy Update Notice:</strong> The terms of service have been updated ({legalSettings.version}). Please review and accept to continue using the OmniReserve platform.
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 font-bold shrink-0">
                Action Required
              </span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 px-6 pt-4 border-b border-white/10 overflow-x-auto no-scrollbar bg-[#14171F]">
            {[
              { id: 'business' as const, label: 'Business Venue Rules', icon: Building2 },
              { id: 'customer' as const, label: 'Customer Rules', icon: UserCheck },
              { id: 'disclaimer' as const, label: 'Platform Disclaimer', icon: ShieldCheck },
              { id: 'crowdfunding' as const, label: 'Invest & Back', icon: TrendingUp },
              { id: 'full' as const, label: 'Terms of Service', icon: FileText },
              { id: 'privacy' as const, label: 'Privacy Policy', icon: Lock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 rounded-t-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 ${
                    isActive
                      ? 'border-teal-400 text-teal-300 bg-teal-500/10'
                      : 'border-transparent text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm text-white/80 leading-relaxed font-sans">
            {activeTab === 'business' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/15">
                  <h3 className="font-display font-bold text-base text-white mb-1 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-400" />
                    Section 1: Business Operator & Venue Governance
                  </h3>
                  <p className="text-xs text-white/60">
                    Strict operational protocols for Tabletop restaurants, Bookly service providers, and Stay properties.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider block">Rule 1.1 • Inventory Guarantee</span>
                    <h4 className="font-bold text-white text-sm">Mandatory Table & Service Availability</h4>
                    <p className="text-xs text-white/70">
                      All partner venues must maintain real-time inventory synchronization. Unreported double-bookings or artificial inventory closures trigger immediate compliance reviews.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">Rule 1.2 • Strict Anti-Cancellation</span>
                    <h4 className="font-bold text-white text-sm">Unilateral Cancellation Penalties</h4>
                    <p className="text-xs text-white/70">
                      Venues cancelling confirmed reservations within 2 hours of arrival without proven force majeure incur a 15% platform fee penalty and a strike on their compliance score.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider block">Rule 1.3 • Check-In Verification</span>
                    <h4 className="font-bold text-white text-sm">Digital QR Scanner Validation</h4>
                    <p className="text-xs text-white/70">
                      Venues must scan customer QR check-in codes or perform manual check-in verification via the staff dashboard to ensure deposit payouts are automatically settled.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider block">Rule 1.4 • Price Integrity</span>
                    <h4 className="font-bold text-white text-sm">Transparent Rate Commitments</h4>
                    <p className="text-xs text-white/70">
                      In-app service fees, deposit amounts, and minimum spends must match on-premise billing. Surcharging customers above the agreed app price is strictly prohibited.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#1A1E27] border border-white/10 text-xs whitespace-pre-wrap font-mono text-white/70 leading-relaxed">
                  {legalSettings.businessRules}
                </div>
              </div>
            )}

            {activeTab === 'customer' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/15">
                  <h3 className="font-display font-bold text-base text-white mb-1 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-indigo-400" />
                    Section 2: Customer Reservation & No-Show Protocols
                  </h3>
                  <p className="text-xs text-white/60">
                    Rights, cancellation windows, deposit forfeiture rules, and account safety guidelines for guests.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider block">Rule 2.1 • Arrival Grace Period</span>
                    <h4 className="font-bold text-white text-sm">15-Minute Seating Window</h4>
                    <p className="text-xs text-white/70">
                      Tabletop reservations are held for exactly 15 minutes past scheduled time. After 15 minutes, venues reserve the right to release unseated tables to walk-in guests.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider block">Rule 2.2 • Fraudulent No-Show Penalties</span>
                    <h4 className="font-bold text-white text-sm">Deposit Forfeiture & Strikes</h4>
                    <p className="text-xs text-white/70">
                      Failing to show up without cancelling at least 1 hour prior results in full deposit forfeiture. Accounts accumulating 3 no-show strikes face temporary reservation locks.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider block">Rule 2.3 • Free Cancellation Window</span>
                    <h4 className="font-bold text-white text-sm">Flexible Modification</h4>
                    <p className="text-xs text-white/70">
                      Reservations modified or cancelled at least 2 hours prior to the slot receive 100% deposit refund back to the OmniReserve user wallet.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider block">Rule 2.4 • Identity Verification</span>
                    <h4 className="font-bold text-white text-sm">Authentic Booking Profiles</h4>
                    <p className="text-xs text-white/70">
                      Multiple duplicate accounts created to bypass reservation limits or exploit promotion codes are subject to immediate account consolidation and ban.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#1A1E27] border border-white/10 text-xs whitespace-pre-wrap font-mono text-white/70 leading-relaxed">
                  {legalSettings.customerRules}
                </div>
              </div>
            )}

            {activeTab === 'disclaimer' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15">
                  <h3 className="font-display font-bold text-base text-white mb-1 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    Section 3: Platform Liability & Third-Party Disclaimer
                  </h3>
                  <p className="text-xs text-white/60">
                    OmniReserve operates as an intermediary marketplace connecting customers with independent venues.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Service Quality Disclaimer</h4>
                      <p className="text-xs text-white/70 mt-1">
                        OmniReserve is not responsible for the quality of food, beverage, spa treatments, or hotel accommodations provided by third-party partner venues. All on-site services remain the sole responsibility of the respective venue management.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-white/5 pt-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Force Majeure & System Outages</h4>
                      <p className="text-xs text-white/70 mt-1">
                        The platform is provided "as is" without implied warranty. Interruptions caused by third-party cloud infrastructure, telecom outages, or extreme weather conditions do not constitute platform breach.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-white/5 pt-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Arbitration & Dispute Resolution</h4>
                      <p className="text-xs text-white/70 mt-1">
                        Disputes between venue operators and guests are mediated by OmniReserve Platform Controls team under the Compliance Violations framework prior to any formal legal arbitration.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#1A1E27] border border-white/10 text-xs whitespace-pre-wrap font-mono text-white/70 leading-relaxed">
                  {legalSettings.disclaimer}
                </div>
              </div>
            )}

            {activeTab === 'crowdfunding' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/15">
                  <h3 className="font-display font-bold text-base text-white mb-1 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    Section 4: Crowdfunding & Venue Backing (Invest & Back)
                  </h3>
                  <p className="text-xs text-white/60">
                    Rules governing how users back venue expansion campaigns, how funds are held in escrow, and how venues must fulfill rewards.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">Investor Risk Disclaimer</span>
                    <h4 className="font-bold text-white text-sm">Backing is Not a Guaranteed Investment</h4>
                    <p className="text-xs text-white/70">
                      Contributions are voluntary pledges for rewards, not financial securities, equity stakes, or guaranteed returns. Backers accept the risk that a venue may be unable to complete the project or deliver rewards as described.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider block">Escrow Policy</span>
                    <h4 className="font-bold text-white text-sm">Segregated Escrow & Milestone Release</h4>
                    <p className="text-xs text-white/70">
                      All funds are collected into an OmniReserve managed escrow account. Pledged funds are released to the venue only after the campaign reaches its funding goal and passes a compliance review.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">Venue Obligations</span>
                    <h4 className="font-bold text-white text-sm">Reward Fulfillment & Redemption</h4>
                    <p className="text-xs text-white/70">
                      Venues must honor all tier rewards to eligible backers once the campaign completes and funds are released. Rewards must be tracked in the backer's account and redeemable through the normal booking flow.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider block">Refund & Cancellation</span>
                    <h4 className="font-bold text-white text-sm">Platform Refund Authority</h4>
                    <p className="text-xs text-white/70">
                      OmniReserve Super Admins may pause, refund, or cancel any campaign that violates platform policies, misrepresents its budget, or fails to meet legal compliance. Refunds are credited to the original backer's deposit balance.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#1A1E27] border border-white/10 text-xs whitespace-pre-wrap font-mono text-white/70 leading-relaxed">
                  {legalSettings.crowdfundingTerms}
                </div>

                <div className="p-4 rounded-xl bg-[#1A1E27] border border-white/10 text-xs whitespace-pre-wrap font-mono text-white/70 leading-relaxed">
                  {legalSettings.crowdfundingEscrow}
                </div>

                <div className="p-4 rounded-xl bg-[#1A1E27] border border-white/10 text-xs whitespace-pre-wrap font-mono text-white/70 leading-relaxed">
                  {legalSettings.crowdfundingVenueObligations}
                </div>
              </div>
            )}

            {activeTab === 'full' && (
              <div className="space-y-3">
                <h3 className="font-display font-bold text-base text-white">Full Terms & Conditions Text</h3>
                <div className="p-5 rounded-xl bg-[#161920] border border-white/10 text-xs text-white/80 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                  {legalSettings.termsAndConditions}
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-3">
                <h3 className="font-display font-bold text-base text-white">Privacy Policy & Data Security</h3>
                <div className="p-5 rounded-xl bg-[#161920] border border-white/10 text-xs text-white/80 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                  {legalSettings.privacyPolicy}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-[#181C24] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Version: <strong className="text-white">{legalSettings.version}</strong></span>
              {isUpToDate && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                  Accepted
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {!forced && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition"
                >
                  Close
                </button>
              )}

              <button
                type="button"
                onClick={handleAccept}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-black font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I Have Read & Accept Terms</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
