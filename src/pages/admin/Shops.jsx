import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import DataTable from "../../components/common/DataTable.jsx";
import Modal from "../../components/common/Modal.jsx";
import FormInput from "../../components/common/FormInput.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import { Plus } from "lucide-react";

export default function Shops() {
  const { t } = useTranslation();
  const { data, loading, reload } = useFetch(() => api.listShops());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ shopName: "", location: "" });

  const save = async () => {
    await api.createShop(form);
    setOpen(false); setForm({ shopName: "", location: "" }); reload();
  };

  if (loading) return <LoadingSpinner />;

  const columns = [
    { key: "shopId", label: t("common.id") },
    { key: "shopName", label: t("common.name") },
    { key: "location", label: "Location" },
    { key: "active", label: t("common.status"), render: (r) => <StatusBadge status={r.active ? "ACTIVE" : "INACTIVE"} /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{t("nav.shops")}</h2>
        <button onClick={() => setOpen(true)} className="btn-primary"><Plus size={16} /> {t("common.add")}</button>
      </div>
      <DataTable columns={columns} data={data} />
      <Modal open={open} onClose={() => setOpen(false)} title={t("common.add") + " " + t("nav.shops")}>
        <FormInput label={t("common.name")} value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} />
        <FormInput label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setOpen(false)} className="btn-secondary">{t("common.cancel")}</button>
          <button onClick={save} className="btn-primary">{t("common.save")}</button>
        </div>
      </Modal>
    </div>
  );
}
