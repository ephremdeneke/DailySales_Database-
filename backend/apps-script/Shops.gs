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
