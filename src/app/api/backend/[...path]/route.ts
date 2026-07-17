import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

const TOKEN_COOKIE = "mkoi_token";

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${config.apiUrl}/${path.join("/")}${req.nextUrl.search}`;

  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;

  // Forward the caller's actual Content-Type instead of hardcoding JSON, so
  // multipart/form-data uploads (photos, bulk-import) keep their boundary and
  // aren't mislabeled/mis-parsed by the backend.
  const contentType = req.headers.get("content-type");
  const headers: HeadersInit = {
    ...(contentType ? { "Content-Type": contentType } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let body: ArrayBuffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await req.arrayBuffer();
    } catch {
      body = undefined;
    }
  }

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body,
  });

  const data = await upstream.text();

  return new NextResponse(data, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
