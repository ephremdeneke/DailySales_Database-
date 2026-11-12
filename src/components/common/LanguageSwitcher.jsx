import React from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const toggle = () => {
    const next = i18n.language === "en" ? "am" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
    document.documentElement.classList.toggle("font-ethiopic", next === "am");
  };
  return (
    <button onClick={toggle} className="btn-ghost flex items-center gap-1 text-sm">
      <Globe size={16} /> {i18n.language === "en" ? "አማርኛ" : "English"}
    </button>
  );
}
