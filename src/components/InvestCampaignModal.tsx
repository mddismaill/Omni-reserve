import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  Landmark,
  ShieldCheck,
  Coins,
  CalendarClock,
  Gem,
  Crown,
  Award,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { CrowdfundingCampaign, InvestmentTier, User } from '../types';

interface InvestCampaignModalProps {
  campaign: CrowdfundingCampaign | null;
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onBackCampaign: (campaignId: string, tierName: string, amount: number) => void;
}

const tierIcons: Record<string, React.ElementType> = {
  Bronze: Award,
  Gold: Gem,
  Platinum: Crown,
  'Platinum Partner': Crown
};

export default function InvestCampaignModal({
  campaign,
  isOpen,
  onClose,
  user,
  onBackCampaign
}: InvestCampaignModalProps) {
  const [selectedTier, setSelectedTier] = useState<InvestmentTier | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [successTier, setSuccessTier] = useState<InvestmentTier | null>(null);

  const canAfford = useMemo(() => {
    if (!user || !selectedTier) return false;
    return user.balance >= selectedTier.amount;
  }, [user, selectedTier]);

  if (!isOpen || !campaign) return null;

  const percentage = Math.min(100, Math.round((campaign.raisedAmount / campaign.fundingGoal) * 100));
  const photos = campaign.images.length > 0 ? campaign.images : ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'];

  const handleNextPhoto = () => setPhotoIndex((i) => (i + 1) % photos.length);
  const handlePrevPhoto = () => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);

  const handleBack = () => {
    if (!selectedTier || !canAfford || !acknowledged) return;
    onBackCampaign(campaign.id, selectedTier.name, selectedTier.amount);
    setSuccessTier(selectedTier);
    setTimeout(() => {
      setSuccessTier(null);
      setSelectedTier(null);
      setAcknowledged(false);
      setPhotoIndex(0);
    }, 2200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-[#12151B] border border-white/10 rounded-3xl w-full max-w-5xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden text-white"
          >
            {/* Header */}
            <div className="p-5 bg-[#181C24] border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-white">{campaign.title}</h2>
                  <div className="flex items-center gap-2 text-[11px] text-white/50">
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 font-mono font-bold">
                      {campaign.venueTag}
                    </span>
                    <span>{campaign.venueName}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successTier ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400"
                >
                  <CheckCircle2 className="w-10 h-10" />
                </motion.div>
                <h3 className="text-xl font-display font-bold text-white">Backed {successTier.name} Tier</h3>
                <p className="text-sm text-white/60 max-w-md">
                  You contributed ${successTier.amount.toLocaleString()} to {campaign.title}. Your reward is locked in.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-5">
                  {/* Left column: gallery + pitch */}
                  <div className="lg:col-span-3 p-5 space-y-6 border-b lg:border-b-0 lg:border-r border-white/10">
                    {/* Photo Gallery */}
                    <div className="relative rounded-2xl overflow-hidden bg-[#0F1115] border border-white/10 aspect-video group">
                      <img
                        src={photos[photoIndex]}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {photos.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setPhotoIndex(idx)}
                              className={`w-2 h-2 rounded-full transition ${idx === photoIndex ? 'bg-teal-400' : 'bg-white/30'}`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handlePrevPhoto}
                            className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleNextPhoto}
                            className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress summary */}
                    <div className="bg-[#161920] border border-white/10 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Raised</span>
                        <span className="font-display font-bold text-white">
                          ${campaign.raisedAmount.toLocaleString()} / ${campaign.fundingGoal.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2.5 bg-[#0F1115] rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-emerald-400">{percentage}% funded</span>
                        <span className="text-white/50">{campaign.daysRemaining} days remaining</span>
                      </div>
                    </div>

                    {/* Pitch */}
                    <div className="space-y-2">
                      <h3 className="font-display font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-400" />
                        Project Pitch
                      </h3>
                      <p className="text-sm text-white/70 leading-relaxed">{campaign.description}</p>
                      <p className="text-sm text-white/70 leading-relaxed italic">{campaign.shortPitch}</p>
                    </div>

                    {/* Budget allocation */}
                    <div className="space-y-3">
                      <h3 className="font-display font-bold text-white flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-amber-400" />
                        Budget Allocation
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {campaign.budgetAllocation.map((item) => (
                          <div key={item.category} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-white/80">{item.category}</span>
                              <span className="text-teal-400 font-mono font-bold">{item.percentage}%</span>
                            </div>
                            <div className="h-1.5 bg-[#0F1115] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-500/60 rounded-full"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-white/40 font-mono">${item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Risk disclaimer */}
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
                      <h3 className="font-display font-bold text-white text-sm mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Risk Disclaimer
                      </h3>
                      <p className="text-xs text-white/60 leading-relaxed">{campaign.riskDisclaimer}</p>
                    </div>
                  </div>

                  {/* Right column: tiers + action */}
                  <div className="lg:col-span-2 p-5 bg-[#0F1115]/50 space-y-6">
                    <div className="space-y-2">
                      <h3 className="font-display font-bold text-white flex items-center gap-2">
                        <Coins className="w-4 h-4 text-teal-400" />
                        Investment Tiers
                      </h3>
                      <p className="text-xs text-white/50">Select a tier to back this campaign. Rewards unlock when the venue completes the funding goal.</p>
                    </div>

                    <div className="space-y-3">
                      {campaign.tiers.map((tier) => {
                        const TierIcon = tierIcons[tier.name] || Award;
                        const isSelected = selectedTier?.name === tier.name;
                        return (
                          <button
                            key={tier.name}
                            onClick={() => {
                              setSelectedTier(tier);
                              setAcknowledged(false);
                            }}
                            className={`w-full text-left p-4 rounded-2xl border transition relative overflow-hidden ${
                              isSelected
                                ? 'bg-teal-500/10 border-teal-500/40'
                                : 'bg-[#161920] border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-teal-500/20 text-teal-400' : 'bg-white/5 text-white/50'}`}>
                                  <TierIcon className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className={`text-xs font-bold block ${isSelected ? 'text-teal-300' : 'text-white'}`}>{tier.name}</span>
                                  <span className="text-[10px] text-white/50">${tier.amount.toLocaleString()}</span>
                                </div>
                              </div>
                              {isSelected && <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />}
                            </div>
                            <div className="mt-2.5 space-y-0.5">
                              <p className="text-[11px] text-emerald-300 font-medium">{tier.bonus}</p>
                              <p className="text-[11px] text-white/60">{tier.reward}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Wallet summary */}
                    <div className="p-4 rounded-xl bg-[#161920] border border-white/10">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white/60 flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-teal-400" />
                          Your deposit balance
                        </span>
                        <span className="font-mono font-bold text-white">${user ? user.balance.toLocaleString() : '0'}</span>
                      </div>
                      {selectedTier && (
                        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5">
                          <span className="text-white/50">After backing</span>
                          <span className={`font-mono font-bold ${(user?.balance || 0) - selectedTier.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ${((user?.balance || 0) - selectedTier.amount).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Acknowledgment */}
                    <button
                      onClick={() => setAcknowledged(!acknowledged)}
                      className="flex items-start gap-2.5 text-left group"
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${acknowledged ? 'bg-teal-500 border-teal-500' : 'border-white/20 group-hover:border-white/40'}`}>
                        {acknowledged && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                      </div>
                      <span className="text-[11px] text-white/60 leading-relaxed">
                        I understand that crowdfunding investments are not guaranteed deposits, and that backing this campaign transfers funds into an OmniReserve escrow until the campaign completes or refunds are issued.
                      </span>
                    </button>

                    {/* Action */}
                    <button
                      onClick={handleBack}
                      disabled={!selectedTier || !canAfford || !acknowledged || campaign.status !== 'Active'}
                      className="w-full py-3.5 px-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                    >
                      {campaign.status !== 'Active' ? (
                        <span>Campaign {campaign.status}</span>
                      ) : !selectedTier ? (
                        <span>Select a Tier</span>
                      ) : !canAfford ? (
                        <span>Insufficient Balance</span>
                      ) : !acknowledged ? (
                        <span>Acknowledge Risk</span>
                      ) : (
                        <>
                          <span>Back This Campaign</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Escrow note */}
                    <div className="flex items-center gap-2 text-[10px] text-white/40">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Funds are held in escrow by OmniReserve until campaign completion or refund.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
