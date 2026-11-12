// Code.gs
function doGet(e) {
  const p = (e && e.parameter) || {};
  let payload = {};
  if (p.payload) {
    try { payload = JSON.parse(decodeURIComponent(p.payload)); } catch (err) { payload = {}; }
  }
  const action = p.action || payload.action;
  if (action) {
    payload.action = action;
    if (p.idToken) payload.idToken = p.idToken;
    return handleRequest(payload);
  }
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("DailySales Manager")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  let payload = {};
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    payload = e.parameter || {};
  }
  return handleRequest(payload);
}

function handleRequest(payload) {
  const action = payload.action;
  const idToken = payload.idToken;
  let result;
  try {
    const auth = authenticate(payload);
    const user = auth.ok ? auth.user : null;
    // allow initDatabase only by admin? We'll allow if no users yet
    if (action === "initDatabase") {
      initDatabase();
      result = { ok: true, data: "initialized" };
    } else if (action === "login") {
      const r = loginUser(payload);
      result = r.ok ? { ok: true, data: { user: r.user, token: r.token } } : { ok: false, error: r.error };
    } else {
      if (!user && action !== "seedUsers" && action !== "seedProducts" && action !== "initDatabase") throw new Error("Unauthenticated");
      result = { ok: true, data: dispatch(action, payload, user) };
    }
  } catch (err) {
    result = { ok: false, error: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function dispatch(action, payload, user) {
  switch (action) {
    case "seedProducts": return seedProducts();
    case "seedUsers": return seedUsers();
    case "me": return user;
    case "listUsers": return listUsers(user);
    case "createUser": return createUser(payload, user);
    case "updateUser": return updateUser(payload, user);
    case "listShops": return listShops();
    case "createShop": return createShop(payload, user);
    case "updateShop": return updateShop(payload, user);
    case "listProducts": return listProducts();
    case "createProduct": return createProduct(payload, user);
    case "updateProduct": return updateProduct(payload, user);
    case "getWarehouseStock": return getWarehouseStock();
    case "receiveStock": return receiveStock(payload, user);
    case "setWarehouseStock": return setWarehouseStock(payload, user);
    case "getShopStock": return getShopStock(payload.shopId || user.shopId, user);
    case "listTransfers": return listTransfers();
    case "createTransfer": return createTransfer(payload, user);
    case "confirmTransfer": return confirmTransfer(payload, user);
    case "createSale": return createSale(payload, user);
    case "listSales": return listSales(payload, user);
    case "createReturn": return createReturn(payload, user);
    case "confirmReturn": return confirmReturn(payload, user);
    case "listReturns": return listReturns(payload, user);
    case "submitDailyReport": return submitDailyReport(payload, user);
    case "listDailyReports": return listDailyReports(payload, user);
    case "reviewDailyReport": return reviewDailyReport(payload, user);
    case "listDiscrepancies": return listDiscrepancies(payload, user);
    case "resolveDiscrepancy": return resolveDiscrepancy(payload, user);
    case "dashboardStats": return dashboardStats();
    case "salesTrend": return salesTrend();
    case "shopPerformance": return shopPerformance();
    case "topProducts": return topProducts();
    case "stockMovements": return getStockMovements();
    case "auditLogs": return getAuditLogs();
    case "detectMissingReports": return detectMissingReports(payload.days);
    default: throw new Error("Unknown action: " + action);
  }
}

function dashboardStats() {
  const todayStr = new Date().toISOString().slice(0,10);
  const sales = sheetToObjects(SHEETS.SALES).filter(function(s){ return s.saleDate === todayStr; });
  const payments = sheetToObjects(SHEETS.PAYMENTS);
  let totalSalesToday = 0, cash = 0, bank = 0;
  sales.forEach(function(s){
    totalSalesToday += parseInt(s.totalAmount,10) || 0;
    payments.filter(function(p){ return p.saleId === s.saleId; }).forEach(function(p){
      const amt = parseInt(p.amount,10) || 0;
      if (p.paymentMethod === "CASH") cash += amt;
      else if (p.paymentMethod === "BANK") bank += amt;
      else { cash += Math.floor(amt/2); bank += amt - Math.floor(amt/2); }
    });
  });
  const products = sheetToObjects(SHEETS.PRODUCTS).filter(function(p){ return p.active !== false && p.active !== "FALSE"; });
  const shops = sheetToObjects(SHEETS.SHOPS).filter(function(s){ return s.active !== false && s.active !== "FALSE"; });
  const reports = sheetToObjects(SHEETS.DAILY_REPORTS);
  const discs = sheetToObjects(SHEETS.DISCREPANCIES);
  return {
    totalSalesToday: totalSalesToday,
    totalCash: cash,
    totalBank: bank,
    totalProducts: products.length,
    totalShops: shops.length,
    pendingReports: reports.filter(function(r){ return r.status === "PENDING"; }).length,
    missingReports: detectMissingReports(1).length,
    discrepancies: discs.filter(function(d){ return d.status === "OPEN"; }).length,
  };
}

function salesTrend() {
  const sales = sheetToObjects(SHEETS.SALES);
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0,10);
    const tot = sales.filter(function(s){ return s.saleDate === ds; }).reduce(function(a,s){ return a + (parseInt(s.totalAmount,10)||0); }, 0);
    out.push({ date: ds, total: tot });
  }
  return out;
}

function shopPerformance() {
  const shops = sheetToObjects(SHEETS.SHOPS);
  const sales = sheetToObjects(SHEETS.SALES);
  return shops.map(function(sh){
    return { shopId: sh.shopId, shopName: sh.shopName, total: sales.filter(function(s){ return s.shopId === sh.shopId; }).reduce(function(a,s){ return a + (parseInt(s.totalAmount,10)||0); }, 0) };
  });
}

function topProducts() {
  const items = sheetToObjects(SHEETS.SALE_ITEMS);
  const products = sheetToObjects(SHEETS.PRODUCTS);
  const counts = {};
  items.forEach(function(si){ counts[si.productId] = (counts[si.productId] || 0) + (parseInt(si.quantity,10)||0); });
  return Object.keys(counts).map(function(pid){
    const p = products.find(function(x){ return x.productId === pid; });
    return { productId: pid, name: p ? p.productName : pid, quantity: counts[pid] };
  }).sort(function(a,b){ return b.quantity - a.quantity; }).slice(0,5);
}
