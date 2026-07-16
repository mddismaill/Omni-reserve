import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const LANGS = [
  { code: "en", label: "English", short: "EN", flag: "🇬🇧" },
  { code: "ru", label: "Русский", short: "RU", flag: "🇷🇺" },
  { code: "ar", label: "العربية", short: "AR", flag: "🇦🇪" },
  { code: "hy", label: "Հայերեն", short: "HY", flag: "🇦🇲" },
] as const;

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentCode = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
  const currentLang = LANGS.find((l) => l.code === currentCode) || LANGS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} id="language-switcher-dropdown">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition cursor-pointer select-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Globe className="w-4 h-4 text-teal-400" />
        <span className="text-xs font-semibold flex items-center gap-1.5 font-sans">
          <span>{currentLang.flag}</span>
          <span>{currentLang.short}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/55 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-40 bg-[#16191F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 py-1"
          >
            {LANGS.map((l) => {
              const active = currentCode === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    void i18n.changeLanguage(l.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition cursor-pointer hover:bg-white/5 text-left font-sans ${
                    active ? "bg-teal-500/10 text-teal-400 font-bold" : "text-white/70 hover:text-white"
                  }`}
                >
                  <span className="text-sm shrink-0">{l.flag}</span>
                  <span className="flex-1">{l.label}</span>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
