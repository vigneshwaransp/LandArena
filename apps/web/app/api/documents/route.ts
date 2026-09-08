import { NextRequest, NextResponse } from "next/server";
import { DEMO_DOCUMENTS } from "@/lib/demoData";

export async function GET(req: NextRequest) {
  const backendUrl = process.env.BACKEND_API_URL || process.env.INTERNAL_API_URL || "http://127.0.0.1:8000";
  const status = req.nextUrl.searchParams.get("status");

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const targetUrl = `${backendUrl.replace(/\/+$/, "")}/api/documents${status ? `?status=${status}` : ""}`;
    const res = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch {
    // Backend unreachable -> use fallback
  }

  const filtered = status ? DEMO_DOCUMENTS.filter(d => d.status === status) : DEMO_DOCUMENTS;
  return NextResponse.json(filtered);
}
