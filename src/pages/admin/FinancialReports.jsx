import React from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import DataTable from "../../components/common/DataTable.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

export default function FinancialReports() {
  const { t } = useTranslation();
  const { data, loading } = useFetch(() => api.listDailyReports());
  if (loading) return <LoadingSpinner />;
  const columns = [
    { key: "businessDate", label: t("common.date") },
    { key: "shopId", label: "Shop" },
    { key: "totalSales", label: "Total Sales", render: (r) => (r.totalSales / 100).toFixed(2) },
    { key: "reportedRevenue", label: "Reported Rev", render: (r) => ((r.reportedRevenue || r.totalSales) / 100).toFixed(2) },
    { key: "revenueDiff", label: "Rev Diff", render: (r) => ((r.revenueDiff || 0) / 100).toFixed(2) },
    { key: "totalCollected", label: "Collected", render: (r) => (r.totalCollected / 100).toFixed(2) },
    { key: "totalDiff", label: "Diff", render: (r) => (r.totalDiff / 100).toFixed(2) },
    { key: "status", label: t("common.status") },
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.financialReports")}</h2>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
