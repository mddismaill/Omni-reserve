import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  Filter,
  Clock,
  Target,
  Building2,
  Utensils,
  Sparkles,
  Bath,
  Hotel,
  Star,
  ArrowRight,
  Landmark,
  Gem,
  Crown,
  Award,
  ChevronRight
} from 'lucide-react';
import { CrowdfundingCampaign, User, CampaignCategory } from '../types';
import InvestCampaignModal from './InvestCampaignModal';

type FilterTab = 'All Projects' | CampaignCategory;

interface InvestAndBackProps {
  user: User | null;
  campaigns: CrowdfundingCampaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<CrowdfundingCampaign[]>>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const categoryIcons: Record<CampaignCategory, React.ElementType> = {
  Dining: Utensils,
  'Spa & Wellness': Bath,
  'Hotel Expansion': Hotel,
  Featured: Star
};

const tierIcons: Record<string, React.ElementType> = {
  Bronze: Award,
  Gold: Gem,
  Platinum: Crown,
  'Platinum Partner': Crown
};

export default function InvestAndBack({ user, campaigns, setCampaigns, setUser }: InvestAndBackProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All Projects');
  const [selectedCampaign, setSelectedCampaign] = useState<CrowdfundingCampaign | null>(null);

  const filteredCampaigns = useMemo(() => {
    if (activeFilter === 'All Projects') return campaigns;
    return campaigns.filter((c) => c.category === activeFilter || (activeFilter === 'Featured' && c.category === 'Featured'));
  }, [campaigns, activeFilter]);

  const handleBackCampaign = (campaignId: string, tierName: string, amount: number) => {
    if (!user) return;

    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? { ...c, raisedAmount: c.raisedAmount + amount, backers: c.backers + 1, escrowDeposited: (c.escrowDeposited || 0) + amount }
          : c
      )
    );

    setUser((prev) => (prev ? { ...prev, balance: prev.balance - amount } : prev));
  };

  const filters: FilterTab[] = ['All Projects', 'Dining', 'Spa & Wellness', 'Hotel Expansion', 'Featured'];

  return (
    <div className="space-y-8" id="invest-and-back-module">
      {/* Header */}
      <div className="bg-[#161920] border border-white/10 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-teal-500/10 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
            Invest & Back
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white flex items-center gap-3">
            Crowdfunding Venue Expansion
            <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              {campaigns.filter((c) => c.status === 'Active').length} Active
            </span>
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            Back your favorite venues and unlock premium rewards. Funds are held in escrow until venues reach their funding goals and deliver on their expansion promises.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mt-8 overflow-x-auto no-scrollbar border-t border-white/10 pt-6">
          <div className="flex items-center gap-2 text-white/50 mr-2 shrink-0">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Filter</span>
          </div>
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            const CategoryIcon = filter === 'All Projects' ? Sparkles : categoryIcons[filter as CampaignCategory] || Building2;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/20'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <CategoryIcon className="w-4 h-4" />
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Campaign Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredCampaigns.map((campaign) => {
            const percentage = Math.min(100, Math.round((campaign.raisedAmount / campaign.fundingGoal) * 100));
            const CategoryIcon = categoryIcons[campaign.category] || Building2;
            const statusColor =
              campaign.status === 'Active'
                ? 'emerald'
                : campaign.status === 'Pending'
                ? 'amber'
                : campaign.status === 'Paused'
                ? 'amber'
                : 'red';

            return (
              <motion.div
                key={campaign.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#161920] border border-white/10 rounded-3xl overflow-hidden shadow-xl hover:border-white/20 transition group"
              >
                {/* Card image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={campaign.images[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'}
                    alt={campaign.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#161920] via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full bg-${statusColor}-500/20 border border-${statusColor}-500/30 text-${statusColor}-300 text-[10px] font-mono font-bold uppercase`}>
                      {campaign.status}
                    </span>
                    {campaign.category === 'Featured' && (
                      <span className="px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1">
                        <Star className="w-3 h-3" /> Featured
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-display font-bold text-white text-base leading-tight">{campaign.title}</h3>
                    <p className="text-[11px] text-white/60 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" /> {campaign.venueName}
                    </p>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 space-y-4">
                  {/* Tags */}
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CategoryIcon className="w-3 h-3" /> {campaign.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[10px] font-mono font-bold">
                      {campaign.venueTag}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-teal-400" /> Goal
                      </span>
                      <span className="font-mono font-bold text-white">${campaign.fundingGoal.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-[#0F1115] rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-emerald-400">{percentage}% raised</span>
                      <span className="text-white/50">${campaign.raisedAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-white/50">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{campaign.daysRemaining} days left</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/50">
                      <Landmark className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{campaign.backers} backers</span>
                    </div>
                  </div>

                  {/* Tiers preview */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {campaign.tiers.slice(0, 3).map((tier) => {
                      const TierIcon = tierIcons[tier.name] || Award;
                      return (
                        <div
                          key={tier.name}
                          className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5 text-[10px] text-white/70"
                        >
                          <TierIcon className="w-3 h-3 text-teal-400" />
                          <span className="font-mono font-bold">${tier.amount}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => setSelectedCampaign(campaign)}
                    disabled={campaign.status !== 'Active'}
                    className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10"
                  >
                    {campaign.status === 'Active' ? (
                      <>
                        <span>Invest & Back</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      <span>Campaign {campaign.status}</span>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredCampaigns.length === 0 && (
        <div className="text-center py-16 bg-[#161920] border border-white/10 rounded-3xl">
          <TrendingUp className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/50">No campaigns match this filter.</p>
        </div>
      )}

      <InvestCampaignModal
        campaign={selectedCampaign}
        isOpen={!!selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        user={user}
        onBackCampaign={handleBackCampaign}
      />
    </div>
  );
}
