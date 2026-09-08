import { NextRequest, NextResponse } from "next/server";

const fallbackNotifications = [
  {
    id: "notif-001",
    channel: "SMS",
    recipient: "+91 98765 43210",
    title: "Land Title Verified",
    message: "Patta No P-88421 for Survey No 145/2A in Thudupathi has been verified by Tahsildar. Validation Score: 96.0%.",
    record_id: "LR-TN-ERD-00101",
    read: false,
    status: "DELIVERED",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: "notif-002",
    channel: "EMAIL",
    recipient: "revenue.tahsildar@tn.gov.in",
    title: "Critical Anomaly Detected",
    message: "URGENT: Boundary overlap and future registration date detected on Survey 145/2A-CLONE. Immediate inspection recommended.",
    record_id: "LR-TN-ERD-00103",
    read: false,
    status: "SENT",
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString()
  },
  {
    id: "notif-003",
    channel: "PUSH",
    recipient: "Field Surveyor Mobile App",
    title: "New Cadastral Survey Assigned",
    message: "New ground-truth verification task assigned for Survey No 89/1B in Nasiyanur Village.",
    record_id: "LR-TN-ERD-00102",
    read: true,
    status: "DELIVERED",
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  }
];

export async function GET() {
  const backendUrl = process.env.BACKEND_API_URL || process.env.INTERNAL_API_URL || "http://127.0.0.1:8000";
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const targetUrl = `${backendUrl.replace(/\/+$/, "")}/api/notifications`;
    const res = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fallback to local notifications
  }
  return NextResponse.json(fallbackNotifications);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const backendUrl = process.env.BACKEND_API_URL || process.env.INTERNAL_API_URL || "http://127.0.0.1:8000";
  try {
    const targetUrl = `${backendUrl.replace(/\/+$/, "")}/api/notifications/send`;
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch {
    // Return created notification
  }
  return NextResponse.json({
    id: `notif-${Date.now()}`,
    channel: body.channel || "SMS",
    title: body.title,
    message: body.message,
    read: false,
    status: "DELIVERED",
    created_at: new Date().toISOString()
  });
}
