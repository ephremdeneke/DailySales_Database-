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

export default function Users() {
  const { t } = useTranslation();
  const { data, loading, reload } = useFetch(() => api.listUsers());
  const { data: shops } = useFetch(() => api.listShops());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "SHOP_MANAGER", shopId: "" });

  const save = async () => {
    await api.createUser({ ...form, shopId: form.shopId || null });
    setOpen(false); reload();
  };

  if (loading) return <LoadingSpinner />;

  const columns = [
    { key: "name", label: t("common.name") },
    { key: "email", label: t("auth.email") },
    { key: "role", label: t("auth.role"), render: (r) => t(`roles.${r.role}`) },
    { key: "active", label: t("common.status"), render: (r) => <StatusBadge status={r.active ? "ACTIVE" : "INACTIVE"} /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{t("nav.users")}</h2>
        <button onClick={() => setOpen(true)} className="btn-primary"><Plus size={16} /> {t("common.add")}</button>
      </div>
      <DataTable columns={columns} data={data} />
      <Modal open={open} onClose={() => setOpen(false)} title={t("common.add") + " " + t("nav.users")}>
        <FormInput label={t("common.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <FormInput label={t("auth.email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <div className="mb-3">
          <label className="label">{t("auth.role")}</label>
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="ADMIN">Admin</option>
            <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
            <option value="SHOP_MANAGER">Shop Manager</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="label">Shop</label>
          <select className="input" value={form.shopId} onChange={(e) => setForm({ ...form, shopId: e.target.value })}>
            <option value="">--</option>
            {(shops || []).map((s) => <option key={s.shopId} value={s.shopId}>{s.shopName}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setOpen(false)} className="btn-secondary">{t("common.cancel")}</button>
          <button onClick={save} className="btn-primary">{t("common.save")}</button>
        </div>
      </Modal>
    </div>
  );
}
