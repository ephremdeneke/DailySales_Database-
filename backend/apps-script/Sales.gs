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
