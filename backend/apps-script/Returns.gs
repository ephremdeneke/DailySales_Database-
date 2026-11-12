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
