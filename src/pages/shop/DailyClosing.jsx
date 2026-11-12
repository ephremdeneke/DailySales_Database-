import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import FormInput from "../../components/common/FormInput.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import { Calculator } from "lucide-react";

export default function DailyClosing() {
  const { t } = useTranslation();
  const { data: stock, loading } = useFetch(() => api.getShopStock());
  const [businessDate, setBusinessDate] = useState(new Date().toISOString().slice(0, 10));
  const [qtys, setQtys] = useState({});
  const [actualCash, setActualCash] = useState("");
  const [actualBank, setActualBank] = useState("");
  const [expenses, setExpenses] = useState("");
  const [loans, setLoans] = useState("");
  const [notes, setNotes] = useState("");
  const [report, setReport] = useState(null);
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("");

  if (loading) return <LoadingSpinner />;

  const products = stock || [];
  const filtered = products.filter((p) => p.productName.toLowerCase().includes(filter.toLowerCase()));

  const setQty = (id, v) => setQtys((prev) => ({ ...prev, [id]: v }));

  const totalRevenue = products.reduce((s, p) => {
    const q = parseInt(qtys[p.productId], 10) || 0;
    return s + p.sellingPrice * q;
  }, 0);
  const collected = (parseInt(actualCash, 10) || 0) * 100 + (parseInt(actualBank, 10) || 0) * 100;
  const expensesMinor = (parseInt(expenses, 10) || 0) * 100;
  const loansMinor = (parseInt(loans, 10) || 0) * 100;
  const expectedCollected = totalRevenue - expensesMinor - loansMinor;
  const diff = expectedCollected - collected;

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSubmitting(true); setMsg("");
    try {
      const payloadItems = products
        .map((p) => ({ productId: p.productId, quantity: parseInt(qtys[p.productId], 10) || 0 }))
        .filter((it) => it.quantity > 0);
      const r = await api.submitDailyReport({
        businessDate,
        items: payloadItems,
        actualCash: (parseInt(actualCash, 10) || 0) * 100,
        actualBank: (parseInt(actualBank, 10) || 0) * 100,
        expenses: expensesMinor,
        loans: loansMinor,
        notes: notes,
      });
      setReport(r); setMsg("Daily closing submitted successfully");
    } catch (err) { setMsg(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t("nav.dailyClosing")}</h2>
          <p className="text-sm text-slate-500">Enter quantities sold today. Leave 0 for unsold items.</p>
        </div>
        <FormInput label={t("common.date")} type="date" value={businessDate} onChange={(e) => setBusinessDate(e.target.value)} />
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Calculator size={18} /> Sold Products</h3>
          <input className="input sm:w-64" placeholder="Search product…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="data min-w-[480px]">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th>Product</th>
                <th className="w-24 text-center">Qty Sold</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const q = parseInt(qtys[p.productId], 10) || 0;
                return (
                  <tr key={p.productId}>
                    <td className="font-medium">{p.productName}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className="input text-center"
                        value={qtys[p.productId] || ""}
                        onChange={(e) => setQty(p.productId, e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="text-right text-slate-600">{(p.sellingPrice / 100).toFixed(2)}</td>
                    <td className="text-right font-medium">{((p.sellingPrice * q) / 100).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-right font-semibold">Total Sale Revenue</td>
                <td className="text-right font-bold text-indigo-600">{(totalRevenue / 100).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold">Cash & Bank Reconciliation</h3>
          <FormInput label="Actual Cash Collected" type="number" value={actualCash} onChange={(e) => setActualCash(e.target.value)} placeholder="0" />
          <FormInput label="Actual Bank Collected" type="number" value={actualBank} onChange={(e) => setActualBank(e.target.value)} placeholder="0" />
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-semibold">Expenses / Loans / Adjustments</h3>
          <FormInput label="Expenses Paid from Collected Cash" type="number" value={expenses} onChange={(e) => setExpenses(e.target.value)} placeholder="0" />
          <FormInput label="Loans / Borrowed from Collected Cash" type="number" value={loans} onChange={(e) => setLoans(e.target.value)} placeholder="0" />
          <div>
            <label className="label">Explanation / Notes</label>
            <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Explain expenses, loans, or adjustments..." />
          </div>
        </div>

        <div className="card space-y-3">
          <h3 className="text-lg font-semibold">Summary</h3>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Total Sale Revenue</span><span className="font-medium">{(totalRevenue / 100).toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Expected Collected (after adjustments)</span><span className="font-medium">{(expectedCollected / 100).toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Total Collected</span><span className="font-medium">{(collected / 100).toFixed(2)}</span></div>
          <div className={`flex justify-between text-sm font-semibold ${diff !== 0 ? "text-red-600" : "text-green-600"}`}>
            <span>Difference</span><span>{(diff / 100).toFixed(2)}</span>
          </div>
          <p className="text-xs text-slate-400 pt-2">Difference = Total Sale Revenue − (Cash + Bank).</p>
        </div>
      </div>

      {msg && <div className={`text-sm font-medium ${msg.includes("success") ? "text-green-600" : "text-red-600"}`}>{msg}</div>}

      <div className="flex justify-end">
        <button type="button" onClick={submit} disabled={submitting} className="btn-primary px-6 py-2.5 text-base">
          {submitting ? "Submitting…" : "Submit Daily Closing"}
        </button>
      </div>

      {report && (
        <div className="card">
          <h3 className="font-semibold mb-3">Submitted Report</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div><span className="text-slate-500">Total Sales:</span> <span className="font-medium">{(report.totalSales / 100).toFixed(2)}</span></div>
            <div><span className="text-slate-500">Expenses:</span> <span className="font-medium">{((report.expenses || 0) / 100).toFixed(2)}</span></div>
            <div><span className="text-slate-500">Loans:</span> <span className="font-medium">{((report.loans || 0) / 100).toFixed(2)}</span></div>
            <div><span className="text-slate-500">Collected:</span> <span className="font-medium">{(report.totalCollected / 100).toFixed(2)}</span></div>
            <div><span className="text-slate-500">Total Diff:</span> <span className="font-medium">{(report.totalDiff / 100).toFixed(2)}</span></div>
            <div><span className="text-slate-500">Status:</span> <span className="font-medium">{report.status}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
