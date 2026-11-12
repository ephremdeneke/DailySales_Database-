import React from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import StatCard from "../../components/common/StatCard.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import { Package, Truck, AlertTriangle } from "lucide-react";

export default function WhDashboard() {
  const { t } = useTranslation();
  const { data: stock, loading } = useFetch(() => api.getWarehouseStock());
  const { data: transfers } = useFetch(() => api.listTransfers());
  if (loading) return <LoadingSpinner />;
  const totalUnits = (stock || []).reduce((a, b) => a + b.quantity, 0);
  const pending = (transfers || []).filter((t) => t.status === "SENT").length;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("pages.dashboard")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Warehouse Units" value={totalUnits} icon={Package} color="indigo" />
        <StatCard title="Pending Transfers" value={pending} icon={Truck} color="amber" />
        <StatCard title="Products" value={(stock || []).length} icon={Package} color="slate" />
      </div>
    </div>
  );
}
