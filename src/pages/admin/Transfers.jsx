import React from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import DataTable from "../../components/common/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

export default function Transfers() {
  const { t } = useTranslation();
  const { data, loading } = useFetch(() => api.listTransfers());
  if (loading) return <LoadingSpinner />;
  const columns = [
    { key: "transferId", label: t("common.id") },
    { key: "toShopId", label: "To Shop" },
    { key: "status", label: t("common.status"), render: (r) => <StatusBadge status={r.status} /> },
    { key: "createdAt", label: t("common.date"), render: (r) => new Date(r.createdAt).toLocaleString() },
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.transfers")}</h2>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
