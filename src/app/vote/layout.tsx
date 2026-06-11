"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { getCurrentUser } from "@/lib/services";
import Link from "next/link";

export default function VoteLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, user, logout } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isAdmin()) {
      getCurrentUser()
        .then((u) => { if (u) useAuthStore.setState({ user: u }); })
        .catch(console.error);
    }
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (isAdmin()) router.replace("/admin");
  }, [isAuthenticated, isAdmin, router]);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  if (!isAuthenticated || isAdmin()) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f7" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const initials = (user?.fullName || user?.matricNo || "?")
    .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const handleLogout = () => { logout(); router.push("/login"); };

  const navItems: { href: string; label: string; icon: string; badge?: string; disabled?: boolean }[] = [
    { href: "/vote", label: "Dashboard", icon: "dashboard" },
    { href: "/vote", label: "Active Elections", icon: "elections" },
    { href: "/vote/results", label: "Results", icon: "results", badge: "Active" },
    { href: "/vote/activity", label: "My Activity", icon: "activity" },
    { href: "/vote/settings", label: "Settings", icon: "settings" },
  ];

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "24px 20px 20px", flex: 1 }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3"/><polyline points="9 12 12 15 16 9"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", lineHeight: 1.1 }}>VoteHub</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2, letterSpacing: "0.03em" }}>University Voting System</div>
          </div>
        </div>

        {/* Profile Card */}
        <div style={{ background: "#1a2640", borderRadius: 14, padding: "16px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.fullName || "Voter"}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                {user?.matricNo || "ID Number"}
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Department</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{user?.department || "—"}</div>
            
            {(user?.faculty || user?.level || user?.semester) && (
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                {user?.level && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Level</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{user.level}</div>
                  </div>
                )}
                {user?.faculty && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Faculty</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={user.faculty}>{user.faculty}</div>
                  </div>
                )}
                {user?.semester && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Semester</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{user.semester}</div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}>Verified Voter</span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {navItems.map((item, idx) => {
            const isActive =
              item.label === "Active Elections" ? pathname === "/vote" || pathname === "/vote/dashboard"
              : item.label === "Results" ? pathname === "/vote/results"
              : item.label === "Settings" ? pathname === "/vote/settings"
              : item.label === "My Activity" ? pathname === "/vote/activity"
              : false;
            return (
              <Link key={idx} href={item.href}
                onClick={() => setDrawerOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 13px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none", cursor: item.disabled ? "not-allowed" : "pointer", opacity: item.disabled ? 0.4 : 1, pointerEvents: item.disabled ? "none" : "auto", background: isActive ? "#2563eb" : "transparent", color: isActive ? "#fff" : "#8899aa", transition: "background 0.15s, color 0.15s" }}>
                <span style={{ width: 19, height: 19, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <NavIcon name={item.icon} active={isActive} />
                </span>
                <span style={{ flex: 1, color: isActive ? "#fff" : "#8899aa" }}>{item.label}</span>
                {item.badge && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "#2563eb", color: "#fff" }}>{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom */}
      <div style={{ padding: "0 16px 20px" }}>
        <div style={{ background: "#1a2640", borderRadius: 14, padding: "16px", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Need Support?</span>
          </div>
          <p style={{ fontSize: 11, color: "#64748b", marginBottom: 12, lineHeight: 1.65 }}>
            Facing any issues with voting or results? Contact RUNSA support.
          </p>
          <a href="mailto:support@runsa.org"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#e2e8f0", textDecoration: "none", padding: "6px 14px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8 }}>
            Contact Support
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>
        <button onClick={handleLogout}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderRadius: 10, background: "#1a2640", border: "none", cursor: "pointer", color: "#8899aa", fontSize: 13, fontWeight: 600, fontFamily: "'Manrope', sans-serif" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </button>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1a2640", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", border: "2px solid #2a3a56", marginTop: 12 }}>
          {initials}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        .vl-root { min-height: 100vh; background: #f0f2f7; font-family: 'Manrope', sans-serif; display: flex; flex-direction: column; }

        /* Mobile top navbar */
        .vl-topnav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; background: #0d1526;
          position: sticky; top: 0; z-index: 80;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .vl-topnav-brand { display: flex; align-items: center; gap: 10px; }
        .vl-topnav-name  { font-size: 15px; font-weight: 800; color: #fff; }
        .vl-topnav-sub   { font-size: 9px; color: #64748b; margin-top: 1px; }
        .vl-hamburger {
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
          color: #94a3b8; cursor: pointer;
        }
        .vl-topnav-avatar {
          width: 34px; height: 34px; border-radius: 8px;
          background: #2563eb; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700;
        }

        /* Desktop sidebar hidden on mobile */
        .vl-sidebar {
          display: none;
          width: 248px; min-width: 248px;
          background: #0d1526;
          position: sticky; top: 0; height: 100vh;
          flex-shrink: 0; color: #fff; overflow-y: auto;
        }

        /* Drawer overlay */
        .vl-overlay {
          display: none; position: fixed; inset: 0; z-index: 90;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(3px);
        }
        .vl-overlay.open { display: block; }

        /* Drawer */
        .vl-drawer {
          position: fixed; top: 0; left: 0; bottom: 0; z-index: 91;
          width: min(280px, 85vw);
          background: #0d1526; color: #fff;
          transform: translateX(-100%);
          transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
          overflow-y: auto;
        }
        .vl-drawer.open { transform: translateX(0); }

        /* Body layout */
        .vl-body { display: flex; flex: 1; min-height: 0; }
        .vl-main { flex: 1; min-width: 0; padding: 20px 16px; color: #0e1628; overflow-y: auto; }

        /* Bottom tab bar (mobile) */
        .vl-tabbar {
          display: flex;
          position: sticky; bottom: 0; z-index: 80;
          background: #0d1526; border-top: 1px solid rgba(255,255,255,0.07);
          padding: 6px 0 env(safe-area-inset-bottom, 6px);
        }
        .vl-tab {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
          padding: 6px 4px; text-decoration: none; cursor: pointer;
          border: none; background: transparent; font-family: 'Manrope', sans-serif;
        }
        .vl-tab-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; position: relative; }
        .vl-tab-label { font-size: 9px; font-weight: 700; color: #64748b; letter-spacing: 0.02em; }
        .vl-tab.active .vl-tab-label { color: #2563eb; }
        .vl-tab-badge {
          position: absolute; top: -2px; right: -4px;
          width: 7px; height: 7px; border-radius: 50%; background: #2563eb;
          border: 1.5px solid #0d1526;
        }

        @media (min-width: 768px) {
          .vl-root { flex-direction: row; }
          .vl-topnav { display: none; }
          .vl-sidebar { display: flex; flex-direction: column; }
          .vl-drawer, .vl-overlay { display: none !important; }
          .vl-main { padding: 32px 36px; }
          .vl-tabbar { display: none; }
          .vl-body { min-height: 100vh; }
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="vl-root">
        {/* ── MOBILE TOP NAV ── */}
        <div className="vl-topnav">
          <div className="vl-topnav-brand">
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3"/><polyline points="9 12 12 15 16 9"/>
              </svg>
            </div>
            <div>
              <div className="vl-topnav-name">VoteHub</div>
              <div className="vl-topnav-sub">University Voting System</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="vl-topnav-avatar">{initials}</div>
            <button className="vl-hamburger" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── MOBILE DRAWER OVERLAY ── */}
        <div className={`vl-overlay ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} />
        <div className={`vl-drawer ${drawerOpen ? "open" : ""}`}>
          {/* Drawer header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Menu</span>
            <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <SidebarContent />
        </div>

        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="vl-sidebar">
          <SidebarContent />
        </aside>

        {/* ── BODY ── */}
        <div className="vl-body">
          <main className="vl-main" style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
            <div style={{ flex: 1 }}>{children}</div>
            <footer style={{ marginTop: 40, borderTop: "1px solid #e2e8f0", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#94a3b8", flexWrap: "wrap", gap: 8 }}>
              <span>© {new Date().getFullYear()} RUNSA. All rights reserved.</span>
              <span>
                Developed by{" "}
                <a href="https://itzbobo.dev" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 700 }}>
                  itzbobo.dev
                </a>
              </span>
            </footer>
          </main>
        </div>

        {/* ── MOBILE BOTTOM TAB BAR ── */}
        <div className="vl-tabbar">
          {([
            { href: "/vote", label: "Elections", icon: "elections", active: pathname === "/vote" || pathname === "/vote/dashboard" },
            { href: "/vote/results", label: "Results", icon: "results", active: pathname === "/vote/results", badge: true },
            { href: "/vote/activity", label: "Activity", icon: "activity", active: pathname === "/vote/activity" },
            { href: "/vote/settings", label: "Settings", icon: "settings", active: pathname === "/vote/settings" },
          ] as { href: string; label: string; icon: string; active?: boolean; badge?: boolean; disabled?: boolean }[]).map((tab, i) => (
            <Link key={i} href={tab.href}
              className={`vl-tab ${tab.active ? "active" : ""}`}
              style={{ opacity: tab.disabled ? 0.35 : 1, pointerEvents: tab.disabled ? "none" : "auto" }}>
              <div className="vl-tab-icon">
                <NavIcon name={tab.icon} active={!!tab.active} size={20} />
                {tab.badge && !tab.active && <span className="vl-tab-badge" />}
              </div>
              <span className="vl-tab-label">{tab.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

function NavIcon({ name, active, size = 19 }: { name: string; active: boolean; size?: number }) {
  const col = active ? "#2563eb" : "#8899aa";
  const sw = active ? 2.5 : 2;
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: col, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "dashboard": return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>;
    case "elections": return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case "results":   return <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    case "activity":  return <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
    case "settings":  return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    default: return null;
  }
}
