import React from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import DataTable from "../../components/common/DataTable.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

export default function StockMovements() {
  const { t } = useTranslation();
  const { data, loading } = useFetch(() => api.stockMovements());
  if (loading) return <LoadingSpinner />;
  const columns = [
    { key: "movementId", label: t("common.id") },
    { key: "type", label: "Type" },
    { key: "createdAt", label: t("common.date"), render: (r) => new Date(r.createdAt).toLocaleString() },
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.stockMovements")}</h2>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
