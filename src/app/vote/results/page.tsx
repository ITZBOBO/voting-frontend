"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEligibleElections, getClosedElections, type Election } from "@/lib/services";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";

interface Tally { electionId: string; electionTitle: string; tally: PositionTally[] }
interface PositionTally { positionId: string; positionName: string; results: { candidateId: string; name: string; count: number }[] }

async function getVoterResults(id: string): Promise<Tally> {
  const { data } = await api.get(`/elections/${id}/results`);
  return data;
}

const MEDAL_COLORS = [
  { border: "rgba(251,191,36,0.5)", bg: "rgba(251,191,36,0.1)", bar: "linear-gradient(90deg, #f59e0b, #fbbf24)", glow: "rgba(251,191,36,0.25)", label: "#fbbf24" },
  { border: "rgba(148,163,184,0.4)", bg: "rgba(148,163,184,0.06)", bar: "linear-gradient(90deg, #64748b, #94a3b8)", glow: "rgba(148,163,184,0.15)", label: "#94a3b8" },
  { border: "rgba(180,100,60,0.4)", bg: "rgba(180,100,60,0.06)", bar: "linear-gradient(90deg, #92400e, #b45309)", glow: "rgba(180,100,60,0.15)", label: "#b45309" },
];

const MEDAL_ICONS = ["🥇", "🥈", "🥉"];

export default function VoterResultsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: openElections } = useQuery({
    queryKey: ["voter-elections"],
    queryFn: getEligibleElections,
  });
  const { data: closedElections } = useQuery({
    queryKey: ["voter-closed-elections"],
    queryFn: getClosedElections,
  });

  // Merge open + closed, deduplicate by id
  const allElections: Election[] = [
    ...(openElections ?? []),
    ...(closedElections ?? []).filter(c => !openElections?.find(o => o.id === c.id)),
  ];

  const { data: resultData, isLoading } = useQuery({
    queryKey: ["voter-results", selectedId],
    queryFn: () => getVoterResults(selectedId!),
    enabled: !!selectedId,
  });

  const tally = resultData?.tally ?? [];

  return (
    <div>
      {/* ── Page Header ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>Election Results</h1>
        </div>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginLeft: "42px" }}>Official results for closed elections</p>
      </motion.div>

      {/* ── Election Selector ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px", marginBottom: "28px" }}>
        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
          Select Election
        </label>
        <select
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value || null)}
          style={{ width: "100%", padding: "11px 14px", background: "rgba(255,255,255,0.05)", color: selectedId ? "#fff" : "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", fontSize: "14px", fontWeight: 500, outline: "none", cursor: "pointer", fontFamily: "inherit", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: "40px", transition: "border-color 0.2s" }}
        >
          <option value="" style={{ background: "#0f172a" }}>Choose an election…</option>
          {allElections.map((el: Election) => (
            <option key={el.id} value={el.id} style={{ background: "#0f172a" }}>
              {el.status === "OPEN" ? "🟢 " : el.status === "CLOSED" ? "🔴 " : "⚫ "}{el.title}
            </option>
          ))}
        </select>
        {!allElections.length && (
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", marginTop: "10px" }}>No elections found.</p>
        )}
      </div>

      {/* ── Loading ── */}
      {selectedId && isLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "220px" }}>
          <div className="vr-spinner" />
        </div>
      )}

      {/* ── Results ── */}
      <AnimatePresence mode="wait">
        {resultData && tally.length > 0 && (
          <motion.div
            key={selectedId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {tally.map((pos, pi) => {
              const totalVotes = pos.results.reduce((s, c) => s + c.count, 0);
              return (
                <motion.div
                  key={pos.positionId}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: pi * 0.08, duration: 0.4 }}
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", overflow: "hidden" }}
                >
                  {/* Position Header */}
                  <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>{pos.positionName}</h3>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "3px 10px", borderRadius: "100px" }}>
                      {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Candidates */}
                  <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                    {pos.results.map((cand, i) => {
                      const pct = totalVotes > 0 ? (cand.count / totalVotes) * 100 : 0;
                      const isWinner = i === 0 && cand.count > 0;
                      const medal = MEDAL_COLORS[i] || { border: "rgba(255,255,255,0.06)", bg: "transparent", bar: "rgba(255,255,255,0.15)", glow: "transparent", label: "rgba(255,255,255,0.35)" };

                      return (
                        <div
                          key={cand.candidateId}
                          style={{
                            background: isWinner ? medal.bg : "transparent",
                            border: isWinner ? `1px solid ${medal.border}` : "1px solid transparent",
                            borderRadius: "12px",
                            padding: isWinner ? "14px" : "0",
                            boxShadow: isWinner ? `0 0 24px ${medal.glow}` : "none",
                            transition: "all 0.3s",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                            <span style={{ fontSize: "18px", lineHeight: 1, width: "24px", textAlign: "center", flexShrink: 0 }}>
                              {MEDAL_ICONS[i] || `${i + 1}.`}
                            </span>
                            <span style={{ flex: 1, fontSize: "14px", fontWeight: isWinner ? 700 : 500, color: isWinner ? "#fff" : "rgba(255,255,255,0.55)" }}>
                              {cand.name}
                            </span>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <span style={{ fontSize: "15px", fontWeight: 700, color: isWinner ? medal.label : "rgba(255,255,255,0.4)" }}>
                                {pct.toFixed(1)}%
                              </span>
                              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>
                                {cand.count} vote{cand.count !== 1 ? "s" : ""}
                              </div>
                            </div>
                          </div>
                          {/* Bar */}
                          <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "100px", overflow: "hidden", marginLeft: "34px" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, ease: "easeOut", delay: pi * 0.08 + i * 0.07 }}
                              style={{ height: "100%", background: i < 3 ? medal.bar : "rgba(255,255,255,0.2)", borderRadius: "100px" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty States ── */}
      {selectedId && !isLoading && tally.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>
          No results available yet.
        </div>
      )}
      {!selectedId && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "220px", textAlign: "center" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "16px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(251,191,36,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px", maxWidth: "300px", lineHeight: 1.6 }}>Select a closed election above to view its official results.</p>
        </div>
      )}

      <style>{`
        .vr-spinner { width:32px;height:32px;border:2.5px solid rgba(255,255,255,0.08);border-top-color:#fbbf24;border-radius:50%;animation:vrSpin 0.7s linear infinite; }
        @keyframes vrSpin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}
