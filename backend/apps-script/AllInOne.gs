
// ===== Config.gs =====
// Config.gs
const CONFIG = {
  // Provided spreadsheet: https://docs.google.com/spreadsheets/d/1cgiWiY802E3jMhLOUdvNqUfZeiCkO-E8ZMk5qD-78S4/edit
  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID") || "1cgiWiY802E3jMhLOUdvNqUfZeiCkO-E8ZMk5qD-78S4",
  APP_NAME: "DailySales Manager",
};

const SHEETS = {
  USERS: "Users",
  SHOPS: "Shops",
  PRODUCTS: "Products",
  SETTINGS: "Settings",
  WAREHOUSE_STOCK: "WarehouseStock",
  SHOP_STOCK: "ShopStock",
  TRANSFERS: "Transfers",
  TRANSFER_ITEMS: "TransferItems",
  STOCK_MOVEMENTS: "StockMovements",
  SALES: "Sales",
  SALE_ITEMS: "SaleItems",
  PAYMENTS: "Payments",
  DAILY_REPORTS: "DailyReports",
  RETURNS: "Returns",
  DISCREPANCIES: "Discrepancies",
  AUDIT_LOGS: "AuditLogs",
};

function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID) return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(name) {
  const ss = getSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
  }
  return sh;
}


// ===== Database.gs =====
// Database.gs
const HEADERS = {};
HEADERS[SHEETS.USERS] = ["userId","name","email","role","shopId","active","createdAt"];
HEADERS[SHEETS.SHOPS] = ["shopId","shopName","location","managerId","active","createdAt"];
HEADERS[SHEETS.PRODUCTS] = ["productId","productName","productNameAm","sku","sellingPrice","active","createdAt"];
HEADERS[SHEETS.SETTINGS] = ["key","value","updatedAt"];
HEADERS[SHEETS.WAREHOUSE_STOCK] = ["productId","quantity","updatedAt"];
HEADERS[SHEETS.SHOP_STOCK] = ["shopId","productId","quantity","updatedAt"];
HEADERS[SHEETS.TRANSFERS] = ["transferId","toShopId","status","createdBy","createdAt","confirmedBy","confirmedAt"];
HEADERS[SHEETS.TRANSFER_ITEMS] = ["transferItemId","transferId","productId","quantity"];
HEADERS[SHEETS.STOCK_MOVEMENTS] = ["movementId","type","details","createdAt","userId"];
HEADERS[SHEETS.SALES] = ["saleId","shopId","saleDate","cashierId","totalAmount","status","createdAt"];
HEADERS[SHEETS.SALE_ITEMS] = ["saleItemId","saleId","productId","quantity","unitPrice","lineTotal"];
HEADERS[SHEETS.PAYMENTS] = ["paymentId","saleId","paymentMethod","amount","reference","createdAt"];
HEADERS[SHEETS.DAILY_REPORTS] = ["reportId","shopId","businessDate","totalSales","totalItems","expectedCash","expectedBank","actualCash","actualBank","totalCollected","cashDiff","bankDiff","totalDiff","reportedRevenue","revenueDiff","expenses","loans","notes","status","submittedBy","submittedAt","reviewedBy","reviewedAt","reviewComment"];
HEADERS[SHEETS.RETURNS] = ["returnId","shopId","status","reason","createdBy","createdAt","confirmedBy","confirmedAt","items"];
HEADERS[SHEETS.DISCREPANCIES] = ["discrepancyId","type","reportId","shopId","businessDate","expected","actual","difference","status","resolution","resolvedBy","resolvedAt","createdAt"];
HEADERS[SHEETS.AUDIT_LOGS] = ["auditId","action","userId","entity","entityId","details","createdAt"];

function initDatabase() {
  const ss = getSpreadsheet();
  Object.keys(HEADERS).forEach(function(name) {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS[name]);
      sh.getRange(1,1,1,HEADERS[name].length).setFontWeight("bold");
      sh.setFrozenRows(1);
    } else {
      const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
      HEADERS[name].forEach(function(h) {
        if (headers.indexOf(h) === -1) {
          const col = sh.getLastColumn() + 1;
          sh.getRange(1, col).setValue(h).setFontWeight("bold");
        }
      });
    }
  });
  // seed settings
  const s = getSheet(SHEETS.SETTINGS);
  if (s.getLastRow() === 1) {
    s.appendRow(["currency","ETB", new Date().toISOString()]);
  }
}

function sheetToObjects(sheetName) {
  const sh = getSheet(sheetName);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  const out = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row.every(function(c){ return c === "" || c === null; })) continue;
    const obj = {};
    headers.forEach(function(h, idx){ obj[h] = row[idx]; });
    out.push(obj);
  }
  return out;
}

function appendObject(sheetName, obj) {
  const sh = getSheet(sheetName);
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const row = headers.map(function(h){ return obj[h] !== undefined ? obj[h] : ""; });
  sh.appendRow(row);
}

function updateRow(sheetName, keyField, keyValue, updates) {
  const sh = getSheet(sheetName);
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  const keyIdx = headers.indexOf(keyField);
  for (let i = 1; i < values.length; i++) {
    if (values[i][keyIdx] === keyValue) {
      Object.keys(updates).forEach(function(k) {
        const ci = headers.indexOf(k);
        if (ci >= 0) sh.getRange(i+1, ci+1).setValue(updates[k]);
      });
      return true;
    }
  }
  return false;
}


