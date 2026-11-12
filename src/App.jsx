import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { api } from "./services/api.js";
import { useAuth } from "./context/AuthContext.jsx";
import MainLayout from "./components/layout/MainLayout.jsx";
import Login from "./pages/Login.jsx";

// admin pages
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import Products from "./pages/admin/Products.jsx";
import Shops from "./pages/admin/Shops.jsx";
import Users from "./pages/admin/Users.jsx";
import Warehouse from "./pages/admin/Warehouse.jsx";
import Transfers from "./pages/admin/Transfers.jsx";
import Sales from "./pages/admin/Sales.jsx";
import DailyReports from "./pages/admin/DailyReports.jsx";
import Discrepancies from "./pages/admin/Discrepancies.jsx";
import InventoryReports from "./pages/admin/InventoryReports.jsx";
import FinancialReports from "./pages/admin/FinancialReports.jsx";
import Settings from "./pages/admin/Settings.jsx";

// warehouse pages
import WhDashboard from "./pages/warehouse/Dashboard.jsx";
import WhInventory from "./pages/warehouse/Inventory.jsx";
import ReceiveStock from "./pages/warehouse/ReceiveStock.jsx";
import CreateTransfers from "./pages/warehouse/CreateTransfers.jsx";
import TransferHistory from "./pages/warehouse/TransferHistory.jsx";
import WhReturns from "./pages/warehouse/Returns.jsx";
import StockMovements from "./pages/warehouse/StockMovements.jsx";

// shop pages
import ShopDashboard from "./pages/shop/Dashboard.jsx";
import NewSale from "./pages/shop/NewSale.jsx";
import SalesHistory from "./pages/shop/SalesHistory.jsx";
import ShopInventory from "./pages/shop/ShopInventory.jsx";
import DailyClosing from "./pages/shop/DailyClosing.jsx";
import ShopReturns from "./pages/shop/Returns.jsx";
import MyReports from "./pages/shop/MyReports.jsx";

function Protected({ children, roles }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function RoleHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "WAREHOUSE_MANAGER") return <Navigate to="/warehouse/dashboard" replace />;
  return <Navigate to="/shop/dashboard" replace />;
}

export default function App() {
  useEffect(() => {
    api.seedUsers().catch(() => {});
    api.seedProducts().catch(() => {});
  }, []);
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RoleHome />} />

      {/* Admin */}
      <Route path="/admin" element={<Protected roles={["ADMIN"]}><MainLayout role="ADMIN" /></Protected>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="shops" element={<Shops />} />
        <Route path="users" element={<Users />} />
        <Route path="warehouse" element={<Warehouse />} />
        <Route path="transfers" element={<Transfers />} />
        <Route path="sales" element={<Sales />} />
        <Route path="daily-reports" element={<DailyReports />} />
        <Route path="discrepancies" element={<Discrepancies />} />
        <Route path="inventory-reports" element={<InventoryReports />} />
        <Route path="financial-reports" element={<FinancialReports />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Warehouse */}
      <Route path="/warehouse" element={<Protected roles={["WAREHOUSE_MANAGER", "ADMIN"]}><MainLayout role="WAREHOUSE_MANAGER" /></Protected>}>
        <Route path="dashboard" element={<WhDashboard />} />
        <Route path="inventory" element={<WhInventory />} />
        <Route path="receive" element={<ReceiveStock />} />
        <Route path="transfers" element={<CreateTransfers />} />
        <Route path="history" element={<TransferHistory />} />
        <Route path="returns" element={<WhReturns />} />
        <Route path="movements" element={<StockMovements />} />
      </Route>

      {/* Shop */}
      <Route path="/shop" element={<Protected roles={["SHOP_MANAGER", "ADMIN"]}><MainLayout role="SHOP_MANAGER" /></Protected>}>
        <Route path="dashboard" element={<ShopDashboard />} />
        <Route path="new-sale" element={<NewSale />} />
        <Route path="sales-history" element={<SalesHistory />} />
        <Route path="inventory" element={<ShopInventory />} />
        <Route path="daily-closing" element={<DailyClosing />} />
        <Route path="returns" element={<ShopReturns />} />
        <Route path="my-reports" element={<MyReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
