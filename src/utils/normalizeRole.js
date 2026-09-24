const normalizeRole = (role) => role === "user" ? "author" : (role || "reader");

module.exports = normalizeRole;