// ===== Auth.gs =====
// Auth.gs
function getClientId() {
  return PropertiesService.getScriptProperties().getProperty("GOOGLE_CLIENT_ID") || "";
}

function verifyGoogleToken(idToken) {
  if (!idToken) return null;
  try {
    const url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken);
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return null;
    const info = JSON.parse(res.getContentText());
    const clientId = getClientId();
    if (clientId && info.aud !== clientId) return null;
    return info;
  } catch (e) {
    return null;
  }
}

function getRegisteredUserByEmailOrName(identifier) {
  const users = sheetToObjects(SHEETS.USERS);
  const key = String(identifier || "").toLowerCase().trim();
  return users.find(function(u){
    return u.active !== false && u.active !== "FALSE" && (
      String(u.email || "").toLowerCase() === key ||
      String(u.name || "").toLowerCase() === key ||
      String(u.userId || "").toLowerCase() === key
    );
  });
}

function getRegisteredUserById(userId) {
  const users = sheetToObjects(SHEETS.USERS);
  return users.find(function(u){ return String(u.userId) === String(userId) && u.active !== false && u.active !== "FALSE"; });
}

// Login by username/email/name (no password) - used when Google OAuth not configured
function loginUser(payload) {
  const identifier = payload.username || payload.email || payload.name || payload.idToken;
  const user = getRegisteredUserByEmailOrName(identifier);
  if (!user) return { ok: false, error: "User not found. Check the Users sheet." };
  return { ok: true, user: { userId: user.userId, name: user.name, email: user.email, role: user.role, shopId: user.shopId }, token: String(user.userId) };
}

function authenticate(payload) {
  const idToken = payload && payload.idToken;
  const clientId = getClientId();
  // Google OAuth mode
  if (clientId && idToken) {
    const info = verifyGoogleToken(idToken);
    if (info && info.email) {
      const user = getRegisteredUserByEmailOrName(info.email);
      if (user) return { ok: true, user: { userId: user.userId, name: user.name, email: user.email, role: user.role, shopId: user.shopId } };
      return { ok: false, error: "Account not registered" };
    }
  }
  // Simple token mode (userId stored as token)
  if (idToken) {
    const user = getRegisteredUserById(idToken);
    if (user) return { ok: true, user: { userId: user.userId, name: user.name, email: user.email, role: user.role, shopId: user.shopId } };
  }
  // Username passed directly
  if (payload && (payload.username || payload.email || payload.name)) {
    const r = loginUser(payload);
    if (r.ok) return { ok: true, user: r.user };
  }
  return { ok: false, error: "Unauthenticated" };
}

function requireAuth(payload) {
  const r = authenticate(payload);
  if (!r.ok) throw new Error(r.error);
  return r.user;
}

function requireRole(user, roles) {
  if (roles.indexOf(user.role) === -1) throw new Error("Forbidden");
}


// ===== Products.gs =====
// Products.gs
function listProducts() {
  return sheetToObjects(SHEETS.PRODUCTS).filter(function(p){ return p.active !== false && p.active !== "FALSE"; });
}

function createProduct(payload, user) {
  requireRole(user, ["ADMIN"]);
  if (!payload.productName) throw new Error("productName required");
  const qty = parseInt(payload.quantity, 10) || 0;
  const createdAt = new Date().toISOString();
  const p = {
    productId: "p_" + Utilities.getUuid(),
    productName: payload.productName,
    productNameAm: payload.productNameAm || "",
    sku: payload.sku || "",
    sellingPrice: parseInt(payload.sellingPrice, 10) || 0,
    active: true,
    createdAt: createdAt,
  };
  appendObject(SHEETS.PRODUCTS, p);
  // warehouse stock row with initial quantity
  appendObject(SHEETS.WAREHOUSE_STOCK, { productId: p.productId, quantity: qty, updatedAt: createdAt });
  logAudit("CREATE_PRODUCT", user.userId, "Product", p.productId, p);
  return p;
}

function updateProduct(payload, user) {
  requireRole(user, ["ADMIN"]);
  if (!payload.productId) throw new Error("productId required");
  const updates = {};
  ["productName","productNameAm","sku","sellingPrice","active"].forEach(function(k){
    if (payload[k] !== undefined) updates[k] = payload[k];
  });
  updateRow(SHEETS.PRODUCTS, "productId", payload.productId, updates);
  logAudit("UPDATE_PRODUCT", user.userId, "Product", payload.productId, updates);
  return { productId: payload.productId, ...updates };
}


// ===== Shops.gs =====
// Shops.gs
function listShops() {
  return sheetToObjects(SHEETS.SHOPS).filter(function(s){ return s.active !== false && s.active !== "FALSE"; });
}

function createShop(payload, user) {
  requireRole(user, ["ADMIN"]);
  if (!payload.shopName) throw new Error("shopName required");
  const s = {
    shopId: "shop_" + Utilities.getUuid(),
    shopName: payload.shopName,
    location: payload.location || "",
    managerId: payload.managerId || "",
    active: true,
    createdAt: new Date().toISOString(),
  };
  appendObject(SHEETS.SHOPS, s);
  logAudit("CREATE_SHOP", user.userId, "Shop", s.shopId, s);
  return s;
}

