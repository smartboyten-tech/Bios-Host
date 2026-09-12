const express = require("express");
const fs      = require("fs");
const path    = require("path");

const app  = express();
const PORT = 3000;
const HWID_FILE = path.join(__dirname, "hwids.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve HTML ────────────────────────────────────────────────────────────────
app.use(express.static(__dirname));

// ── Helpers ───────────────────────────────────────────────────────────────────
function load() {
    try { return JSON.parse(fs.readFileSync(HWID_FILE, "utf-8")); }
    catch { return []; }
}
function save(list) {
    fs.writeFileSync(HWID_FILE, JSON.stringify(list, null, 2), "utf-8");
}

// ── Auth API (DLL call করে) ───────────────────────────────────────────────────
// GET /api/auth?hwid=XXXX
app.get("/api/auth", (req, res) => {
    const hwid = (req.query.hwid || "").trim();
    if (!hwid) return res.status(400).json({ status: "error" });
    const list = load();
    const found = list.some(h => h.hwid.trim().toLowerCase() === hwid.toLowerCase());
    res.json({ status: found ? "authorized" : "unauthorized" });
});

// ── Admin API (HTML panel call করে) ──────────────────────────────────────────
// GET /admin/list
app.get("/admin/list", (req, res) => {
    res.json({ hwids: load() });
});

// POST /admin/add
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

// POST /admin/remove
app.post("/admin/remove", (req, res) => {
    const hwid = (req.body.hwid || "").trim();
    const list = load().filter(h => h.hwid !== hwid);
    save(list);
    res.json({ success: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ Server:  http://localhost:${PORT}`);
    console.log(`📋 Panel:   http://localhost:${PORT}/hwid-manager.html`);
    console.log(`🔑 API:     http://localhost:${PORT}/api/auth?hwid=YOUR_HWID`);
});
