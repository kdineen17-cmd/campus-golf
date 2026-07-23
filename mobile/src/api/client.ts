import { notifyUnauthorized } from "./authEvents";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
}

function buildHeaders(token: string | null | undefined): Headers {
  // Built via the standard Headers API (not a plain object) so header
  // transmission is consistent across every fetch implementation this app
  // runs on — plain-object header maps have historically been less
  // reliable in some React Native / Hermes builds.
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

async function doFetch(path: string, options: RequestOptions): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers: buildHeaders(options.token),
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(
      `Could not reach the Campus Golf server at ${API_URL}. Check EXPO_PUBLIC_API_URL and that the backend is running.`,
      0
    );
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await doFetch(path, options);

  // A token-bearing request that comes back 401 gets one immediate retry
  // before we treat the session as invalid — this absorbs any transient
  // hiccup (cold start, brief network blip) instead of bouncing the user
  // to the login screen over a one-off failure.
  if (response.status === 401 && options.token) {
    response = await doFetch(path, options);
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data && typeof data.error === "string" ? data.error : `Request failed (${response.status})`;
    if (response.status === 401 && options.token) {
      notifyUnauthorized();
    }
    throw new ApiError(message, response.status);
  }

  return data as T;
}
