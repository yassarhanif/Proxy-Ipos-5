const FORBIDDEN = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE',
  'TRUNCATE', 'EXECUTE', 'CALL', 'MERGE', 'REPLACE',
];

function isReadOnlyQuery(sql) {
  const trimmed = sql.trim();
  if (!/^\s*SELECT\b/i.test(trimmed)) {
    return false;
  }
  const upper = trimmed.toUpperCase();
  for (const word of FORBIDDEN) {
    if (upper.includes(word)) {
      return false;
    }
  }
  if (/\bINTO\b/i.test(trimmed)) {
    return false;
  }
  return true;
}

function injectLimit(sql, maxRows = 1000) {
  const trimmed = sql.trim();
  if (/\bLIMIT\s+\d+/i.test(trimmed)) {
    return { sql: trimmed, truncated: false };
  }
  const semiIndex = trimmed.lastIndexOf(';');
  const base = semiIndex >= 0 ? trimmed.slice(0, semiIndex) : trimmed;
  return { sql: `${base} LIMIT ${maxRows}`, truncated: true };
}

module.exports = { isReadOnlyQuery, injectLimit };
