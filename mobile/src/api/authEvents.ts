// Lets apiRequest trigger a clean logout when a token is rejected (expired,
// revoked, or otherwise invalid), instead of leaving the caller stuck on a
// dead-end auth error. AuthContext registers the handler once on mount.
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized() {
  unauthorizedHandler?.();
}