function updateShop(payload, user) {
  requireRole(user, ["ADMIN"]);
  if (!payload.shopId) throw new Error("shopId required");
  const updates = {};
  ["shopName","location","managerId","active"].forEach(function(k){
    if (payload[k] !== undefined) updates[k] = payload[k];
  });
  updateRow(SHEETS.SHOPS, "shopId", payload.shopId, updates);
  logAudit("UPDATE_SHOP", user.userId, "Shop", payload.shopId, updates);
  return { shopId: payload.shopId, ...updates };
}


// ===== Users.gs =====
// Users.gs (backend)
function listUsers(user) {
  requireRole(user, ["ADMIN"]);
  return sheetToObjects(SHEETS.USERS);
}

function createUser(payload, user) {
  requireRole(user, ["ADMIN"]);
  if (!payload.name || !payload.email || !payload.role) throw new Error("Missing fields");
  const u = {
    userId: "u_" + Utilities.getUuid(),
    name: payload.name,
    email: payload.email,
    role: payload.role,
    shopId: payload.shopId || "",
    active: true,
    createdAt: new Date().toISOString(),
  };
  appendObject(SHEETS.USERS, u);
  logAudit("CREATE_USER", user.userId, "User", u.userId, u);
  return u;
}

function updateUser(payload, user) {
  requireRole(user, ["ADMIN"]);
  if (!payload.userId) throw new Error("userId required");
  const updates = {};
  ["name","email","role","shopId","active"].forEach(function(k){
    if (payload[k] !== undefined) updates[k] = payload[k];
  });
  updateRow(SHEETS.USERS, "userId", payload.userId, updates);
  logAudit("UPDATE_USER", user.userId, "User", payload.userId, updates);
  return { userId: payload.userId, ...updates };
}


// ===== Inventory.gs =====
// Inventory.gs
function getWarehouseStock() {
  const products = listProducts();
  const stocks = sheetToObjects(SHEETS.WAREHOUSE_STOCK);
  const map = {};
  stocks.forEach(function(s){ map[s.productId] = s.quantity; });
  return products.map(function(p){ return { productId: p.productId, productName: p.productName, sku: p.sku, sellingPrice: p.sellingPrice, quantity: parseInt(map[p.productId] || 0, 10) }; });
}

function setWarehouseStock(payload, user) {
  requireRole(user, ["ADMIN","WAREHOUSE_MANAGER"]);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const pid = payload.productId;
    const qty = parseInt(payload.quantity, 10);
    if (!pid || isNaN(qty) || qty < 0) throw new Error("Invalid input");
    const stocks = sheetToObjects(SHEETS.WAREHOUSE_STOCK);
    const existing = stocks.find(function(s){ return s.productId === pid; });
    if (existing) {
      updateRow(SHEETS.WAREHOUSE_STOCK, "productId", pid, { quantity: qty, updatedAt: new Date().toISOString() });
    } else {
      appendObject(SHEETS.WAREHOUSE_STOCK, { productId: pid, quantity: qty, updatedAt: new Date().toISOString() });
    }
    logAudit("SET_WAREHOUSE_STOCK", user.userId, "Product", pid, { quantity: qty });
    return { productId: pid, quantity: qty };
  } finally {
    lock.releaseLock();
  }
}

function receiveStock(payload, user) {
  requireRole(user, ["ADMIN","WAREHOUSE_MANAGER"]);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const pid = payload.productId;
    const qty = parseInt(payload.quantity, 10);
    if (!pid || qty <= 0) throw new Error("Invalid input");
    const stocks = sheetToObjects(SHEETS.WAREHOUSE_STOCK);
    const existing = stocks.find(function(s){ return s.productId === pid; });
    if (existing) {
      updateRow(SHEETS.WAREHOUSE_STOCK, "productId", pid, { quantity: parseInt(existing.quantity,10) + qty, updatedAt: new Date().toISOString() });
    } else {
      appendObject(SHEETS.WAREHOUSE_STOCK, { productId: pid, quantity: qty, updatedAt: new Date().toISOString() });
    }
    logStockMovement("RECEIVE", pid, qty, "SUPPLIER", "WAREHOUSE", user.userId);
    logAudit("RECEIVE_STOCK", user.userId, "Product", pid, { quantity: qty });
    return { productId: pid, quantity: qty };
  } finally {
    lock.releaseLock();
  }
}

function getShopStock(shopId, user) {
  if (user && user.role === "SHOP_MANAGER" && user.shopId && shopId && user.shopId !== shopId) throw new Error("Forbidden");
  const products = listProducts();
  const stocks = sheetToObjects(SHEETS.SHOP_STOCK).filter(function(s){ return s.shopId === shopId; });
  const map = {};
  stocks.forEach(function(s){ map[s.productId] = s.quantity; });
  return products.map(function(p){ return { productId: p.productId, productName: p.productName, sku: p.sku, sellingPrice: p.sellingPrice, quantity: parseInt(map[p.productId] || 0, 10) }; });
}


// ===== Transfers.gs =====
// Transfers.gs
function listTransfers() {
  const transfers = sheetToObjects(SHEETS.TRANSFERS);
  const items = sheetToObjects(SHEETS.TRANSFER_ITEMS);
  return transfers.map(function(t){
    return Object.assign({}, t, { items: items.filter(function(i){ return i.transferId === t.transferId; }) });
  });
}

