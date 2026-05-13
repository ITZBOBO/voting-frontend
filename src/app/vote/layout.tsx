"use client";

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import Image from "next/image";
import Link from "next/link";

export default function VoteLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, user, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (isAdmin()) { router.replace("/admin"); }
  }, [isAuthenticated, isAdmin, router]);

  if (!isAuthenticated || isAdmin()) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#060d1f" }}>
        <div className="vl-spinner" />
      </div>
    );
  }

  const initials = (user?.fullName || user?.matricNo || "?")
    .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="vl-root">
      {/* Ambient background orbs */}
      <div className="vl-orb vl-orb-1" />
      <div className="vl-orb vl-orb-2" />
      <div className="vl-orb vl-orb-3" />

      {/* ── Header ── */}
      <header className="vl-header">
        <div className="vl-header-inner">
          {/* Brand */}
          <div className="vl-brand">
            <div className="vl-logo-ring">
              <Image src="/redeemers-logo.png" alt="RUN Logo" width={34} height={34} className="vl-logo-img" />
            </div>
            <div>
              <div className="vl-brand-name">RUNSA</div>
              <div className="vl-brand-sub">Voting Portal</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="vl-nav">
            <Link href="/vote" className={`vl-nav-link${pathname === "/vote" ? " active" : ""}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Elections
            </Link>
            <Link href="/vote/results" className={`vl-nav-link${pathname === "/vote/results" ? " active" : ""}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Results
            </Link>
          </nav>

          {/* User + Logout */}
          <div className="vl-user-area">
            <div className="vl-avatar" title={user?.fullName || user?.matricNo}>{initials}</div>
            <span className="vl-user-name">{user?.fullName || user?.matricNo}</span>
            <button
              className="vl-logout-btn"
              onClick={() => { logout(); router.push("/login"); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        </div>
        {/* Animated gradient underline */}
        <div className="vl-header-glow-bar" />
      </header>

      {/* ── Main ── */}
      <main className="vl-main">
        <div className="vl-content-panel">
          {children}
        </div>
      </main>

      <style>{`
        /* ── Root ── */
        .vl-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #060d1f;
          position: relative;
          overflow-x: hidden;
        }

        /* ── Orbs ── */
        .vl-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.45;
          animation: orbDrift 18s ease-in-out infinite alternate;
        }
        .vl-orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, #1e3a8a 0%, transparent 70%); top: -200px; left: -150px; animation-delay: 0s; }
        .vl-orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, #0f766e 0%, transparent 70%); bottom: -100px; right: -100px; animation-delay: -6s; }
        .vl-orb-3 { width: 400px; height: 400px; background: radial-gradient(circle, #312e81 0%, transparent 70%); top: 40%; left: 50%; transform: translateX(-50%); animation-delay: -12s; }
        @keyframes orbDrift {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(30px, 20px) scale(1.05); }
        }

        /* ── Header ── */
        .vl-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(6, 13, 31, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .vl-header-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .vl-header-glow-bar {
          height: 2px;
          background: linear-gradient(90deg, transparent, #3b82f6, #10b981, #6366f1, transparent);
          background-size: 200% 100%;
          animation: glowBarShift 4s linear infinite;
        }
        @keyframes glowBarShift {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }

        /* ── Brand ── */
        .vl-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .vl-logo-ring {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(255,255,255,0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3px;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.4), 0 4px 16px rgba(59,130,246,0.2);
        }
        .vl-logo-img { border-radius: 50%; mix-blend-mode: multiply; object-fit: contain; }
        .vl-brand-name {
          font-size: 17px;
          font-weight: 800;
          color: #fff;
          letter-spacing: 2px;
          line-height: 1;
        }
        .vl-brand-sub {
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        /* ── Nav ── */
        .vl-nav {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
          justify-content: center;
        }
        .vl-nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 13.5px;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          transition: all 0.2s ease;
          border: 1px solid transparent;
          white-space: nowrap;
          text-decoration: none;
        }
        .vl-nav-link:hover {
          color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.06);
        }
        .vl-nav-link.active {
          color: #fff;
          background: rgba(59,130,246,0.15);
          border-color: rgba(59,130,246,0.35);
          box-shadow: 0 0 16px rgba(59,130,246,0.15);
          font-weight: 600;
        }

        /* ── User Area ── */
        .vl-user-area {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .vl-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          box-shadow: 0 0 0 2px rgba(99,102,241,0.4);
          flex-shrink: 0;
        }
        .vl-user-name {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.75);
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .vl-logout-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 100px;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          font-family: inherit;
        }
        .vl-logout-btn:hover {
          background: rgba(239,68,68,0.12);
          border-color: rgba(239,68,68,0.3);
          color: #f87171;
        }

        /* ── Main ── */
        .vl-main {
          flex: 1;
          position: relative;
          z-index: 1;
          padding: 32px 24px 60px;
          max-width: 1280px;
          width: 100%;
          margin: 0 auto;
        }
        .vl-content-panel {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 32px;
          min-height: 70vh;
        }

        /* ── Spinner ── */
        .vl-spinner {
          width: 36px; height: 36px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: vlSpin 0.7s linear infinite;
        }
        @keyframes vlSpin { to { transform: rotate(360deg); } }

        /* ── Mobile ── */
        @media (max-width: 680px) {
          .vl-header-inner { padding: 0 16px; gap: 12px; }
          .vl-user-name { display: none; }
          .vl-nav-link span { display: none; }
          .vl-main { padding: 20px 12px 48px; }
          .vl-content-panel { padding: 20px 16px; }
          .vl-brand-name { font-size: 15px; }
        }
      `}</style>
    </div>
  );
}
