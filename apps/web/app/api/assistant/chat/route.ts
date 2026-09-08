import { NextRequest, NextResponse } from "next/server";

const DEMO_RECORDS_CONTEXT: Record<string, any> = {
  "LR-TN-ERD-00101": {
    survey: "145/2A",
    owner: "Ravi Kumar",
    father: "S. Kumar",
    extent: "2.45 Acres",
    gis_extent: "2.39 Acres",
    variance: "2.45%",
    village: "Thudupathi",
    taluk: "Perundurai",
    district: "Erode",
    score: 78.5,
    risk: "MEDIUM",
    anomalies: ["Cadastral Area Variance Detected (Deed states 2.45 ac, GIS calculates 2.39 ac)"],
    status: "NEEDS_REVIEW"
  },
  "LR-TN-ERD-00102": {
    survey: "89/1",
    owner: "Suresh Murugan",
    father: "M. Murugan",
    extent: "3.15 Acres",
    gis_extent: "3.15 Acres",
    variance: "0.0%",
    village: "Nasiyanur",
    taluk: "Erode",
    district: "Erode",
    score: 96.0,
    risk: "LOW",
    anomalies: [],
    status: "VERIFIED"
  },
  "LR-TN-ERD-00103": {
    survey: "145/2A-CLONE",
    owner: "Rajesh Kumar",
    father: "P. Kumar",
    extent: "2.85 Acres",
    gis_extent: "2.39 Acres",
    variance: "19.2%",
    village: "Thudupathi",
    taluk: "Perundurai",
    district: "Erode",
    score: 42.0,
    risk: "CRITICAL",
    anomalies: ["Critical Fraud: Future registration date 2028-11-10", "Boundary overlap encroachment on 145/2A & 145/2B"],
    status: "REJECTED"
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string = body.query || "";
    const recordId: string | undefined = body.record_id;

    // 1. If backend API is configured and reachable, attempt proxy
    const backendUrl = process.env.BACKEND_API_URL || process.env.INTERNAL_API_URL || "http://127.0.0.1:8000";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const targetUrl = `${backendUrl.replace(/\/+$/, "")}/api/assistant/chat`;
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, record_id: recordId }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend proxy unreachable (e.g. on serverless Vercel) -> proceed to native Mistral execution
    }

    // 2. Direct Mistral AI execution
    const apiKey = process.env.MISTRAL_API_KEY;
    const model = process.env.MISTRAL_MODEL || "codestral-latest";

    const ctx = recordId && DEMO_RECORDS_CONTEXT[recordId] ? DEMO_RECORDS_CONTEXT[recordId] : DEMO_RECORDS_CONTEXT["LR-TN-ERD-00101"];
    const citations: any[] = [];

    if (ctx) {
      citations.push({ type: "RECORD_CONTEXT", id: recordId || "LR-TN-ERD-00101", title: `Survey ${ctx.survey} (${ctx.owner})` });
      if (ctx.anomalies.length > 0) {
        citations.push({ type: "ANOMALY", title: ctx.anomalies[0] });
      }
    }

    const systemPrompt = `You are the Official AI Land Intelligence Assistant for the Revenue Department and Digital India Land Records Modernization Programme (DILRMP).
You assist Tahsildars, District Revenue Officers (DRO), and Cadastral Surveyors in verifying land titles, resolving boundary overlaps, and auditing fraud.

ACTIVE CADASTRAL DATABASE CONTEXT:
- Record ID: ${recordId || "General District Query"}
- Registered Owner: ${ctx?.owner} (Father/Husband: ${ctx?.father})
- Survey Number: ${ctx?.survey}
- Deed Extent: ${ctx?.extent} | GIS Digitized Extent: ${ctx?.gis_extent} (Variance: ${ctx?.variance})
- Jurisdiction: Village ${ctx?.village}, Taluk ${ctx?.taluk}, District ${ctx?.district}, Tamil Nadu
- Validation Score: ${ctx?.score}% | Risk Level: ${ctx?.risk} | Status: ${ctx?.status}
- Active Anomalies: ${ctx?.anomalies?.join("; ") || "None"}

GUIDELINES:
1. Provide authoritative, concise, legally grounded responses (Tamil Nadu Revenue Code & DILRMP standards).
2. Clearly explain why records are flagged (e.g. future date, area mismatch >2%, spatial overlap).
3. If asked about Tahsildar powers, explain their statutory authority to inspect ground truth, order re-measurement, approve mutations, and resolve title disputes.`;

    if (apiKey) {
      try {
        const mistralRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: query }
            ],
            temperature: 0.3,
            max_tokens: 600
          })
        });

        if (mistralRes.ok) {
          const data = await mistralRes.json();
          const answer = data.choices?.[0]?.message?.content?.trim();
          if (answer) {
            return NextResponse.json({
              answer,
              citations,
              suggested_queries: [
                "Why was this record flagged?",
                "What is the GIS area variance?",
                "Explain the ownership match score?",
                "What are the statutory powers of a Tahsildar?"
              ]
            });
          }
        }
      } catch (err) {
        console.warn("Direct Mistral API call failed:", err);
      }
    }

    // 3. Resilient Deterministic Fallback if API key missing or network failure
    let fallback = "According to the Cadastral Land Administration Database: ";
    const lower = query.toLowerCase();
    if (lower.includes("flag") || lower.includes("fraud") || lower.includes("why")) {
      fallback = `Record ${recordId || "LR-TN-ERD-00101"} (Survey ${ctx.survey}, Owner: ${ctx.owner}) was flagged due to: ${ctx.anomalies.join(". ")}. Under Revenue Department standards, a ground-truth Tahsildar inspection is mandatory before mutation approval.`;
    } else if (lower.includes("gis") || lower.includes("area") || lower.includes("variance")) {
      fallback = `For Survey ${ctx.survey}: The deed states ${ctx.extent}, whereas the GIS polygon computes ${ctx.gis_extent} (a ${ctx.variance} deviation). Variances over 2.0% trigger automated Tahsildar verification notices.`;
    } else if (lower.includes("tahsildar") || lower.includes("power")) {
      fallback = "Under the Tamil Nadu Revenue Code, Tahsildars possess executive authority over land record maintenance, mutation sanctioning, boundary settlement, and resolving ownership disputes.";
    } else {
      fallback = `Land Title Summary for Survey ${ctx.survey}: Registered to ${ctx.owner}, extent ${ctx.extent}, situated in Village ${ctx.village}, ${ctx.taluk} Taluk. Validation Score: ${ctx.score}% (${ctx.risk} Risk).`;
    }

    return NextResponse.json({
      answer: fallback,
      citations,
      suggested_queries: [
        "Why was this record flagged?",
        "What is the GIS area variance?",
        "What are the statutory powers of a Tahsildar?"
      ]
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
