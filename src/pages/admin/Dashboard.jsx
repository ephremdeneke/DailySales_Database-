import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../services/api.js";
import StatCard from "../../components/common/StatCard.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import { DollarSign, Wallet, Building2, Package, Store, FileText, AlertTriangle, TrendingUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [shops, setShops] = useState([]);
  const [top, setTop] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.dashboardStats(), api.salesTrend(), api.shopPerformance(), api.topProducts()])
      .then(([s, tr, sh, tp]) => { setStats(s || {}); setTrend((tr || []).map((d) => ({ ...d, total: (d.total || 0) / 100 }))); setShops((sh || []).map((x) => ({ ...x, total: (x.total || 0) / 100 }))); setTop(tp || []); })
      .catch(() => { setStats({}); setTrend([]); setShops([]); setTop([]); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const cards = [
    { title: t("dashboard.totalSalesToday"), value: ((stats.totalSalesToday || 0) / 100).toFixed(2), icon: DollarSign, color: "indigo" },
    { title: t("dashboard.totalCash"), value: ((stats.totalCash || 0) / 100).toFixed(2), icon: Wallet, color: "green" },
    { title: t("dashboard.totalBank"), value: ((stats.totalBank || 0) / 100).toFixed(2), icon: Building2, color: "blue" },
    { title: t("dashboard.totalProducts"), value: stats.totalProducts || 0, icon: Package, color: "slate" },
    { title: t("dashboard.totalShops"), value: stats.totalShops || 0, icon: Store, color: "slate" },
    { title: t("dashboard.pendingReports"), value: stats.pendingReports || 0, icon: FileText, color: "amber" },
    { title: t("dashboard.missingReports"), value: stats.missingReports || 0, icon: AlertTriangle, color: "red" },
    { title: t("dashboard.discrepancies"), value: stats.discrepancies || 0, icon: AlertTriangle, color: "red" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("pages.dashboard")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-3">{t("dashboard.dailySalesTrend")}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-3">{t("dashboard.cashVsBank")}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={[{ name: "Cash", value: stats.totalCash }, { name: "Bank", value: stats.totalBank }]} dataKey="value" outerRadius={90} label>
                <Cell fill="#10b981" /><Cell fill="#3b82f6" />
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-3">{t("dashboard.shopPerformance")}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={shops}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="shopName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-3">{t("dashboard.topProducts")}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={top} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="quantity" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
