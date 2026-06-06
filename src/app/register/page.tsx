"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    matricNo: "", fullName: "", schoolEmail: "", password: "", confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");

    // Frontend validation
    if (form.matricNo.trim().length < 3) {
      setError("Matric number is too short."); return;
    }
    if (form.fullName.trim().length < 2) {
      setError("Please enter your full name."); return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long."); return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match."); return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        matricNo: form.matricNo.trim(),
        fullName: form.fullName.trim(),
        schoolEmail: form.schoolEmail.trim() || undefined,
        password: form.password,
      });
      setSuccess("Registration successful! Redirecting to login…");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string; issues?: Array<{ path: string[]; message: string }> } } };
      const issues = ax.response?.data?.issues?.map(i => i.message).join(", ");
      setError(issues || ax.response?.data?.error || "Registration failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="portal-page">
      <header className="portal-header">
        <div className="portal-header-inner">
          <div className="portal-logo">
            <Image src="/redeemers-logo.png" alt="Logo" width={80} height={80} style={{ objectFit: "contain" }} priority />
          </div>
          <div className="portal-header-text">
            <h1 className="university-title">
              <span className="title-line title-line-1">REDEEMER&rsquo;S</span>
              <span className="title-line title-line-2">UNIVERSITY</span>
            </h1>
            <p>Student Association (RUNSA) — Voter Registration</p>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", background: "#e8eef6" }}>
        <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 4px 20px rgba(9,22,54,0.1)", width: "100%", maxWidth: "480px", padding: "36px 32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0e2354", marginBottom: "4px" }}>Student Registration</h2>
          <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px" }}>
            Already registered? <Link href="/login" style={{ color: "#1a3a7a", fontWeight: 600 }}>Sign in here</Link>
          </p>

          {error && <div className="alert alert-error" style={{ marginBottom: "16px" }}>{error}</div>}
          {success && <div className="alert alert-success" style={{ marginBottom: "16px" }}>{success}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Matric Number *</label>
              <input className="form-input" value={form.matricNo} onChange={e => setForm({ ...form, matricNo: e.target.value })} placeholder="e.g. RUN/CSC/20/1234" required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="e.g. John Adebayo" required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">School Email (Optional)</label>
              <input className="form-input" type="email" value={form.schoolEmail} onChange={e => setForm({ ...form, schoolEmail: e.target.value })} placeholder="e.g. john@run.edu.ng" />
            </div>
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
              <div className="form-group !mb-0">
                <label className="form-label">Password *</label>
                <input className="form-input min-h-[44px]" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" required />
              </div>
              <div className="form-group !mb-0">
                <label className="form-label">Confirm Password *</label>
                <input className="form-input min-h-[44px]" type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Repeat password" required />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{
              padding: "12px", background: "#0e2354", color: "white", border: "none", borderRadius: "8px",
              fontSize: "14px", fontWeight: 600, cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
              opacity: loading ? 0.7 : 1, marginTop: "4px", minHeight: "44px"
            }}>
              {loading ? "Registering…" : "Create Account"}
            </button>
          </form>
        </div>
      </main>

      <footer className="portal-footer">
        <p>Copyright © {new Date().getFullYear()} Redeemer&rsquo;s University. All Rights Reserved.</p>
        <p style={{ marginTop: 4, fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
          Developed by <a href="https://itzbobo.dev" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "underline", fontWeight: 600 }}>itzbobo.dev</a>
        </p>
      </footer>
    </div>
  );
}
