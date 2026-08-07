export const safeText = (v, fallback = "-") => {
  const s = String(v ?? "").trim();
  return s ? s : fallback;
};

export const normalizeDate = (v) => {
  const s = String(v || "").trim();
  if (!s) return "";

  // already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY or DD-MM-YYYY or MM/DD/YYYY (we convert consistently)
  const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const yyyy = m[3];

    // Pakistan style default DD/MM
    const dd = String(a).padStart(2, "0");
    const mm = String(b).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  return s;
};
