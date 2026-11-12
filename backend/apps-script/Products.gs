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
