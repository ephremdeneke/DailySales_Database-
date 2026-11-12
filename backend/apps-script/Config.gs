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