function createTransfer(payload, user) {
  requireRole(user, ["ADMIN","WAREHOUSE_MANAGER"]);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const toShopId = payload.toShopId;
    const items = payload.items || [];
    if (!toShopId || !items.length) throw new Error("Invalid input");
    // check stock
    const stocks = sheetToObjects(SHEETS.WAREHOUSE_STOCK);
    const smap = {};
    stocks.forEach(function(s){ smap[s.productId] = parseInt(s.quantity,10) || 0; });
    items.forEach(function(it){
      if ((smap[it.productId] || 0) < it.quantity) throw new Error("Insufficient warehouse stock: " + it.productId);
    });
    const transferId = "tr_" + Utilities.getUuid();
    appendObject(SHEETS.TRANSFERS, {
      transferId: transferId,
      toShopId: toShopId,
      status: "SENT",
      createdBy: user.userId,
      createdAt: new Date().toISOString(),
      confirmedBy: "",
      confirmedAt: "",
    });
    items.forEach(function(it){
      appendObject(SHEETS.TRANSFER_ITEMS, {
        transferItemId: "tri_" + Utilities.getUuid(),
        transferId: transferId,
        productId: it.productId,
        quantity: it.quantity,
      });
      // decrement warehouse stock
      const cur = smap[it.productId] || 0;
      updateRow(SHEETS.WAREHOUSE_STOCK, "productId", it.productId, { quantity: cur - it.quantity, updatedAt: new Date().toISOString() });
      smap[it.productId] = cur - it.quantity;
    });
    logStockMovement("TRANSFER_SENT", toShopId, items, user.userId);
    logAudit("CREATE_TRANSFER", user.userId, "Transfer", transferId, payload);
    return { transferId: transferId, status: "SENT" };
  } finally {
    lock.releaseLock();
  }
}

function confirmTransfer(payload, user) {
  requireRole(user, ["ADMIN","WAREHOUSE_MANAGER","SHOP_MANAGER"]);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const transferId = payload.transferId;
    const transfers = sheetToObjects(SHEETS.TRANSFERS);
    const tr = transfers.find(function(t){ return t.transferId === transferId; });
    if (!tr) throw new Error("Transfer not found");
    if (tr.status !== "SENT") throw new Error("Transfer already processed");
    // shop manager can only confirm own shop
    if (user.role === "SHOP_MANAGER" && user.shopId !== tr.toShopId) throw new Error("Forbidden");
    const items = sheetToObjects(SHEETS.TRANSFER_ITEMS).filter(function(i){ return i.transferId === transferId; });
    // ensure shop stock rows
    const shopStocks = sheetToObjects(SHEETS.SHOP_STOCK);
    items.forEach(function(it){
      const existing = shopStocks.find(function(s){ return s.shopId === tr.toShopId && s.productId === it.productId; });
      if (existing) {
        updateRow(SHEETS.SHOP_STOCK, "shopId", tr.toShopId, {}); // noop placeholder
      }
    });
    // update quantities properly
    items.forEach(function(it){
      const cur = shopStocks.find(function(s){ return s.shopId === tr.toShopId && s.productId === it.productId; });
      if (cur) {
        // update by composite key manually
        const sh = getSheet(SHEETS.SHOP_STOCK);
        const vals = sh.getDataRange().getValues();
        const hdr = vals[0];
        const si = hdr.indexOf("shopId"), pi = hdr.indexOf("productId"), qi = hdr.indexOf("quantity"), ui = hdr.indexOf("updatedAt");
        for (let r = 1; r < vals.length; r++) {
          if (vals[r][si] === tr.toShopId && vals[r][pi] === it.productId) {
            sh.getRange(r+1, qi+1).setValue((parseInt(vals[r][qi],10)||0) + parseInt(it.quantity,10));
            sh.getRange(r+1, ui+1).setValue(new Date().toISOString());
          }
        }
      } else {
        appendObject(SHEETS.SHOP_STOCK, { shopId: tr.toShopId, productId: it.productId, quantity: it.quantity, updatedAt: new Date().toISOString() });
      }
    });
    updateRow(SHEETS.TRANSFERS, "transferId", transferId, { status: "RECEIVED", confirmedBy: user.userId, confirmedAt: new Date().toISOString() });
    logStockMovement("TRANSFER_RECEIVED", tr.toShopId, items, user.userId);
    logAudit("CONFIRM_TRANSFER", user.userId, "Transfer", transferId, {});
    return { transferId: transferId, status: "RECEIVED" };
  } finally {
    lock.releaseLock();
  }
}


