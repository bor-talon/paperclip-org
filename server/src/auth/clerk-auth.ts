/**
 * Clerk authentication integration for Paperclip.
 *
 * Provides a `resolveSession` function compatible with the existing
 * `BetterAuthSessionResult` interface so Clerk slots in without
 * changing the rest of the server.
 */

import type { Request, RequestHandler } from "express";
import { clerkMiddleware, getAuth, createClerkClient, verifyToken } from "@clerk/express";
import type { BetterAuthSessionResult } from "./better-auth.js";

export type { BetterAuthSessionResult as ClerkSessionResult };

/** Module-level Clerk client singleton — reused across all requests. */
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
});

/**
 * Returns the Express middleware that installs Clerk's auth context on every
 * request. Must be mounted before any route that calls `resolveClerkSession`.
 */
export function createClerkMiddleware(): RequestHandler {
  return clerkMiddleware() as RequestHandler;
}

/**
 * Resolves the Clerk session from an Express request.
 * Compatible with the `resolveSession` slot in `actorMiddleware`.
 */
export async function resolveClerkSession(
  req: Request,
): Promise<BetterAuthSessionResult | null> {
  const auth = getAuth(req);
  if (!auth?.userId) return null;

  const userId = auth.userId;
  let email: string | null = null;
  let name: string | null = null;

  try {
    const user = await clerkClient.users.getUser(userId);
    email = user.emailAddresses[0]?.emailAddress ?? null;
    name = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
  } catch {
    // Non-fatal — return minimal user info
  }

  return {
    session: { id: auth.sessionId ?? userId, userId },
    user: { id: userId, email, name },
  };
}

/**
 * Resolves the Clerk session from raw HTTP headers.
 * Used by the WebSocket live-events server.
 */
export async function resolveClerkSessionFromHeaders(
  headers: Headers,
): Promise<BetterAuthSessionResult | null> {
  const authHeader = headers.get("authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;

  const token = authHeader.slice("bearer ".length).trim();
  if (!token) return null;

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const userId = payload.sub;
    if (!userId) return null;

    return {
      session: { id: token.slice(0, 32), userId },
      user: { id: userId, email: null, name: null },
    };
  } catch {
    return null;
  }
}
