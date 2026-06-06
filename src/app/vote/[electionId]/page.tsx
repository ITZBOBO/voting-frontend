"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getVoterPositions, castVote, type VoteResponse } from "@/lib/services";
import { useAuthStore } from "@/lib/authStore";

function toTitleCase(str: string | null | undefined): string {
  if (!str) return "";
  return str.split(" ").map((word) => {
    if (!word) return "";
    const upper = word.toUpperCase();
    if (upper === "RUNSA" || upper === "VOTEHUB") return upper;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(" ");
}

const AVATAR_PALETTES = [
  { bg: "#1e3a5f", text: "#60a5fa" },
  { bg: "#14532d", text: "#4ade80" },
  { bg: "#3b0764", text: "#c084fc" },
  { bg: "#7c2d12", text: "#fb923c" },
  { bg: "#1e1b4b", text: "#818cf8" },
  { bg: "#164e63", text: "#22d3ee" },
];

export default function VotingPage() {
  const { electionId } = useParams();
  const router = useRouter();
  const eId = electionId as string;
  const { user, logout } = useAuthStore();

  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<VoteResponse[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: positions, isLoading } = useQuery({
    queryKey: ["voter-positions", eId],
    queryFn: () => getVoterPositions(eId),
    enabled: !!eId,
  });

  const selectedCount = Object.keys(selections).length;
  const totalPositions = positions?.length ?? 0;
  const allSelected = selectedCount === totalPositions && totalPositions > 0;
  const progressPct = totalPositions > 0 ? (selectedCount / totalPositions) * 100 : 0;
  const electionInfo = positions?.[0]?.election;

  const firstName = user?.fullName?.split(" ")[0] || "Voter";

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
        if (ax.response?.status === 409) voteErrors.push(`${pos.name}: Already voted.`);
        else voteErrors.push(`${pos.name}: ${ax.response?.data?.error || "Failed."}`);
      }
    }
    setResults(voteResults); setErrors(voteErrors); setDone(true); setSubmitting(false);
  }
  const handleLogout = () => { logout(); router.push("/login"); };

  /* ── SUCCESS SCREEN ── */
  if (done) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="vb-root">
          <div className="vb-topbar">
            <div className="vb-brand">
              <div className="vb-brand-icon">
                <ShieldCheck />
              </div>
              <div>
                <p className="vb-brand-name">VoteHub</p>
                <p className="vb-brand-sub">Your vote. Your voice.</p>
              </div>
            </div>
            <button onClick={handleLogout} className="vb-signout-btn">
              <Logout /> <span>Sign out</span>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
            <div className="vb-success-card">
              <div className="vb-success-icon">
                <motion.svg initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
                  width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <motion.polyline points="20 6 9 17 4 12" />
                </motion.svg>
              </div>
              <h1 className="vb-success-title">Vote Cast Successfully!</h1>
              <p className="vb-success-sub">
                {results.length > 0
                  ? `Your ${results.length} vote${results.length > 1 ? "s have" : " has"} been cryptographically sealed.`
                  : "Voting completed."}
              </p>

              {errors.length > 0 && (
                <div className="vb-error-box">
                  {errors.map((e, i) => <p key={i} style={{ fontSize: 13, color: "#fcd34d", margin: 0 }}>{e}</p>)}
                </div>
              )}

              {results.length > 0 && (
                <div className="vb-receipt-box">
                  <p className="vb-receipt-label">🔐 Cryptographic Receipts</p>
                  {results.map((v, i) => (
                    <motion.div key={v.receiptId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="vb-receipt-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 9, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>Hash</p>
                        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#818cf8", wordBreak: "break-all", margin: 0 }}>{v.voteHash}</p>
                      </div>
                      <button onClick={() => handleCopy(v.voteHash)} className="vb-copy-btn">
                        {copied === v.voteHash ? "✓ Copied" : "Copy"}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="vb-success-actions">
                <Link href="/vote" className="vb-btn-outline">← Elections</Link>
                <Link href="/vote/results" className="vb-btn-purple">View Results</Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── MAIN VOTING BOOTH ── */
  return (
    <>
      <style>{STYLES}</style>
      <div className="vb-root">

        {/* ── TOP BAR ── */}
        <div className="vb-topbar">
          <div className="vb-brand">
            <div className="vb-brand-icon"><ShieldCheck /></div>
            <div>
              <p className="vb-brand-name">VoteHub</p>
              <p className="vb-brand-sub">Your vote. Your voice.</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Mobile: hamburger for sidebar drawer */}
            <button className="vb-hamburger" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <button onClick={handleLogout} className="vb-signout-btn">
              <Logout /> <span className="vb-signout-label">Sign out</span>
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="vb-body">

          {/* ── LEFT SIDEBAR (desktop) ── */}
          <aside className="vb-sidebar">
            <SidebarContent firstName={firstName} matricNo={user?.matricNo} />
          </aside>

          {/* ── MOBILE DRAWER OVERLAY ── */}
          <AnimatePresence>
            {drawerOpen && (
              <>
                <motion.div className="vb-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setDrawerOpen(false)} />
                <motion.div className="vb-drawer" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 32 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", margin: 0 }}>Voting Guide</p>
                    <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    <SidebarContent firstName={firstName} matricNo={user?.matricNo} />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* ── MAIN CONTENT ── */}
          <main className="vb-main">

            {/* Election Header */}
            <div className="vb-election-header">
              <div className="vb-election-meta-top">
                <div className="vb-active-label">
                  <CalendarIcon size={14} color="#7c3aed" />
                  <span>Active Election</span>
                </div>
                <div className="vb-active-badge">
                  <span className="vb-pulse-dot" />
                  <span>Active</span>
                </div>
              </div>

              {isLoading ? (
                <div style={{ height: 32, background: "rgba(255,255,255,0.05)", borderRadius: 8, margin: "12px 0 8px", width: "60%" }} />
              ) : (
                <h1 className="vb-election-title">
                  {toTitleCase(electionInfo?.title || "Election")}
                </h1>
              )}
              <p className="vb-election-sub">
                {positions?.length ? `Choose one candidate to vote in this election.` : "Loading…"}
              </p>

              <div className="vb-election-pills">
                {electionInfo?.endAt && (
                  <div className="vb-pill">
                    <CalendarIcon size={12} color="#94a3b8" />
                    Ends: {new Date(electionInfo.endAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </div>
                )}
                <div className="vb-pill">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                  All students eligible
                </div>
              </div>
            </div>

            <div className="vb-divider" />

            {/* Loading */}
            {isLoading && (
              <div className="vb-loading-state">
                <div className="vb-spinner" />
                <p>Preparing your ballot…</p>
              </div>
            )}

            {/* Positions */}
            {!isLoading && positions && positions.length > 0 && (
              <div className="vb-positions">
                {positions.map((pos) => {
                  const approved = (pos.candidates || []).filter((c) => c.status === "APPROVED");
                  const isFilled = !!selections[pos.id];

                  return (
                    <div key={pos.id} className="vb-position">
                      {/* Position heading */}
                      <div className="vb-pos-header">
                        <div className={`vb-pos-icon ${isFilled ? "filled" : ""}`}>
                          {isFilled ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h2 className="vb-pos-title">{toTitleCase(pos.name)}</h2>
                          <p className="vb-pos-sub">
                            Select <strong style={{ color: "#7c3aed" }}>ONE</strong> candidate below.
                          </p>
                        </div>
                        {!isFilled && <span className="vb-required-badge">Required</span>}
                      </div>

                      {/* Candidate cards */}
                      {approved.length > 0 ? (
                        <div className="vb-candidate-grid">
                          {approved.map((cand, ci) => {
                            const selected = selections[pos.id] === cand.id;
                            const palette = AVATAR_PALETTES[ci % AVATAR_PALETTES.length];
                            const nameInitials = (cand.user?.fullName || cand.user?.matricNo || "??")
                              .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

                            return (
                              <motion.div
                                key={cand.id}
                                onClick={() => handleSelect(pos.id, cand.id)}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`vb-candidate-card ${selected ? "selected" : ""}`}
                              >
                                {/* Radio */}
                                <div className={`vb-radio ${selected ? "selected" : ""}`}>
                                  {selected && <div className="vb-radio-dot" />}
                                </div>

                                {/* Avatar */}
                                <div className="vb-avatar" style={{ background: palette.bg, color: palette.text }}>
                                  {cand.photoUrl
                                    ? <img src={cand.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : nameInitials}
                                </div>

                                <p className="vb-cand-name">{cand.user?.fullName || cand.user?.matricNo}</p>
                                <div className="vb-cand-tag">{cand.user?.matricNo || "—"}</div>

                                <div className="vb-cand-divider" />

                                {cand.manifesto ? (
                                  <p className="vb-cand-manifesto">{cand.manifesto}</p>
                                ) : (
                                  <p className="vb-cand-manifesto" style={{ color: "#2d3748", fontStyle: "italic" }}>No manifesto provided.</p>
                                )}

                                <button className={`vb-manifesto-btn ${selected ? "selected" : ""}`}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                  </svg>
                                  View Manifesto
                                </button>
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="vb-empty-candidates">
                          <p>No approved candidates for this position.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!isLoading && (!positions || positions.length === 0) && (
              <div className="vb-loading-state">
                <p>No positions configured for this election.</p>
              </div>
            )}

          </main>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="vb-bottom">
          {/* Info strip */}
          <div className="vb-info-strip">
            <div className="vb-info-left">
              <div className="vb-shield-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <p className="vb-info-title">Your vote is private and secure</p>
                <p className="vb-info-sub">You can only vote once. Your identity is protected.</p>
              </div>
            </div>

            <div className="vb-progress-block">
              <p className="vb-progress-label">Vote progress</p>
              <div className="vb-progress-row">
                <div className="vb-progress-track">
                  <motion.div className="vb-progress-fill"
                    animate={{ width: `${progressPct}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                </div>
                <span className={`vb-progress-text ${allSelected ? "ready" : ""}`}>
                  {allSelected ? "✓ Ready" : "Not submitted"}
                </span>
              </div>
            </div>

            <div className="vb-lock-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
          </div>

          {/* Submit */}
          <button className={`vb-submit-btn ${selectedCount === 0 ? "disabled" : ""}`}
            onClick={handleSubmitVotes} disabled={submitting || selectedCount === 0}>
            {submitting ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="vb-spinner-sm" />
                Encoding Ballot…
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Submit Vote
                </div>
                <span className="vb-submit-sub">You will be asked to confirm your choice.</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── SIDEBAR CONTENT (reused in desktop + drawer) ── */
function SidebarContent({ firstName, matricNo }: { firstName: string; matricNo?: string }) {
  return (
    <div className="vb-sidebar-inner">
      {/* User */}
      <div className="vb-sidebar-section border-b">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div className="vb-user-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <p className="vb-user-name">Hello, {firstName}</p>
            <p className="vb-user-id">Voter ID: {matricNo || "—"}</p>
          </div>
        </div>
        <div className="vb-verified-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Verified
        </div>
      </div>

      {/* How to vote */}
      <div className="vb-sidebar-section border-b">
        <div className="vb-section-heading">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          How to vote
        </div>
        {[
          { n: 1, title: "Review the election", desc: "Read the details and candidates." },
          { n: 2, title: "Select your choice", desc: "Choose one candidate." },
          { n: 3, title: "Submit your vote", desc: "Confirm and securely submit your vote." },
        ].map((step, i) => (
          <div key={step.n} className="vb-step-row">
            <div className="vb-step-left">
              <div className="vb-step-num">{step.n}</div>
              {i < 2 && <div className="vb-step-line" />}
            </div>
            <div className={`vb-step-content ${i < 2 ? "mb" : ""}`}>
              <p className="vb-step-title">{step.title}</p>
              <p className="vb-step-desc">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Secure */}
      <div className="vb-sidebar-section border-b">
        <div className="vb-section-heading">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Secure & Confidential
        </div>
        <p className="vb-section-body">Your vote is encrypted and anonymous. We can&apos;t see who you vote for.</p>
        <div className="vb-encrypted-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          End-to-end encrypted
        </div>
      </div>

      {/* Help */}
      <div className="vb-sidebar-section">
        <div className="vb-section-heading">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Need help?
        </div>
        <p className="vb-section-body">Contact support if you have any issues or questions.</p>
        <a href="mailto:support@runsa.org" className="vb-support-btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
          </svg>
          Contact Support
        </a>
      </div>
    </div>
  );
}

/* ── SVG ICON HELPERS ── */
function ShieldCheck() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 12 15 16 9"/>
    </svg>
  );
}
function Logout() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}
function CalendarIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

/* ── ALL CSS ── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

  .vb-root {
    position: fixed; inset: 0; z-index: 100;
    background: #0d1117;
    font-family: 'Manrope', sans-serif;
    display: flex; flex-direction: column;
    overflow: hidden;
    color: #ffffff;
  }

  /* ── TOP BAR ── */
  .vb-topbar {
    height: 56px; flex-shrink: 0;
    background: #111827;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20px;
  }
  .vb-brand { display: flex; align-items: center; gap: 10px; }
  .vb-brand-icon {
    width: 34px; height: 34px; border-radius: 9px;
    background: #7c3aed;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .vb-brand-name { font-size: 14px; font-weight: 800; color: #fff; margin: 0; line-height: 1; }
  .vb-brand-sub  { font-size: 10px; color: #475569; margin: 0; margin-top: 2px; }
  .vb-signout-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
    background: transparent; color: #94a3b8; font-size: 13px; font-weight: 600;
    cursor: pointer; font-family: 'Manrope', sans-serif;
  }
  .vb-signout-label { display: none; }
  .vb-hamburger {
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
    color: #64748b; cursor: pointer;
  }

  /* ── BODY ── */
  .vb-body {
    flex: 1; display: flex; overflow: hidden; position: relative;
  }

  /* ── SIDEBAR (desktop only) ── */
  .vb-sidebar {
    display: none;
    width: 260px; flex-shrink: 0;
    background: #111827;
    border-right: 1px solid rgba(255,255,255,0.06);
    overflow-y: auto;
  }
  .vb-sidebar-inner { display: flex; flex-direction: column; }
  .vb-sidebar-section { padding: 20px; }
  .vb-sidebar-section.border-b { border-bottom: 1px solid rgba(255,255,255,0.06); }

  /* ── MOBILE DRAWER ── */
  .vb-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);
  }
  .vb-drawer {
    position: fixed; top: 0; left: 0; bottom: 0; z-index: 201;
    width: min(280px, 85vw);
    background: #111827;
    border-right: 1px solid rgba(255,255,255,0.08);
    display: flex; flex-direction: column;
    overflow: hidden;
  }

  /* ── MAIN CONTENT ── */
  .vb-main {
    flex: 1; overflow-y: auto;
    padding: 24px 16px 200px;
  }

  /* Election Header */
  .vb-election-header { margin-bottom: 24px; }
  .vb-election-meta-top {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
  }
  .vb-active-label {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 700; color: #7c3aed;
  }
  .vb-active-badge {
    display: flex; align-items: center; gap: 6px;
    background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.35);
    border-radius: 999px; padding: 4px 12px;
    font-size: 12px; font-weight: 700; color: #c4b5fd;
  }
  .vb-pulse-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #a78bfa; display: block;
    animation: pulse-dot 2s ease-in-out infinite;
  }
  .vb-election-title {
    font-size: 24px; font-weight: 800; color: #ffffff;
    margin: 0 0 8px; letter-spacing: -0.4px; line-height: 1.25;
  }
  .vb-election-sub { font-size: 13px; color: #64748b; margin: 0 0 16px; }
  .vb-election-pills { display: flex; gap: 8px; flex-wrap: wrap; }
  .vb-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 12px; border: 1px solid rgba(255,255,255,0.08); border-radius: 999px;
    font-size: 11px; color: #94a3b8;
  }

  .vb-divider { height: 1px; background: rgba(255,255,255,0.06); margin-bottom: 24px; }

  /* Loading */
  .vb-loading-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 200px; gap: 12px;
    color: #475569; font-size: 13px;
  }

  /* Positions */
  .vb-positions { display: flex; flex-direction: column; gap: 32px; }
  .vb-position {}
  .vb-pos-header {
    display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px;
  }
  .vb-pos-icon {
    width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
    background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.2);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.3s;
  }
  .vb-pos-icon.filled {
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    border-color: transparent;
  }
  .vb-pos-title { font-size: 17px; font-weight: 800; color: #ffffff; margin: 0 0 3px; }
  .vb-pos-sub   { font-size: 12px; color: #475569; margin: 0; }
  .vb-required-badge {
    flex-shrink: 0; padding: 3px 10px;
    background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.2);
    border-radius: 999px; font-size: 10px; font-weight: 700; color: #7c3aed;
    margin-top: 2px;
  }

  /* Candidate Grid */
  .vb-candidate-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .vb-candidate-card {
    background: #161b27;
    border: 1.5px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 20px 16px;
    cursor: pointer;
    display: flex; flex-direction: column; align-items: center; text-align: center;
    position: relative;
    transition: all 0.2s ease;
  }
  .vb-candidate-card.selected {
    background: #1a2035;
    border-color: rgba(124,58,237,0.55);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
  }

  /* Radio */
  .vb-radio {
    position: absolute; top: 14px; left: 14px;
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    transition: border-color 0.2s;
  }
  .vb-radio.selected { border-color: #7c3aed; }
  .vb-radio-dot {
    width: 9px; height: 9px; border-radius: 50%; background: #7c3aed;
  }

  /* Avatar */
  .vb-avatar {
    width: 72px; height: 72px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: 800;
    margin-bottom: 14px; margin-top: 4px; flex-shrink: 0;
    overflow: hidden;
  }
  .vb-cand-name  { font-size: 15px; font-weight: 800; color: #fff; margin: 0 0 8px; line-height: 1.3; }
  .vb-cand-tag   {
    padding: 3px 10px; border: 1px solid rgba(255,255,255,0.1); border-radius: 999px;
    font-size: 10px; color: #64748b; font-weight: 600; margin-bottom: 12px;
    font-family: monospace;
  }
  .vb-cand-divider { width: 100%; height: 1px; background: rgba(255,255,255,0.05); margin-bottom: 12px; }
  .vb-cand-manifesto {
    font-size: 12px; color: #475569; line-height: 1.7; margin: 0 0 14px; text-align: left;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }
  .vb-manifesto-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
    background: transparent; color: #475569; font-size: 11px; font-weight: 700;
    cursor: pointer; font-family: 'Manrope', sans-serif; margin-top: auto;
    transition: all 0.2s;
  }
  .vb-manifesto-btn.selected { border-color: rgba(124,58,237,0.4); color: #a78bfa; }

  .vb-empty-candidates {
    padding: 28px; text-align: center; background: #161b27;
    border-radius: 12px; border: 1px dashed rgba(255,255,255,0.06);
    color: #475569; font-size: 13px;
  }

  /* ── BOTTOM BAR ── */
  .vb-bottom { flex-shrink: 0; border-top: 1px solid rgba(255,255,255,0.07); }
  .vb-info-strip {
    background: #111827; padding: 12px 16px;
    display: flex; align-items: center; gap: 12;
  }
  .vb-info-left {
    display: flex; align-items: center; gap: 10; flex: 1; min-width: 0;
  }
  .vb-shield-icon {
    width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
    background: rgba(124,58,237,0.12);
    display: flex; align-items: center; justify-content: center;
  }
  .vb-info-title { font-size: 12px; font-weight: 700; color: #e2e8f0; margin: 0; }
  .vb-info-sub   { font-size: 10px; color: #475569; margin: 0; }
  .vb-progress-block { display: none; }
  .vb-progress-label { font-size: 10px; font-weight: 700; color: #64748b; margin: 0 0 5px; text-transform: uppercase; letter-spacing: 0.06em; }
  .vb-progress-row   { display: flex; align-items: center; gap: 8px; }
  .vb-progress-track { flex: 1; height: 5px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden; min-width: 80px; }
  .vb-progress-fill  { height: 100%; background: linear-gradient(90deg, #7c3aed, #4f46e5); border-radius: 999px; }
  .vb-progress-text  { font-size: 10px; font-weight: 700; color: #475569; white-space: nowrap; }
  .vb-progress-text.ready { color: #a78bfa; }
  .vb-lock-icon {
    width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    display: none; align-items: center; justify-content: center;
  }
  .vb-submit-btn {
    width: 100%; padding: 18px 24px;
    background: linear-gradient(135deg, #7c3aed 0%, #4338ca 100%);
    border: none; color: #fff; font-size: 16px; font-weight: 800;
    cursor: pointer; font-family: 'Manrope', sans-serif;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    transition: opacity 0.2s;
  }
  .vb-submit-btn.disabled {
    background: rgba(124,58,237,0.3); color: rgba(255,255,255,0.35); cursor: not-allowed;
  }
  .vb-submit-sub { font-size: 11px; font-weight: 500; opacity: 0.5; }

  /* ── SIDEBAR COMPONENT STYLES ── */
  .vb-user-avatar {
    width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
    background: #1e2d40; border: 1px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center;
  }
  .vb-user-name { font-size: 14px; font-weight: 700; color: #fff; margin: 0; }
  .vb-user-id   { font-size: 11px; color: #475569; margin: 0; font-family: monospace; }
  .vb-verified-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 999px;
    background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2);
    font-size: 11px; font-weight: 700; color: #22c55e;
  }
  .vb-section-heading {
    display: flex; align-items: center; gap: 7px;
    font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 14px;
  }
  .vb-section-body { font-size: 12px; color: #475569; margin: 0 0 12px; line-height: 1.6; }
  .vb-encrypted-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 999px;
    background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.18);
    font-size: 11px; font-weight: 700; color: #22c55e;
  }
  .vb-support-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 16px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1); background: transparent;
    color: #94a3b8; font-size: 12px; font-weight: 700; text-decoration: none;
  }
  .vb-step-row   { display: flex; gap: 10px; }
  .vb-step-left  { display: flex; flex-direction: column; align-items: center; }
  .vb-step-num   {
    width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
    background: #1e2d40; border: 1px solid rgba(124,58,237,0.4);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; color: #a78bfa;
  }
  .vb-step-line  { width: 1px; flex: 1; min-height: 20px; background: rgba(124,58,237,0.2); margin: 4px 0; }
  .vb-step-content.mb { padding-bottom: 14px; }
  .vb-step-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin: 2px 0 3px; }
  .vb-step-desc  { font-size: 11px; color: #475569; margin: 0; line-height: 1.5; }

  /* Success screen */
  .vb-success-card {
    max-width: 560px; width: 100%;
    background: #161b27; border-radius: 20px; padding: 40px 28px;
    border: 1px solid rgba(255,255,255,0.07); text-align: center;
  }
  .vb-success-icon {
    width: 68px; height: 68px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; box-shadow: 0 0 0 10px rgba(124,58,237,0.1);
  }
  .vb-success-title { font-size: 24px; font-weight: 800; color: #fff; margin: 0 0 10px; }
  .vb-success-sub   { font-size: 14px; color: #64748b; margin: 0 0 28px; line-height: 1.7; }
  .vb-error-box { background: rgba(251,146,60,0.08); border: 1px solid rgba(251,146,60,0.2); border-radius: 12px; padding: 14px; margin-bottom: 20px; }
  .vb-receipt-box { background: rgba(255,255,255,0.02); border-radius: 14px; padding: 16px; margin-bottom: 24px; text-align: left; border: 1px solid rgba(255,255,255,0.05); }
  .vb-receipt-label { font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 10px; }
  .vb-receipt-row { background: rgba(255,255,255,0.03); border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 10; flex-wrap: wrap; }
  .vb-copy-btn { padding: 6px 12px; border-radius: 7px; border: 1px solid rgba(124,58,237,0.35); background: transparent; color: #a78bfa; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Manrope', sans-serif; white-space: nowrap; }
  .vb-success-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .vb-btn-outline { padding: 11px 22px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; font-size: 13px; font-weight: 600; text-decoration: none; }
  .vb-btn-purple  { padding: 11px 22px; border-radius: 10px; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; font-size: 13px; font-weight: 700; text-decoration: none; }

  /* Spinners */
  .vb-spinner    { width: 22px; height: 22px; border: 2.5px solid rgba(124,58,237,0.2); border-top-color: #7c3aed; border-radius: 50%; animation: vbSpin 0.7s linear infinite; }
  .vb-spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: vbSpin 0.7s linear infinite; }

  @keyframes vbSpin    { to { transform: rotate(360deg); } }
  @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }

  /* ── TABLET (≥ 600px) ── */
  @media (min-width: 600px) {
    .vb-main { padding: 28px 28px 200px; }
    .vb-election-title { font-size: 28px; }
    .vb-candidate-grid { grid-template-columns: repeat(2, 1fr); }
    .vb-signout-label { display: inline; }
    .vb-progress-block { display: block; }
    .vb-lock-icon { display: flex; }
    .vb-info-strip { padding: 12px 28px; gap: 20px; }
  }

  /* ── DESKTOP (≥ 900px) ── */
  @media (min-width: 900px) {
    .vb-sidebar { display: flex; flex-direction: column; }
    .vb-hamburger { display: none; }
    .vb-main { padding: 28px 36px 200px; }
    .vb-election-title { font-size: 30px; }
    .vb-candidate-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
    .vb-info-strip { padding: 14px 36px; }
  }
`;
