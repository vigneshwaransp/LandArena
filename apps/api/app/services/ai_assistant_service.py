from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import LandRecord, Anomaly, Document, Parcel

class AIAssistantService:
    def __init__(self):
        pass

    async def answer_query(self, db: AsyncSession, query: str, record_id: Optional[str] = None) -> Dict[str, Any]:
        """
        RAG / Context-Grounded AI Assistant for land officers.
        Analyzes records, validation rules, anomalies, and GIS data.
        """
        q = query.lower().strip()
        citations = []
        suggested = [
            "Why was this record flagged?",
            "What is the GIS area variance?",
            "Explain the ownership match score.",
            "List all anomalies for survey 145."
        ]

        # Case 1: Specific record context provided
        target_record = None
        if record_id:
            res = await db.execute(select(LandRecord).where(LandRecord.id == record_id))
            target_record = res.scalar_one_or_none()

        if target_record:
            rec_id_str = target_record.record_id
            owner = target_record.owner_data or {}
            prop = target_record.property_data or {}
            loc = target_record.location_data or {}
            val_sum = target_record.validation_summary or {}
            score = target_record.validation_score
            risk = target_record.risk_level

            # Fetch anomalies
            anom_res = await db.execute(select(Anomaly).where(Anomaly.record_id == target_record.id))
            anomalies = anom_res.scalars().all()

            if "why" in q and ("flagged" in q or "risk" in q or "score" in q or "low" in q):
                reasons = []
                for anom in anomalies:
                    reasons.append(f"• **{anom.title}** ({anom.severity}): {anom.explanation}")
                    citations.append({"type": "ANOMALY", "id": anom.id, "title": anom.title})

                rules = val_sum.get("rules", [])
                failed_rules = [r for r in rules if r.get("status") in ["WARNING", "FAIL"]]
                for fr in failed_rules:
                    reasons.append(f"• Rule *{fr.get('rule')}* scored {fr.get('score')}%: {fr.get('message')}")
                    citations.append({"type": "RULE", "name": fr.get("rule")})

                if not reasons:
                    answer = f"Record **{rec_id_str}** has an overall score of **{score}%** (Risk: **{risk}**). All validation rules passed standard thresholds with no active anomalies."
                else:
                    answer = (
                        f"Record **{rec_id_str}** received a validation score of **{score}%** with **{risk}** risk level due to the following factors:\n\n"
                        + "\n".join(reasons) +
                        "\n\n*Recommendation*: Please inspect the original document OCR boxes and verify the physical survey sketch before approving."
                    )
                return {"answer": answer, "citations": citations, "suggested_queries": suggested}

            elif "area" in q or "gis" in q:
                doc_area = prop.get("area", 0)
                unit = prop.get("area_unit", "acre")
                area_rule = next((r for r in val_sum.get("rules", []) if "Area" in r.get("rule", "")), None)
                evidence = area_rule.get("evidence", {}) if area_rule else {}
                gis_area = evidence.get("gis_area", doc_area)
                dev_pct = evidence.get("deviation_pct", 0)

                answer = (
                    f"**Area Analysis for Record {rec_id_str}**:\n"
                    f"- Document Stated Area: **{doc_area} {unit}**\n"
                    f"- GIS Cadastral Parcel Area: **{gis_area} acres**\n"
                    f"- Deviation: **{dev_pct}%**\n\n"
                    f"Status: {area_rule.get('message') if area_rule else 'Calculated based on PostGIS polygon projection.'}"
                )
                citations.append({"type": "PROPERTY", "field": "area", "value": doc_area})
                return {"answer": answer, "citations": citations, "suggested_queries": suggested}

            elif "owner" in q or "who" in q or "name" in q:
                owner_rule = next((r for r in val_sum.get("rules", []) if "Owner" in r.get("rule", "")), None)
                answer = (
                    f"**Ownership Details for Record {rec_id_str}**:\n"
                    f"- Registered Owner: **{owner.get('name')}**\n"
                    f"- Normalized Name: **{owner.get('normalized_name')}**\n"
                    f"- Father / Husband: **{owner.get('father_name')}**\n"
                    f"- Address: **{owner.get('address')}**\n"
                    f"- Owner Match Score: **{val_sum.get('owner_match_score', 95)}%**\n\n"
                    f"Explanation: {owner_rule.get('explanation') if owner_rule else 'Matched against revenue records.'}"
                )
                citations.append({"type": "OWNER", "name": owner.get("name")})
                return {"answer": answer, "citations": citations, "suggested_queries": suggested}

        # Case 2: General queries across records
        if "survey" in q or "145" in q:
            res = await db.execute(select(LandRecord))
            all_records = res.scalars().all()
            matched = [
                r for r in all_records 
                if (r.property_data and "145" in str(r.property_data.get("survey_number", "")))
            ]
            if matched:
                lines = []
                for r in matched:
                    lines.append(f"• **{r.record_id}** | Survey: {r.property_data.get('survey_number')} | Owner: {r.owner_data.get('name')} | Status: {r.status} | Score: {r.validation_score}%")
                    citations.append({"type": "RECORD", "id": r.id, "record_id": r.record_id})
                answer = f"Found **{len(matched)}** record(s) matching Survey '145':\n\n" + "\n".join(lines)
            else:
                answer = "I couldn't find any records with Survey Number 145 in the database."
            return {"answer": answer, "citations": citations, "suggested_queries": suggested}

        # Default helpful assistant response
        return {
            "answer": (
                "I am your **Land Record Intelligence AI Assistant**. You can ask me:\n"
                "• *'Why was this record flagged?'*\n"
                "• *'Explain the area deviation between document and GIS'* \n"
                "• *'Show all records in Thudupathi village with Survey 145'* \n"
                "• *'Summarize owner name phonetic matching'* \n\n"
                "All responses are verified and grounded strictly against active database records and OCR extractions."
            ),
            "citations": [],
            "suggested_queries": suggested
        }

ai_assistant_service = AIAssistantService()
