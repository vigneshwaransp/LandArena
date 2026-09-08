import { NextRequest, NextResponse } from "next/server";
import { DEMO_DOCUMENTS } from "@/lib/demoData";

const DEMO_PAGES_DATA: Record<string, any> = {
  "c5b46e54-6c85-4f37-9f69-7ec4ad47db1f": {
    filename: "land_record_145_patta.pdf",
    document_type: "PATTA",
    image_url: "/api/documents/files/documents/land_record_145_patta.png",
    processed_image_url: "/api/documents/files/documents/land_record_145_patta_proc.png",
    language: "ta",
    confidence: 96.0,
    ocr_boxes: [
      { x0: 80, y0: 60, x1: 500, y1: 90, text: "Patta No: P-88421", confidence: 98.0, page: 1, field_name: "patta_number" },
      { x0: 80, y0: 110, x1: 420, y1: 140, text: "Survey No: 145/2A", confidence: 99.0, page: 1, field_name: "survey_number" },
      { x0: 80, y0: 160, x1: 460, y1: 190, text: "Owner: Ravi Kumar (ரவிகுமார்)", confidence: 96.5, page: 1, field_name: "owner_name" },
      { x0: 80, y0: 210, x1: 400, y1: 240, text: "Father: S. Kumar", confidence: 95.0, page: 1, field_name: "father_name" },
      { x0: 80, y0: 260, x1: 480, y1: 290, text: "Extent / Area: 2.45 Acres", confidence: 97.0, page: 1, field_name: "area" },
      { x0: 80, y0: 310, x1: 430, y1: 340, text: "Village: Thudupathi | District: Erode", confidence: 98.0, page: 1, field_name: "location" }
    ],
    ocr_text: "GOVERNMENT OF TAMIL NADU - REVENUE DEPARTMENT\nPatta No: P-88421\nSurvey No: 145/2A\nOwner: Ravi Kumar\nFather: S. Kumar\nArea: 2.45 Acres\nVillage: Thudupathi"
  },
  "fe9dea3e-e8ca-4bcb-a316-364a36c7b45c": {
    filename: "sale_deed_89_nasiyanur.pdf",
    document_type: "SALE_DEED",
    image_url: "/api/documents/files/documents/sale_deed_89_nasiyanur.png",
    processed_image_url: "/api/documents/files/documents/sale_deed_89_nasiyanur_proc.png",
    language: "en",
    confidence: 97.5,
    ocr_boxes: [
      { x0: 80, y0: 60, x1: 520, y1: 90, text: "Sale Deed No: SD-2022-891", confidence: 99.0, page: 1, field_name: "registration_number" },
      { x0: 80, y0: 110, x1: 420, y1: 140, text: "Survey No: 89/1", confidence: 98.5, page: 1, field_name: "survey_number" },
      { x0: 80, y0: 160, x1: 480, y1: 190, text: "Purchaser: Suresh Murugan", confidence: 97.0, page: 1, field_name: "owner_name" },
      { x0: 80, y0: 210, x1: 400, y1: 240, text: "Father: M. Murugan", confidence: 96.0, page: 1, field_name: "father_name" },
      { x0: 80, y0: 260, x1: 480, y1: 290, text: "Extent: 3.15 Acres", confidence: 98.0, page: 1, field_name: "area" },
      { x0: 80, y0: 310, x1: 460, y1: 340, text: "Village: Nasiyanur | Taluk: Erode", confidence: 98.5, page: 1, field_name: "location" }
    ],
    ocr_text: "SUB-REGISTRAR OFFICE - ERODE\nSale Deed: SD-2022-891\nSurvey: 89/1\nOwner: Suresh Murugan\nFather: M. Murugan\nExtent: 3.15 Acres\nVillage: Nasiyanur"
  },
  "af1a9ab5-cde7-48da-be73-3adaae1f4f61": {
    filename: "fraud_indicator_deed_145_altered.pdf",
    document_type: "SALE_DEED",
    image_url: "/api/documents/files/documents/fraud_indicator_deed_145_altered.png",
    processed_image_url: "/api/documents/files/documents/fraud_indicator_deed_145_altered_proc.png",
    language: "ta",
    confidence: 82.0,
    ocr_boxes: [
      { x0: 80, y0: 60, x1: 520, y1: 90, text: "Deed No: 145/2A-CLONE", confidence: 75.0, page: 1, field_name: "registration_number" },
      { x0: 80, y0: 110, x1: 440, y1: 140, text: "Survey No: 145/2A (Altered)", confidence: 68.0, page: 1, field_name: "survey_number" },
      { x0: 80, y0: 160, x1: 480, y1: 190, text: "Claimant: Rajesh Kumar", confidence: 85.0, page: 1, field_name: "owner_name" },
      { x0: 80, y0: 210, x1: 420, y1: 240, text: "Father: P. Kumar", confidence: 80.0, page: 1, field_name: "father_name" },
      { x0: 80, y0: 260, x1: 500, y1: 290, text: "Claimed Extent: 2.85 Acres (Inflated)", confidence: 60.0, page: 1, field_name: "area" },
      { x0: 80, y0: 310, x1: 460, y1: 340, text: "Registration Date: 2028-11-10 (FUTURE!)", confidence: 99.0, page: 1, field_name: "registration_date" }
    ],
    ocr_text: "ALTERED DEED COPY\nSurvey: 145/2A-CLONE\nClaimant: Rajesh Kumar\nClaimed Extent: 2.85 Acres\nFuture Date Flagged: 2028-11-10\nOverlaps with 145/2A and 145/2B"
  }
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const docId = params.id;
  const backendUrl = process.env.BACKEND_API_URL || process.env.INTERNAL_API_URL || "http://127.0.0.1:8000";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const targetUrl = backendUrl.replace(/\/+$/, "") + "/api/documents/" + encodeURIComponent(docId);
    const res = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Backend unreachable -> use fallback
  }

  // Fallback lookup
  let matchedDoc = DEMO_DOCUMENTS.find(d => d.id === docId || d.filename.includes(docId) || d.record_id === docId);
  if (!matchedDoc) {
    matchedDoc = DEMO_DOCUMENTS[0];
  }

  const pageInfo = DEMO_PAGES_DATA[matchedDoc.id] || DEMO_PAGES_DATA["c5b46e54-6c85-4f37-9f69-7ec4ad47db1f"];

  return NextResponse.json({
    id: matchedDoc.id,
    filename: matchedDoc.filename,
    file_size: matchedDoc.file_size,
    mime_type: matchedDoc.mime_type,
    document_type: matchedDoc.document_type,
    type_confidence: matchedDoc.type_confidence,
    page_count: 1,
    status: matchedDoc.status,
    processing_progress: 100,
    current_stage: matchedDoc.current_stage,
    created_at: matchedDoc.created_at,
    updated_at: matchedDoc.created_at,
    download_url: pageInfo.image_url,
    pages: [
      {
        id: "page-01",
        page_number: 1,
        image_url: pageInfo.image_url,
        processed_image_url: pageInfo.processed_image_url,
        width: 1200,
        height: 1600,
        ocr_text: pageInfo.ocr_text,
        ocr_boxes: pageInfo.ocr_boxes,
        confidence: pageInfo.confidence,
        language: pageInfo.language
      }
    ]
  });
}
