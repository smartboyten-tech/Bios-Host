const express  = require("express");
const admin    = require("firebase-admin");
const path     = require("path");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Firebase Init ─────────────────────────────────────────────────────────────
const serviceAccount = {
  type: "service_account",
  project_id: "fc-tournament-maf",
  private_key_id: "ba633bcffac57692134e743eabfc6e80094f471e",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDI/zIZV9j9WIdF\nwmR3HFZ8NqOebdaPxL7ikXB0YDI+1qZQIqpDZcNpMjlRyF87u2Fmz1m2uc7r/94u\nZBLT7dFSF0rmZhQMJrOMk0NVEJ6xtKMEoH0O0qaHWnuSSYAvHReBAOu+cdz3Lnzm\np+RC8oWOP90OA8/MSpWCE0LyTHqcT5o5LXmN5tgnz7Cy+x1yoqAbEt106CuN91CK\n75cfVRoSDLyPP/vFTesGCqFXOkhRJChQtiotHmazLysAqFbBMsZ+09L2V4m5oWqQ\n0VyC3MEZvGy8cZykaFzHlbHwLUq+c569U3M80JnJboF+8sf5wNjFQGdHcccNXMtV\nIo5QFlj9AgMBAAECggEABGraDq/dPKbUb5ZidN0HkuVJ2p0us6wu8cshKJLwp8GP\nQtWa3lj/NBxUIYBWL3mNHiBSfW8/T/UooeZgejiQ0CK46lq1+BUQVHeWvuja7qw5\n+ku4qTm8n97qNlXX3lvfp13TezUEwTNMBW8NLOIoSJm4tv/Nx6n1TTg1Jsltgb/o\nIB/TdKpD8+mMSZvcmVKHTZqQgjNdBos+ZfONZv5kYY4OQdESZPUKoIO8XEn1OszG\nTF+/fd5z2GAZSCoG8MzCXS8EccqDtldQxej2bm0+0yuIczMsuY7nwQHK0mTx0/ct\nuwqBFzoW9JzjCxdlm2jIfFLHsu0Mv1AooaGJYxI/dQKBgQDyOQMIYwYZSwCd2K8d\nUC6ASwPEJwcDaF7A1tW7cJ2qVo31yvt+XMRVQw0yEwBr4me4/5tX9PVEG03lcKQB\nCIZYQuOg3hAKaZtXUNU/ia5WIvEBL4/kKxGp4hRiX3FghNXhiaFGC81HZdL7/NNX\n82L6vZdzmjmidzJCjeWl9lo91wKBgQDUbeWsYo8dJlyxuK2ZqpPEyb5EmF+5bvQL\n90tTFWz1GoG2fzAhkpVjuAY5pRhaulUnAsYfuKyXsWy8xvEe5AkPv2VFj7nAcvlC\nA4rGZ9mm5+trxoj78WBrOZiQwvTeoP+bguy/OGL4kQSBqUPeMmBBe/iS6/IdDqEJ\nBePMkyY9SwKBgQDrybu+CkcBkBVFkozEiCz8DgnYg/U7x/mU1oywLewMyLzgK3ut\ngjhMlzzdJcofOwGlAI0DjhzC86FcW84Kg3XjrRlQm1oaCLuCv9kWRLxEdTcN5HK5\ntYM4UC9vo2EGh8h8CDHJseteOSysx2wkDXSoiK5JhjPchxOR3fdTGwC1eQKBgQC8\nUEPnImP+ElDf13hFnfpq2/EIvA83wk0kAnBK0daKHZpZnrybNmeqQ6t5FIrXexEb\niRD7c+nEe6uKWc3MdZg21pO/K58eJI4kYCF4qv0+QZ/oJdKvjZXM1/0Qb1NFvHF7\neX/IMANEmMHm85dPdVbxFiYQkItMCPjml8sOQnAGqwKBgQCo2eoLwKdbeUPnLtfV\nSR+UV7PgpF+LrQqPIwEu6NxQjjYBdjZn43XeqMg5O6nYj3Hu56y7fEFXf9LGxiVU\n0WSORKRsNeAQqv+fHgiNA14r9+mHwIphBg80Eol1fKUY0/xmVMKg5+SNmeSu3cW9\nxXidaUFuvhKYq6FgA4bhifUwIg==\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@fc-tournament-maf.iam.gserviceaccount.com",
  client_id: "102862464584979953913",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40fc-tournament-maf.iam.gserviceaccount.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fc-tournament-maf-default-rtdb.firebaseio.com"
});

const db = admin.database();
const hwidsRef = db.ref("hwids");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ── Auto remove expired HWIDs ─────────────────────────────────────────────────
async function removeExpired() {
  const snap = await hwidsRef.once("value");
  const data = snap.val() || {};
  const now  = Date.now();
  for (const [key, val] of Object.entries(data)) {
    if (val.expiresAt && val.expiresAt <= now) {
      await hwidsRef.child(key).remove();
      console.log(`Removed expired HWID: ${val.hwid}`);
    }
  }
}

// প্রতি 10 মিনিটে expired check
setInterval(removeExpired, 10 * 60 * 1000);

// ── Auth API (DLL call করে) ───────────────────────────────────────────────────
app.get("/api/auth", async (req, res) => {
  const hwid = (req.query.hwid || "").trim();
  if (!hwid) return res.status(400).json({ status: "error" });

  await removeExpired();

  const snap = await hwidsRef.once("value");
  const data = snap.val() || {};
  const found = Object.values(data).some(
    h => h.hwid && h.hwid.trim().toLowerCase() === hwid.toLowerCase()
  );

  res.json({ status: found ? "authorized" : "unauthorized" });
});

// ── Admin: List ───────────────────────────────────────────────────────────────
app.get("/admin/list", async (req, res) => {
  await removeExpired();
  const snap = await hwidsRef.once("value");
  const data = snap.val() || {};
  const hwids = Object.values(data);
  res.json({ hwids });
});

// ── Admin: Add ────────────────────────────────────────────────────────────────
app.post("/admin/add", async (req, res) => {
  const hwid      = (req.body.hwid || "").trim();
  const note      = (req.body.note || "No note").trim();
  const expiresAt = req.body.expiresAt || null;

  if (!hwid) return res.json({ success: false, message: "No HWID" });

  // duplicate check
  const snap = await hwidsRef.once("value");
  const data = snap.val() || {};
  const exists = Object.values(data).some(h => h.hwid === hwid);
  if (exists) return res.json({ success: false, message: "HWID already exists" });

  await hwidsRef.push({ hwid, note, expiresAt, added: new Date().toISOString() });
  res.json({ success: true });
});

// ── Admin: Remove ─────────────────────────────────────────────────────────────
app.post("/admin/remove", async (req, res) => {
  const hwid = (req.body.hwid || "").trim();
  const snap = await hwidsRef.once("value");
  const data = snap.val() || {};
  for (const [key, val] of Object.entries(data)) {
    if (val.hwid === hwid) {
      await hwidsRef.child(key).remove();
      break;
    }
  }
  res.json({ success: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  removeExpired();
});
