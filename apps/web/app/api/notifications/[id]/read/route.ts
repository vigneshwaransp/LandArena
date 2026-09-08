import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const notifId = params.id;
  const backendUrl = process.env.BACKEND_API_URL || process.env.INTERNAL_API_URL || "http://127.0.0.1:8000";
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const targetUrl = `${backendUrl.replace(/\/+$/, "")}/api/notifications/${encodeURIComponent(notifId)}/read`;
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
  return NextResponse.json({ status: "success", id: notifId });
}
