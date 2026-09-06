from typing import List, Dict, Any

class AnomalyService:
    DISCLAIMER = "This system identifies risk indicators for human investigation. It does not make a legal determination of fraud."

    def extract_anomalies_from_validation(self, validation_summary: Dict[str, Any], record_id: str) -> List[Dict[str, Any]]:
        """
        Converts non-passing validation rule outcomes into actionable anomaly records.
        """
        anomalies = []
        rules = validation_summary.get("rules", [])

        for r in rules:
            status = r.get("status")
            if status in ["WARNING", "FAIL"]:
                rule_name = r.get("rule", "")
                cat = r.get("category", "")
                sev = r.get("severity", "MEDIUM")
                score = r.get("score", 50.0)
                
                # Map to standard anomaly type
                if "Area" in rule_name:
                    anom_type = "AREA_MISMATCH"
                    title = "Cadastral Area Variance Detected"
                elif "Owner" in rule_name:
                    anom_type = "OWNER_MISMATCH"
                    title = "Ownership Discrepancy"
                elif "Survey" in rule_name:
                    anom_type = "SURVEY_CONFLICT"
                    title = "Survey Claim or Format Conflict"
                elif "Date" in rule_name:
                    anom_type = "DATE_ANOMALY"
                    title = "Chronological or Timestamp Anomaly"
                elif "Boundary" in rule_name:
                    anom_type = "BOUNDARY_OVERLAP"
                    title = "Spatial Boundary Encroachment"
                elif "OCR" in rule_name:
                    anom_type = "OCR_LOW_CONFIDENCE"
                    title = "Degraded Document Scan Quality"
                else:
                    anom_type = "DOCUMENT_TAMPERING_INDICATOR"
                    title = "Document Risk Indicator"

                anomalies.append({
                    "record_id": record_id,
                    "type": anom_type,
                    "severity": sev,
                    "confidence": round((100.0 - score) / 100.0, 2) if score < 100 else 0.85,
                    "title": title,
                    "explanation": r.get("explanation") or r.get("message"),
                    "evidence": r.get("evidence", {}),
                    "resolved": False
                })

        return anomalies

anomaly_service = AnomalyService()
