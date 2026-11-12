import React from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../services/api.js";
import DataTable from "../../components/common/DataTable.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

export default function InventoryReports() {
  const { t } = useTranslation();
  const { data: wh, loading: l1 } = useFetch(() => api.getWarehouseStock());
  const { data: shops } = useFetch(() => api.listShops());
  if (l1) return <LoadingSpinner />;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.inventoryReports")}</h2>
      <h3 className="font-semibold mb-2">Warehouse</h3>
      <DataTable columns={[{key:"productName",label:t("common.name")},{key:"quantity",label:t("common.quantity")}]} data={wh} />
      <h3 className="font-semibold mt-6 mb-2">Shop Stock</h3>
      {(shops || []).map((s) => <ShopStockBlock key={s.shopId} shop={s} />)}
    </div>
  );
}

function ShopStockBlock({ shop }) {
  const { data } = useFetch(() => api.getShopStock(shop.shopId), [shop.shopId]);
  return (
    <div className="mb-4">
      <p className="font-medium">{shop.shopName}</p>
      <DataTable columns={[{key:"productName",label:"Product"},{key:"quantity",label:"Qty"}]} data={data} />
    </div>
  );
}
