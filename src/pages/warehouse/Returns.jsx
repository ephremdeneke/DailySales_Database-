import React from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import DataTable from "../../components/common/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

export default function WhReturns() {
  const { t } = useTranslation();
  const { data, loading, reload } = useFetch(() => api.listReturns());
  if (loading) return <LoadingSpinner />;
  const confirm = async (id) => { await api.confirmReturn({ returnId: id }); reload(); };
  const columns = [
    { key: "returnId", label: t("common.id") },
    { key: "shopId", label: "Shop" },
    { key: "status", label: t("common.status"), render: (r) => <StatusBadge status={r.status === "PENDING" ? "PENDING" : "APPROVED"} /> },
    { key: "reason", label: t("common.reason") },
    { key: "createdAt", label: t("common.date"), render: (r) => new Date(r.createdAt).toLocaleString() },
    { key: "actions", label: t("common.actions"), render: (r) => r.status === "PENDING" ? <button onClick={() => confirm(r.returnId)} className="btn-primary text-xs">Confirm Receipt</button> : null },
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.productReturns")}</h2>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
