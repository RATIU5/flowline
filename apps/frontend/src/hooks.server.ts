import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

const ELYSIA_API_URL = "http://localhost:3001";

const authProxy: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  // Proxy all auth requests to Elysia
  if (pathname.startsWith("/api/auth")) {
    const targetUrl = `${ELYSIA_API_URL}/auth${pathname.replace("/api/auth", "")}`;

    // Forward the request to Elysia
    event.request.headers.delete("connection");

    const response = await fetch(targetUrl, {
      method: event.request.method,
      headers: event.request.headers,
      body: event.request.body,
    });

    return response;
  }

  return resolve(event);
};

const authMiddleware: Handle = async ({ event, resolve }) => {
  // Get session from cookie and validate with Elysia
  const sessionCookie = event.cookies.get("better-auth.session_token");

  if (sessionCookie) {
    try {
      const sessionResponse = await fetch(
        `${ELYSIA_API_URL}/auth/api/session`,
        {
          headers: {
            Cookie: event.request.headers.get("Cookie") || "",
          },
        },
      );

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        event.locals.user = sessionData.user;
        event.locals.session = sessionData.session;
      }
    } catch (error) {
      console.error("Session validation failed:", error);
    }
  }

  return resolve(event);
};

export const handle = sequence(authProxy, authMiddleware);
