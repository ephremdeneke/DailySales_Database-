import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import DataTable from "../../components/common/DataTable.jsx";
import Modal from "../../components/common/Modal.jsx";
import FormInput from "../../components/common/FormInput.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import { Plus, Pencil } from "lucide-react";

const empty = { productName: "", productNameAm: "", sellingPrice: "", quantity: "" };

export default function Products() {
  const { t } = useTranslation();
  const { data: products, loading: lp, reload } = useFetch(() => api.listProducts());
  const { data: wstock, reload: reloadStock } = useFetch(() => api.getWarehouseStock());
  const loading = lp;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const openAdd = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ productName: p.productName, productNameAm: p.productNameAm || "", sellingPrice: (p.sellingPrice / 100).toString() });
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload = { productName: form.productName, productNameAm: form.productNameAm, sellingPrice: Math.round((parseFloat(form.sellingPrice) || 0) * 100) };
      if (!editing) payload.quantity = parseInt(form.quantity, 10) || 0;
      if (editing) await api.updateProduct({ productId: editing.productId, ...payload });
      else await api.createProduct(payload);
      setOpen(false); reload(); reloadStock();
    } catch (err) {
      alert(err.message || "Failed to save product");
    }
  };

  const stockMap = {};
  (wstock || []).forEach((s) => { stockMap[s.productId] = s.quantity; });
  const data = (products || []).map((p) => ({ ...p, quantity: stockMap[p.productId] ?? 0 }));

  if (loading) return <LoadingSpinner />;

  const columns = [
    { key: "productName", label: t("common.name") },
    { key: "productNameAm", label: "Name (AM)" },
    { key: "sellingPrice", label: t("common.price"), render: (r) => (r.sellingPrice / 100).toFixed(2) },
    { key: "quantity", label: "Warehouse Qty" },
    { key: "createdAt", label: "Add Date", render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-" },
    { key: "actions", label: t("common.actions"), render: (r) => (
      <button onClick={() => openEdit(r)} className="btn-secondary text-xs flex items-center gap-1"><Pencil size={14} /> Edit</button>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{t("nav.products")}</h2>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> {t("common.add")}</button>
      </div>
      <DataTable columns={columns} data={data} />
      <Modal open={open} onClose={() => setOpen(false)} title={(editing ? "Edit" : t("common.add")) + " " + t("nav.products")}>
        <FormInput label={t("common.name")} value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
        <FormInput label="Name (Amharic)" value={form.productNameAm} onChange={(e) => setForm({ ...form, productNameAm: e.target.value })} />
        <FormInput label={t("common.price")} type="number" step="0.01" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
        {!editing && (
          <FormInput label="Initial Warehouse Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        )}
        <p className="text-xs text-slate-400">Add date is recorded automatically.</p>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setOpen(false)} className="btn-secondary">{t("common.cancel")}</button>
          <button onClick={save} className="btn-primary">{t("common.save")}</button>
        </div>
      </Modal>
    </div>
  );
}
