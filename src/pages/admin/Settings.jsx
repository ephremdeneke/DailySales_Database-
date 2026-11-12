import React from "react";
import { useTranslation } from "react-i18next";

export default function Settings() {
  const { t } = useTranslation();
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.settings")}</h2>
      <div className="card">
        <p className="text-sm text-slate-600">Application settings and configuration.</p>
      </div>
    </div>
  );
}
