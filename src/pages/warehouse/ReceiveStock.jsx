import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import FormInput from "../../components/common/FormInput.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

export default function ReceiveStock() {
  const { t } = useTranslation();
  const { data: products, loading } = useFetch(() => api.listProducts());
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.receiveStock({ productId, quantity: parseInt(quantity, 10) });
      setMsg("Received"); setQuantity("");
    } catch (err) { setMsg(err.message); }
  };

  if (loading) return <LoadingSpinner />;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.receiveStock")}</h2>
      <form onSubmit={submit} className="card max-w-md space-y-3">
        <div>
          <label className="label">Product</label>
          <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">--</option>
            {(products || []).map((p) => <option key={p.productId} value={p.productId}>{p.productName}</option>)}
          </select>
        </div>
        <FormInput label={t("common.quantity")} type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        {msg && <p className="text-sm text-green-600">{msg}</p>}
        <button type="submit" className="btn-primary">{t("common.submit")}</button>
      </form>
    </div>
  );
}
