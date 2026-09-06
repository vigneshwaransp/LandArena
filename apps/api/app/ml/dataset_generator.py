import os
import random
import numpy as np
import pandas as pd

def generate_kaggle_land_fraud_dataset(n_samples: int = 5000, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)
    random.seed(random_seed)

    doc_types = ["PATTA", "SALE_DEED", "SETTLEMENT", "POWER_OF_ATTORNEY", "GIFT_DEED"]
    doc_weights = [0.45, 0.30, 0.10, 0.10, 0.05]

    encumbrance_statuses = ["NIL", "ACTIVE_MORTGAGE", "DISPUTED", "COURT_STAY"]
    mutation_statuses = ["APPROVED", "PENDING", "REJECTED"]

    data = []

    for i in range(n_samples):
        # Latent risk score (continuous latent variable)
        latent_risk = np.random.beta(a=1.5, b=5.0) # Skewed towards low risk
        
        # Binary target with realistic noise
        is_fraud = 1 if latent_risk > 0.45 or (latent_risk > 0.25 and np.random.rand() < 0.25) else 0

        doc_type = np.random.choice(doc_types, p=doc_weights)
        stated_area = round(float(np.random.exponential(scale=3.0) + 0.3), 2)
        stated_area = min(stated_area, 50.0)
        reg_year = int(np.random.choice(range(1965, 2027)))
        subdivision_depth = int(np.random.choice([1, 2, 3, 4, 5], p=[0.4, 0.3, 0.18, 0.09, 0.03]))

        if is_fraud:
            # High area variance with stochastic noise
            area_var_pct = round(float(np.random.exponential(scale=12.0) + 4.5), 2)
            gis_area = round(stated_area * (1.0 + np.random.choice([-1, 1]) * (area_var_pct / 100.0)), 2)
            gis_area = max(gis_area, 0.05)

            # Spatial boundary overlap
            overlap_ratio = round(float(np.random.beta(a=2.0, b=3.0) * 0.65 + np.random.uniform(0.01, 0.1)), 3)
            overlap_ratio = min(overlap_ratio, 0.95)

            # Phonetic/Transliteration similarity
            owner_similarity = round(float(np.random.beta(a=3.0, b=3.0) * 0.45 + 0.35), 3)

            # Temporal delay/anomaly (days)
            temporal_gap_days = int(np.random.choice([
                np.random.randint(180, 2500),
                np.random.randint(-730, -5), # Future date anomaly
                np.random.randint(30, 180)
            ], p=[0.55, 0.25, 0.20]))

            ocr_confidence = round(float(np.random.normal(loc=72.0, scale=14.0)), 1)
            ocr_confidence = max(min(ocr_confidence, 97.0), 38.0)

            stamp_duty_ratio = round(float(np.random.uniform(0.25, 0.78)), 2)
            encumbrance = np.random.choice(encumbrance_statuses, p=[0.35, 0.30, 0.22, 0.13])
            prior_dispute = int(np.random.choice([0, 1], p=[0.45, 0.55]))
            mutation = np.random.choice(mutation_statuses, p=[0.25, 0.40, 0.35])
        else:
            # Clean record with realistic surveyor noise
            area_var_pct = round(float(np.random.exponential(scale=2.0) + np.random.uniform(0.1, 1.5)), 2)
            area_var_pct = min(area_var_pct, 6.5) # occasionally slightly above 5% due to GPS noise
            gis_area = round(stated_area * (1.0 + np.random.uniform(-0.06, 0.06)), 2)
            gis_area = max(gis_area, 0.05)

            overlap_ratio = round(float(np.random.exponential(scale=0.008)), 3)
            overlap_ratio = min(overlap_ratio, 0.045)

            owner_similarity = round(float(np.random.beta(a=7.0, b=1.5) * 0.2 + 0.80), 3)
            owner_similarity = min(owner_similarity, 1.0)

            temporal_gap_days = int(np.random.gamma(shape=2.5, scale=12.0) + 5)
            temporal_gap_days = max(temporal_gap_days, 1)

            ocr_confidence = round(float(np.random.normal(loc=93.0, scale=4.0)), 1)
            ocr_confidence = min(max(ocr_confidence, 78.0), 99.5)

            stamp_duty_ratio = round(float(np.random.normal(loc=1.0, scale=0.06)), 2)
            stamp_duty_ratio = max(stamp_duty_ratio, 0.80)

            encumbrance = np.random.choice(encumbrance_statuses, p=[0.82, 0.14, 0.03, 0.01])
            prior_dispute = int(np.random.choice([0, 1], p=[0.94, 0.06]))
            mutation = np.random.choice(mutation_statuses, p=[0.88, 0.10, 0.02])

        record = {
            "record_id": f"KAG-LR-{100000 + i}",
            "document_type": doc_type,
            "registration_year": reg_year,
            "stated_area_acres": stated_area,
            "gis_calculated_area_acres": gis_area,
            "area_variance_pct": area_var_pct,
            "boundary_overlap_ratio": overlap_ratio,
            "owner_name_similarity": owner_similarity,
            "temporal_date_gap_days": temporal_gap_days,
            "subdivision_depth": subdivision_depth,
            "ocr_confidence": ocr_confidence,
            "stamp_duty_ratio": stamp_duty_ratio,
            "encumbrance_status": encumbrance,
            "prior_dispute_flag": prior_dispute,
            "mutation_status": mutation,
            "target_fraud_risk": is_fraud
        }
        data.append(record)

    df = pd.DataFrame(data)
    return df

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "land_fraud_dataset.csv")

    df = generate_kaggle_land_fraud_dataset(n_samples=5000)
    df.to_csv(out_path, index=False)
    print(f"Dataset generated at {out_path} ({len(df)} rows)")
