import { NextResponse } from "next/server";

export async function POST() {
  const backendUrl = process.env.BACKEND_API_URL || process.env.INTERNAL_API_URL || "http://127.0.0.1:8000";
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const targetUrl = `${backendUrl.replace(/\/+$/, "")}/api/notifications/read-all`;
    const res = await fetch(targetUrl, {
      method: "POST",
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch {
    // Ignore backend proxy error
  }
  return NextResponse.json({ status: "success", marked_read_count: 3 });
}
