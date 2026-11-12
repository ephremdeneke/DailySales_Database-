// Auth.gs
function getClientId() {
  return PropertiesService.getScriptProperties().getProperty("GOOGLE_CLIENT_ID") || "";
}

function verifyGoogleToken(idToken) {
  if (!idToken) return null;
  try {
    const url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken);
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return null;
    const info = JSON.parse(res.getContentText());
    const clientId = getClientId();
    if (clientId && info.aud !== clientId) return null;
    return info;
  } catch (e) {
    return null;
  }
}

function getRegisteredUserByEmailOrName(identifier) {
  const users = sheetToObjects(SHEETS.USERS);
  const key = String(identifier || "").toLowerCase().trim();
  return users.find(function(u){
    return u.active !== false && u.active !== "FALSE" && (
      String(u.email || "").toLowerCase() === key ||
      String(u.name || "").toLowerCase() === key ||
      String(u.userId || "").toLowerCase() === key
    );
  });
}

function getRegisteredUserById(userId) {
  const users = sheetToObjects(SHEETS.USERS);
  return users.find(function(u){ return String(u.userId) === String(userId) && u.active !== false && u.active !== "FALSE"; });
}

// Login by username/email/name (no password) - used when Google OAuth not configured
function loginUser(payload) {
  const identifier = payload.username || payload.email || payload.name || payload.idToken;
  const user = getRegisteredUserByEmailOrName(identifier);
  if (!user) return { ok: false, error: "User not found. Check the Users sheet." };
  return { ok: true, user: { userId: user.userId, name: user.name, email: user.email, role: user.role, shopId: user.shopId }, token: String(user.userId) };
}

function authenticate(payload) {
  const idToken = payload && payload.idToken;
  const clientId = getClientId();
  // Google OAuth mode
  if (clientId && idToken) {
    const info = verifyGoogleToken(idToken);
    if (info && info.email) {
      const user = getRegisteredUserByEmailOrName(info.email);
      if (user) return { ok: true, user: { userId: user.userId, name: user.name, email: user.email, role: user.role, shopId: user.shopId } };
      return { ok: false, error: "Account not registered" };
    }
  }
  // Simple token mode (userId stored as token)
  if (idToken) {
    const user = getRegisteredUserById(idToken);
    if (user) return { ok: true, user: { userId: user.userId, name: user.name, email: user.email, role: user.role, shopId: user.shopId } };
  }
  // Username passed directly
  if (payload && (payload.username || payload.email || payload.name)) {
    const r = loginUser(payload);
    if (r.ok) return { ok: true, user: r.user };
  }
  return { ok: false, error: "Unauthenticated" };
}

function requireAuth(payload) {
  const r = authenticate(payload);
  if (!r.ok) throw new Error(r.error);
  return r.user;
}

function requireRole(user, roles) {
  if (roles.indexOf(user.role) === -1) throw new Error("Forbidden");
}
