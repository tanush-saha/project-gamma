import { readFile } from "node:fs/promises";

const requiredVariables = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
];

let localConfig = "";
try {
  localConfig = await readFile(".env.local", "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const localValues = Object.fromEntries(localConfig.split(/\r?\n/).flatMap((line) => {
  const match = line.match(/^\s*(VITE_FIREBASE_[A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  return match ? [[match[1], match[2].replace(/^(['"])(.*)\1$/, "$2")]] : [];
}));
const isConfiguredValue = (value) => typeof value === "string"
  && value.trim().length > 0
  && !/^(your-|replace-|<|example)/i.test(value.trim());
const missing = requiredVariables.filter((name) => !isConfiguredValue(process.env[name] || localValues[name]));
if (missing.length) {
  const message = `Firebase cloud features are disabled because configuration is missing: ${missing.join(", ")}.`;
  if (process.env.REQUIRE_FIREBASE_CONFIG === "true") {
    console.error(message);
    console.error("Set these as GitHub Actions repository variables/secrets or configure .env.local.");
    process.exit(1);
  }
  console.warn(`${message} Building the public site in guest mode.`);
}
