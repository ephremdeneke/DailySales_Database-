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
