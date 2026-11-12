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

