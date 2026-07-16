import React from "react";
import { Sun, Cloud, CloudRain, CloudLightning, Wind, Droplets, Sparkles, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

export type WeatherId = "sunny" | "cloudy" | "rainy" | "stormy";

export interface WeatherInfo {
  id: WeatherId;
  temp: number;
  wind: number;
  humidity: number;
  isTerraceOpen: boolean;
  alertLevel: "success" | "info" | "warning" | "error";
  bgGradient: string;
  iconColor: string;
}

export const weatherPresets: Record<WeatherId, WeatherInfo> = {
  sunny: {
    id: "sunny",
    temp: 27,
    wind: 3.2,
    humidity: 45,
    isTerraceOpen: true,
    alertLevel: "success",
    bgGradient: "from-amber-500/10 via-orange-500/5 to-transparent",
    iconColor: "text-amber-400",
  },
  cloudy: {
    id: "cloudy",
    temp: 21,
    wind: 4.8,
    humidity: 55,
    isTerraceOpen: true,
    alertLevel: "info",
    bgGradient: "from-sky-500/5 via-teal-500/5 to-transparent",
    iconColor: "text-teal-400",
  },
  rainy: {
    id: "rainy",
    temp: 18,
    wind: 6.5,
    humidity: 85,
    isTerraceOpen: true,
    alertLevel: "warning",
    bgGradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
    iconColor: "text-blue-400",
  },
  stormy: {
    id: "stormy",
    temp: 22,
    wind: 12.0,
    humidity: 90,
    isTerraceOpen: false,
    alertLevel: "error",
    bgGradient: "from-red-500/10 via-purple-500/5 to-transparent",
    iconColor: "text-red-400",
  },
};

interface WeatherWidgetProps {
  currentWeatherId: WeatherId;
  onWeatherChange: (id: WeatherId) => void;
}

export default function WeatherWidget({ currentWeatherId, onWeatherChange }: WeatherWidgetProps) {
  const { t } = useTranslation();
  const current = weatherPresets[currentWeatherId];

  const getWeatherIcon = (id: WeatherId, className: string) => {
    switch (id) {
      case "sunny":
        return <Sun className={`${className} animate-spin-slow`} />;
      case "cloudy":
        return <Cloud className={className} />;
      case "rainy":
        return <CloudRain className={className} />;
      case "stormy":
        return <CloudLightning className={className} />;
    }
  };

  const getAlertStyles = (level: string) => {
    switch (level) {
      case "success":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
      case "info":
        return "bg-teal-500/10 border-teal-500/20 text-teal-300";
      case "warning":
        return "bg-amber-500/10 border-amber-500/20 text-amber-300";
      case "error":
        return "bg-red-500/10 border-red-500/20 text-red-400";
      default:
        return "bg-white/5 border-white/10 text-white";
    }
  };

  return (
    <div className="relative overflow-hidden bg-[#16191F] border border-white/5 rounded-3xl p-6 shadow-2xl transition-all duration-500">
      <div className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-b ${current.bgGradient} rounded-full blur-3xl -z-10`} />

      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="space-y-4 flex-1 w-full">
          <div className="flex flex-wrap items-center justify-between lg:justify-start gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-widest font-mono block">
                {t("weather.sectionLabel")}
              </span>
              <h4 className="font-display font-black text-xl text-white tracking-tight flex items-center gap-2">
                <span>{t("weather.title")}</span>
                <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
              </h4>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0F1115] p-1 rounded-2xl border border-white/5">
              {(Object.keys(weatherPresets) as WeatherId[]).map((id) => {
                const isActive = id === currentWeatherId;
                return (
                  <button
                    key={id}
                    onClick={() => onWeatherChange(id)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                      isActive
                        ? "bg-teal-500 text-black font-black shadow-lg shadow-teal-500/20"
                        : "text-white/40 hover:text-white hover:bg-white/5"
                    }`}
                    title={t(`weather.condition.${id}`)}
                  >
                    {getWeatherIcon(id, "w-3 h-3")}
                    <span className="hidden sm:inline">{t(`weather.shortName.${id}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <motion.div
            key={currentWeatherId}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 border rounded-2xl text-xs leading-relaxed flex items-start gap-3 transition ${getAlertStyles(current.alertLevel)}`}
          >
            {current.alertLevel === "error" || current.alertLevel === "warning" ? (
              <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
            ) : (
              <CheckCircle className="w-5 h-5 shrink-0" />
            )}
            <div>
              <span className="font-extrabold uppercase tracking-wider text-[10px] block mb-1">
                {t(`weather.alertTitle.${current.alertLevel}`)}
              </span>
              <p>{t(`weather.recommendation.${currentWeatherId}`)}</p>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center gap-6 bg-[#0F1115] border border-white/5 p-5 rounded-2xl shrink-0 w-full lg:w-auto justify-around lg:justify-start">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full bg-white/[0.02] border border-white/5 ${current.iconColor}`}>
              {getWeatherIcon(currentWeatherId, "w-10 h-10")}
            </div>
            <div>
              <div className="flex items-start">
                <span className="text-4xl font-display font-black text-white leading-none tracking-tight">
                  {current.temp}
                </span>
                <span className="text-lg font-black text-teal-400 leading-none -mt-1">°C</span>
              </div>
              <span className="text-[10px] text-white/50 block font-bold uppercase tracking-wider mt-1.5">
                {t(`weather.condition.${currentWeatherId}`)}
              </span>
            </div>
          </div>

          <div className="h-10 w-px bg-white/10" />

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Wind className="w-4 h-4 text-teal-400/80" />
              <div>
                <span className="text-white/40 text-[10px] uppercase block leading-none">{t("weather.wind")}</span>
                <span className="text-white font-mono font-bold">
                  {current.wind} {t("weather.windUnit")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Droplets className="w-4 h-4 text-teal-400/80" />
              <div>
                <span className="text-white/40 text-[10px] uppercase block leading-none font-bold">
                  {t("weather.humidity")}
                </span>
                <span className="text-white font-mono font-bold">{current.humidity}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
