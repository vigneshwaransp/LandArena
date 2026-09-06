import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix,
    roc_curve, precision_recall_curve
)

def train_and_evaluate_models():
    base_dir = os.path.dirname(__file__)
    data_path = os.path.join(base_dir, "data", "land_fraud_dataset.csv")
    artifacts_dir = os.path.join(base_dir, "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)

    try:
        from app.ml.dataset_generator import generate_kaggle_land_fraud_dataset
    except ImportError:
        from dataset_generator import generate_kaggle_land_fraud_dataset
    df = generate_kaggle_land_fraud_dataset(n_samples=5000)
    df.to_csv(data_path, index=False)

    print(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")

    num_features = [
        "stated_area_acres", "gis_calculated_area_acres", "area_variance_pct",
        "boundary_overlap_ratio", "owner_name_similarity", "temporal_date_gap_days",
        "registration_year", "subdivision_depth", "ocr_confidence",
        "stamp_duty_ratio", "prior_dispute_flag"
    ]
    cat_features = ["document_type", "encumbrance_status", "mutation_status"]
    target_col = "target_fraud_risk"

    X = df[num_features + cat_features]
    y = df[target_col]

    # Stratified 80/20 train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features),
        ]
    )

    candidates = {
        "Random Forest Classifier (Ensemble)": RandomForestClassifier(
            n_estimators=150, max_depth=10, min_samples_split=4, class_weight="balanced", random_state=42
        ),
        "Gradient Boosting Classifier": GradientBoostingClassifier(
            n_estimators=120, learning_rate=0.08, max_depth=4, random_state=42
        ),
        "Logistic Regression (Baseline)": LogisticRegression(
            C=1.0, max_iter=1000, class_weight="balanced", random_state=42
        ),
    }

    leaderboard = []
    trained_pipelines = {}
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    for name, clf in candidates.items():
        pipe = Pipeline(steps=[("preprocessor", preprocessor), ("classifier", clf)])
        
        cv_roc = cross_val_score(pipe, X_train, y_train, cv=cv, scoring="roc_auc")
        cv_f1 = cross_val_score(pipe, X_train, y_train, cv=cv, scoring="f1")

        pipe.fit(X_train, y_train)
        trained_pipelines[name] = pipe

        y_pred = pipe.predict(X_test)
        y_proba = pipe.predict_proba(X_test)[:, 1]

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred))
        rec = float(recall_score(y_test, y_pred))
        f1 = float(f1_score(y_test, y_pred))
        roc = float(roc_auc_score(y_test, y_proba))
        pr_auc = float(average_precision_score(y_test, y_proba))

        entry = {
            "model_name": name,
            "accuracy": round(acc * 100, 2),
            "precision": round(prec * 100, 2),
            "recall": round(rec * 100, 2),
            "f1_score": round(f1 * 100, 2),
            "roc_auc": round(roc * 100, 2),
            "pr_auc": round(pr_auc * 100, 2),
            "cv_roc_auc_mean": round(float(np.mean(cv_roc)) * 100, 2),
            "cv_roc_auc_std": round(float(np.std(cv_roc)) * 100, 2),
            "cv_f1_mean": round(float(np.mean(cv_f1)) * 100, 2),
        }
        leaderboard.append(entry)
        print(f"[{name}] Test ROC-AUC: {entry['roc_auc']}% | F1: {entry['f1_score']}% | CV ROC-AUC: {entry['cv_roc_auc_mean']}% +/- {entry['cv_roc_auc_std']}%")

    # Select Random Forest as the primary explainable ensemble model
    best_model_name = "Random Forest Classifier (Ensemble)"
    best_pipeline = trained_pipelines[best_model_name]
    best_entry = next(item for item in leaderboard if item["model_name"] == best_model_name)

    best_y_pred = best_pipeline.predict(X_test)
    best_y_proba = best_pipeline.predict_proba(X_test)[:, 1]

    cm = confusion_matrix(y_test, best_y_pred).tolist()
    tn, fp, fn, tp = cm[0][0], cm[0][1], cm[1][0], cm[1][1]

    # Sample ROC curve points
    fpr, tpr, _ = roc_curve(y_test, best_y_proba)
    roc_points = [{"fpr": round(float(f), 4), "tpr": round(float(t), 4)} for f, t in zip(fpr[::max(1, len(fpr)//25)], tpr[::max(1, len(tpr)//25)])]

    # Feature Importance extraction
    feature_importances = []
    fitted_preprocessor = best_pipeline.named_steps["preprocessor"]
    fitted_clf = best_pipeline.named_steps["classifier"]

    cat_encoder = fitted_preprocessor.named_transformers_["cat"]
    cat_names = list(cat_encoder.get_feature_names_out(cat_features))
    all_feature_names = num_features + cat_names

    if hasattr(fitted_clf, "feature_importances_"):
        raw_importances = fitted_clf.feature_importances_
        for f_name, imp in zip(all_feature_names, raw_importances):
            display_name = f_name.replace("_", " ").title()
            feature_importances.append({
                "feature": f_name,
                "display_name": display_name,
                "importance": round(float(imp) * 100, 2)
            })
        feature_importances.sort(key=lambda x: x["importance"], reverse=True)

    # Save artifact model
    model_path = os.path.join(artifacts_dir, "land_fraud_model.joblib")
    joblib.dump(best_pipeline, model_path)

    metrics_summary = {
        "best_model": best_model_name,
        "selected_metrics": best_entry,
        "leaderboard": leaderboard,
        "dataset_summary": {
            "total_samples": len(df),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "fraud_rate_pct": round(float(df[target_col].mean()) * 100, 2),
            "clean_records": int((df[target_col] == 0).sum()),
            "fraud_records": int((df[target_col] == 1).sum()),
        },
        "confusion_matrix": {
            "matrix": cm,
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
            "true_positives": tp,
            "specificity": round((tn / (tn + fp)) * 100, 2) if (tn + fp) > 0 else 0,
            "sensitivity": round((tp / (tp + fn)) * 100, 2) if (tp + fn) > 0 else 0,
        },
        "feature_importances": feature_importances[:10],
        "roc_curve": roc_points,
        "feature_names": {
            "numerical": num_features,
            "categorical": cat_features
        }
    }

    metrics_path = os.path.join(artifacts_dir, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics_summary, f, indent=2)

    print(f"\nModel saved successfully to: {model_path}")
    print(f"Metrics saved successfully to: {metrics_path}")
    return metrics_summary

if __name__ == "__main__":
    train_and_evaluate_models()