// ===== Sales.gs =====
// Sales.gs
function createSale(payload, user) {
  requireRole(user, ["ADMIN","SHOP_MANAGER"]);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const shopId = (user.role === "SHOP_MANAGER") ? user.shopId : payload.shopId;
    if (!shopId) throw new Error("shopId required");
    const items = payload.items || [];
    if (!items.length) throw new Error("No items");
    const products = sheetToObjects(SHEETS.PRODUCTS);
    const pmap = {};
    products.forEach(function(p){ pmap[p.productId] = p; });
    // validate stock
    const shopStocks = sheetToObjects(SHEETS.SHOP_STOCK);
    const smap = {};
    shopStocks.forEach(function(s){ if (s.shopId === shopId) smap[s.productId] = parseInt(s.quantity,10) || 0; });
    items.forEach(function(it){
      if ((smap[it.productId] || 0) < it.quantity) throw new Error("Insufficient stock: " + it.productId);
    });
    const saleId = "sale_" + Utilities.getUuid();
    let total = 0;
    items.forEach(function(it){
      const p = pmap[it.productId];
      if (!p) throw new Error("Product not found");
      const unitPrice = parseInt(p.sellingPrice, 10);
      const lineTotal = unitPrice * it.quantity;
      total += lineTotal;
      appendObject(SHEETS.SALE_ITEMS, {
        saleItemId: "si_" + Utilities.getUuid(),
        saleId: saleId,
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: unitPrice,
        lineTotal: lineTotal,
      });
      // decrement stock
      updateShopStockQty(shopId, it.productId, (smap[it.productId] || 0) - it.quantity);
      smap[it.productId] = (smap[it.productId] || 0) - it.quantity;
    });
    appendObject(SHEETS.SALES, {
      saleId: saleId,
      shopId: shopId,
      saleDate: new Date().toISOString().slice(0,10),
      cashierId: user.userId,
      totalAmount: total,
      status: "COMPLETED",
      createdAt: new Date().toISOString(),
    });
    const payments = payload.payments || [];
    payments.forEach(function(pay){
      appendObject(SHEETS.PAYMENTS, {
        paymentId: "pay_" + Utilities.getUuid(),
        saleId: saleId,
        paymentMethod: pay.method || pay.paymentMethod,
        amount: parseInt(pay.amount, 10),
        reference: pay.reference || "",
        createdAt: new Date().toISOString(),
      });
    });
    logStockMovement("SALE", shopId, items, user.userId);
    logAudit("CREATE_SALE", user.userId, "Sale", saleId, { total: total });
    return { saleId: saleId, totalAmount: total };
  } finally {
    lock.releaseLock();
  }
}

function updateShopStockQty(shopId, productId, qty) {
  const sh = getSheet(SHEETS.SHOP_STOCK);
  const vals = sh.getDataRange().getValues();
  const hdr = vals[0];
  const si = hdr.indexOf("shopId"), pi = hdr.indexOf("productId"), qi = hdr.indexOf("quantity"), ui = hdr.indexOf("updatedAt");
  for (let r = 1; r < vals.length; r++) {
    if (vals[r][si] === shopId && vals[r][pi] === productId) {
      sh.getRange(r+1, qi+1).setValue(qty);
      sh.getRange(r+1, ui+1).setValue(new Date().toISOString());
      return;
    }
  }
  appendObject(SHEETS.SHOP_STOCK, { shopId: shopId, productId: productId, quantity: qty, updatedAt: new Date().toISOString() });
}

function listSales(payload, user) {
  let shopId = payload && payload.shopId;
  if (user.role === "SHOP_MANAGER") shopId = user.shopId;
  let sales = sheetToObjects(SHEETS.SALES);
  if (shopId) sales = sales.filter(function(s){ return s.shopId === shopId; });
  const items = sheetToObjects(SHEETS.SALE_ITEMS);
  const pays = sheetToObjects(SHEETS.PAYMENTS);
  return sales.map(function(s){
    return Object.assign({}, s, {
      items: items.filter(function(i){ return i.saleId === s.saleId; }),
      payments: pays.filter(function(p){ return p.saleId === s.saleId; }),
    });
  });
}


// ===== Returns.gs =====
// Returns.gs
function createReturn(payload, user) {
  requireRole(user, ["ADMIN","SHOP_MANAGER"]);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const shopId = (user.role === "SHOP_MANAGER") ? user.shopId : payload.shopId;
    const items = payload.items || [];
    if (!shopId || !items.length) throw new Error("Invalid input");
    // validate stock
    const shopStocks = sheetToObjects(SHEETS.SHOP_STOCK);
    const smap = {};
    shopStocks.forEach(function(s){ if (s.shopId === shopId) smap[s.productId] = parseInt(s.quantity,10) || 0; });
    items.forEach(function(it){
      if ((smap[it.productId] || 0) < it.quantity) throw new Error("Cannot return more than available");
    });
    const returnId = "ret_" + Utilities.getUuid();
    // reduce shop stock
    items.forEach(function(it){
      updateShopStockQty(shopId, it.productId, (smap[it.productId] || 0) - it.quantity);
      smap[it.productId] = (smap[it.productId] || 0) - it.quantity;
    });
    appendObject(SHEETS.RETURNS, {
      returnId: returnId,
      shopId: shopId,
      status: "PENDING",
      reason: payload.reason || "",
      createdBy: user.userId,
      createdAt: new Date().toISOString(),
      confirmedBy: "",
      confirmedAt: "",
      items: JSON.stringify(items),
    });
    logStockMovement("RETURN_SENT", shopId, items, user.userId);
    logAudit("CREATE_RETURN", user.userId, "Return", returnId, payload);
    return { returnId: returnId, status: "PENDING" };
  } finally {
    lock.releaseLock();
  }
}

