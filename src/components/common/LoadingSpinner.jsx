import React from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ label }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
      <Loader2 className="animate-spin mb-2" size={28} />
      <span className="text-sm">{label || t("common.loading")}</span>
    </div>
  );
}
