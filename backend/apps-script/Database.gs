// Database.gs
const HEADERS = {};
HEADERS[SHEETS.USERS] = ["userId","name","email","role","shopId","password","active","createdAt"];
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
      // add any missing columns to existing sheets
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
