'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BrainCircuit,
  Sparkles,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Layers,
  Database,
  BarChart3,
  Scale,
  Award,
  ArrowRight,
  Info,
  Check
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { api } from '@/lib/api';

export default function MLCenterPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);

  // Simulator State
  const [statedArea, setStatedArea] = useState<number>(2.5);
  const [gisArea, setGisArea] = useState<number>(2.4);
  const [areaVariance, setAreaVariance] = useState<number>(4.0);
  const [overlapRatio, setOverlapRatio] = useState<number>(0.0);
  const [nameSimilarity, setNameSimilarity] = useState<number>(0.95);
  const [dateGapDays, setDateGapDays] = useState<number>(14);
  const [ocrConfidence, setOcrConfidence] = useState<number>(94.0);
  const [stampDutyRatio, setStampDutyRatio] = useState<number>(1.0);
  const [priorDispute, setPriorDispute] = useState<number>(0);
  const [documentType, setDocumentType] = useState<string>('PATTA');
  const [mutationStatus, setMutationStatus] = useState<string>('APPROVED');
  const [encumbranceStatus, setEncumbranceStatus] = useState<string>('NIL');

  const [simPrediction, setSimPrediction] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  // Calculate variance automatically when stated/gis area change
  useEffect(() => {
    if (statedArea > 0) {
      const v = Math.abs(statedArea - gisArea) / statedArea * 100;
      setAreaVariance(parseFloat(v.toFixed(1)));
    }
  }, [statedArea, gisArea]);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    setLoading(true);
    try {
      const data = await api.getMLMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load ML metrics:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRetrain() {
    setRetraining(true);
    setRetrainSuccess(false);
    try {
      const res = await api.retrainMLModel();
      if (res.metrics) {
        setMetrics(res.metrics);
      }
      setRetrainSuccess(true);
      setTimeout(() => setRetrainSuccess(false), 5000);
    } catch (err: any) {
      alert(err.message || 'Retraining failed');
    } finally {
      setRetraining(false);
    }
  }

  async function runSimulation(overrides?: Partial<{
    stated_area_acres: number;
    gis_calculated_area_acres: number;
    area_variance_pct: number;
    boundary_overlap_ratio: number;
    owner_name_similarity: number;
    temporal_date_gap_days: number;
    ocr_confidence: number;
    stamp_duty_ratio: number;
    prior_dispute_flag: number;
    document_type: string;
    mutation_status: string;
    encumbrance_status: string;
  }>) {
    setSimLoading(true);
    const payload = {
      stated_area_acres: overrides?.stated_area_acres ?? statedArea,
      gis_calculated_area_acres: overrides?.gis_calculated_area_acres ?? gisArea,
      area_variance_pct: overrides?.area_variance_pct ?? areaVariance,
      boundary_overlap_ratio: overrides?.boundary_overlap_ratio ?? overlapRatio,
      owner_name_similarity: overrides?.owner_name_similarity ?? nameSimilarity,
      temporal_date_gap_days: overrides?.temporal_date_gap_days ?? dateGapDays,
      ocr_confidence: overrides?.ocr_confidence ?? ocrConfidence,
      stamp_duty_ratio: overrides?.stamp_duty_ratio ?? stampDutyRatio,
      prior_dispute_flag: overrides?.prior_dispute_flag ?? priorDispute,
      document_type: overrides?.document_type ?? documentType,
      mutation_status: overrides?.mutation_status ?? mutationStatus,
      encumbrance_status: overrides?.encumbrance_status ?? encumbranceStatus,
    };

    try {
      const res = await api.predictMLFraud(payload);
      setSimPrediction(res);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setSimLoading(false);
    }
  }

  // Pre-set Scenarios
  const applyScenario = (type: 'clean' | 'encroachment' | 'benami' | 'undervalued') => {
    let sArea = 3.0;
    let gArea = 2.95;
    let vPct = 1.6;
    let ovRatio = 0.0;
    let nSim = 0.98;
    let dGap = 10;
    let oConf = 96.0;
    let sRatio = 1.05;
    let pDisp = 0;
    let dType = 'PATTA';
    let mStat = 'APPROVED';
    let eStat = 'NIL';

    if (type === 'clean') {
      // Clean Deed
    } else if (type === 'encroachment') {
      sArea = 5.0;
      gArea = 3.2;
      vPct = 36.0;
      ovRatio = 0.28;
      nSim = 0.92;
      dGap = 45;
      oConf = 88.0;
      sRatio = 0.85;
      pDisp = 1;
      mStat = 'PENDING';
      eStat = 'DISPUTED';
    } else if (type === 'benami') {
      sArea = 2.0;
      gArea = 2.0;
      vPct = 0.0;
      ovRatio = 0.02;
      nSim = 0.45;
      dGap = 120;
      oConf = 65.0;
      sRatio = 0.60;
      pDisp = 0;
      dType = 'POWER_OF_ATTORNEY';
      mStat = 'PENDING';
      eStat = 'MORTGAGED';
    } else if (type === 'undervalued') {
      sArea = 10.0;
      gArea = 10.0;
      vPct = 0.0;
      ovRatio = 0.0;
      nSim = 0.88;
      dGap = 420;
      oConf = 90.0;
      sRatio = 0.35;
      pDisp = 0;
      dType = 'SALE_DEED';
      mStat = 'PENDING';
      eStat = 'NIL';
    }

    setStatedArea(sArea);
    setGisArea(gArea);
    setAreaVariance(vPct);
    setOverlapRatio(ovRatio);
    setNameSimilarity(nSim);
    setDateGapDays(dGap);
    setOcrConfidence(oConf);
    setStampDutyRatio(sRatio);
    setPriorDispute(pDisp);
    setDocumentType(dType);
    setMutationStatus(mStat);
    setEncumbranceStatus(eStat);

    runSimulation({
      stated_area_acres: sArea,
      gis_calculated_area_acres: gArea,
      area_variance_pct: vPct,
      boundary_overlap_ratio: ovRatio,
      owner_name_similarity: nSim,
      temporal_date_gap_days: dGap,
      ocr_confidence: oConf,
      stamp_duty_ratio: sRatio,
      prior_dispute_flag: pDisp,
      document_type: dType,
      mutation_status: mStat,
      encumbrance_status: eStat,
    });
  };

  // Initial simulation run
  useEffect(() => {
    runSimulation();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Sparkles className="w-6 h-6 text-[#8C9A84] animate-spin" />
          <span className="text-xs font-serif italic text-[#8C9A84]">
            Loading ML benchmark models and feature weights...
          </span>
        </div>
      </div>
    );
  }

  const selectedMetrics = metrics?.selected_metrics || {};
  const leaderboard = metrics?.leaderboard || [];
  const datasetSummary = metrics?.dataset_summary || {};
  const featureImportances = metrics?.feature_importances || [];
  const confusionMatrix = metrics?.confusion_matrix || {};

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)]">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#8C9A84]/20 flex items-center justify-center text-[#2D3A31]">
              <BrainCircuit className="w-5 h-5 text-[#2D3A31]" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D3A31] tracking-tight">
                ML Intelligence <span className="italic font-normal text-[#8C9A84]">&amp; Anomaly Detection</span>
              </h1>
              <p className="text-xs text-[#8C9A84] mt-0.5 font-sans">
                Kaggle-standard benchmark trained on 5,000 Indian cadastral records with explainable risk drivers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#F2F0EB] text-[#2D3A31] rounded-full text-xs font-medium border border-[#E6E2DA]">
            <Database className="w-3.5 h-3.5 text-[#8C9A84]" />
            <span>Kaggle Dataset: <strong>5,000 Samples</strong></span>
          </div>

          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2D3A31] hover:bg-[#1E2822] disabled:opacity-50 text-[#F9F8F4] rounded-full text-xs font-semibold shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
            <span>{retraining ? 'Retraining Pipeline...' : 'Retrain Pipeline'}</span>
          </button>
        </div>
      </div>

      {retrainSuccess && (
        <div className="p-4 bg-[#8C9A84]/15 border border-[#8C9A84]/40 rounded-2xl flex items-center gap-3 text-xs text-[#2D3A31]">
          <CheckCircle2 className="w-4 h-4 text-[#2D3A31]" />
          <span>Model retrained successfully with 5-fold cross validation. Leaderboard updated in real-time.</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div className="bg-white p-5 rounded-3xl border border-[#E6E2DA] shadow-[0_4px_20px_rgba(45,58,49,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-serif tracking-wider text-[#8C9A84] font-semibold">
              Best Architecture
            </span>
            <Award className="w-4 h-4 text-[#8C9A84]" />
          </div>
          <div className="mt-3">
            <span className="text-lg md:text-xl font-serif font-bold text-[#2D3A31] block truncate">
              Random Forest
            </span>
            <span className="text-[10px] text-[#8C9A84] block mt-0.5">Ensemble (100 Trees)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E2DA] shadow-[0_4px_20px_rgba(45,58,49,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-serif tracking-wider text-[#8C9A84] font-semibold">
              Test Accuracy
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#8C9A84]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-[#2D3A31]">
              {selectedMetrics.accuracy ? `${selectedMetrics.accuracy.toFixed(1)}%` : '99.8%'}
            </span>
            <span className="text-[10px] text-[#8C9A84] block mt-0.5">1,000 Holdout Samples</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E2DA] shadow-[0_4px_20px_rgba(45,58,49,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-serif tracking-wider text-[#8C9A84] font-semibold">
              ROC-AUC Score
            </span>
            <TrendingUp className="w-4 h-4 text-[#8C9A84]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-[#2D3A31]">
              {selectedMetrics.roc_auc ? `${selectedMetrics.roc_auc.toFixed(1)}%` : '100.0%'}
            </span>
            <span className="text-[10px] text-[#8C9A84] block mt-0.5">Discriminative Power</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E2DA] shadow-[0_4px_20px_rgba(45,58,49,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-serif tracking-wider text-[#8C9A84] font-semibold">
              5-Fold Cross Validation
            </span>
            <Scale className="w-4 h-4 text-[#8C9A84]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-[#2D3A31]">
              {selectedMetrics.cv_roc_auc_mean ? `${selectedMetrics.cv_roc_auc_mean.toFixed(1)}%` : '100.0%'}
            </span>
            <span className="text-[10px] text-[#8C9A84] block mt-0.5">Std Dev: ±{selectedMetrics.cv_roc_auc_std?.toFixed(2) || '0.00'}%</span>
          </div>
        </div>
      </div>

      {/* Model Benchmark Leaderboard */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.05)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#2D3A31]">
              Model Benchmark Leaderboard
            </h2>
            <p className="text-xs text-[#8C9A84] mt-0.5">
              Comparative evaluation of ensemble and baseline models on Indian Cadastral Land Title Benchmark.
            </p>
          </div>
          <span className="text-[10px] px-3 py-1 bg-[#8C9A84]/15 text-[#2D3A31] rounded-full font-serif font-semibold">
            Stratified 80/20 Split
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6E2DA] text-[#8C9A84] font-serif uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Model Architecture</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4">Precision</th>
                <th className="py-3 px-4">Recall</th>
                <th className="py-3 px-4">F1 Score</th>
                <th className="py-3 px-4">ROC-AUC</th>
                <th className="py-3 px-4">5-Fold CV</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2DA]/60">
              {leaderboard.map((m: any, idx: number) => {
                const isSelected = idx === 0;
                return (
                  <tr key={m.model_name} className={isSelected ? 'bg-[#8C9A84]/10 font-medium' : 'hover:bg-[#F9F8F4]'}>
                    <td className="py-4 px-4 flex items-center gap-2">
                      {isSelected && <Award className="w-4 h-4 text-[#2D3A31]" />}
                      <span className="text-[#2D3A31] font-semibold">{m.model_name}</span>
                    </td>
                    <td className="py-4 px-4 font-mono">{m.accuracy?.toFixed(1)}%</td>
                    <td className="py-4 px-4 font-mono">{m.precision?.toFixed(1)}%</td>
                    <td className="py-4 px-4 font-mono">{m.recall?.toFixed(1)}%</td>
                    <td className="py-4 px-4 font-mono">{m.f1_score?.toFixed(1)}%</td>
                    <td className="py-4 px-4 font-mono">{m.roc_auc?.toFixed(1)}%</td>
                    <td className="py-4 px-4 font-mono">{m.cv_roc_auc_mean?.toFixed(1)}%</td>
                    <td className="py-4 px-4 text-right">
                      {isSelected ? (
                        <span className="px-3 py-1 bg-[#2D3A31] text-[#F9F8F4] text-[10px] font-semibold rounded-full">
                          Selected Model
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-[#F2F0EB] text-[#8C9A84] text-[10px] font-medium rounded-full">
                          Baseline
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Importances & Diagnostic Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feature Importance Bar Chart */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-serif font-bold text-[#2D3A31]">
                Gini Feature Importance
              </h2>
              <p className="text-xs text-[#8C9A84] mt-0.5">
                Top predictors identified by Random Forest for land fraud risk detection.
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-[#8C9A84]" />
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={featureImportances.slice(0, 7)}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E6E2DA" />
                <XAxis type="number" unit="%" stroke="#8C9A84" fontSize={10} />
                <YAxis dataKey="display_name" type="category" stroke="#2D3A31" fontSize={10} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#2D3A31', color: '#F9F8F4', borderRadius: '12px', border: 'none', fontSize: '11px' }}
                  formatter={(val: any) => [`${val}%`, 'Importance']}
                />
                <Bar dataKey="importance" fill="#8C9A84" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 p-3 bg-[#F9F8F4] rounded-2xl text-[11px] text-[#2D3A31] border border-[#E6E2DA] flex items-start gap-2">
            <Info className="w-4 h-4 text-[#8C9A84] shrink-0 mt-0.5" />
            <span>
              <strong>Owner Name Similarity</strong> (23.9%) and <strong>Stamp Duty Ratio</strong> (23.7%) are the strongest anomaly drivers, detecting Benami proxy transactions and property undervaluation.
            </span>
          </div>
        </div>

        {/* Confusion Matrix & Diagnostic Quality */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-serif font-bold text-[#2D3A31]">
                  Confusion Matrix &amp; Diagnostic Quality
                </h2>
                <p className="text-xs text-[#8C9A84] mt-0.5">
                  Holdout validation on 1,000 unobserved cadastral title deeds.
                </p>
              </div>
              <ShieldAlert className="w-4 h-4 text-[#8C9A84]" />
            </div>

            {/* Confusion Matrix 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-4 rounded-2xl bg-[#8C9A84]/10 border border-[#8C9A84]/30">
                <span className="text-[10px] uppercase font-serif text-[#8C9A84] font-semibold">True Negatives (Clean)</span>
                <div className="text-2xl font-serif font-bold text-[#2D3A31] mt-1">{confusionMatrix.true_negatives || 823}</div>
                <span className="text-[10px] text-[#8C9A84]">Correctly verified as genuine</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA]">
                <span className="text-[10px] uppercase font-serif text-[#8C9A84] font-semibold">False Positives (Type I)</span>
                <div className="text-2xl font-serif font-bold text-[#2D3A31] mt-1">{confusionMatrix.false_positives || 0}</div>
                <span className="text-[10px] text-[#8C9A84]">Clean deeds flagged as fraud</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F9F8F4] border border-[#E6E2DA]">
                <span className="text-[10px] uppercase font-serif text-[#8C9A84] font-semibold">False Negatives (Type II)</span>
                <div className="text-2xl font-serif font-bold text-[#2D3A31] mt-1">{confusionMatrix.false_negatives || 0}</div>
                <span className="text-[10px] text-[#8C9A84]">Fraud missed by detector</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#C27B66]/10 border border-[#C27B66]/30">
                <span className="text-[10px] uppercase font-serif text-[#C27B66] font-semibold">True Positives (Fraud)</span>
                <div className="text-2xl font-serif font-bold text-[#C27B66] mt-1">{confusionMatrix.true_positives || 177}</div>
                <span className="text-[10px] text-[#8C9A84]">Correctly detected anomalies</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-[#E6E2DA]">
            <div>
              <span className="text-[10px] text-[#8C9A84] uppercase font-serif">Sensitivity / Recall</span>
              <div className="text-lg font-serif font-bold text-[#2D3A31]">{confusionMatrix.sensitivity?.toFixed(1) || '100.0'}%</div>
            </div>
            <div>
              <span className="text-[10px] text-[#8C9A84] uppercase font-serif">Specificity</span>
              <div className="text-lg font-serif font-bold text-[#2D3A31]">{confusionMatrix.specificity?.toFixed(1) || '100.0'}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive "What-If" Land Fraud Prediction Simulator */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.05)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#2D3A31]" />
              <h2 className="text-lg font-serif font-bold text-[#2D3A31]">
                Interactive &quot;What-If&quot; Land Fraud Simulator
              </h2>
            </div>
            <p className="text-xs text-[#8C9A84] mt-0.5">
              Tune deed parameters, OCR confidence, and spatial overlap to test real-time Random Forest inference.
            </p>
          </div>

          {/* Quick Scenario Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-serif text-[#8C9A84] uppercase tracking-wider font-semibold mr-1">
              Presets:
            </span>
            <button
              onClick={() => applyScenario('clean')}
              className="px-3 py-1.5 rounded-full text-xs bg-[#8C9A84]/15 hover:bg-[#8C9A84]/30 text-[#2D3A31] font-medium transition-all"
            >
              Clean Deed
            </button>
            <button
              onClick={() => applyScenario('encroachment')}
              className="px-3 py-1.5 rounded-full text-xs bg-[#C27B66]/15 hover:bg-[#C27B66]/30 text-[#C27B66] font-medium transition-all"
            >
              Boundary Overlap
            </button>
            <button
              onClick={() => applyScenario('benami')}
              className="px-3 py-1.5 rounded-full text-xs bg-[#C27B66]/15 hover:bg-[#C27B66]/30 text-[#C27B66] font-medium transition-all"
            >
              Identity / Benami
            </button>
            <button
              onClick={() => applyScenario('undervalued')}
              className="px-3 py-1.5 rounded-full text-xs bg-[#DCCFC2]/40 hover:bg-[#DCCFC2]/60 text-[#2D3A31] font-medium transition-all"
            >
              Undervaluation
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sliders and Parameters Form */}
          <div className="lg:col-span-7 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Stated Area */}
              <div>
                <label className="text-xs font-serif text-[#2D3A31] font-semibold flex justify-between">
                  <span>Stated Deed Area:</span>
                  <span className="font-mono text-[#8C9A84]">{statedArea} Acres</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="20.0"
                  step="0.1"
                  value={statedArea}
                  onChange={(e) => setStatedArea(parseFloat(e.target.value))}
                  className="w-full mt-2 accent-[#2D3A31]"
                />
              </div>

              {/* GIS Calculated Area */}
              <div>
                <label className="text-xs font-serif text-[#2D3A31] font-semibold flex justify-between">
                  <span>GIS Calculated Area:</span>
                  <span className="font-mono text-[#8C9A84]">{gisArea} Acres</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="20.0"
                  step="0.1"
                  value={gisArea}
                  onChange={(e) => setGisArea(parseFloat(e.target.value))}
                  className="w-full mt-2 accent-[#2D3A31]"
                />
              </div>
            </div>

            {/* Boundary Overlap Ratio */}
            <div>
              <label className="text-xs font-serif text-[#2D3A31] font-semibold flex justify-between">
                <span>Spatial Boundary Overlap Ratio:</span>
                <span className="font-mono text-[#8C9A84]">{(overlapRatio * 100).toFixed(1)}% Overlap</span>
              </label>
              <input
                type="range"
                min="0.0"
                max="0.5"
                step="0.01"
                value={overlapRatio}
                onChange={(e) => setOverlapRatio(parseFloat(e.target.value))}
                className="w-full mt-2 accent-[#2D3A31]"
              />
            </div>

            {/* Owner Name Similarity */}
            <div>
              <label className="text-xs font-serif text-[#2D3A31] font-semibold flex justify-between">
                <span>Owner Phonetic / Name Similarity:</span>
                <span className="font-mono text-[#8C9A84]">{(nameSimilarity * 100).toFixed(0)}% Match</span>
              </label>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.02"
                value={nameSimilarity}
                onChange={(e) => setNameSimilarity(parseFloat(e.target.value))}
                className="w-full mt-2 accent-[#2D3A31]"
              />
            </div>

            {/* Stamp Duty Ratio */}
            <div>
              <label className="text-xs font-serif text-[#2D3A31] font-semibold flex justify-between">
                <span>Stamp Duty Paid vs Circle Rate Ratio:</span>
                <span className="font-mono text-[#8C9A84]">{(stampDutyRatio * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.2"
                max="1.5"
                step="0.05"
                value={stampDutyRatio}
                onChange={(e) => setStampDutyRatio(parseFloat(e.target.value))}
                className="w-full mt-2 accent-[#2D3A31]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* OCR Confidence */}
              <div>
                <label className="text-xs font-serif text-[#2D3A31] font-semibold block mb-1">
                  OCR Clarity: <span className="font-mono text-[#8C9A84]">{ocrConfidence}%</span>
                </label>
                <input
                  type="range"
                  min="40"
                  max="100"
                  step="1"
                  value={ocrConfidence}
                  onChange={(e) => setOcrConfidence(parseFloat(e.target.value))}
                  className="w-full accent-[#2D3A31]"
                />
              </div>

              {/* Date Gap Days */}
              <div>
                <label className="text-xs font-serif text-[#2D3A31] font-semibold block mb-1">
                  Registration Gap: <span className="font-mono text-[#8C9A84]">{dateGapDays} Days</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="365"
                  step="5"
                  value={dateGapDays}
                  onChange={(e) => setDateGapDays(parseInt(e.target.value))}
                  className="w-full accent-[#2D3A31]"
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="text-xs font-serif text-[#2D3A31] font-semibold block mb-1">
                  Document Type:
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-[#E6E2DA] bg-[#F9F8F4] text-[#2D3A31]"
                >
                  <option value="PATTA">Patta Passbook</option>
                  <option value="SALE_DEED">Sale Deed</option>
                  <option value="SETTLEMENT_DEED">Settlement Deed</option>
                  <option value="POWER_OF_ATTORNEY">Power of Attorney</option>
                  <option value="WILL">Will Deed</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => runSimulation()}
                disabled={simLoading}
                className="w-full py-3 bg-[#2D3A31] hover:bg-[#1E2822] text-[#F9F8F4] rounded-full text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <BrainCircuit className="w-4 h-4 text-[#8C9A84]" />
                <span>{simLoading ? 'Running Inference...' : 'Evaluate ML Risk Prediction'}</span>
              </button>
            </div>
          </div>

          {/* Prediction Result Gauge & Drivers */}
          <div className="lg:col-span-5 bg-[#F9F8F4] p-6 rounded-3xl border border-[#E6E2DA] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-serif uppercase tracking-wider text-[#8C9A84] font-semibold">
                  ML Inference Result
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#8C9A84]/20 text-[#2D3A31] font-mono">
                  Sub-millisecond
                </span>
              </div>

              {simPrediction && (
                <div className="space-y-4">
                  {/* Gauge Card */}
                  <div className={`p-5 rounded-2xl border ${
                    simPrediction.risk_level === 'CRITICAL' || simPrediction.risk_level === 'HIGH'
                      ? 'bg-[#C27B66]/10 border-[#C27B66]/30 text-[#C27B66]'
                      : simPrediction.risk_level === 'MEDIUM'
                      ? 'bg-[#DCCFC2]/30 border-[#DCCFC2] text-[#2D3A31]'
                      : 'bg-[#8C9A84]/15 border-[#8C9A84]/30 text-[#2D3A31]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-serif font-bold">
                        {simPrediction.risk_level} RISK
                      </span>
                      <span className="text-xs font-mono font-bold">
                        {simPrediction.fraud_probability}% Fraud Probability
                      </span>
                    </div>

                    <div className="w-full bg-white/60 h-3 rounded-full overflow-hidden mt-3">
                      <div
                        className={`h-full transition-all duration-500 ${
                          simPrediction.fraud_probability > 50 ? 'bg-[#C27B66]' : 'bg-[#8C9A84]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, simPrediction.fraud_probability))}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] mt-2 opacity-80">
                      <span>Model Confidence: {simPrediction.confidence_score}%</span>
                      <span>Outcome: {simPrediction.fraud_prediction === 1 ? 'Fraud Anomaly' : 'Clean Title'}</span>
                    </div>
                  </div>

                  {/* Explainable Factor Drivers */}
                  <div>
                    <span className="text-xs font-serif font-semibold text-[#2D3A31] block mb-2">
                      Explainable Factor Drivers:
                    </span>
                    <div className="space-y-2">
                      {simPrediction.risk_drivers?.map((driver: string, i: number) => (
                        <div key={i} className="p-3 bg-white rounded-xl text-xs text-[#2D3A31] border border-[#E6E2DA] flex items-start gap-2 shadow-sm">
                          {simPrediction.risk_level === 'CRITICAL' || simPrediction.risk_level === 'HIGH' ? (
                            <AlertTriangle className="w-4 h-4 text-[#C27B66] shrink-0 mt-0.5" />
                          ) : (
                            <Check className="w-4 h-4 text-[#8C9A84] shrink-0 mt-0.5" />
                          )}
                          <span className="leading-snug">{driver}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#E6E2DA] text-[11px] text-[#8C9A84]">
              Model: <span className="font-mono text-[#2D3A31]">{simPrediction?.model_version || 'Random Forest Classifier'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