function confirmReturn(payload, user) {
  requireRole(user, ["ADMIN","WAREHOUSE_MANAGER"]);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const returnId = payload.returnId;
    const returns = sheetToObjects(SHEETS.RETURNS);
    const r = returns.find(function(x){ return x.returnId === returnId; });
    if (!r) throw new Error("Return not found");
    if (r.status !== "PENDING") throw new Error("Already processed");
    const items = JSON.parse(r.items || "[]");
    // add to warehouse stock
    items.forEach(function(it){
      const stocks = sheetToObjects(SHEETS.WAREHOUSE_STOCK);
      const existing = stocks.find(function(s){ return s.productId === it.productId; });
      if (existing) {
        updateRow(SHEETS.WAREHOUSE_STOCK, "productId", it.productId, { quantity: (parseInt(existing.quantity,10)||0) + it.quantity, updatedAt: new Date().toISOString() });
      } else {
        appendObject(SHEETS.WAREHOUSE_STOCK, { productId: it.productId, quantity: it.quantity, updatedAt: new Date().toISOString() });
      }
    });
    updateRow(SHEETS.RETURNS, "returnId", returnId, { status: "CONFIRMED", confirmedBy: user.userId, confirmedAt: new Date().toISOString() });
    logStockMovement("RETURN_RECEIVED", r.shopId, items, user.userId);
    logAudit("CONFIRM_RETURN", user.userId, "Return", returnId, {});
    return { returnId: returnId, status: "CONFIRMED" };
  } finally {
    lock.releaseLock();
  }
}

function listReturns(payload, user) {
  let returns = sheetToObjects(SHEETS.RETURNS);
  if (user.role === "SHOP_MANAGER") returns = returns.filter(function(r){ return r.shopId === user.shopId; });
  return returns;
}


// ===== Reports.gs =====
// Reports.gs
function submitDailyReport(payload, user) {
  requireRole(user, ["ADMIN","SHOP_MANAGER"]);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const shopId = (user.role === "SHOP_MANAGER") ? user.shopId : payload.shopId;
    const businessDate = payload.businessDate;
    if (!shopId || !businessDate) throw new Error("Invalid input");
    // duplicate check
    const existing = sheetToObjects(SHEETS.DAILY_REPORTS).find(function(r){ return r.shopId === shopId && r.businessDate === businessDate; });
    if (existing) throw new Error("Duplicate report for this date");
    const products = sheetToObjects(SHEETS.PRODUCTS);
    const pmap = {};
    products.forEach(function(p){ pmap[p.productId] = p; });
    const items = payload.items || [];
    let totalSales = 0, totalItems = 0;
    if (items.length) {
      // validate stock
      const shopStocks = sheetToObjects(SHEETS.SHOP_STOCK);
      const smap = {};
      shopStocks.forEach(function(s){ if (s.shopId === shopId) smap[s.productId] = parseInt(s.quantity,10) || 0; });
      items.forEach(function(it){
        if ((smap[it.productId] || 0) < it.quantity) throw new Error("Insufficient shop stock: " + it.productId);
      });
      // deduct stock
      items.forEach(function(it){
        const p = pmap[it.productId];
        const unitPrice = p ? parseInt(p.sellingPrice,10) : 0;
        totalSales += unitPrice * (parseInt(it.quantity,10)||0);
        totalItems += (parseInt(it.quantity,10)||0);
        updateShopStockQty(shopId, it.productId, (smap[it.productId] || 0) - (parseInt(it.quantity,10)||0));
        smap[it.productId] = (smap[it.productId] || 0) - (parseInt(it.quantity,10)||0);
      });
    } else {
      // fallback: individual sales
      const sales = sheetToObjects(SHEETS.SALES).filter(function(s){ return s.shopId === shopId && s.saleDate === businessDate; });
      const saleItems = sheetToObjects(SHEETS.SALE_ITEMS);
      sales.forEach(function(s){
        totalSales += parseInt(s.totalAmount,10) || 0;
        const its = saleItems.filter(function(i){ return i.saleId === s.saleId; });
        totalItems += its.reduce(function(a,b){ return a + (parseInt(b.quantity,10)||0); }, 0);
      });
    }
    const expenses = parseInt(payload.expenses,10) || 0;
    const loans = parseInt(payload.loans,10) || 0;
    const notes = payload.notes || "";
    const expCash = totalSales - expenses - loans;
    const expBank = 0;
    const actualCash = parseInt(payload.actualCash,10) || 0;
    const actualBank = parseInt(payload.actualBank,10) || 0;
    const totalCollected = actualCash + actualBank;
    const cashDiff = expCash - actualCash;
    const bankDiff = expBank - actualBank;
    const totalDiff = totalSales - totalCollected;
    const reportedRevenue = (payload.reportedRevenue !== undefined && payload.reportedRevenue !== null && payload.reportedRevenue !== "") ? parseInt(payload.reportedRevenue,10) : totalSales;
    const revenueDiff = totalSales - reportedRevenue;
    const reportId = "rep_" + Utilities.getUuid();
    appendObject(SHEETS.DAILY_REPORTS, {
      reportId: reportId,
      shopId: shopId,
      businessDate: businessDate,
      totalSales: totalSales,
      totalItems: totalItems,
      expectedCash: expCash,
      expectedBank: expBank,
      actualCash: actualCash,
      actualBank: actualBank,
      totalCollected: totalCollected,
      cashDiff: cashDiff,
      bankDiff: bankDiff,
      totalDiff: totalDiff,
      reportedRevenue: reportedRevenue,
      revenueDiff: revenueDiff,
       expenses: expenses,
       notes: notes,
       loans: loans,
       
      status: "PENDING",
      submittedBy: user.userId,
      submittedAt: new Date().toISOString(),
      reviewedBy: "",
      reviewedAt: "",
      reviewComment: "",
    });
    if (totalDiff !== 0) {
      appendObject(SHEETS.DISCREPANCIES, {
        discrepancyId: "disc_" + Utilities.getUuid(),
        type: "FINANCIAL_DIFFERENCE",
        reportId: reportId,
        shopId: shopId,
        businessDate: businessDate,
        expected: totalSales,
        actual: totalCollected,
        difference: totalDiff,
        status: "OPEN",
        resolution: "",
        resolvedBy: "",
        resolvedAt: "",
        createdAt: new Date().toISOString(),
      });
    }
    if (revenueDiff !== 0) {
      appendObject(SHEETS.DISCREPANCIES, {
        discrepancyId: "disc_" + Utilities.getUuid(),
        type: "REVENUE_DIFFERENCE",
        reportId: reportId,
        shopId: shopId,
        businessDate: businessDate,
        expected: totalSales,
        actual: reportedRevenue,
        difference: revenueDiff,
        status: "OPEN",
        resolution: "",
        resolvedBy: "",
        resolvedAt: "",
        createdAt: new Date().toISOString(),
      });
    }
    // missing report check not here
    logAudit("SUBMIT_DAILY_REPORT", user.userId, "DailyReport", reportId, { totalDiff: totalDiff });
    return { reportId: reportId, totalSales: totalSales, totalDiff: totalDiff, status: "PENDING" };
  } finally {
    lock.releaseLock();
  }
}

