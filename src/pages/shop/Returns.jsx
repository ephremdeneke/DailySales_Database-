import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import FormInput from "../../components/common/FormInput.jsx";

export default function ShopReturns() {
  const { t } = useTranslation();
  const { data: stock } = useFetch(() => api.getShopStock());
  const [items, setItems] = useState([{ productId: "", quantity: "" }]);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");

  const addItem = () => setItems([...items, { productId: "", quantity: "" }]);
  const update = (i, f, v) => { const c = [...items]; c[i][f] = v; setItems(c); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.createReturn({ items: items.map((it) => ({ productId: it.productId, quantity: parseInt(it.quantity, 10) })), reason });
      setMsg("Return submitted"); setItems([{ productId: "", quantity: "" }]);
    } catch (err) { setMsg(err.message); }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.productReturns")}</h2>
      <form onSubmit={submit} className="card max-w-2xl space-y-3">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="label">Product</label>
              <select className="input" value={it.productId} onChange={(e) => update(i, "productId", e.target.value)}>
                <option value="">--</option>
                {(stock || []).map((p) => <option key={p.productId} value={p.productId}>{p.productName} (stock {p.quantity})</option>)}
              </select>
            </div>
            <FormInput label={t("common.quantity")} type="number" value={it.quantity} onChange={(e) => update(i, "quantity", e.target.value)} />
          </div>
        ))}
        <button type="button" onClick={addItem} className="btn-secondary">{t("common.add")}</button>
        <FormInput label={t("common.reason")} value={reason} onChange={(e) => setReason(e.target.value)} />
        {msg && <p className="text-sm text-green-600">{msg}</p>}
        <button type="submit" className="btn-primary">{t("common.submit")}</button>
      </form>
    </div>
  );
}
