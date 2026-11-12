import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext.jsx";
import { LogIn } from "lucide-react";

const DEMOS = [
  { label: "Admin", username: "admin@demo.com" },
  { label: "Warehouse", username: "warehouse@demo.com" },
  { label: "Gombora Shop", username: "gombora@demo.com" },
  { label: "Hospital Shop", username: "hospital@demo.com" },
];

export default function Login() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin@demo.com");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try { await login(username); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const quick = async (u) => {
    setUsername(u); setError(""); setLoading(true);
    try { await login(u); } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-1">{t("app.name")}</h1>
        <p className="text-sm text-slate-500 text-center mb-6">{t("auth.loginTitle")}</p>
        <form onSubmit={submit}>
          <label className="label">Username / Email</label>
          <input className="input mb-4" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin@demo.com" />
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            <LogIn size={18} /> {loading ? t("common.loading") : t("auth.login")}
          </button>
        </form>
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs text-slate-400 text-center">Quick demo login</p>
          <div className="flex gap-2 justify-center">
            {DEMOS.map((d) => (
              <button key={d.label} onClick={() => quick(d.username)} className="btn-secondary text-xs">{d.label}</button>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4 text-center">Login using a username or email that exists in the Users sheet.</p>
      </div>
    </div>
  );
}
