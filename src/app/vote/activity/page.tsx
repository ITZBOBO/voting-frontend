"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getVoterActivity, type VoterActivity } from "@/lib/services";
import Link from "next/link";

export default function VoterActivityPage() {
  const { data: logs, isLoading } = useQuery<VoterActivity[]>({
    queryKey: ["voter-activity"],
    queryFn: getVoterActivity,
  });

  const getActionDetails = (action: string, details: any) => {
    switch (action) {
      case "LOGIN":
        return {
          title: "Session Login",
          desc: "Successfully authenticated session. Secure JWT token issued.",
          color: "#22c55e",
          bg: "#f0fdf4",
          border: "#bbf7d0",
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
          ),
        };
      case "LOGOUT":
        return {
          title: "Session Logout",
          desc: "Safely logged out. Session tokens revoked.",
          color: "#64748b",
          bg: "#f8fafc",
          border: "#e2e8f0",
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          ),
        };
      case "CAST_VOTE_PENDING":
        return {
          title: "Vote Ballot Cast",
          desc: `Secure vote cast successfully. Integrity receipt generated in the audit ledger.`,
          color: "#2563eb",
          bg: "#eff6ff",
          border: "#bfdbfe",
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><polyline points="9 12 12 15 16 9"/>
            </svg>
          ),
          extra: (
            <div style={{ marginTop: 8 }}>
              <Link href="/vote/settings" style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                View Cryptographic Receipt in Settings
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
            </div>
          ),
        };
      case "CHANGE_PASSWORD":
        return {
          title: "Password Updated",
          desc: "Account credentials changed successfully.",
          color: "#d97706",
          bg: "#fffbeb",
          border: "#fde68a",
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          ),
        };
      case "SELF_REGISTER":
        return {
          title: "Voter Registration",
          desc: "Voter profile registered and verified on the system.",
          color: "#0891b2",
          bg: "#ecfeff",
          border: "#c5f2f7",
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/>
            </svg>
          ),
        };
      default:
        return {
          title: action.replace(/_/g, " "),
          desc: "System operation performed successfully.",
          color: "#475569",
          bg: "#f1f5f9",
          border: "#cbd5e1",
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12.01" y2="16"/><line x1="12" y1="8" x2="12" y2="12"/>
            </svg>
          ),
        };
    }
  };

  return (
    <>
      <style>{`
        .ac-page { display: flex; flex-direction: column; gap: 24px; max-width: 760px; margin: 0 auto; }
        
        .ac-header { display: flex; flex-direction: column; gap: 5px; }
        .ac-title { font-size: 24px; font-weight: 800; color: #0e1628; margin: 0; }
        .ac-sub { font-size: 13px; color: #64748b; margin: 0; }

        .ac-card {
          background: white; border-radius: 16px; border: 1px solid #e8ecf2;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04); padding: 24px;
        }

        /* Timeline Styles */
        .ac-timeline { position: relative; padding-left: 28px; }
        .ac-timeline::before {
          content: ""; position: absolute; left: 9px; top: 8px; bottom: 8px;
          width: 2px; background: #e2e8f0;
        }

        .ac-item { position: relative; margin-bottom: 24px; }
        .ac-item:last-child { margin-bottom: 0; }

        .ac-badge-dot {
          position: absolute; left: -28px; top: 3px;
          width: 20px; height: 20px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 2px solid white;
          z-index: 2;
        }

        .ac-item-content {
          background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px;
          padding: 14px 16px; display: flex; flex-direction: column; gap: 4px;
          transition: all 0.15s ease-in-out;
        }
        .ac-item-content:hover {
          background: white; border-color: #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }

        .ac-item-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .ac-item-title { font-size: 14px; font-weight: 800; color: #0e1628; margin: 0; }
        .ac-item-time { font-size: 11px; color: #94a3b8; font-weight: 600; white-space: nowrap; }

        .ac-item-desc { font-size: 12.5px; color: #475569; line-height: 1.5; margin: 0; }

        .ac-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 60px 20px; text-align: center; color: #64748b;
        }

        @media (min-width: 600px) {
          .ac-title { font-size: 28px; }
        }
      `}</style>

      <div className="ac-page">
        {/* Header */}
        <div className="ac-header">
          <h1 className="ac-title">My Activity Log</h1>
          <p className="ac-sub">Cryptographically linked ledger record of your session security and voting participation.</p>
        </div>

        {/* Card containing log */}
        <div className="ac-card">
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 12 }}>
              <div style={{ width: 24, height: 24, border: "2.5px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 700 }}>Reading security logs...</span>
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="ac-timeline">
              {logs.map((log: VoterActivity, idx: number) => {
                const ui = getActionDetails(log.action, log.details);
                const dt = new Date(log.createdAt);
                const timeString = dt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                });

                return (
                  <motion.div
                    key={log.id}
                    className="ac-item"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.2 }}
                  >
                    <div
                      className="ac-badge-dot"
                      style={{ background: ui.color, color: "white" }}
                    >
                      {ui.icon}
                    </div>
                    <div className="ac-item-content">
                      <div className="ac-item-top">
                        <h4 className="ac-item-title">{ui.title}</h4>
                        <span className="ac-item-time">{timeString}</span>
                      </div>
                      <p className="ac-item-desc">{ui.desc}</p>
                      {ui.extra}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="ac-empty">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <p style={{ fontStyle: "italic", fontSize: 14, margin: 0, fontWeight: 700, color: "#475569" }}>No activity logs recorded.</p>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Any account authentication or secure operations will appear on this timeline.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
