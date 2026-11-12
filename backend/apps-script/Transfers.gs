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
