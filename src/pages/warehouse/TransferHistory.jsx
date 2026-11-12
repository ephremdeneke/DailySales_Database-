import React from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import DataTable from "../../components/common/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

export default function TransferHistory() {
  const { t } = useTranslation();
  const { data, loading, reload } = useFetch(() => api.listTransfers());
  if (loading) return <LoadingSpinner />;
  const confirm = async (id) => { await api.confirmTransfer({ transferId: id }); reload(); };
  const columns = [
    { key: "transferId", label: t("common.id") },
    { key: "toShopId", label: "To Shop" },
    { key: "status", label: t("common.status"), render: (r) => <StatusBadge status={r.status} /> },
    { key: "createdAt", label: t("common.date"), render: (r) => new Date(r.createdAt).toLocaleString() },
    { key: "actions", label: t("common.actions"), render: (r) => r.status === "SENT" ? <button onClick={() => confirm(r.transferId)} className="btn-primary text-xs">Confirm Receipt</button> : null },
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.transferHistory")}</h2>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
