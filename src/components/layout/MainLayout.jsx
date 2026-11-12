import React, { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function MainLayout({ role }) {
  const { user } = useAuth();
  const effectiveRole = role || user?.role;
  const [open, setOpen] = useState(false);
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={effectiveRole} open={open} setOpen={setOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenu={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
