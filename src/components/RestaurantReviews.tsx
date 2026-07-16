import React, { useState, useEffect } from "react";
import { Star, MessageSquare, Send, Calendar, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Review, Restaurant, User as UserType } from "../types";
import { useTranslation } from "react-i18next";

interface RestaurantReviewsProps {
  restaurant: Restaurant;
  user: UserType | null;
  onRatingUpdated: (newRating: number) => void;
}

export default function RestaurantReviews({ restaurant, user, onRatingUpdated }: RestaurantReviewsProps) {
  const { t, i18n } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    fetch(`/api/restaurants/${restaurant.id}/reviews`)
      .then((res) => {
        if (!res.ok) throw new Error(t("reviews.errorLoad"));
        return res.json();
      })
      .then((data) => {
        setReviews(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [restaurant.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!user) {
      setErrorMsg(t("reviews.loginRequired"));
      return;
    }

    if (!text.trim()) {
      setErrorMsg(t("reviews.writeText"));
      return;
    }

    setSubmitLoading(true);

    fetch(`/api/restaurants/${restaurant.id}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        rating,
        text: text.trim(),
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(t("reviews.errorSendGeneric"));
        return res.json();
      })
      .then((data) => {
        setReviews((prev) => [data.review, ...prev]);
        onRatingUpdated(data.updatedRating);
        setText("");
        setRating(5);
        setSuccessMsg(t("reviews.success"));
        setSubmitLoading(false);
        // Clear success message after 4 seconds
        setTimeout(() => setSuccessMsg(""), 4000);
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(t("reviews.errorSend"));
        setSubmitLoading(false);
      });
  };

  // Helper to format date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(i18n.language, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Calculate rating distribution
  const totalCount = reviews.length;
  const distribution = [0, 0, 0, 0, 0]; // 1 to 5 stars
  reviews.forEach((r) => {
    const starIdx = Math.max(1, Math.min(5, Math.round(r.rating))) - 1;
    distribution[starIdx]++;
  });

  return (
    <div className="space-y-8 bg-[#16191F] rounded-3xl p-6 sm:p-8 border border-white/5 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -z-10" />
      
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-400" />
            <span>{t("reviews.title")}</span>
          </h3>
          <p className="text-xs text-white/60 mt-1">
            {t("reviews.description", { name: restaurant.name })}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#0F1115] p-4 rounded-2xl border border-white/5 self-start md:self-auto">
          <div className="text-center pr-4 border-r border-white/10">
            <span className="text-3xl font-black text-white font-display block leading-none">
              {restaurant.rating}
            </span>
            <span className="text-[10px] text-white/40 block mt-1 uppercase font-mono font-bold">{t("reviews.ratingLabel")}</span>
          </div>
          <div>
            <div className="flex gap-0.5 mb-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3.5 h-3.5 ${i < Math.round(restaurant.rating) ? 'fill-amber-400' : 'text-white/10'}`} 
                />
              ))}
            </div>
            <span className="text-xs text-white/60">
              {t("reviews.countReviews", { count: totalCount })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Star distribution & Submission Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Rating distribution bar chart */}
          <div className="bg-[#0F1115]/50 border border-white/5 p-4 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-white/70 block uppercase tracking-wide">{t("reviews.distribution")}</span>
            <div className="space-y-1.5 pt-1">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = distribution[stars - 1];
                const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <span className="w-3 text-white/60 text-right font-mono font-semibold">{stars}</span>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${percentage}%` }}
                        className="h-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-500 rounded-full"
                      />
                    </div>
                    <span className="w-8 text-white/40 text-right font-mono">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form container */}
          <div className="bg-[#0F1115] border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <span className="text-sm font-bold text-white">{t("reviews.leaveReview")}</span>
            </div>

            {user ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rating selection stars */}
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1.5">{t("reviews.yourRating")}</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const isHighlighted = hoverRating !== null ? starValue <= hoverRating : starValue <= rating;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          onClick={() => setRating(starValue)}
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-1 -m-1 focus:outline-none transition duration-150 transform hover:scale-110"
                        >
                          <Star 
                            className={`w-6 h-6 transition-all ${
                              isHighlighted 
                                ? 'text-amber-400 fill-amber-400' 
                                : 'text-white/10'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Text comment field */}
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1.5">{t("reviews.reviewText")}</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t("reviews.textPlaceholder")}
                    rows={4}
                    className="w-full p-3 bg-[#16191F] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500 transition focus:ring-1 focus:ring-teal-500/20"
                  />
                </div>

                {errorMsg && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs text-teal-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-teal-500/10 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitLoading ? t("reviews.submitting") : t("reviews.submit")}
                </button>
              </form>
            ) : (
              <div className="p-4 bg-white/[0.01] border border-dashed border-white/10 rounded-xl text-center space-y-2">
                <p className="text-xs text-white/50 leading-relaxed">
                  {t("reviews.loginPrompt")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: List of reviews */}
        <div className="lg:col-span-7">
          <div className="space-y-4">
            <span className="text-xs font-bold text-white/70 block uppercase tracking-wide">{t("reviews.latest")}</span>

            {loading ? (
              <div className="py-12 text-center text-xs text-white/40 space-y-2">
                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>{t("reviews.loadingReviews")}</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-12 border border-dashed border-white/5 rounded-2xl text-center text-xs text-white/40">
                <p>{t("reviews.empty")}</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {reviews.map((review) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-[#0F1115]/60 border border-white/5 rounded-2xl space-y-3 hover:border-white/10 transition duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={review.userAvatar}
                            alt={review.userName}
                            className="w-10 h-10 rounded-full object-cover border border-white/10 bg-white/5"
                            onError={(e) => {
                              // Fallback if image fails to load
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150";
                            }}
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-white block leading-tight">{review.userName}</span>
                              {review.isVerified && (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                  {t("reviews.verifiedClient")}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-0.5 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400' : 'text-white/10'}`} 
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-white/80 leading-relaxed pl-1">
                        {review.text}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
