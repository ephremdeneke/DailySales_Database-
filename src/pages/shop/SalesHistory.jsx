import React from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import DataTable from "../../components/common/DataTable.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

export default function SalesHistory() {
  const { t } = useTranslation();
  const { data, loading } = useFetch(() => api.listSales());
  if (loading) return <LoadingSpinner />;
  const columns = [
    { key: "saleId", label: t("common.id") },
    { key: "totalAmount", label: t("common.total"), render: (r) => (r.totalAmount / 100).toFixed(2) },
    { key: "saleDate", label: t("common.date") },
    { key: "status", label: t("common.status") },
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.salesHistory")}</h2>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
