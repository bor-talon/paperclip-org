/**
 * Vercel serverless entry point.
 * Creates a slim Express app for the Paperclip API.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createDb } from "@paperclipai/db";
import { createApp } from "../server/src/app.js";

let appPromise: ReturnType<typeof createApp> | null = null;

function getApp() {
  if (!appPromise) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is required");

    const db = createDb(databaseUrl);

    appPromise = createApp(db as any, {
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
  }
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    return (app as any)(req, res);
  } catch (err: any) {
    console.error("Vercel handler error:", err);
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
}
