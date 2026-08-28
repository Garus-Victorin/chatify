import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "chatify-secret-change-in-production"
);

const PUBLIC_PATHS = ["/", "/login", "/register", "/home", "/api/auth/login", "/api/auth/register"];

// Routes restricted to admin role
const ADMIN_PATHS = ["/api/admin"];

interface AppJWTPayload {
  userId: string;
  email: string;
  role?: string;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const start = Date.now();

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth-token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  let payload: AppJWTPayload;
  try {
    const { payload: p } = await jwtVerify(token, SECRET);
    payload = p as unknown as AppJWTPayload;
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("auth-token");
    return res;
  }

  // Admin route guard
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Forward user identity to API routes via headers
  const res = NextResponse.next();
  res.headers.set("x-user-id", payload.userId);
  res.headers.set("x-user-role", payload.role ?? "user");

  // Structured access log (server-side only)
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== "test") {
    console.log(
      JSON.stringify({
        level: "info",
        type: "access",
        method: req.method,
        path: pathname,
        userId: payload.userId,
        role: payload.role ?? "user",
        duration,
        timestamp: new Date().toISOString(),
      })
    );
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
