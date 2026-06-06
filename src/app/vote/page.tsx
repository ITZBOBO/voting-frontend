"use client";

import { useQuery } from "@tanstack/react-query";
import { getEligibleElections, type Election } from "@/lib/services";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/authStore";
import Link from "next/link";

function toTitleCase(str: string | null | undefined): string {
  if (!str) return "";
  return str.split(" ").map((word) => {
    if (!word) return "";
    const upper = word.toUpperCase();
    if (upper === "RUNSA" || upper === "VOTEHUB") return upper;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(" ");
}

export default function VoterElectionsPage() {
  const { user } = useAuthStore();
  const { data: elections, isLoading } = useQuery({
    queryKey: ["voter-elections"],
    queryFn: getEligibleElections,
  });

  const now = new Date();

  return (
    <>
      <style>{`
        .vd-page { display: flex; flex-direction: column; gap: 20px; }

        .vd-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .vd-title  { font-size: 22px; font-weight: 800; color: #0e1628; margin: 0; line-height: 1.2; }
        .vd-sub    { font-size: 13px; color: #64748b; margin: 5px 0 0; }

        .vd-section-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .vd-section-left { display: flex; align-items: center; gap: 12px; }
        .vd-section-icon {
          width: 42px; height: 42px; border-radius: 11px;
          background: #eff6ff; border: 1px solid #dbeafe;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .vd-section-title { font-size: 15px; font-weight: 700; color: #0e1628; margin: 0 0 2px; }
        .vd-section-sub   { font-size: 12px; color: #64748b; margin: 0; }

        .vd-sort-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 12px; border: 1px solid #e2e8f0; border-radius: 9px;
          background: white; font-size: 12px; font-weight: 500; color: #64748b;
          cursor: pointer; font-family: 'Manrope', sans-serif; white-space: nowrap;
        }

        .vd-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .vd-card {
          background: white; border-radius: 14px; border: 1px solid #e8ecf2;
          overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          display: flex; flex-direction: column;
        }
        .vd-card-body { padding: 18px 18px 0; }
        .vd-card-top  { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
        .vd-card-icon { width: 38px; height: 38px; border-radius: 9px; background: #eff6ff; display: flex; align-items: center; justify-content: center; }

        .vd-status-badge { display: flex; align-items: center; gap: 4px; }
        .vd-status-dot   { width: 6px; height: 6px; border-radius: 50%; display: block; }

        .vd-card-type    { font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.07em; margin: 0 0 4px; }
        .vd-card-title   { font-size: 15px; font-weight: 800; color: #0e1628; margin: 0 0 14px; line-height: 1.3; }

        .vd-dates { display: flex; flex-direction: column; gap: 6px; border-top: 1px solid #f1f5f9; padding: 12px 0 16px; }
        .vd-date-row { display: flex; align-items: center; gap: 7px; color: #64748b; font-size: 12px; }

        .vd-card-foot { padding: 0 18px 18px; }
        .vd-vote-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 12px; border-radius: 10px; font-weight: 700; font-size: 14px;
          border: none; cursor: pointer; font-family: 'Manrope', sans-serif;
          transition: background 0.15s;
        }

        .vd-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 240px; background: white; border-radius: 14px; border: 1px solid #e2e8f0;
          text-align: center; padding: 28px;
        }

        .vd-banner {
          background: white; border-radius: 14px; border: 1px solid #e8ecf2;
          padding: 22px 20px; display: flex; align-items: center; gap: 16px;
          flex-wrap: wrap;
        }
        .vd-banner-icon {
          width: 48px; height: 48px; border-radius: 50%; background: #eff6ff;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .vd-banner-title { font-size: 16px; font-weight: 800; color: #0e1628; margin: 0 0 4px; }
        .vd-banner-text  { font-size: 13px; color: #64748b; margin: 0; }
        .vd-banner-illus { display: none; }

        .vd-footer { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #94a3b8; padding-top: 4px; }

        .vd-loading {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 240px; background: white; border-radius: 14px; border: 1px solid #e2e8f0; gap: 12px;
        }
        .vd-spinner { width: 22px; height: 22px; border: 2.5px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: vdSpin 0.7s linear infinite; }
        @keyframes vdSpin { to { transform: rotate(360deg); } }

        @media (min-width: 600px) {
          .vd-title  { font-size: 26px; }
          .vd-grid   { grid-template-columns: repeat(2, 1fr); }
          .vd-banner-illus { display: block; width: 130px; height: 100px; margin-left: auto; flex-shrink: 0; }
        }
        @media (min-width: 900px) {
          .vd-title  { font-size: 28px; }
          .vd-grid   { grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); }
          .vd-banner-illus { width: 160px; height: 120px; }
        }
      `}</style>

      <div className="vd-page">
        {/* Header */}
        <div className="vd-header">
          <div>
            <h1 className="vd-title">Active Elections</h1>
            <p className="vd-sub">View and vote in ongoing campus and departmental elections.</p>
          </div>
        </div>

        <div style={{ height: 1, background: "#e8ecf0" }} />

        {/* Section row */}
        <div className="vd-section-row">
          <div className="vd-section-left">
            <div className="vd-section-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div>
              <p className="vd-section-title">Ongoing Elections</p>
              <p className="vd-section-sub">Cast your vote before the deadline.</p>
            </div>
          </div>
          <button className="vd-sort-btn">
            Sort by: Closest closing
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>

        {/* Cards */}
        {isLoading ? (
          <div className="vd-loading">
            <div className="vd-spinner" />
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>Loading elections…</span>
          </div>
        ) : elections && elections.length > 0 ? (
          <div className="vd-grid">
            {elections.map((el: Election, index: number) => {
              const isOpen = el.status === "OPEN";
              const start = typeof el.startAt === "string" ? new Date(el.startAt) : null;
              const end   = typeof el.endAt   === "string" ? new Date(el.endAt)   : null;
              const isActive   = isOpen && (!start || now >= start) && (!end || now <= end);
              const isUpcoming = isOpen && start && now < start;
              const isClosed   = el.status === "CLOSED" || (isOpen && end && now > end);
              const fmt: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };

              return (
                <motion.div key={el.id} className="vd-card"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07, duration: 0.3 }}>
                  <div className="vd-card-body">
                    <div className="vd-card-top">
                      <div className="vd-card-icon">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </div>
                      <div className="vd-status-badge">
                        <span className="vd-status-dot" style={{ background: isActive ? "#22c55e" : isUpcoming ? "#94a3b8" : "#ef4444" }} />
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: isActive ? "#16a34a" : isUpcoming ? "#64748b" : "#dc2626" }}>
                          {isActive ? "ACTIVE" : isUpcoming ? "UPCOMING" : "CLOSED"}
                        </span>
                      </div>
                    </div>

                    <p className="vd-card-type">{el.type?.name ? `${el.type.name} Election` : "RUNSA Election"}</p>
                    <h3 className="vd-card-title">{toTitleCase(el.title)}</h3>

                    <div className="vd-dates">
                      {start && (
                        <div className="vd-date-row">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                          Opens: <strong style={{ color: "#0e1628" }}>{start.toLocaleString("en-US", fmt)}</strong>
                        </div>
                      )}
                      {end && (
                        <div className="vd-date-row">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          Closes: <strong style={{ color: "#0e1628" }}>{end.toLocaleString("en-US", fmt)}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="vd-card-foot">
                    <Link href={`/vote/${el.id}`} style={{ textDecoration: "none" }}>
                      <button disabled={!isActive} className="vd-vote-btn"
                        style={{ background: isActive ? "#2563eb" : "#f1f5f9", color: isActive ? "#fff" : "#94a3b8", cursor: isActive ? "pointer" : "not-allowed" }}>
                        <span style={{ color: isActive ? "#fff" : "#94a3b8" }}>
                          {isActive ? "Cast Your Vote" : isClosed ? "Election Ended" : "Not Opened Yet"}
                        </span>
                        {isActive && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                          </svg>
                        )}
                      </button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="vd-empty">
            <div style={{ width: 48, height: 48, borderRadius: 13, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0e1628", margin: "0 0 6px" }}>No elections active</h3>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>There are currently no active elections for your user role.</p>
          </div>
        )}

        {/* Banner */}
        <div className="vd-banner">
          <div className="vd-banner-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p className="vd-banner-title">Secure. Private. Trusted.</p>
            <p className="vd-banner-text">Your vote is encrypted and confidential.</p>
            <p className="vd-banner-text">We ensure a fair and transparent election process.</p>
          </div>
          <div className="vd-banner-illus">
            <svg viewBox="0 0 200 150" fill="none" style={{ width: "100%", height: "100%" }}>
              <circle cx="155" cy="85" r="45" fill="#e8eef8" opacity="0.7"/>
              <path d="M88 25 L128 25 L128 88 L88 88 Z" fill="white" stroke="#c8d5e8" strokeWidth="1.5"/>
              <path d="M97 45 L119 45" stroke="#dde3ed" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M97 58 L112 58" stroke="#dde3ed" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M113 53 L117 57 L123 47" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M58 82 L142 82 L142 132 L58 132 Z" fill="#2563eb"/>
              <path d="M53 71 L147 71 L147 86 L53 86 Z" fill="#3b82f6"/>
              <circle cx="100" cy="107" r="13" fill="white" opacity="0.15"/>
              <path d="M95 107 L98 110 L106 101" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

      </div>
    </>
  );
}
