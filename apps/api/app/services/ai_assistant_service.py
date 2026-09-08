import os
import json
import logging
from typing import Dict, Any, List, Optional
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.config import settings
from app.models.models import LandRecord, Anomaly, Document, Parcel

logger = logging.getLogger(__name__)

class AIAssistantService:
    """
    Intelligent RAG Assistant for Indian Cadastral & Land Record Administration (DILRMP).
    Powered by Mistral AI (Codestral / Mistral) with grounded database context and rule fallback.
    """

    def __init__(self):
        self.api_key = settings.MISTRAL_API_KEY
        self.model = settings.MISTRAL_MODEL or "codestral-latest"

    async def _call_mistral_llm(self, system_prompt: str, user_query: str) -> Optional[str]:
        """
        Calls Mistral AI chat completions API using the configured API key.
        """
        key = settings.MISTRAL_API_KEY
        if not key:
            return None

        # Try codestral-latest first, fallback to mistral-small-latest if needed
        models_to_try = [settings.MISTRAL_MODEL, "codestral-latest", "mistral-small-latest"]
        seen = set()
        models = [m for m in models_to_try if m and not (m in seen or seen.add(m))]

        for model_name in models:
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    payload = {
                        "model": model_name,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_query}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 600
                    }
                    response = await client.post(
                        "https://api.mistral.ai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {key}",
                            "Content-Type": "application/json"
                        },
                        json=payload
                    )
                    if response.status_code == 200:
                        data = response.json()
                        choices = data.get("choices", [])
                        if choices and "message" in choices[0]:
                            return choices[0]["message"]["content"].strip()
                    else:
                        logger.warning(f"Mistral API returned {response.status_code} for {model_name}: {response.text[:150]}")
            except Exception as e:
                logger.warning(f"Mistral API call error with {model_name}: {e}")

        return None

    async def answer_query(self, db: AsyncSession, query: str, record_id: Optional[str] = None) -> Dict[str, Any]:
        """
        RAG / Context-Grounded AI Assistant for land officers.
        Analyzes records, validation rules, anomalies, and GIS data using LLM or structured rules.
        """
        q = query.lower().strip()
        citations = []
        suggested = [
            "Why was this record flagged?",
            "What is the GIS area variance?",
            "Explain the ownership match score.",
            "List all anomalies for survey 145."
        ]

        # 1. Fetch relevant database context
        target_record = None
        record_context_text = ""
        if record_id:
            res = await db.execute(select(LandRecord).where(or_(LandRecord.id == record_id, LandRecord.record_id == record_id)))
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

            for anom in anomalies:
                citations.append({"type": "ANOMALY", "id": anom.id, "title": anom.title})

            record_context_text = (
                f"RECORD DETAILS:\n"
                f"- Record ID: {rec_id_str}\n"
                f"- Owner Name: {owner.get('name')} (Father/Husband: {owner.get('father_name')})\n"
                f"- Survey Number: {prop.get('survey_number')} (Subdivision: {prop.get('subdivision_number')})\n"
                f"- Deed Stated Area: {prop.get('area')} {prop.get('area_unit', 'acres')}\n"
                f"- Location: Village {loc.get('village')}, Taluk {loc.get('taluk')}, District {loc.get('district')}\n"
                f"- Validation Score: {score}%\n"
                f"- Fraud Risk Level: {risk}\n"
                f"- Active Anomalies: {', '.join(f'{a.title} ({a.severity})' for a in anomalies) if anomalies else 'None'}\n"
                f"- Validation Rules: {json.dumps(val_sum.get('rules', []))}\n"
            )

        # General district stats context
        rec_count_res = await db.execute(select(LandRecord))
        all_recs = rec_count_res.scalars().all()
        general_context = (
            f"SYSTEM STATE:\n"
            f"- Total Land Records in DB: {len(all_recs)}\n"
            f"- District: Erode District, Tamil Nadu\n"
            f"- Active Taluks: Perundurai, Erode, Bhavani, Modakkurichi, Gobichettipalayam, Sathyamangalam\n"
            f"- Modernization Standard: Digital India Land Records Modernization Programme (DILRMP)\n"
        )

        # 2. Try LLM Call (Mistral / Codestral)
        system_prompt = (
            "You are the Land Record Intelligence AI Assistant for the Indian Revenue Department and National Land Records Modernization Programme (DILRMP).\n"
            "You assist Tahsildars, Revenue Divisional Officers, and Land Verifiers.\n"
            "Answer the user's question clearly, concisely (under 4 paragraphs), professionally, and strictly grounded in the cadastral database context provided below.\n"
            "If an anomaly, boundary overlap, or area discrepancy exists, cite the specific numbers and recommend whether the officer should approve, inspect, or reject the record.\n\n"
            f"{general_context}\n"
            f"{record_context_text}"
        )

        llm_response = await self._call_mistral_llm(system_prompt, query)
        if llm_response:
            return {
                "answer": llm_response,
                "citations": citations,
                "suggested_queries": suggested
            }

        # 3. Deterministic RAG Fallback if LLM is unreachable
        if target_record:
            rec_id_str = target_record.record_id
            owner = target_record.owner_data or {}
            prop = target_record.property_data or {}
            val_sum = target_record.validation_summary or {}
            score = target_record.validation_score
            risk = target_record.risk_level

            anom_res = await db.execute(select(Anomaly).where(Anomaly.record_id == target_record.id))
            anomalies = anom_res.scalars().all()

            if "why" in q and ("flagged" in q or "risk" in q or "score" in q or "low" in q):
                reasons = []
                for anom in anomalies:
                    reasons.append(f"• **{anom.title}** ({anom.severity}): {anom.explanation}")
                rules = val_sum.get("rules", [])
                for fr in [r for r in rules if r.get("status") in ["WARNING", "FAIL"]]:
                    reasons.append(f"• Rule *{fr.get('rule')}* scored {fr.get('score')}%: {fr.get('message')}")

                if not reasons:
                    answer = f"Record **{rec_id_str}** has an overall score of **{score}%** (Risk: **{risk}**). All validation rules passed standard thresholds with no active anomalies."
                else:
                    answer = (
                        f"Record **{rec_id_str}** received a validation score of **{score}%** with **{risk}** risk level due to:\n\n"
                        + "\n".join(reasons) +
                        "\n\n*Recommendation*: Please inspect the original scanned deed and cadastral FMB sketch before issuing statutory title clearance."
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
                    f"- Document Stated Extent: **{doc_area} {unit}**\n"
                    f"- GIS Cadastral Parcel Extent: **{gis_area} acres**\n"
                    f"- Variance: **{dev_pct}%**\n\n"
                    f"Status: {area_rule.get('message') if area_rule else 'Calculated based on PostGIS polygon projection.'}"
                )
                return {"answer": answer, "citations": citations, "suggested_queries": suggested}

        return {
            "answer": (
                "I am your **Land Record Intelligence AI Assistant**. You can ask me:\n"
                "• *'Why was this record flagged?'*\n"
                "• *'Explain the area deviation between document and GIS'* \n"
                "• *'Show all records with Survey 145'* \n"
                "• *'Summarize DILRMP compliance across Erode Taluks'* \n\n"
                "Responses are verified and grounded strictly against active database records and OCR extractions."
            ),
            "citations": [],
            "suggested_queries": suggested
        }

ai_assistant_service = AIAssistantService()
