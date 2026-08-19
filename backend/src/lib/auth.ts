import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./env";

export interface AuthPayload {
  userId: string;
  username: string;
}

export interface AuthedRequest extends Request {
  user?: AuthPayload;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const headerToken = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  // Fallback for clients where the Authorization header has been observed
  // not to arrive on some requests despite being set client-side (cause
  // unconfirmed — possibly a device/network-layer header-stripping quirk).
  // The client also sends the token as ?access_token=, which can't be
  // dropped the same way since it's part of the URL itself.
  const queryToken = typeof req.query.access_token === "string" ? req.query.access_token : undefined;
  const token = headerToken ?? queryToken;
  if (!token) {
    console.warn(
      `[auth] ${req.method} ${req.path} missing/malformed Authorization header and no access_token query param (header present: ${!!header})`
    );
    return res.status(401).json({ error: "Missing Authorization header" });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET) as AuthPayload;
    next();
  } catch (err) {
    console.warn(
      `[auth] ${req.method} ${req.path} jwt.verify failed: ${err instanceof Error ? err.name + ": " + err.message : err} (secretLen=${JWT_SECRET.length}, tokenLen=${token.length})`
    );
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
