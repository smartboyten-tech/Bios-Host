const express = require("express");
const fs      = require("fs");
const path    = require("path");

const app  = express();
const PORT = process.env.PORT || 3000;
const HWID_FILE = path.join(__dirname, "hwids.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS — Netlify থেকে request allow করো
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function load() {
    try { return JSON.parse(fs.readFileSync(HWID_FILE, "utf-8")); }
    catch { return []; }
}
function save(list) {
    fs.writeFileSync(HWID_FILE, JSON.stringify(list, null, 2), "utf-8");
}

// ── Auth API (DLL call করে) ───────────────────────────────────────────────────
app.get("/api/auth", (req, res) => {
    const hwid = (req.query.hwid || "").trim();
    if (!hwid) return res.status(400).json({ status: "error" });
    const list = load();
    const found = list.some(h => h.hwid.trim().toLowerCase() === hwid.toLowerCase());
    res.json({ status: found ? "authorized" : "unauthorized" });
});

// ── Admin API ─────────────────────────────────────────────────────────────────
app.get("/admin/list", (req, res) => {
    res.json({ hwids: load() });
});

app.post("/admin/add", (req, res) => {
    const hwid = (req.body.hwid || "").trim();
    const note = (req.body.note || "No note").trim();
    if (!hwid) return res.json({ success: false, message: "No HWID" });
    const list = load();
    if (list.some(h => h.hwid === hwid))
        return res.json({ success: false, message: "HWID already exists" });
    list.push({ hwid, note });
    save(list);
    res.json({ success: true });
});

app.post("/admin/remove", (req, res) => {
    const hwid = (req.body.hwid || "").trim();
    const list = load().filter(h => h.hwid !== hwid);
    save(list);
    res.json({ success: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