function listDailyReports(payload, user) {
  let reports = sheetToObjects(SHEETS.DAILY_REPORTS);
  if (user.role === "SHOP_MANAGER") reports = reports.filter(function(r){ return r.shopId === user.shopId; });
  else if (payload && payload.shopId) reports = reports.filter(function(r){ return r.shopId === payload.shopId; });
  return reports;
}

function reviewDailyReport(payload, user) {
  requireRole(user, ["ADMIN"]);
  const reportId = payload.reportId;
  const reports = sheetToObjects(SHEETS.DAILY_REPORTS);
  const r = reports.find(function(x){ return x.reportId === reportId; });
  if (!r) throw new Error("Report not found");
  if (r.status === "APPROVED") throw new Error("Approved reports are immutable");
  const newStatus = payload.status;
  if (["APPROVED","REJECTED","RESUBMITTED"].indexOf(newStatus) === -1) throw new Error("Invalid status");
  updateRow(SHEETS.DAILY_REPORTS, "reportId", reportId, {
    status: newStatus,
    reviewedBy: user.userId,
    reviewedAt: new Date().toISOString(),
    reviewComment: payload.comment || "",
  });
  logAudit("REVIEW_DAILY_REPORT", user.userId, "DailyReport", reportId, { status: newStatus });
  return { reportId: reportId, status: newStatus };
}


// ===== Reconciliation.gs =====
// Reconciliation.gs
function listDiscrepancies(payload, user) {
  requireRole(user, ["ADMIN"]);
  return sheetToObjects(SHEETS.DISCREPANCIES);
}

function resolveDiscrepancy(payload, user) {
  requireRole(user, ["ADMIN"]);
  const id = payload.discrepancyId;
  updateRow(SHEETS.DISCREPANCIES, "discrepancyId", id, {
    status: "RESOLVED",
    resolution: payload.resolution || "",
    resolvedBy: user.userId,
    resolvedAt: new Date().toISOString(),
  });
  logAudit("RESOLVE_DISCREPANCY", user.userId, "Discrepancy", id, payload);
  return { discrepancyId: id, status: "RESOLVED" };
}

// Detect missing daily reports: for each shop, for last N days, ensure report exists
function detectMissingReports(days) {
  days = days || 7;
  const shops = listShops();
  const reports = sheetToObjects(SHEETS.DAILY_REPORTS);
  const missing = [];
  const today = new Date();
  for (let d = 1; d <= days; d++) {
    const dt = new Date(today.getTime() - d*86400000);
    const ds = dt.toISOString().slice(0,10);
    shops.forEach(function(sh){
      const has = reports.some(function(r){ return r.shopId === sh.shopId && r.businessDate === ds; });
      if (!has) missing.push({ shopId: sh.shopId, shopName: sh.shopName, businessDate: ds });
    });
  }
  return missing;
}


// ===== AuditLogs.gs =====
// AuditLogs.gs
function logAudit(action, userId, entity, entityId, details) {
  try {
    appendObject(SHEETS.AUDIT_LOGS, {
      auditId: "aud_" + Utilities.getUuid(),
      action: action,
      userId: userId || "",
      entity: entity || "",
      entityId: entityId || "",
      details: JSON.stringify(details || {}),
      createdAt: new Date().toISOString(),
    });
  } catch (e) {}
}

function logStockMovement(type, ref, items, userId) {
  try {
    appendObject(SHEETS.STOCK_MOVEMENTS, {
      movementId: "mv_" + Utilities.getUuid(),
      type: type,
      details: JSON.stringify({ ref: ref, items: items }),
      createdAt: new Date().toISOString(),
      userId: userId || "",
    });
  } catch (e) {}
}

function getAuditLogs() {
  return sheetToObjects(SHEETS.AUDIT_LOGS);
}

function getStockMovements() {
  return sheetToObjects(SHEETS.STOCK_MOVEMENTS);
}


