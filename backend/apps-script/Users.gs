// Users.gs (backend)
function listUsers(user) {
  requireRole(user, ["ADMIN"]);
  return sheetToObjects(SHEETS.USERS);
}

function createUser(payload, user) {
  requireRole(user, ["ADMIN"]);
  if (!payload.name || !payload.email || !payload.role) throw new Error("Missing fields");
  const u = {
    userId: "u_" + Utilities.getUuid(),
    name: payload.name,
    email: payload.email,
    role: payload.role,
    shopId: payload.shopId || "",
    active: true,
    createdAt: new Date().toISOString(),
  };
  appendObject(SHEETS.USERS, u);
  logAudit("CREATE_USER", user.userId, "User", u.userId, u);
  return u;
}

function updateUser(payload, user) {
  requireRole(user, ["ADMIN"]);
  if (!payload.userId) throw new Error("userId required");
  const updates = {};
  ["name","email","role","shopId","active"].forEach(function(k){
    if (payload[k] !== undefined) updates[k] = payload[k];
  });
  updateRow(SHEETS.USERS, "userId", payload.userId, updates);
  logAudit("UPDATE_USER", user.userId, "User", payload.userId, updates);
  return { userId: payload.userId, ...updates };
}
