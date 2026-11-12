import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import FormInput from "../../components/common/FormInput.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

export default function CreateTransfers() {
  const { t } = useTranslation();
  const { data: products } = useFetch(() => api.listProducts());
  const { data: shops } = useFetch(() => api.listShops());
  const [toShopId, setToShopId] = useState("");
  const [items, setItems] = useState([{ productId: "", quantity: "" }]);
  const [msg, setMsg] = useState("");

  const addItem = () => setItems([...items, { productId: "", quantity: "" }]);
  const updateItem = (i, f, v) => { const c = [...items]; c[i][f] = v; setItems(c); };
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { toShopId, items: items.map((it) => ({ productId: it.productId, quantity: parseInt(it.quantity, 10) })) };
      await api.createTransfer(payload);
      setMsg("Transfer sent"); setItems([{ productId: "", quantity: "" }]);
    } catch (err) { setMsg(err.message); }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.createTransfers")}</h2>
      <form onSubmit={submit} className="card max-w-2xl space-y-3">
        <div>
          <label className="label">To Shop</label>
          <select className="input" value={toShopId} onChange={(e) => setToShopId(e.target.value)}>
            <option value="">--</option>
            {(shops || []).map((s) => <option key={s.shopId} value={s.shopId}>{s.shopName}</option>)}
          </select>
        </div>
        {items.map((it, i) => (
          <div key={i} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="label">Product</label>
              <select className="input" value={it.productId} onChange={(e) => updateItem(i, "productId", e.target.value)}>
                <option value="">--</option>
                {(products || []).map((p) => <option key={p.productId} value={p.productId}>{p.productName}</option>)}
              </select>
            </div>
            <FormInput label={t("common.quantity")} type="number" value={it.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} />
            <button type="button" onClick={() => removeItem(i)} className="btn-secondary mb-3">X</button>
          </div>
        ))}
        <button type="button" onClick={addItem} className="btn-secondary">{t("common.add")}</button>
        {msg && <p className="text-sm text-green-600">{msg}</p>}
        <div><button type="submit" className="btn-primary">{t("common.submit")}</button></div>
      </form>
    </div>
  );
}
