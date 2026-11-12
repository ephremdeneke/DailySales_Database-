import React from "react";

export default function StatCard({ title, value, icon: Icon, color = "indigo", subtitle }) {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
    slate: "bg-slate-50 text-slate-600",
  };
  return (
    <div className="card flex items-center gap-4">
      {Icon && (
        <div className={`rounded-lg p-3 ${colorMap[color] || colorMap.indigo}`}>
          <Icon size={22} />
        </div>
      )}
      <div className="flex-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 break-words">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
