import React from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import StatCard from "../../components/common/StatCard.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import { Package, ShoppingCart, DollarSign } from "lucide-react";

export default function ShopDashboard() {
  const { t } = useTranslation();
  const { data: stock, loading: stockLoading } = useFetch(() => api.getShopStock());
  const { data: sales, loading: salesLoading } = useFetch(() => api.listSales());

  if (stockLoading || salesLoading) return <LoadingSpinner />;

  const totalStock = (stock || []).reduce((s, p) => s + (p.quantity || 0), 0);
  const totalSales = (sales || []).reduce((s, x) => s + (x.totalAmount || 0), 0);
  const recentSales = (sales || []).slice(-5).reverse();

  const columns = [
    { key: "saleId", label: t("common.id") },
    { key: "totalAmount", label: t("common.total"), render: (r) => ((r.totalAmount || 0) / 100).toFixed(2) },
    { key: "saleDate", label: t("common.date") },
    { key: "status", label: t("common.status") },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("nav.dashboard")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Shop Stock Units" value={totalStock} icon={Package} color="indigo" />
        <StatCard title="Total Sales" value={(totalSales / 100).toFixed(2)} icon={DollarSign} color="green" />
        <StatCard title="Products" value={(stock || []).length} icon={ShoppingCart} color="slate" />
      </div>
      <div className="card">
        <h3 className="font-semibold mb-3">Recent Sales</h3>
        <DataTable columns={columns} data={recentSales} />
      </div>
    </div>
  );
}