// ===== Seed.gs =====
// Seed.gs (backend) - run seedProducts() once after initDatabase
const SEED_PRODUCTS = [
["Ambasha-pieces","አምባሻ ቁራጭ",2,200.00],
["Bans","ባንስ",22,80.00],
["Barley Bread","የገብስ ዳቦ",48,20.00],
["Biscuit","ቢስኩት",85,40.00],
["Bombolino","ቦምቦሊኖ",38,50.00],
["Bread 20","ዳቦ 20",293,20.00],
["Bread 80","ዳቦ 80",7,80.00],
["Brown Bread","ቡናማ ዳቦ",0,80.00],
["Coca","ኮካ",11,70.00],
["Cookies -20","ኩኪስ 20",158,20.00],
["Cookies -200","ኩኪስ 200",12,200.00],
["Cream Cake","ክሪም ኬክ",7,100.00],
["Cup Cake","ካፕ ኬክ",7,80.00],
["Cup Cake 50","ካፕ ኬክ 50",0,50.00],
["Dabo Kolo","ዳቦ ቆሎ",31,100.00],
["Dabo kolo -200","ዳቦ ቆሎ 200",0,200.00],
["Difo Bread","ድፎ ዳቦ",5,1000.00],
["Donat","ዶናት",17,70.00],
["Energy","ኢነርጂ",4,80.00],
["English Cake","እንግሊዝ ኬክ",13,80.00],
["Eskons","ኤስኮንስ",44,20.00],
["Flower","ፍላወር",19,80.00],
["Ginger","ዝንጅብል",40,30.00],
["Heath Bread","ሄልዝ ዳቦ",30,20.00],
["Injera","እንጀራ",537,30.00],
["KK","ኬኬ",27,30.00],
["Mafn","ማፍን",0,80.00],
["Mini Difo","ሚኒ ድፎ",10,80.00],
["Mirinda","ሚሪንዳ",9,120.00],
["Mitin","ሚቲን",0,80.00],
["Mulmul","ሙልሙል",26,40.00],
["Pepsi","ፔፕሲ",5,100.00],
["School Vanus","ስኩል ቫኑስ",40,80.00],
["Sinamon","ሲናሞን",0,80.00],
["Slice Cake","ስላይስ ኬክ",0,80.00],
["Special Torta","ስፔሻል ቶርታ",0,2000.00],
["Sprite","ስፕራይት",12,70.00],
["Teramiso","ተራሚሶ",3,100.00],
["Torta","ቶርታ",1,1200.00],
["Torta 1/2","ቶርታ 1/2",0,1000.00],
["VC Orange","ቪሲ ኦሬንጅ",13,70.00],
["Venus","ቬኑስ",10,80.00],
["Venus 1/2","ቬኑስ 1/2",15,50.00],
["Water 1/2L","ውሃ 1/2 ሊትር",8,30.00],
["Water 2L","ውሃ 2 ሊትር",18,70.00],
["White Bread","ነጭ ዳቦ",0,80.00],
["Yellow Bread","ቢጫ ዳቦ",0,80.00],
["Zebib","ዘቢብ",1,80.00],
["Zebra","ዘብራ",13,80.00]
];

function seedUsers() {
  const existing = sheetToObjects(SHEETS.USERS);
  if (existing.length > 0) return { inserted: 0, message: "Users already exist" };
  const rows = [
    ["u_admin","Admin User","admin@demo.com","ADMIN",""],
    ["u_wh","Warehouse Manager","warehouse@demo.com","WAREHOUSE_MANAGER",""],
    ["u_shop1","Gombora Shop Manager","gombora@demo.com","SHOP_MANAGER","shop_1"],
    ["u_shop2","Hospital Shop Manager","hospital@demo.com","SHOP_MANAGER","shop_2"],
  ];
  rows.forEach(function(r){
    appendObject(SHEETS.USERS, { userId: r[0], name: r[1], email: r[2], role: r[3], shopId: r[4], active: true, createdAt: new Date().toISOString() });
  });
  // shops
  const shops = sheetToObjects(SHEETS.SHOPS);
  if (shops.length === 0) {
    appendObject(SHEETS.SHOPS, { shopId: "shop_1", shopName: "Gombora Branch", location: "Gombora", managerId: "u_shop1", active: true, createdAt: new Date().toISOString() });
    appendObject(SHEETS.SHOPS, { shopId: "shop_2", shopName: "Hospital Branch", location: "Hospital", managerId: "", active: true, createdAt: new Date().toISOString() });
  }
  return { inserted: rows.length };
}

function seedProducts() {
  const existing = sheetToObjects(SHEETS.PRODUCTS);
  if (existing.length > 0) return { inserted: 0, message: "Products already exist" };
  let count = 0;
  SEED_PRODUCTS.forEach(function(row, idx) {
    const name = row[0], nameAm = row[1], qty = row[2], price = row[3];
    const pid = "p_" + (idx + 1);
    const sku = name.toUpperCase().replace(/[^A-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    appendObject(SHEETS.PRODUCTS, {
      productId: pid,
      productName: name,
      productNameAm: nameAm,
      sku: sku,
      sellingPrice: Math.round(price * 100),
      active: true,
      createdAt: new Date().toISOString(),
    });
    appendObject(SHEETS.WAREHOUSE_STOCK, { productId: pid, quantity: qty, updatedAt: new Date().toISOString() });
    count++;
  });
  return { inserted: count };
}


// ===== Code.gs =====
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


