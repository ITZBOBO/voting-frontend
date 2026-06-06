"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/lib/authStore";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "grid", exact: true },
  { href: "/admin/elections", label: "Elections", icon: "calendar", exact: false },
  { href: "/admin/positions", label: "Positions", icon: "list", exact: false },
  { href: "/admin/candidates", label: "Candidates", icon: "users", exact: false },
  { href: "/admin/users", label: "Voters", icon: "user-check", exact: false },
  { href: "/admin/results", label: "Results", icon: "bar-chart", exact: false },
  { href: "/admin/settings", label: "Settings", icon: "settings", exact: false },
];

function NavIcon({ name }: { name: string }) {
  const p = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "grid": return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>;
    case "calendar": return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case "users": return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "bar-chart": return <svg {...p}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>;
    case "user-check": return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>;
    case "list": return <svg {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    default: return null;
  }
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, user, logout, isHydrated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isLoginPage = pathname === "/admin/login" || pathname === "/login";

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (isLoginPage || !isHydrated) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (!isAdmin()) { router.replace("/vote"); }
  }, [isAuthenticated, isAdmin, router, isLoginPage, isHydrated]);

  if (isLoginPage) return <>{children}</>;
  if (!isHydrated || !isAuthenticated || !isAdmin()) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f6fa" }}>
        <div className="al-spinner" />
      </div>
    );
  }

  function handleLogout() { logout(); router.push("/login"); }

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AD";

  const currentLabel = NAV_ITEMS.find((n) =>
    n.exact ? pathname === n.href : pathname.startsWith(n.href) && n.href !== "/admin"
  )?.label || "Dashboard";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f6fa", fontFamily: "inherit" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(12,26,58,0.5)", zIndex: 40, display: "block" }}
          className="md-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: "220px",
        background: "#0c1a3a",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}>

        {/* Brand */}
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2px", flexShrink: 0, boxShadow: "0 0 0 2px rgba(255,255,255,0.15)" }}>
              <Image src="/redeemers-logo.png" alt="RUN" width={32} height={32} style={{ objectFit: "contain", mixBlendMode: "multiply", borderRadius: "50%" }} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff", letterSpacing: "2px" }}>RUNSA</div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "1px", padding: "4px 10px 8px" }}>
            Navigation
          </div>
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href) && (item.href !== "/admin" || pathname === "/admin");
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  fontSize: "13.5px",
                  fontWeight: active ? 600 : 400,
                  color: active ? "#fff" : "rgba(255,255,255,0.5)",
                  background: active ? "rgba(37,99,235,0.25)" : "transparent",
                  border: active ? "1px solid rgba(37,99,235,0.3)" : "1px solid transparent",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  position: "relative",
                }}
              >
                {active && (
                  <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: "3px", height: "20px", background: "#2563eb", borderRadius: "0 2px 2px 0" }} />
                )}
                <span style={{ color: active ? "#60a5fa" : "rgba(255,255,255,0.4)", flexShrink: 0 }}>
                  <NavIcon name={item.icon} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: "12px 10px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", marginBottom: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg,#2563eb,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.fullName || "Admin"}</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>Administrator</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.25)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Sidebar spacer */}
      <div style={{ flexShrink: 0, width: sidebarOpen ? "220px" : "0", transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)" }} aria-hidden="true" className="sidebar-spacer" />

      {/* ── Main ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Top bar */}
        <header style={{ height: "56px", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderBottom: "1px solid #e8eaf0", position: "sticky", top: 0, zIndex: 30, gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              onClick={() => setSidebarOpen((p) => !p)}
              aria-label="Toggle sidebar"
              style={{ width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #e8eaf0", background: "transparent", cursor: "pointer", color: "#6b7280", transition: "all 0.15s", flexShrink: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#9ca3af" }}>
              <span>Admin</span>
              <span>/</span>
              <span style={{ color: "#0c1a3a", fontWeight: 600 }}>{currentLabel}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "7px", background: "linear-gradient(135deg,#2563eb,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#fff" }}>
              {initials}
            </div>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>{user?.fullName || "Admin"}</span>
          </div>
        </header>

        {/* Page content */}
        <div style={{ padding: "28px 32px", flex: 1, overflowX: "hidden", display: "flex", flexDirection: "column" }}>
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
        </div>
      </main>

      <style>{`
        .al-spinner { width:32px;height:32px;border:2.5px solid #e2e4ea;border-top-color:#2563eb;border-radius:50%;animation:alSpin 0.7s linear infinite; }
        @keyframes alSpin { to { transform:rotate(360deg); } }
        @media (min-width: 768px) { .md-overlay { display: none !important; } .sidebar-spacer { display: block !important; } }
        @media (max-width: 767px) { .sidebar-spacer { display: none !important; width: 0 !important; } }
      `}</style>
    </div>
  );
}
