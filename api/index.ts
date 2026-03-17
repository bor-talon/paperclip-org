/**
 * Vercel serverless entry point.
 * Uses relative imports to work with Vercel's bundler in a monorepo.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

let appPromise: Promise<any> | null = null;

async function initApp() {
  console.log("[vercel] Starting app init...");
  
  // Use relative imports so Vercel's bundler can trace them
  const { createDb } = await import("../packages/db/src/index.js");
  console.log("[vercel] createDb imported");
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  
  const db = createDb(databaseUrl);
  console.log("[vercel] DB created");
  
  const { createApp } = await import("../server/src/app.js");
  console.log("[vercel] createApp imported");
  
  const app = await createApp(db as any, {
    uiMode: "external" as any,
    serverPort: 3000,
    storageService: {
      uploadFile: async () => ({ url: "", key: "" }),
      deleteFile: async () => {},
      getSignedUrl: async (key: string) => key,
    } as any,
    deploymentMode: "cloud" as any,
    deploymentExposure: "public" as any,
    allowedHostnames: [],
    bindHost: "0.0.0.0",
    authReady: true,
    companyDeletionEnabled: false,
  });
  console.log("[vercel] App created successfully");
  
  return app;
}

function getApp() {
  if (!appPromise) {
    appPromise = initApp().catch(err => {
      console.error("[vercel] INIT ERROR:", err.message, err.stack);
      appPromise = null;
      throw err;
    });
  }
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    return (app as any)(req, res);
  } catch (err: any) {
    console.error("[vercel] HANDLER ERROR:", err.message);
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
}
