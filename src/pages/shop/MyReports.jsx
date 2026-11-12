import React from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import DataTable from "../../components/common/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

export default function MyReports() {
  const { t } = useTranslation();
  const { data, loading } = useFetch(() => api.listDailyReports());
  if (loading) return <LoadingSpinner />;
  const columns = [
    { key: "businessDate", label: t("common.date") },
    { key: "totalSales", label: "Total Sales", render: (r) => (r.totalSales / 100).toFixed(2) },
    { key: "status", label: t("common.status"), render: (r) => <StatusBadge status={r.status} /> },
    { key: "reviewComment", label: "Comment" },
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.myReports")}</h2>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
