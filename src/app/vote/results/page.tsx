"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEligibleElections, getClosedElections, type Election } from "@/lib/services";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/authStore";
import api from "@/lib/api";

interface ElectionResultsPayload {
  electionId: string;
  electionTitle: string;
  status: string;
  endAt: string | null;
  totalEligibleVoters: number;
  totalVotesCast: number;
  tally: PositionTally[];
}
interface PositionTally {
  positionId: string;
  positionName: string;
  results: CandidateResult[];
}
interface CandidateResult {
  candidateId: string;
  name: string;
  matricNo: string;
  photoUrl: string | null;
  department: string | null;
  count: number;
}

async function getVoterResults(id: string): Promise<ElectionResultsPayload> {
  const { data } = await api.get(`/elections/${id}/results`);
  return data;
}

function toTitleCase(str: string | null | undefined): string {
  if (!str) return "";
  return str.split(" ").map((word) => {
    if (!word) return "";
    const upper = word.toUpperCase();
    if (upper === "RUNSA" || upper === "VOTEHUB") return upper;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(" ");
}

export default function VoterResultsPage() {
  const { user } = useAuthStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: openElections }   = useQuery({ queryKey: ["voter-elections"],        queryFn: getEligibleElections });
  const { data: closedElections } = useQuery({ queryKey: ["voter-closed-elections"], queryFn: getClosedElections  });

  const allElections: Election[] = [
    ...(openElections ?? []),
    ...(closedElections ?? []).filter(c => !openElections?.find(o => o.id === c.id)),
  ];

  const { data: resultData, isLoading } = useQuery({
    queryKey: ["voter-results", selectedId],
    queryFn: () => getVoterResults(selectedId!),
    enabled: !!selectedId,
  });

  const tally          = resultData?.tally ?? [];
  const totalEligible  = resultData?.totalEligibleVoters ?? 0;
  const totalCast      = resultData?.totalVotesCast ?? 0;
  const turnoutPercent = totalEligible > 0 ? (totalCast / totalEligible) * 100 : 0;
  const radius         = 44;
  const circumference  = 2 * Math.PI * radius;
  const strokeOffset   = circumference - (turnoutPercent / 100) * circumference;
  const isOpen         = resultData?.status === "OPEN";

  const formatDate = (dateStr: string | null | undefined) => {
    if (typeof dateStr !== "string") return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <>
      <style>{`
        .vr-page { display: flex; flex-direction: column; gap: 20px; }
        .vr-title { font-size: 22px; font-weight: 800; color: #0e1628; margin: 0; line-height: 1.2; }
        .vr-sub   { font-size: 13px; color: #64748b; margin: 5px 0 0; }

        .vr-picker-row {
          display: flex; align-items: flex-start; flex-direction: column; gap: 14px;
        }
        .vr-picker-label { display: flex; align-items: center; gap: 12px; }
        .vr-picker-icon  {
          width: 42px; height: 42px; border-radius: 11px;
          background: #eff6ff; border: 1px solid #dbeafe;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .vr-picker-title { font-size: 15px; font-weight: 700; color: #0e1628; margin: 0 0 2px; }
        .vr-picker-sub   { font-size: 12px; color: #64748b; margin: 0; }

        .vr-select-wrap { position: relative; width: 100%; }
        .vr-select {
          width: 100%; padding: 11px 40px 11px 14px;
          background: white; border: 1.5px solid #e2e8f0; border-radius: 11px;
          font-size: 14px; font-weight: 600; color: #0e1628; outline: none;
          cursor: pointer; appearance: none; font-family: 'Manrope', sans-serif;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .vr-select-arrow {
          position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
          pointer-events: none;
        }

        .vr-loading {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 200px; background: white; border-radius: 14px; border: 1px solid #e2e8f0; gap: 12px;
        }
        .vr-spinner { width: 22px; height: 22px; border: 2.5px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: vrSpin 0.7s linear infinite; }
        @keyframes vrSpin { to { transform: rotate(360deg); } }

        .vr-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 260px; background: white; border-radius: 14px; border: 1px solid #e2e8f0;
          text-align: center; padding: 32px;
        }

        /* Results layout — mobile: stacked, desktop: 2-col */
        .vr-results-grid {
          display: flex; flex-direction: column; gap: 16px;
        }
        .vr-results-main { display: flex; flex-direction: column; gap: 14px; }
        .vr-results-side { display: flex; flex-direction: column; gap: 14px; }

        /* Cards */
        .vr-card {
          background: white; border-radius: 14px; border: 1px solid #e8ecf2;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04); overflow: hidden;
        }
        .vr-card-pad { padding: 20px; }

        .vr-el-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .vr-status-pill {
          display: inline-flex; align-items: center; gap: 5px;
          border-radius: 999px; padding: 4px 11px; margin-bottom: 10px;
          font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
        }
        .vr-el-title { font-size: 20px; font-weight: 800; color: #0e1628; margin: 0; line-height: 1.3; }
        .vr-ended-box {
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
          padding: 10px 14px; flex-shrink: 0;
        }
        .vr-ended-label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 3px; }
        .vr-ended-val   { font-size: 13px; font-weight: 700; color: #0e1628; }

        /* Position tally */
        .vr-pos-title { font-size: 15px; font-weight: 800; color: #0e1628; margin: 0 0 16px; padding-bottom: 14px; border-bottom: 1px solid #f1f5f9; }
        .vr-cand-row {
          padding: 14px 16px; border-radius: 11px; border: 1px solid #e8ecf2;
          background: #fafbfc; margin-bottom: 10px;
        }
        .vr-cand-row.winner { border-color: #bfdbfe; background: #f0f6ff; }
        .vr-cand-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 8px; }
        .vr-cand-left { display: flex; align-items: center; gap: 10px; }
        .vr-cand-avatar {
          width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
        }
        .vr-cand-name   { font-size: 13px; font-weight: 700; color: #0e1628; margin: 0 0 2px; }
        .vr-cand-dept   { font-size: 11px; color: #94a3b8; margin: 0; }
        .vr-cand-pct    { font-size: 18px; font-weight: 800; }
        .vr-cand-votes  { font-size: 10px; font-weight: 700; color: #94a3b8; text-align: right; margin-top: 1px; }
        .vr-bar-track   { height: 5px; border-radius: 999px; background: #e8ecf2; overflow: hidden; }
        .vr-bar-fill    { height: 100%; border-radius: 999px; }
        .vr-leading-tag {
          font-size: 9px; font-weight: 700; color: #2563eb; background: #dbeafe;
          padding: 2px 7px; border-radius: 999px; margin-left: 6px;
        }

        /* Donut */
        .vr-turnout-card { padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .vr-turnout-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 18px; }
        .vr-donut-wrap { position: relative; width: 130px; height: 130px; margin-bottom: 16px; }
        .vr-donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .vr-donut-pct { font-size: 26px; font-weight: 800; color: #0e1628; line-height: 1; }
        .vr-donut-sub { font-size: 10px; color: #94a3b8; margin-top: 3px; }
        .vr-stat-grid { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .vr-stat-box  { background: #f8fafc; border-radius: 9px; padding: 10px 12px; text-align: center; }
        .vr-stat-val  { font-size: 17px; font-weight: 800; }
        .vr-stat-label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

        /* Info card */
        .vr-info-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
        .vr-info-row   { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
        .vr-info-key   { font-size: 12px; color: #64748b; }
        .vr-info-val   { font-size: 12px; font-weight: 700; color: #0e1628; }
        .vr-divider-sm { height: 1px; background: #f1f5f9; }

        .vr-footer { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #94a3b8; padding-top: 4px; }

        @media (min-width: 768px) {
          .vr-title { font-size: 26px; }
          .vr-picker-row { flex-direction: row; align-items: center; }
          .vr-select-wrap { width: 280px; }
          .vr-results-grid { display: grid; grid-template-columns: 1fr 280px; gap: 18px; align-items: start; }
          .vr-el-title { font-size: 22px; }
        }
        @media (min-width: 1024px) {
          .vr-title { font-size: 28px; }
          .vr-results-grid { grid-template-columns: 1fr 300px; }
          .vr-select-wrap { width: 300px; }
        }
      `}</style>

      <div className="vr-page">
        {/* Header */}
        <div>
          <h1 className="vr-title">Election Results</h1>
          <p className="vr-sub">Live and historical outcome tracking.</p>
        </div>

        <div style={{ height: 1, background: "#e8ecf0" }} />

        {/* Picker */}
        <div className="vr-picker-row">
          <div className="vr-picker-label">
            <div className="vr-picker-icon">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <div>
              <p className="vr-picker-title">Results Overview</p>
              <p className="vr-picker-sub">Select an election to view the tally.</p>
            </div>
          </div>
          <div className="vr-select-wrap">
            <select className="vr-select" value={selectedId ?? ""} onChange={(e) => setSelectedId(e.target.value || null)}>
              <option value="">Select an election…</option>
              {allElections.map((el: Election) => (
                <option key={el.id} value={el.id}>
                  {el.status === "OPEN" ? "🟢 " : el.status === "CLOSED" ? "🔴 " : "⚫ "}{toTitleCase(el.title)}
                </option>
              ))}
            </select>
            <div className="vr-select-arrow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </div>

        {/* Loading */}
        {selectedId && isLoading && (
          <div className="vr-loading">
            <div className="vr-spinner" />
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>Consolidating votes…</span>
          </div>
        )}

        {/* Empty prompt */}
        {!selectedId && (
          <div className="vr-empty">
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0e1628", margin: "0 0 7px" }}>Select an Election</h3>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, maxWidth: 300 }}>Choose an election from the dropdown above to view the live vote tally.</p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {resultData && !isLoading && (
            <motion.div key={selectedId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
              className="vr-results-grid">

              {/* Left: election info + tally */}
              <div className="vr-results-main">

                {/* Election title card */}
                <div className="vr-card vr-card-pad">
                  <div className="vr-el-header">
                    <div>
                      <div className="vr-status-pill" style={{ background: isOpen ? "#eff6ff" : "#f0fdf4", border: `1px solid ${isOpen ? "#dbeafe" : "#bbf7d0"}`, color: isOpen ? "#2563eb" : "#16a34a" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: isOpen ? "#2563eb" : "#22c55e", display: "block" }} />
                        {resultData.status}
                      </div>
                      <h2 className="vr-el-title">{toTitleCase(resultData.electionTitle)}</h2>
                    </div>
                    <div className="vr-ended-box">
                      <p className="vr-ended-label">Ended At</p>
                      <p className="vr-ended-val">{formatDate(resultData.endAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Position tallies */}
                {tally.map((pos, pi) => {
                  const totalVotesForPos = pos.results.reduce((s, c) => s + c.count, 0);
                  return (
                    <motion.div key={pos.positionId} className="vr-card vr-card-pad"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pi * 0.06 }}>
                      <h3 className="vr-pos-title">{toTitleCase(pos.positionName)}</h3>
                      {pos.results.map((cand, i) => {
                        const pct       = totalVotesForPos > 0 ? (cand.count / totalVotesForPos) * 100 : 0;
                        const isWinner  = i === 0 && cand.count > 0;
                        return (
                          <div key={cand.candidateId} className={`vr-cand-row ${isWinner ? "winner" : ""}`}>
                            <div className="vr-cand-top">
                              <div className="vr-cand-left">
                                <div className="vr-cand-avatar" style={{ background: isWinner ? "#dbeafe" : "#e8ecf2", color: isWinner ? "#2563eb" : "#64748b" }}>
                                  {cand.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="vr-cand-name">
                                    {cand.name}
                                    {isWinner && <span className="vr-leading-tag">Leading</span>}
                                  </p>
                                  <p className="vr-cand-dept">{cand.department || cand.matricNo}</p>
                                </div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <p className="vr-cand-pct" style={{ color: isWinner ? "#2563eb" : "#0e1628" }}>{pct.toFixed(1)}%</p>
                                <p className="vr-cand-votes">{cand.count} VOTES</p>
                              </div>
                            </div>
                            <div className="vr-bar-track">
                              <div className="vr-bar-fill" style={{ width: `${pct}%`, background: isWinner ? "#2563eb" : "#94a3b8" }} />
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  );
                })}

                {tally.length === 0 && (
                  <div className="vr-empty" style={{ minHeight: 160 }}>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>No results available yet.</p>
                  </div>
                )}
              </div>

              {/* Right: stats sidebar */}
              <div className="vr-results-side">

                {/* Turnout donut */}
                <div className="vr-card vr-turnout-card">
                  <p className="vr-turnout-label">Voter Turnout</p>
                  <div className="vr-donut-wrap">
                    <svg width="130" height="130" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="65" cy="65" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="11" />
                      <circle cx="65" cy="65" r={radius} fill="transparent" stroke="#2563eb" strokeWidth="11"
                        strokeDasharray={circumference} strokeDashoffset={strokeOffset} strokeLinecap="round" />
                    </svg>
                    <div className="vr-donut-center">
                      <span className="vr-donut-pct">{turnoutPercent.toFixed(0)}%</span>
                      <span className="vr-donut-sub">Turnout</span>
                    </div>
                  </div>
                  <div className="vr-stat-grid">
                    <div className="vr-stat-box">
                      <p className="vr-stat-val" style={{ color: "#2563eb" }}>{totalCast}</p>
                      <p className="vr-stat-label">Voted</p>
                    </div>
                    <div className="vr-stat-box">
                      <p className="vr-stat-val" style={{ color: "#0e1628" }}>{totalEligible}</p>
                      <p className="vr-stat-label">Eligible</p>
                    </div>
                  </div>
                </div>

                {/* Election info */}
                <div className="vr-card vr-card-pad">
                  <p className="vr-info-label">Election Info</p>
                  <div className="vr-info-row">
                    <span className="vr-info-key">Status</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: isOpen ? "#eff6ff" : "#f0fdf4", color: isOpen ? "#2563eb" : "#16a34a" }}>{resultData.status}</span>
                  </div>
                  <div className="vr-divider-sm" />
                  <div className="vr-info-row">
                    <span className="vr-info-key">Positions</span>
                    <span className="vr-info-val">{tally.length}</span>
                  </div>
                  <div className="vr-divider-sm" />
                  <div style={{ padding: "6px 0" }}>
                    <span className="vr-info-key" style={{ display: "block", marginBottom: 4 }}>Ended</span>
                    <span className="vr-info-val">{formatDate(resultData.endAt)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}
