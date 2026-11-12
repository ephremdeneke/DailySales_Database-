// services/api.js
// Central API layer. Calls the deployed Google Apps Script web app endpoint.
// Set VITE_API_URL in .env to the deployed Apps Script /exec URL.

const API_URL = import.meta.env.VITE_API_URL || "https://script.google.com/macros/s/AKfycbwZ4jB24lkCarQYUdNSPELeMkcWQqb4jXCw4PZ5gEE2caoFU1X-zxLpb5T3ZPYx3qM/exec";

async function call(action, payload = {}) {
  if (!API_URL || !API_URL.trim()) {
    throw new Error("VITE_API_URL is not configured");
  }
  const fullPayload = { action, idToken: localStorage.getItem("auth_token"), ...payload };
  const url = API_URL + "?action=" + encodeURIComponent(action) + "&payload=" + encodeURIComponent(JSON.stringify(fullPayload));
  const res = await fetch(url, { method: "GET" });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch (e) { throw new Error("Backend not responding (not deployed?)"); }
  if (!data.ok) throw new Error(data.error || "Request failed");
  return data.data;
}

export const api = {
  me: () => call("me"),
  login: (d) => call("login", d),
  // users
  listUsers: () => call("listUsers"),
  createUser: (d) => call("createUser", d),
  updateUser: (d) => call("updateUser", d),
  // shops
  listShops: () => call("listShops"),
  createShop: (d) => call("createShop", d),
  updateShop: (d) => call("updateShop", d),
  // products
  listProducts: () => call("listProducts"),
  createProduct: (d) => call("createProduct", d),
  updateProduct: (d) => call("updateProduct", d),
  // warehouse
  getWarehouseStock: () => call("getWarehouseStock"),
  receiveStock: (d) => call("receiveStock", d),
  setWarehouseStock: (d) => call("setWarehouseStock", d),
  // shop stock
  getShopStock: (shopId) => call("getShopStock", { shopId }),
  // transfers
  listTransfers: () => call("listTransfers"),
  createTransfer: (d) => call("createTransfer", d),
  confirmTransfer: (d) => call("confirmTransfer", d),
  // sales
  createSale: (d) => call("createSale", d),
  listSales: (shopId) => call("listSales", { shopId }),
  // returns
  createReturn: (d) => call("createReturn", d),
  confirmReturn: (d) => call("confirmReturn", d),
  listReturns: () => call("listReturns"),
  // daily reports
  submitDailyReport: (d) => call("submitDailyReport", d),
  listDailyReports: (shopId) => call("listDailyReports", { shopId }),
  reviewDailyReport: (d) => call("reviewDailyReport", d),
  // discrepancies
  listDiscrepancies: () => call("listDiscrepancies"),
  resolveDiscrepancy: (d) => call("resolveDiscrepancy", d),
  // reports
  dashboardStats: () => call("dashboardStats"),
  salesTrend: () => call("salesTrend"),
  shopPerformance: () => call("shopPerformance"),
  topProducts: () => call("topProducts"),
  stockMovements: () => call("stockMovements"),
  auditLogs: () => call("auditLogs"),
  seedProducts: () => call("seedProducts"),
  seedUsers: () => call("seedUsers"),
};
