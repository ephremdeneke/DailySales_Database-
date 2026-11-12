import React from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import DataTable from "../../components/common/DataTable.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

export default function ShopInventory() {
  const { t } = useTranslation();
  const { data, loading } = useFetch(() => api.getShopStock());
  if (loading) return <LoadingSpinner />;
  const columns = [
    { key: "productName", label: t("common.name") },
    { key: "sku", label: "SKU" },
    { key: "quantity", label: t("common.quantity") },
    { key: "sellingPrice", label: t("common.price"), render: (r) => (r.sellingPrice / 100).toFixed(2) },
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.shopInventory")}</h2>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
