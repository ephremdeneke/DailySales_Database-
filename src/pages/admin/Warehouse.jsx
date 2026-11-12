import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import DataTable from "../../components/common/DataTable.jsx";
import Modal from "../../components/common/Modal.jsx";
import FormInput from "../../components/common/FormInput.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import { Pencil } from "lucide-react";

export default function Warehouse() {
  const { t } = useTranslation();
  const { data, loading, reload } = useFetch(() => api.getWarehouseStock());
  const [edit, setEdit] = useState(null);
  const [qty, setQty] = useState("");

  const openEdit = (p) => { setEdit(p); setQty(String(p.quantity)); };
  const save = async () => {
    try {
      await api.setWarehouseStock({ productId: edit.productId, quantity: parseInt(qty, 10) });
      setEdit(null); reload();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <LoadingSpinner />;
  const columns = [
    { key: "productName", label: t("common.name") },
    { key: "sku", label: "SKU" },
    { key: "quantity", label: t("common.quantity") },
    { key: "sellingPrice", label: t("common.price"), render: (r) => (r.sellingPrice / 100).toFixed(2) },
    { key: "actions", label: t("common.actions"), render: (r) => (
      <button onClick={() => openEdit(r)} className="btn-secondary text-xs flex items-center gap-1"><Pencil size={14} /> Adjust</button>
    )},
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.warehouse")}</h2>
      <DataTable columns={columns} data={data} />
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Adjust Warehouse Stock">
        {edit && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">{edit.productName}</p>
            <FormInput label={t("common.quantity")} type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEdit(null)} className="btn-secondary">{t("common.cancel")}</button>
              <button onClick={save} className="btn-primary">{t("common.save")}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
