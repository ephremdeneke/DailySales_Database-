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
