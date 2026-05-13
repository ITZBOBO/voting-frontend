"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { getVoterPositions, castVote, type VoteResponse } from "@/lib/services";
import Link from "next/link";

export default function VotingPage() {
  const { electionId } = useParams();
  const router = useRouter();
  const eId = electionId as string;

  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<VoteResponse[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: positions, isLoading } = useQuery({
    queryKey: ["voter-positions", eId],
    queryFn: () => getVoterPositions(eId),
    enabled: !!eId,
  });

  function handleSelect(positionId: string, candidateId: string) {
    setSelections((prev) => ({ ...prev, [positionId]: candidateId }));
  }

  function handleCopy(hash: string) {
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(hash);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  async function handleSubmitVotes() {
    if (!positions) return;
    setSubmitting(true);
    setErrors([]);
    const voteResults: VoteResponse[] = [];
    const voteErrors: string[] = [];

    for (const pos of positions) {
      const candidateId = selections[pos.id];
      if (!candidateId) continue;
      try {
        const res = await castVote({ positionId: pos.id, candidateId });
        voteResults.push(res);
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { error?: string }; status?: number } };
        if (ax.response?.status === 409) {
          voteErrors.push(`${pos.name}: You have already voted for this position.`);
        } else {
          voteErrors.push(`${pos.name}: ${ax.response?.data?.error || "Failed to cast vote."}`);
        }
      }
    }

    setResults(voteResults);
    setErrors(voteErrors);
    setDone(true);
    setSubmitting(false);
  }

  /* ── SUCCESS SCREEN ── */
  if (done) {
    return (
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "40px 0" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(16,185,129,0.35)",
            borderRadius: "20px",
            padding: "48px 40px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 0 60px rgba(16,185,129,0.1)",
          }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, #10b981, #3b82f6, transparent)" }} />

          {/* Animated check */}
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", boxShadow: "0 0 30px rgba(16,185,129,0.2)" }}>
            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <motion.polyline points="20 6 9 17 4 12" />
            </motion.svg>
          </div>

          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", marginBottom: "10px", letterSpacing: "-0.5px" }}>
            Vote Recorded!
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", marginBottom: "32px" }}>
            {results.length > 0
              ? `Successfully cast ${results.length} vote${results.length > 1 ? "s" : ""}. Your ballot is sealed and immutable.`
              : "Voting completed."}
          </p>

          {errors.length > 0 && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", padding: "14px 18px", textAlign: "left", marginBottom: "24px" }}>
              <div style={{ fontWeight: 600, color: "#f87171", marginBottom: "8px", fontSize: "13px" }}>Some votes couldn't be cast:</div>
              <ul style={{ margin: 0, paddingLeft: "18px" }}>
                {errors.map((e, i) => <li key={i} style={{ color: "rgba(239,68,68,0.8)", fontSize: "13px", marginBottom: "4px" }}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* Receipt hashes */}
          {results.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "20px", textAlign: "left", marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px" }}>Cryptographic Receipts</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {results.map((v, i) => (
                  <motion.div
                    key={v.receiptId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.03)", padding: "12px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", alignItems: "center" }}
                  >
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>Hash</div>
                      <div style={{ fontFamily: "monospace", fontSize: "12px", color: "rgba(96,165,250,0.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.voteHash}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(v.voteHash)}
                      style={{ background: copied === v.voteHash ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)", color: copied === v.voteHash ? "#10b981" : "rgba(255,255,255,0.5)", border: `1px solid ${copied === v.voteHash ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.1)"}`, padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s", flexShrink: 0, fontFamily: "inherit" }}
                    >
                      {copied === v.voteHash ? "✓ Copied" : "Copy"}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link href="/vote" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 22px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
              ← Back to Elections
            </Link>
            <Link href="/vote/results" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 22px", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", borderRadius: "10px", fontSize: "13px", fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}>
              View Results →
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const selectedCount = Object.keys(selections).length;
  const totalPositions = positions?.length ?? 0;
  const progressPercent = totalPositions > 0 ? (selectedCount / totalPositions) * 100 : 0;
  const allSelected = selectedCount === totalPositions && totalPositions > 0;

  /* ── VOTING BOOTH ── */
  return (
    <div style={{ paddingBottom: "100px", maxWidth: "900px", margin: "0 auto" }}>

      {/* ── Progress Header ── */}
      <div style={{ marginBottom: "36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <button
              onClick={() => router.push("/vote")}
              style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: "13px", cursor: "pointer", padding: "0 0 8px", fontFamily: "inherit" }}
            >
              ← Elections
            </button>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>Voting Booth</h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "22px", fontWeight: 800, color: allSelected ? "#10b981" : "#fff", transition: "color 0.3s" }}>
              {selectedCount} <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>/ {totalPositions}</span>
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "1px" }}>Selected</div>
          </div>
        </div>

        {/* Segmented progress */}
        <div style={{ display: "flex", gap: "4px" }}>
          {Array.from({ length: Math.max(totalPositions, 1) }).map((_, i) => (
            <motion.div
              key={i}
              style={{
                flex: 1, height: "4px", borderRadius: "100px",
                background: i < selectedCount
                  ? (allSelected ? "#10b981" : "#3b82f6")
                  : "rgba(255,255,255,0.08)",
                transition: "background 0.3s",
              }}
              animate={{ scaleX: [0.95, 1] }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            />
          ))}
        </div>
      </div>

      {/* ── Positions & Candidates ── */}
      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "280px" }}>
          <div className="vb-spinner" />
        </div>
      ) : positions && positions.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          {positions.map((pos) => {
            const isFilled = !!selections[pos.id];
            const approvedCandidates = (pos.candidates || []).filter((c) => c.status === "APPROVED");

            return (
              <div key={pos.id}>
                {/* Position label */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px", paddingBottom: "14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: isFilled ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${isFilled ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
                    {isFilled ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                    )}
                  </div>
                  <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", flex: 1 }}>{pos.name}</h2>
                  {!isFilled && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#fbbf24", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", padding: "3px 10px", borderRadius: "100px" }}>
                      Select one
                    </span>
                  )}
                </div>

                {/* Candidates grid */}
                {approvedCandidates.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
                    {approvedCandidates.map((cand) => {
                      const selected = selections[pos.id] === cand.id;
                      return (
                        <motion.div
                          key={cand.id}
                          onClick={() => handleSelect(pos.id, cand.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelect(pos.id, cand.id); } }}
                          whileHover={{ scale: selected ? 1 : 1.02, translateY: selected ? 0 : -3 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            position: "relative",
                            padding: "20px",
                            borderRadius: "14px",
                            cursor: "pointer",
                            background: selected
                              ? "linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(99,102,241,0.15) 100%)"
                              : "rgba(255,255,255,0.03)",
                            border: selected
                              ? "1px solid rgba(59,130,246,0.55)"
                              : "1px solid rgba(255,255,255,0.07)",
                            boxShadow: selected ? "0 0 30px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
                            transition: "all 0.2s ease",
                            outline: "none",
                            overflow: "hidden",
                          }}
                        >
                          {selected && (
                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #3b82f6, #6366f1)" }} />
                          )}

                          {/* Selected checkmark */}
                          <AnimatePresence>
                            {selected && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                style={{ position: "absolute", top: "14px", right: "14px", width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(59,130,246,0.4)" }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Candidate photo */}
                          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: cand.manifesto ? "14px" : "0" }}>
                            <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: selected ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)", border: `2px solid ${selected ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 700, color: selected ? "#60a5fa" : "rgba(255,255,255,0.3)", flexShrink: 0, transition: "all 0.2s", overflow: "hidden" }}>
                              {cand.photoUrl ? (
                                <img src={cand.photoUrl} alt="Candidate" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} />
                              ) : (
                                (cand.user?.fullName?.[0] || cand.user?.matricNo?.[0] || "?").toUpperCase()
                              )}
                            </div>
                            <div style={{ flex: 1, paddingTop: "4px" }}>
                              <p style={{ fontSize: "15px", fontWeight: 700, color: selected ? "#fff" : "rgba(255,255,255,0.75)", margin: "0 0 4px 0", lineHeight: 1.2, paddingRight: "28px" }}>
                                {cand.user?.fullName || cand.user?.matricNo}
                              </p>
                              <p style={{ fontSize: "11px", color: selected ? "rgba(96,165,250,0.7)" : "rgba(255,255,255,0.3)", margin: 0, fontFamily: "monospace" }}>
                                {cand.user?.matricNo}
                              </p>
                            </div>
                          </div>

                          {cand.manifesto && (
                            <div style={{ background: "rgba(255,255,255,0.04)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.07)" }}>
                              <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Manifesto</div>
                              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {cand.manifesto}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: "32px 24px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "12px" }}>
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "13px" }}>No approved candidates for this position.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "280px", textAlign: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>Ballot Empty</h2>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "13px" }}>No positions have been configured for this election.</p>
        </div>
      )}

      {/* ── Floating Submit Bar ── */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            style={{
              position: "fixed",
              bottom: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "calc(100% - 48px)",
              maxWidth: "640px",
              background: "rgba(6,13,31,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "100px",
              padding: "12px 16px 12px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
              zIndex: 100,
            }}
          >
            <div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Ready to cast</div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#fff" }}>
                {selectedCount} Vote{selectedCount > 1 ? "s" : ""}
                {allSelected && <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600, marginLeft: "8px" }}>· All positions filled ✓</span>}
              </div>
            </div>
            <button
              onClick={handleSubmitVotes}
              disabled={submitting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 28px",
                background: allSelected
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "linear-gradient(135deg, #3b82f6, #6366f1)",
                color: "#fff",
                border: "none",
                borderRadius: "100px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: submitting ? "wait" : "pointer",
                boxShadow: allSelected ? "0 0 24px rgba(16,185,129,0.4)" : "0 0 24px rgba(59,130,246,0.3)",
                transition: "all 0.3s",
                fontFamily: "inherit",
                opacity: submitting ? 0.7 : 1,
                flexShrink: 0,
              }}
            >
              {submitting ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="vb-spinner-sm" /> Encoding…
                </span>
              ) : (
                <>
                  Submit Ballot
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .vb-spinner { width:32px;height:32px;border:2.5px solid rgba(255,255,255,0.08);border-top-color:#3b82f6;border-radius:50%;animation:vbSpin 0.7s linear infinite; }
        .vb-spinner-sm { display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:vbSpin 0.7s linear infinite; }
        @keyframes vbSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
