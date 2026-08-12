import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
let cachedAdmin = null;

const normalizeServiceAccount = (raw) => {
  if (!raw || typeof raw !== "object") return raw;
  const normalized = { ...raw };
  if (typeof normalized.private_key === "string") {
    let key = normalized.private_key.trim();
    if (
      (key.startsWith('"') && key.endsWith('"')) ||
      (key.startsWith("'") && key.endsWith("'"))
    ) {
      key = key.slice(1, -1);
    }
    normalized.private_key = key.replace(/\\n/g, "\n");
  }
  return normalized;
};

const parseJson = (rawJson, label) => {
  if (!rawJson || typeof rawJson !== "string") return null;
  try {
    return normalizeServiceAccount(JSON.parse(rawJson));
  } catch (error) {
    console.error(`[firebase] Invalid ${label} JSON:`, error.message);
    return null;
  }
};

const parseBase64 = (rawBase64, label) => {
  if (!rawBase64 || typeof rawBase64 !== "string") return null;
  try {
    const decoded = Buffer.from(rawBase64, "base64").toString("utf8");
    return normalizeServiceAccount(JSON.parse(decoded));
  } catch (error) {
    console.error(`[firebase] Invalid ${label} base64 JSON:`, error.message);
    return null;
  }
};

const resolveFilePaths = () => {
  const configuredPath = (process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "").trim();
  const candidates = [];
  if (configuredPath) {
    candidates.push(
      path.isAbsolute(configuredPath)
        ? configuredPath
        : path.resolve(process.cwd(), configuredPath)
    );
  }
  candidates.push(path.resolve(process.cwd(), "firebase-service-account.json"));
  return Array.from(new Set(candidates));
};

const readServiceAccountFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return null;
    return normalizeServiceAccount(JSON.parse(fs.readFileSync(filePath, "utf8")));
  } catch (error) {
    console.error(`[firebase] Failed to parse service account file (${filePath}):`, error.message);
    return null;
  }
};

const resolveCandidates = () => {
  const candidates = [];
  for (const filePath of resolveFilePaths()) {
    const value = readServiceAccountFile(filePath);
    if (value) candidates.push({ source: `file:${filePath}`, value });
  }

  const rawJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT;
  const parsedJson = parseJson(
    rawJson,
    "FIREBASE_SERVICE_ACCOUNT_JSON/FIREBASE_SERVICE_ACCOUNT"
  );
  if (parsedJson) candidates.push({ source: "env-json", value: parsedJson });

  const parsedBase64 = parseBase64(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    "FIREBASE_SERVICE_ACCOUNT_JSON"
  );
  if (parsedBase64) candidates.push({ source: "env-base64", value: parsedBase64 });

  return candidates;
};

export const ensureFirebaseAdmin = () => {
  if (cachedAdmin) return cachedAdmin;

  let admin;
  try {
    admin = require("firebase-admin");
  } catch (_) {
    return null;
  }

  if (admin.apps?.length > 0) {
    cachedAdmin = admin;
    return cachedAdmin;
  }

  const candidates = resolveCandidates();
  if (!candidates.length) {
    console.warn(
      "[firebase] No service account found. Set FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT, or add firebase-service-account.json"
    );
    return null;
  }

  for (const candidate of candidates) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(candidate.value),
      });
      cachedAdmin = admin;
      console.log(`[firebase] initialized from ${candidate.source}`);
      return cachedAdmin;
    } catch (error) {
      console.error(`[firebase] initializeApp failed for ${candidate.source}:`, error.message);
    }
  }
  return null;
};
