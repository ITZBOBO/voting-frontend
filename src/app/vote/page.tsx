"use client";

import { useQuery } from "@tanstack/react-query";
import { getEligibleElections, type Election } from "@/lib/services";
import Link from "next/link";
import { motion } from "framer-motion";

function LiveBadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "100px", fontSize: "11px", fontWeight: 700, color: "#f87171", letterSpacing: "0.5px" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f87171", boxShadow: "0 0 6px #f87171", animation: "livePulse 1.5s ease infinite" }} />
      LIVE
    </span>
  );
}

function UpcomingBadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "100px", fontSize: "11px", fontWeight: 700, color: "#fbbf24", letterSpacing: "0.5px" }}>
      UPCOMING
    </span>
  );
}

function ClosedBadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "100px", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.5px" }}>
      CLOSED
    </span>
  );
}

export default function VoterElectionsPage() {
  const { data: elections, isLoading } = useQuery({
    queryKey: ["voter-elections"],
    queryFn: getEligibleElections,
  });

  const now = new Date();

  return (
    <div>
      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center", padding: "24px 0 40px" }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "100px", fontSize: "11px", fontWeight: 700, color: "#60a5fa", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "20px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          RUNSA Electoral Committee
        </span>
        <h1 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800, color: "#fff", marginBottom: "12px", letterSpacing: "-1px", lineHeight: 1.1 }}>
          Elections Portal
        </h1>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.6 }}>
          Select an active election to exercise your franchise. Your vote is secure, anonymous, and immutable.
        </p>
      </motion.div>

      {/* ── Content ── */}
      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "280px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div className="ep-spinner" />
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>Loading elections…</span>
          </div>
        </div>
      ) : elections && elections.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {elections.map((el: Election, index: number) => {
            const isOpen = el.status === "OPEN";
            const start = new Date(el.startAt);
            const end = new Date(el.endAt);
            const isActive = isOpen && now >= start && now <= end;
            const isUpcoming = isOpen && now < start;
            const isClosed = el.status === "CLOSED" || (isOpen && now > end);

            const fmt: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };

            return (
              <motion.div
                key={el.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                style={{
                  position: "relative",
                  borderRadius: "16px",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(30,58,138,0.6) 0%, rgba(17,24,39,0.8) 100%)"
                    : "rgba(255,255,255,0.03)",
                  border: isActive
                    ? "1px solid rgba(59,130,246,0.45)"
                    : "1px solid rgba(255,255,255,0.07)",
                  padding: "24px",
                  boxShadow: isActive ? "0 0 40px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: isActive ? "pointer" : "default",
                  overflow: "hidden",
                }}
                whileHover={isActive ? { translateY: -4, boxShadow: "0 8px 48px rgba(59,130,246,0.2)" } : {}}
              >
                {/* Active glow top bar */}
                {isActive && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, #3b82f6, #10b981, transparent)" }} />
                )}

                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: isActive ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${isActive ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.08)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: isActive ? "#60a5fa" : "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {start.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span style={{ fontSize: "18px", fontWeight: 800, color: isActive ? "#fff" : "rgba(255,255,255,0.4)", lineHeight: 1 }}>
                      {start.getDate()}
                    </span>
                  </div>
                  {isActive ? <LiveBadge /> : isUpcoming ? <UpcomingBadge /> : <ClosedBadge />}
                </div>

                {/* Title */}
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: isActive ? "#fff" : "rgba(255,255,255,0.55)", marginBottom: "6px", lineHeight: 1.3 }}>
                  {el.title}
                </h3>
                <p style={{ fontSize: "12px", color: isActive ? "rgba(96,165,250,0.8)" : "rgba(255,255,255,0.3)", fontWeight: 600, marginBottom: "16px" }}>
                  {el.type?.name ? `${el.type.name} Election` : "Campus-wide Election"}
                </p>

                {/* Date info */}
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "12px", color: "rgba(255,255,255,0.3)", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Opens: {start.toLocaleString("en-US", fmt)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Closes: {end.toLocaleString("en-US", fmt)}
                  </div>
                </div>

                {/* CTA */}
                {isActive ? (
                  <Link
                    href={`/vote/${el.id}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "11px 20px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff", borderRadius: "10px", fontSize: "14px", fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 20px rgba(59,130,246,0.35)", transition: "opacity 0.2s" }}
                  >
                    Cast Your Vote
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </Link>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "11px 20px", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.25)", borderRadius: "10px", fontSize: "13px", fontWeight: 600, border: "1px solid rgba(255,255,255,0.07)" }}>
                    {isClosed ? "Voting Closed" : isUpcoming ? "Not Open Yet" : "Unavailable"}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* ── Empty State ── */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "360px", textAlign: "center", padding: "48px 24px" }}
        >
          <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: "10px" }}>No Active Elections</h3>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.3)", maxWidth: "340px", lineHeight: 1.6 }}>
            There are currently no elections available for you to vote in. Check back later or contact your electoral committee.
          </p>
        </motion.div>
      )}

      <style>{`
        .ep-spinner {
          width: 32px; height: 32px;
          border: 2.5px solid rgba(255,255,255,0.08);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: epSpin 0.7s linear infinite;
        }
        @keyframes epSpin { to { transform: rotate(360deg); } }
        @keyframes livePulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #f87171; }
          50% { opacity: 0.6; box-shadow: 0 0 12px #f87171; }
        }
      `}</style>
    </div>
  );
}
