import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext.jsx";
import { Menu, LogOut, User } from "lucide-react";
import LanguageSwitcher from "../common/LanguageSwitcher.jsx";

export default function Header({ onMenu }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-3">
        <button className="md:hidden" onClick={onMenu}><Menu size={22} /></button>
        <h1 className="text-base sm:text-lg font-semibold text-slate-800 truncate">{t("app.name")}</h1>
      </div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
          <User size={16} /> {user?.name}
        </div>
        <button onClick={logout} className="btn-ghost flex items-center gap-1 text-sm">
          <LogOut size={16} /> {t("nav.logout")}
        </button>
      </div>
    </header>
  );
}
