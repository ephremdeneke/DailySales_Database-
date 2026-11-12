import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext.jsx";
import { LayoutDashboard, Package, Store, Users, Warehouse, Truck, ShoppingCart, FileText, AlertTriangle, BarChart3, Settings, LogOut, Menu, X } from "lucide-react";
import LanguageSwitcher from "../common/LanguageSwitcher.jsx";

const NAV = {
  ADMIN: [
    { to: "/admin/dashboard", icon: LayoutDashboard, key: "dashboard" },
    { to: "/admin/products", icon: Package, key: "products" },
    { to: "/admin/shops", icon: Store, key: "shops" },
    { to: "/admin/users", icon: Users, key: "users" },
    { to: "/admin/warehouse", icon: Warehouse, key: "warehouse" },
    { to: "/admin/transfers", icon: Truck, key: "transfers" },
    { to: "/admin/sales", icon: ShoppingCart, key: "sales" },
    { to: "/admin/daily-reports", icon: FileText, key: "dailyReports" },
    { to: "/admin/discrepancies", icon: AlertTriangle, key: "discrepancies" },
    { to: "/admin/inventory-reports", icon: BarChart3, key: "inventoryReports" },
    { to: "/admin/financial-reports", icon: BarChart3, key: "financialReports" },
    { to: "/admin/settings", icon: Settings, key: "settings" },
  ],
  WAREHOUSE_MANAGER: [
    { to: "/warehouse/dashboard", icon: LayoutDashboard, key: "dashboard" },
    { to: "/warehouse/inventory", icon: Warehouse, key: "warehouseInventory" },
    { to: "/warehouse/receive", icon: Package, key: "receiveStock" },
    { to: "/warehouse/transfers", icon: Truck, key: "createTransfers" },
    { to: "/warehouse/history", icon: FileText, key: "transferHistory" },
    { to: "/warehouse/returns", icon: Package, key: "productReturns" },
    { to: "/warehouse/movements", icon: BarChart3, key: "stockMovements" },
  ],
  SHOP_MANAGER: [
    { to: "/shop/dashboard", icon: LayoutDashboard, key: "dashboard" },
    { to: "/shop/new-sale", icon: ShoppingCart, key: "newSale" },
    { to: "/shop/sales-history", icon: FileText, key: "salesHistory" },
    { to: "/shop/inventory", icon: Package, key: "shopInventory" },
    { to: "/shop/daily-closing", icon: FileText, key: "dailyClosing" },
    { to: "/shop/returns", icon: Package, key: "productReturns" },
    { to: "/shop/my-reports", icon: FileText, key: "myReports" },
  ],
};

export default function Sidebar({ role, open, setOpen }) {
  const { t } = useTranslation();
  const items = NAV[role] || [];
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed z-40 top-0 left-0 h-full w-64 bg-slate-900 text-slate-100 transform transition-transform ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700">
          <span className="font-bold text-lg">DailySales</span>
          <button className="md:hidden" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100%-60px)]">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}
            >
              <it.icon size={18} />
              {t(`nav.${it.key}`)}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
