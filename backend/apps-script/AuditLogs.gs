// AuditLogs.gs
function logAudit(action, userId, entity, entityId, details) {
  try {
    appendObject(SHEETS.AUDIT_LOGS, {
      auditId: "aud_" + Utilities.getUuid(),
      action: action,
      userId: userId || "",
      entity: entity || "",
      entityId: entityId || "",
      details: JSON.stringify(details || {}),
      createdAt: new Date().toISOString(),
    });
  } catch (e) {}
}

function logStockMovement(type, ref, items, userId) {
  try {
    appendObject(SHEETS.STOCK_MOVEMENTS, {
      movementId: "mv_" + Utilities.getUuid(),
      type: type,
      details: JSON.stringify({ ref: ref, items: items }),
      createdAt: new Date().toISOString(),
      userId: userId || "",
    });
  } catch (e) {}
}

function getAuditLogs() {
  return sheetToObjects(SHEETS.AUDIT_LOGS);
}

function getStockMovements() {
  return sheetToObjects(SHEETS.STOCK_MOVEMENTS);
}
