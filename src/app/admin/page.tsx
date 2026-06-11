"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminElections, getCandidates, getRecentVotes } from "@/lib/services";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  OPEN:     { bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e" },
  DRAFT:    { bg: "#f8fafc", color: "#64748b", dot: "#94a3b8" },
  CLOSED:   { bg: "#fffbeb", color: "#d97706", dot: "#f59e0b" },
  ARCHIVED: { bg: "#f8f9fb", color: "#9ca3af", dot: "#d1d5db" },
};

export default function AdminDashboard() {
  const { data: elections, isLoading: le } = useQuery({ queryKey: ["admin-elections"], queryFn: getAdminElections });
  const { data: candidates, isLoading: lc } = useQuery({ queryKey: ["admin-candidates"], queryFn: () => getCandidates() });
  const { data: recentVotes } = useQuery({ queryKey: ["recent-votes"], queryFn: getRecentVotes, refetchInterval: 3000 });
  const loading = le || lc;

  const stats = [
    {
      label: "Total Elections",
      value: elections?.length ?? 0,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      accent: "#2563eb",
      accentBg: "#eff6ff",
    },
    {
      label: "Active Now",
      value: elections?.filter((e) => e.status === "OPEN").length ?? 0,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      accent: "#16a34a",
      accentBg: "#f0fdf4",
    },
    {
      label: "Drafts",
      value: elections?.filter((e) => e.status === "DRAFT").length ?? 0,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
      ),
      accent: "#64748b",
      accentBg: "#f8fafc",
    },
    {
      label: "Closed",
      value: elections?.filter((e) => e.status === "CLOSED").length ?? 0,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      ),
      accent: "#d97706",
      accentBg: "#fffbeb",
    },
    {
      label: "Candidates",
      value: candidates?.length ?? 0,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      accent: "#7c3aed",
      accentBg: "#f5f3ff",
    },
    {
      label: "Pending Approvals",
      value: candidates?.filter((c) => c.status === "PENDING").length ?? 0,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ),
      accent: "#ea580c",
      accentBg: "#fff7ed",
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "320px" }}>
        <div className="db-spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px" }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0c1a3a", marginBottom: "4px", letterSpacing: "-0.3px" }}>
          Dashboard
        </h1>
        <p style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 400 }}>
          Overview of the RUNSA election system
        </p>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }} className="stats-responsive">
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: "#fff",
              border: "1px solid #e8eaf0",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              transition: "box-shadow 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(12,26,58,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
          >
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: s.accentBg, display: "flex", alignItems: "center", justifyContent: "center", color: s.accent, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0c1a3a", lineHeight: 1, marginBottom: "4px" }}>
                {s.value}
              </div>
              <div style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom Section Grid ── */}
      <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "1fr 1fr" }} className="dashboard-bottom">
        
        {/* ── Recent Elections ── */}
        <div style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #f0f1f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#0c1a3a", marginBottom: "2px" }}>Recent Elections</h2>
              <p style={{ fontSize: "12px", color: "#9ca3af" }}>Latest election activity</p>
            </div>
            <Link
              href="/admin/elections"
              style={{ fontSize: "12.5px", fontWeight: 600, color: "#2563eb", textDecoration: "none", padding: "6px 14px", background: "#eff6ff", borderRadius: "7px", border: "1px solid #bfdbfe", transition: "all 0.15s" }}
            >
              View all →
            </Link>
          </div>

          {elections && elections.length > 0 ? (
            <div style={{ flex: 1 }}>
              {elections.slice(0, 5).map((el, i) => {
                const style = STATUS_STYLES[el.status] || STATUS_STYLES.ARCHIVED;
                const isLast = i === elections.slice(0, 5).length - 1;
                return (
                  <div
                    key={el.id}
                    style={{
                      padding: "14px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      borderBottom: isLast ? "none" : "1px solid #f5f6fa",
                      transition: "background 0.15s",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fafbfd")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Status dot */}
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: style.dot, flexShrink: 0 }} />

                    {/* Title */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {el.title}
                      </div>
                      <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                        {el.type?.name || "General"} {el.endAt ? `· Ends ${new Date(el.endAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span style={{ fontSize: "11px", fontWeight: 700, color: style.color, background: style.bg, padding: "3px 10px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.5px", flexShrink: 0 }}>
                      {el.status}
                    </span>

                    {/* Arrow */}
                    <Link
                      href="/admin/elections"
                      style={{ color: "#d1d5db", textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "56px 24px", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px", color: "#93c5fd" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#6b7280", marginBottom: "4px" }}>No elections yet</p>
              <p style={{ fontSize: "12.5px", color: "#9ca3af", marginBottom: "16px" }}>Create your first election to get started</p>
              <Link
                href="/admin/elections"
                style={{ fontSize: "13px", fontWeight: 600, color: "#fff", background: "#2563eb", padding: "8px 20px", borderRadius: "8px", textDecoration: "none" }}
              >
                Create Election →
              </Link>
            </div>
          )}
        </div>

        {/* ── Live Activity Ticker ── */}
        <div style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", height: "400px" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #f0f1f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", animation: "pulse 1.5s infinite" }} />
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#0c1a3a", marginBottom: "2px" }}>Live Vote Feed</h2>
                <p style={{ fontSize: "12px", color: "#9ca3af" }}>Anonymous real-time ticker</p>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }} className="feed-container">
            {recentVotes && recentVotes.length > 0 ? (
              <AnimatePresence initial={false}>
                {recentVotes.map((vote) => (
                  <motion.div
                    key={vote.id}
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    style={{ background: "#f8f9fb", border: "1px solid #f0f1f5", borderRadius: "10px", padding: "12px 14px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#0c1a3a" }}>Vote Cast</span>
                      <span style={{ fontSize: "11px", color: "#9ca3af" }}>{formatDistanceToNow(new Date(vote.createdAt), { addSuffix: true })}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                      An anonymous voter just cast a ballot in <span style={{ fontWeight: 600, color: "#3b82f6" }}>{vote.electionTitle}</span>.
                    </div>
                    <div style={{ fontSize: "10px", fontFamily: "monospace", color: "#94a3b8", background: "#fff", padding: "4px 8px", borderRadius: "6px", border: "1px dashed #e2e8f0", display: "inline-block" }}>
                      Hash: {vote.voteHash.substring(0, 16)}...
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: "13px", color: "#9ca3af" }}>Waiting for live votes...</p>
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        .db-spinner { width:32px;height:32px;border:2.5px solid #e2e4ea;border-top-color:#2563eb;border-radius:50%;animation:dbSpin 0.7s linear infinite; }
        @keyframes dbSpin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
        .feed-container::-webkit-scrollbar { width: 4px; }
        .feed-container::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        @media (max-width: 860px) { 
          .stats-responsive { grid-template-columns: repeat(2,1fr) !important; }
          .dashboard-bottom { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) { .stats-responsive { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
