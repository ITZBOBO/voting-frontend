"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { loginUser } from "@/lib/services";
import Link from "next/link";
import Image from "next/image";

export default function StudentLoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginUser({ identifier, password });
      login(res.token, res.user);

      const isAdmin = res.user.roles.some(
        (r) => r === "admin" || r === "super_admin"
      );
      router.push(isAdmin ? "/admin" : "/vote");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(
          axiosErr.response?.data?.message ||
          "Invalid credentials. Please try again."
        );
      } else {
        setError("Unable to connect to server. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="portal-page">
      {/* ── University Header ── */}
      <header className="portal-header">
        <div className="portal-header-inner">
          <div className="portal-logo">
            <Image
              src="/redeemers-logo.png"
              alt="Redeemer's University Logo"
              width={90}
              height={90}
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
          <div className="portal-header-text">
            <h1 className="university-title">
              <span className="title-line title-line-1">REDEEMER&rsquo;S</span>
              <span className="title-line title-line-2">UNIVERSITY</span>
            </h1>
            <p>Student Association (RUNSA) — Digital Voting Portal</p>
          </div>
        </div>
      </header>

      {/* ── Home Nav Bar ── */}
      <nav className="portal-nav">
        <div className="portal-nav-inner">
          <span className="portal-nav-item active">HOME</span>
          <span className="portal-nav-item">ABOUT RUNSA</span>
          <span className="portal-nav-item">HELP</span>
        </div>
      </nav>

      {/* ── Banner Image ── */}
      <div className="portal-banner">
        <Image
          src="/campus-banner.png"
          alt="Redeemer's University campus"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
        <div className="portal-banner-overlay" />
      </div>

      {/* ── Main Content Card ── */}
      <main className="portal-main">
        <div className="portal-card">
          {/* Left Column: Instructions */}
          <div className="portal-instructions">
            <h2>To Login, do the following:</h2>
            <ol>
              <li>Enter your <strong>Matric Number</strong> in the username field.</li>
              <li>Enter your password correctly.</li>
              <li>Click the <strong>Sign In</strong> button.</li>
              <li>After login, you will be taken to your voting dashboard.</li>
            </ol>

            <h2>Voting Instructions</h2>
            <ol>
              <li>Only elections you are eligible for will be shown.</li>
              <li>Select your preferred candidate carefully.</li>
              <li>Review your selection before submitting.</li>
              <li>Once submitted, your vote cannot be changed.</li>
            </ol>

            <h2>Important Note</h2>
            <p className="portal-help-note" style={{ fontStyle: "normal", color: "#4b5563", fontSize: "13px", lineHeight: 1.7 }}>
              Each eligible student can vote only once per election. Make sure
              your login details are correct and confirm your vote carefully
              before submission.
            </p>
          </div>

          {/* Divider */}
          <div className="portal-divider" />

          {/* Right Column: Login Form */}
          <div className="portal-form-section">
            <h2 className="portal-form-title">Student Log-In</h2>

            <div className="portal-form-accent" />

            {error && (
              <div className="portal-error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="portal-form">
              <div className="portal-field">
                <label htmlFor="identifier">Matric No / JAMB No</label>
                <input
                  id="identifier"
                  type="text"
                  placeholder="e.g. RUN/CSC/20/1234"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>

              <div className="portal-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                className="portal-submit"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <div className="portal-form-links">
              <Link href="/register" className="portal-admin-link">
                New student? <span>Register here →</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="portal-footer">
        <p>
          Copyright © {new Date().getFullYear()} Redeemer&rsquo;s University.
          All Rights Reserved.
        </p>
        <p style={{ marginTop: 4 }}>
          RUNSA Digital Voting Portal — Developed by <a href="https://itzbobo.dev" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "underline", fontWeight: 600 }}>itzbobo.dev</a>
        </p>
      </footer>

      <style jsx>{`
        /* ── Page ── */
        .portal-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #e8eef6;
        }

        /* ── University Header ── */
        .portal-header {
          background-color: #0b4372;
          background-image: repeating-linear-gradient(
            -45deg,
            rgba(255, 255, 255, 0.05) 0,
            rgba(255, 255, 255, 0.05) 20px,
            transparent 20px,
            transparent 40px
          );
          padding: 16px 0;
          border-bottom: 5px solid #1a568b;
        }
        .portal-header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 28px;
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .portal-logo {
          flex-shrink: 0;
          background: rgba(255,255,255,0.92);
          border-radius: 50%;
          padding: 6px;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.25), 0 4px 16px rgba(0,0,0,0.35);
          line-height: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .portal-logo img {
          border-radius: 50%;
          mix-blend-mode: multiply;
          background: transparent !important;
        }
        .portal-header-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .university-title {
          display: flex;
          flex-direction: column;
          margin: 0;
          line-height: 1;
        }
        .title-line {
          font-family: "Impact", "Arial Black", var(--font-inter), sans-serif;
          font-weight: 900;
          color: #ffffff;
          text-shadow: 
            2px 2px 0 #000, 
            -1px -1px 0 #000,  
             1px -1px 0 #000,
            -1px  1px 0 #000,
             1px  1px 0 #000,
             3px 4px 8px rgba(0,0,0,0.6);
          letter-spacing: 1px;
        }
        .title-line-1 {
          font-size: 42px;
        }
        .title-line-2 {
          font-size: 38px;
          letter-spacing: 2.5px; /* Spaced out to roughly match the width of REDEEMER'S */
        }
        .portal-header-text p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
          margin: 6px 0 0 0;
          letter-spacing: 0.5px;
          font-weight: 500;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }

        /* ── Nav Bar ── */
        .portal-nav {
          background: #1a3a7a;
        }
        .portal-nav-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 28px;
          display: flex;
          gap: 0;
        }
        .portal-nav-item {
          padding: 10px 22px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: 0.5px;
          cursor: default;
          transition: background 150ms;
        }
        .portal-nav-item.active {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
        }

        /* ── Banner ── */
        .portal-banner {
          position: relative;
          width: 100%;
          height: 220px;
          overflow: hidden;
        }
        .portal-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(14, 35, 84, 0.15) 0%,
            rgba(14, 35, 84, 0.35) 100%
          );
        }

        /* ── Main Card ── */
        .portal-main {
          flex: 1;
          max-width: 1100px;
          width: 100%;
          margin: -32px auto 0;
          padding: 0 28px 40px;
          position: relative;
          z-index: 2;
        }
        .portal-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(9, 22, 54, 0.1);
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 0;
          overflow: hidden;
        }

        /* ── Left: Instructions ── */
        .portal-instructions {
          padding: 36px 32px;
        }
        .portal-instructions h2 {
          font-size: 15px;
          font-weight: 700;
          color: #0e2354;
          margin: 0 0 12px 0;
        }
        .portal-instructions h2:not(:first-child) {
          margin-top: 24px;
        }
        .portal-instructions ol {
          padding-left: 20px;
          margin: 0 0 0 0;
        }
        .portal-instructions li {
          font-size: 13px;
          color: #4b5563;
          line-height: 1.7;
          margin-bottom: 4px;
        }
        .portal-instructions li strong {
          color: #1f2937;
        }
        .portal-help-contact {
          margin-top: 8px;
        }
        .portal-help-contact p {
          font-size: 13px;
          color: #4b5563;
          margin: 0 0 4px 0;
        }
        .portal-help-contact a {
          color: #1a3a7a;
          font-weight: 500;
        }
        .portal-help-note {
          font-size: 12px;
          color: #9da2b0;
          font-style: italic;
          margin-top: 4px;
        }

        /* ── Divider ── */
        .portal-divider {
          width: 1px;
          background: #e5e7eb;
          margin: 24px 0;
        }

        /* ── Right: Form ── */
        .portal-form-section {
          padding: 36px 32px;
        }
        .portal-form-title {
          font-size: 20px;
          font-weight: 700;
          color: #0e2354;
          text-align: center;
          margin: 0 0 16px 0;
        }
        .portal-form-accent {
          height: 4px;
          background: linear-gradient(90deg, #1a3a7a, #3b6dcc);
          border-radius: 2px;
          margin: 0 0 24px 0;
        }

        /* ── Error ── */
        .portal-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          margin-bottom: 16px;
        }

        /* ── Form Fields ── */
        .portal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .portal-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .portal-field label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }
        .portal-field input {
          font-family: var(--font-inter), sans-serif;
          font-size: 14px;
          padding: 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff;
          color: #1f2937;
          outline: none;
          transition: border-color 150ms, box-shadow 150ms;
        }
        .portal-field input:focus {
          border-color: #1a3a7a;
          box-shadow: 0 0 0 3px rgba(26, 58, 122, 0.1);
        }
        .portal-field input::placeholder {
          color: #9ca3af;
        }

        /* ── Submit ── */
        .portal-submit {
          font-family: var(--font-inter), sans-serif;
          font-size: 14px;
          font-weight: 600;
          padding: 11px 24px;
          background: #0e2354;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 150ms;
          margin-top: 4px;
        }
        .portal-submit:hover:not(:disabled) {
          background: #1a3a7a;
        }
        .portal-submit:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        /* ── Form Links ── */
        .portal-form-links {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }
        .portal-admin-link {
          font-size: 13px;
          color: #6b7280;
          text-decoration: none;
        }
        .portal-admin-link span {
          color: #1a3a7a;
          font-weight: 500;
        }
        .portal-admin-link:hover span {
          text-decoration: underline;
        }

        /* ── Footer ── */
        .portal-footer {
          background: #091636;
          padding: 16px 28px;
          text-align: center;
        }
        .portal-footer p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
          margin: 0;
          line-height: 1.7;
        }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .portal-header-inner {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }
          .portal-header-text h1 {
            font-size: 22px;
          }
          .portal-banner {
            height: 140px;
          }
          .portal-card {
            grid-template-columns: 1fr;
          }
          .portal-form-section {
            order: 1;
            padding: 28px 24px 24px;
          }
          .portal-divider {
            order: 2;
            width: auto;
            height: 1px;
            margin: 0 24px;
          }
          .portal-instructions {
            order: 3;
            padding: 24px 24px 28px;
          }
          .portal-nav-inner {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
