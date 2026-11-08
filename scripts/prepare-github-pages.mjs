import { access, copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

await copyFile("dist/index.html", "dist/404.html");
await writeFile("dist/.nojekyll", "");

const html = await readFile("dist/index.html", "utf8");
if (html.includes("/src/main.jsx")) {
  throw new Error("GitHub Pages output still points to the Vite source entry instead of built assets.");
}

const basePath = new URL(process.env.VITE_BASE_PATH || "/", "https://pages.invalid").pathname;
const assetPaths = [...html.matchAll(/\b(?:src|href)="([^"]+\.(?:js|css))"/g)]
  .map((match) => new URL(match[1], "https://pages.invalid").pathname);
if (!assetPaths.some((assetPath) => assetPath.endsWith(".js"))) {
  throw new Error("GitHub Pages output does not reference a built JavaScript bundle.");
}

for (const assetPath of assetPaths) {
  if (!assetPath.startsWith(basePath)) {
    throw new Error(`Built asset "${assetPath}" is outside the configured base path "${basePath}".`);
  }
  const relativeAsset = path.normalize(assetPath.slice(basePath.length));
  if (relativeAsset.startsWith("..") || path.isAbsolute(relativeAsset)) {
    throw new Error(`Invalid built asset path: ${assetPath}`);
  }
  await access(path.join("dist", relativeAsset));
}
