import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import FormInput from "../../components/common/FormInput.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

export default function NewSale() {
  const { t } = useTranslation();
  const { data: stock, loading } = useFetch(() => api.getShopStock());
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState("CASH");
  const [cashAmt, setCashAmt] = useState("");
  const [bankAmt, setBankAmt] = useState("");
  const [ref, setRef] = useState("");
  const [msg, setMsg] = useState("");

  if (loading) return <LoadingSpinner />;

  const product = (stock || []).find((p) => p.productId === productId);
  const lineTotal = product ? product.sellingPrice * (parseInt(quantity, 10) || 0) : 0;

  const submit = async (e) => {
    e.preventDefault();
    try {
      const q = parseInt(quantity, 10);
      const pays = [];
      if (method === "CASH") pays.push({ method: "CASH", amount: lineTotal, reference: "" });
      else if (method === "BANK") pays.push({ method: "BANK", amount: lineTotal, reference: ref });
      else pays.push({ method: "SPLIT", amount: lineTotal, reference: ref });
      await api.createSale({
        items: [{ productId, quantity: q, unitPrice: product.sellingPrice }],
        payments: pays,
      });
      setMsg("Sale recorded");
      setQuantity(1); setProductId("");
    } catch (err) { setMsg(err.message); }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.newSale")}</h2>
      <form onSubmit={submit} className="card max-w-md space-y-3">
        <div>
          <label className="label">Product</label>
          <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">--</option>
            {(stock || []).map((p) => <option key={p.productId} value={p.productId}>{p.productName} (stock {p.quantity})</option>)}
          </select>
        </div>
        <FormInput label={t("common.quantity")} type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        {product && (
          <div className="text-sm text-slate-600">
            Price: {(product.sellingPrice / 100).toFixed(2)} | Line total: {(lineTotal / 100).toFixed(2)}
          </div>
        )}
        <div>
          <label className="label">Payment Method</label>
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
            <option value="SPLIT">Split</option>
          </select>
        </div>
        {(method === "BANK" || method === "SPLIT") && (
          <FormInput label="Reference" value={ref} onChange={(e) => setRef(e.target.value)} />
        )}
        {msg && <p className="text-sm text-green-600">{msg}</p>}
        <button type="submit" className="btn-primary">{t("common.submit")}</button>
      </form>
    </div>
  );
}
