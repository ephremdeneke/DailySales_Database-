import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import DataTable from "../../components/common/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Modal from "../../components/common/Modal.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import { CheckCircle, XCircle } from "lucide-react";

export default function DailyReports() {
  const { t } = useTranslation();
  const { data, loading, reload } = useFetch(() => api.listDailyReports());
  const [review, setReview] = useState(null);
  const [comment, setComment] = useState("");

  const act = async (status) => {
    await api.reviewDailyReport({ reportId: review.reportId, status, comment });
    setReview(null); setComment(""); reload();
  };

  if (loading) return <LoadingSpinner />;

  const columns = [
    { key: "reportId", label: t("common.id") },
    { key: "shopId", label: "Shop" },
    { key: "businessDate", label: t("common.date") },
    { key: "totalSales", label: "Total Sales", render: (r) => (r.totalSales / 100).toFixed(2) },
    { key: "expenses", label: "Expenses", render: (r) => ((r.expenses || 0) / 100).toFixed(2) },
    { key: "loans", label: "Loans", render: (r) => ((r.loans || 0) / 100).toFixed(2) },
    { key: "notes", label: "Notes" },
    { key: "reportedRevenue", label: "Reported Revenue", render: (r) => ((r.reportedRevenue || r.totalSales) / 100).toFixed(2) },
    { key: "revenueDiff", label: "Revenue Diff", render: (r) => ((r.revenueDiff || 0) / 100).toFixed(2) },
    { key: "totalDiff", label: "Cash/Bank Diff", render: (r) => (r.totalDiff / 100).toFixed(2) },
    { key: "status", label: t("common.status"), render: (r) => <StatusBadge status={r.status} /> },
    { key: "actions", label: t("common.actions"), render: (r) => (
      <button onClick={() => setReview(r)} className="btn-secondary text-xs">Review</button>
    )},
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.dailyReports")}</h2>
      <DataTable columns={columns} data={data} />
      <Modal open={!!review} onClose={() => setReview(null)} title="Review Report" size="lg">
        {review && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>Total Sales: {(review.totalSales/100).toFixed(2)}</div>
              <div>Expenses: {((review.expenses || 0)/100).toFixed(2)}</div>
              <div>Loans: {((review.loans || 0)/100).toFixed(2)}</div>
              <div>Notes: {review.notes || "-"}</div>
              <div>Expected Cash: {(review.expectedCash/100).toFixed(2)}</div>
              <div>Expected Bank: {(review.expectedBank/100).toFixed(2)}</div>
              <div>Actual Cash: {(review.actualCash/100).toFixed(2)}</div>
              <div>Actual Bank: {(review.actualBank/100).toFixed(2)}</div>
              <div>Total Diff: {(review.totalDiff/100).toFixed(2)}</div>
            </div>
            <textarea className="input" rows={3} placeholder="Comment" value={comment} onChange={(e) => setComment(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button onClick={() => act("REJECTED")} className="btn-danger flex items-center gap-1"><XCircle size={16} /> Reject</button>
              <button onClick={() => act("APPROVED")} className="btn-primary flex items-center gap-1"><CheckCircle size={16} /> Approve</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
