#!/usr/bin/env node
/**
 * Build the Vercel serverless function as a standalone bundle.
 * Uses esbuild to bundle all workspace packages into a single file.
 */
import { build } from "esbuild";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [resolve(__dirname, "entry.ts")],
  bundle: true,
  outfile: resolve(__dirname, "index.js"),
  platform: "node",
  target: "node20",
  format: "esm",
  sourcemap: false,
  external: [
    // Node builtins
    "crypto", "fs", "path", "os", "net", "http", "https", "stream",
    "url", "util", "events", "buffer", "child_process", "tls", "zlib",
    "querystring", "string_decoder", "dgram", "dns", "cluster", "worker_threads",
    "perf_hooks", "async_hooks", "v8", "vm", "readline", "tty", "assert",
    "node:*",
    // Native/binary modules
    "pg-native",
    "better-sqlite3",
    "lightningcss",
    "@parcel/css",
    "bun:*",
    // Heavy deps with native bindings
    "@aws-sdk/*",
    "sharp",
    "canvas",
  ],
  banner: {
    js: `
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
`,
  },
  logLevel: "info",
});

console.log("✅ API function bundled successfully");
