// Downloads the engine wasm files that are too large to keep in git.
// Files are pinned to an npm release of stockfish.js and verified by sha256,
// so the wasm always matches the js loader committed in public/engines.

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENGINES_DIR = path.join(ROOT, "public", "engines");
const CDN = "https://unpkg.com";

const ENGINE_FILES = [
  {
    pkg: "stockfish@18.0.7",
    src: "bin/stockfish-18-lite.wasm",
    dest: "stockfish-18/stockfish-18-lite.wasm",
    sha256: "1QE2kZ3NkOdeuN94slXUfWGJYrZwAos4lhND9utAkXQ=",
  },
  {
    pkg: "stockfish@18.0.7",
    src: "bin/stockfish-18-lite-single.wasm",
    dest: "stockfish-18/stockfish-18-lite-single.wasm",
    sha256: "qPvAXsaSC1bXSFgm3LAsX/0oJry/dRz5cwRvI3qQlvE=",
  },
  {
    pkg: "stockfish@19.0.0",
    src: "bin/stockfish-19-lite.wasm",
    dest: "stockfish-19/stockfish-19-lite.wasm",
    sha256: "GHJ8mt4RqMoEORq1opgjK8b//r4gAufP/6yC561FNEc=",
  },
  {
    pkg: "stockfish@19.0.0",
    src: "bin/stockfish-19-lite-single.wasm",
    dest: "stockfish-19/stockfish-19-lite-single.wasm",
    sha256: "V6wtcjEqujRnYOPxc/aHqMIRII6XqHJoQ29/DhC7U4c=",
  },
];

const sha256 = (buffer) =>
  createHash("sha256").update(buffer).digest("base64");

const readIfExists = async (filePath) => {
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
};

const fetchWithRetry = async (url, attempts = 3) => {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (error) {
      if (i >= attempts) throw new Error(`${url}: ${error.message}`);
      console.warn(`Retrying ${url} (${error.message})`);
    }
  }
};

const ensureFile = async ({ pkg, src, dest, sha256: expected }) => {
  const destPath = path.join(ENGINES_DIR, dest);

  const existing = await readIfExists(destPath);
  if (existing && sha256(existing) === expected) return false;

  const url = `${CDN}/${pkg}/${src}`;
  const data = await fetchWithRetry(url);

  const actual = sha256(data);
  if (actual !== expected) {
    throw new Error(
      `Checksum mismatch for ${url}: expected ${expected}, got ${actual}`
    );
  }

  await mkdir(path.dirname(destPath), { recursive: true });
  await writeFile(`${destPath}.tmp`, data);
  await rename(`${destPath}.tmp`, destPath);

  console.log(`Downloaded ${dest} (${(data.length / 1e6).toFixed(1)} MB)`);
  return true;
};

const results = await Promise.all(ENGINE_FILES.map(ensureFile));
const downloaded = results.filter(Boolean).length;
console.log(
  `Engine files ready (${downloaded} downloaded, ${
    results.length - downloaded
  } already present)`
);
