import React from "react";
import { useTranslation } from "react-i18next";

const colors = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  RESUBMITTED: "bg-blue-100 text-blue-800",
  SENT: "bg-indigo-100 text-indigo-800",
  RECEIVED: "bg-green-100 text-green-800",
  CONFIRMED: "bg-green-100 text-green-800",
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-slate-100 text-slate-600",
  OPEN: "bg-red-100 text-red-800",
  RESOLVED: "bg-green-100 text-green-800",
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const cls = colors[status] || "bg-slate-100 text-slate-700";
  const label = t(`status.${status}`, { defaultValue: status });
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}
