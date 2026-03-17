/**
 * Vercel serverless entry point — gets bundled by esbuild.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createDb } from "../packages/db/src/index.js";
import { createApp } from "../server/src/app.js";

let appPromise: Promise<any> | null = null;

async function initApp() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  
  const db = createDb(databaseUrl);
  
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
