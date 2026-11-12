import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import DataTable from "../../components/common/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Modal from "../../components/common/Modal.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

export default function Discrepancies() {
  const { t } = useTranslation();
  const { data, loading, reload } = useFetch(() => api.listDiscrepancies());
  const [open, setOpen] = useState(null);
  const [res, setRes] = useState("");

  const resolve = async () => {
    await api.resolveDiscrepancy({ discrepancyId: open.discrepancyId, resolution: res });
    setOpen(null); setRes(""); reload();
  };

  if (loading) return <LoadingSpinner />;
  const columns = [
    { key: "discrepancyId", label: t("common.id") },
    { key: "type", label: "Type" },
    { key: "shopId", label: "Shop" },
    { key: "difference", label: "Difference", render: (r) => (r.difference / 100).toFixed(2) },
    { key: "status", label: t("common.status"), render: (r) => <StatusBadge status={r.status === "OPEN" ? "OPEN" : "RESOLVED"} /> },
    { key: "actions", label: t("common.actions"), render: (r) => r.status === "OPEN" ? <button onClick={() => setOpen(r)} className="btn-secondary text-xs">Resolve</button> : null },
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.discrepancies")}</h2>
      <DataTable columns={columns} data={data} />
      <Modal open={!!open} onClose={() => setOpen(null)} title="Resolve Discrepancy">
        <textarea className="input" rows={3} value={res} onChange={(e) => setRes(e.target.value)} placeholder="Resolution notes" />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setOpen(null)} className="btn-secondary">{t("common.cancel")}</button>
          <button onClick={resolve} className="btn-primary">{t("common.confirm")}</button>
        </div>
      </Modal>
    </div>
  );
}
