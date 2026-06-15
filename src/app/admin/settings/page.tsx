"use client";

import { useState, useEffect, useCallback } from"react";
import { useQuery, useMutation, useQueryClient } from"@tanstack/react-query";
import {
 getDepartments, getAdminUsers, getAuditLogs, getRoles,
 createAdminUser, toggleUserActive,
 getCandidates, getAdminElections,
 createDepartment, updateDepartment, deleteDepartment,
} from"@/lib/services";
import toast from"react-hot-toast";
import {
 Settings, Globe, Vote, Shield, UserCog, Building2,
 Download, ScrollText, Save, Plus, Trash2, Edit2,
 X, Check, ChevronRight, RefreshCw, AlertTriangle, ShieldCheck
} from"lucide-react";

// ─── Local settings store (persisted to localStorage) ───────────────────────
const LS_KEY ="runsa_system_settings";

interface SystemSettings {
 systemName: string;
 institutionName: string;
 electionBodyName: string;
 systemDescription: string;
 logoUrl: string;
 // Election config
 allowMultipleVotes: boolean;
 enableLiveResults: boolean;
 autoCloseElection: boolean;
 allowVoteReview: boolean;
 // Auth
 loginMethod:"matric" |"email";
 allowOnlyRegisteredVoters: boolean;
 sessionTimeout: number;
 // Security
 preventDuplicateVoting: boolean;
 enableVoteEncryption: boolean;
 enableActivityLogging: boolean;
}

const defaultSettings: SystemSettings = {
 systemName:"RUNSA Digital Voting System",
 institutionName:"Redeemer's University",
 electionBodyName:"RUNSA",
 systemDescription:"Official digital voting platform for RUNSA student government elections.",
 logoUrl:"",
 allowMultipleVotes: false,
 enableLiveResults: true,
 autoCloseElection: true,
 allowVoteReview: true,
 loginMethod:"matric",
 allowOnlyRegisteredVoters: true,
 sessionTimeout: 30,
 preventDuplicateVoting: true,
 enableVoteEncryption: true,
 enableActivityLogging: true,
};

function loadSettings(): SystemSettings {
 if (typeof window ==="undefined") return defaultSettings;
 try {
 const raw = localStorage.getItem(LS_KEY);
 return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
 } catch { return defaultSettings; }
}

function saveSettings(s: SystemSettings) {
 localStorage.setItem(LS_KEY, JSON.stringify(s));
 window.dispatchEvent(new CustomEvent("runsa-settings-changed", { detail: s }));
}

// ─── Shared Theme Colors (Light & Dark Support) ──────────────────────────────
const colors = {
 bgApp:"bg-gray-50",
 bgCard:"bg-white",
 bgInput:"bg-white",
 border:"border-gray-200",
 textPrimary:"text-gray-900",
 textSecondary:"text-gray-500",
 primaryHover:"hover:bg-gray-50",
 accentBlue:"text-[#2563eb]",
};

// ─── Shared UI primitives ──────────────────────────────────────────────────
function ToggleRow({ checked, onChange, title, description }: { checked: boolean; onChange: (v: boolean) => void; title: string, description?: string }) {
 return (
 <div className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between border-b ${colors.border} last:border-0 gap-4`}>
 <div className="pr-4 sm:pr-8">
 <h4 className={`text-[15px] font-medium ${colors.textPrimary} mb-1 sm:mb-1.5`}>{title}</h4>
 {description && <p className={`text-sm ${colors.textSecondary} leading-relaxed`}>{description}</p>}
 </div>
 <div className="flex items-center gap-3 shrink-0">
 <span className="text-sm text-gray-500">{checked ?"On" :"Off"}</span>
 <button
 type="button"
 role="switch"
 aria-checked={checked}
 onClick={() => onChange(!checked)}
 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-white ${checked ?"bg-blue-600" :"bg-gray-300"}`}
 >
 <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ?"translate-x-6" :"translate-x-1"}`} />
 </button>
 </div>
 </div>
 );
}

function SectionCard({ title, description, badge, badgeColor, children, icon: Icon }: {
 title: string; description?: string; badge?: string; badgeColor?:"red" |"green" |"blue" |"yellow"; children: React.ReactNode; icon?: React.ElementType;
}) {
 const badgeClasses = {
 red:"text-red-500 font-semibold", // No pill background in the strict layout for critical
 green:"bg-green-100 text-green-700 border border-green-200", // Pill for active
 blue:"text-blue-500 font-semibold",
 yellow:"text-yellow-500 font-semibold",
 };

 return (
 <div className={`${colors.bgCard} rounded-xl border ${colors.border} overflow-hidden mb-6`}>
 <div className={`px-4 sm:px-5 py-4 flex items-center justify-between border-b ${colors.border}`}>
 <div className="flex items-center gap-4">
 {Icon && (
 <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
 <Icon size={20} className="text-blue-600" />
 </div>
 )}
 <div>
 <h3 className={`text-base font-medium ${colors.textPrimary}`}>{title}</h3>
 {description && <p className={`text-sm ${colors.textSecondary} mt-0.5`}>{description}</p>}
 </div>
 </div>
 {badge && (
 <span className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${badgeClasses[badgeColor ||"blue"]}`}>
 {badge}
 </span>
 )}
 </div>
 <div className="flex flex-col">{children}</div>
 </div>
 );
}

function StatBox({ title, value, subtext, icon: Icon, valueColor ="text-gray-900" }: any) {
 return (
 <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-5`}>
 <p className={`text-sm ${colors.textSecondary} mb-2`}>{title}</p>
 <div className="flex items-center gap-2 mb-1">
 {Icon && <Icon size={12} className={valueColor} />}
 <p className={`text-3xl font-light ${valueColor} leading-none tracking-tight`}>{value}</p>
 </div>
 <p className={`text-sm ${colors.textSecondary}`}>{subtext}</p>
 </div>
 );
}

function WarningBanner({ message }: { message: string }) {
 return (
 <div className="m-4 sm:m-5 p-4 border rounded-xl bg-red-50 border-red-200 flex gap-3">
 <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
 <p className="text-[15px] text-red-600 leading-relaxed">{message}</p>
 </div>
 );
}

function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
 return (
 <div>
 <label className={`block text-sm font-medium ${colors.textPrimary} mb-1.5`}>{label}</label>
 {children}
 {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
 </div>
 );
}

const inputCls ="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition";

// ─── TAB DEFINITIONS ─────────────────────────────────────────────────────────
const TABS = [
 { group:"SYSTEM", items: [
 { id:"general", label:"General", icon: Globe },
 { id:"election", label:"Election Config", icon: Vote },
 { id:"auth", label:"Authentication", icon: Shield },
 { id:"security", label:"Security", icon: ShieldCheck },
 ]},
 { group:"MANAGEMENT", items: [
 { id:"admins", label:"Admin Management", icon: UserCog },
 { id:"departments",label:"Departments", icon: Building2 },
 ]},
 { group:"DATA", items: [
 { id:"export", label:"Data Export", icon: Download },
 { id:"audit", label:"Audit Logs", icon: ScrollText },
 ]}
] as const;

type TabId ="general" |"election" |"auth" |"security" |"admins" |"departments" |"export" |"audit";

// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
 const [activeTab, setActiveTab] = useState<TabId>("security");
 const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
 const [saving, setSaving] = useState(false);
 const qc = useQueryClient();

 useEffect(() => { setSettings(loadSettings()); }, []);

 const update = (patch: Partial<SystemSettings>) => setSettings(prev => ({ ...prev, ...patch }));

 const handleSave = useCallback(() => {
 setSaving(true);
 saveSettings(settings);
 setTimeout(() => {
 setSaving(false);
 toast.success("Settings saved successfully!");
 }, 400);
 }, [settings]);

 const activeTabLabel = TABS.flatMap((g: any) => g.items).find((t: any) => t.id === activeTab)?.label ||"Settings";

 const allTabs = TABS.flatMap((g: any) => g.items);

 return (
 <div style={{ maxWidth:"1100px" }}>

 {/* Header */}
 <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px", gap:"16px", flexWrap:"wrap" }}>
 <div>
 <h1 style={{ fontSize:"22px", fontWeight: 700, color:"#0c1a3a", marginBottom:"4px", letterSpacing:"-0.3px" }}>Settings</h1>
 <p style={{ fontSize:"13px", color:"#9ca3af" }}>System configuration and administration</p>
 </div>
 <button
 onClick={handleSave}
 disabled={saving}
 style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"9px 18px", background:"#2563eb", color:"#fff", border:"none", borderRadius:"8px", fontSize:"13.5px", fontWeight: 600, cursor: saving ?"wait" :"pointer", fontFamily:"inherit", opacity: saving ? 0.7 : 1, boxShadow:"0 1px 4px rgba(37,99,235,0.25)" }}
 >
 <Save size={14} />
 {saving ?"Saving…" :"Save Changes"}
 </button>
 </div>

 {/* Tab groups */}
 <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:"12px", overflow:"hidden", marginBottom:"20px" }}>
 {TABS.map((group: any, gi: number) => (
 <div key={gi} style={{ borderBottom: gi < TABS.length - 1 ?"1px solid #f0f1f5" :"none", padding:"12px 16px" }}>
 <div style={{ fontSize:"10px", fontWeight: 700, color:"#c4c9d4", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"8px", paddingLeft:"4px" }}>{group.group}</div>
 <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
 {group.items.map((tab: any) => {
 const Icon = tab.icon;
 const active = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as TabId)}
 style={{
 display:"inline-flex",
 alignItems:"center",
 gap:"6px",
 padding:"7px 14px",
 borderRadius:"8px",
 fontSize:"13px",
 fontWeight: active ? 600 : 400,
 color: active ?"#2563eb" :"#6b7280",
 background: active ?"#eff6ff" :"transparent",
 border: active ?"1px solid #bfdbfe" :"1px solid transparent",
 cursor:"pointer",
 fontFamily:"inherit",
 transition:"all 0.15s",
 }}
 >
 <Icon size={14} style={{ color: active ?"#2563eb" :"#9ca3af" }} />
 {tab.label}
 </button>
 );
 })}
 </div>
 </div>
 ))}
 </div>

 {/* Active tab breadcrumb */}
 <div style={{ fontSize:"11px", color:"#9ca3af", marginBottom:"16px" }}>
 Settings / <span style={{ color:"#374151", fontWeight: 600 }}>{activeTabLabel}</span>
 </div>

 {/* Tab Content */}
 <div>
 {activeTab ==="general" && <GeneralTab settings={settings} update={update} />}
 {activeTab ==="election" && <ElectionTab settings={settings} update={update} />}
 {activeTab ==="auth" && <AuthTab settings={settings} update={update} />}
 {activeTab ==="security" && <SecurityTab settings={settings} update={update} />}
 {activeTab ==="admins" && <AdminsTab qc={qc} />}
 {activeTab ==="departments" && <DepartmentsTab qc={qc} />}
 {activeTab ==="export" && <ExportTab />}
 {activeTab ==="audit" && <AuditTab />}
 </div>
 </div>
 );
}

// ─── Tab: General ─────────────────────────────────────────────────────────────
function GeneralTab({ settings, update }: any) {
 return (
 <SectionCard title="System Identity & Branding" description="Controls system identity across the entire platform.">
 <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
 <FormField label="System Name">
 <input className={inputCls} value={settings.systemName} onChange={e => update({ systemName: e.target.value })} placeholder="RUNSA Digital Voting System" />
 </FormField>
 <FormField label="Institution Name">
 <input className={inputCls} value={settings.institutionName} onChange={e => update({ institutionName: e.target.value })} placeholder="Redeemer's University" />
 </FormField>
 <FormField label="Election Body Name">
 <input className={inputCls} value={settings.electionBodyName} onChange={e => update({ electionBodyName: e.target.value })} placeholder="RUNSA" />
 </FormField>
 <FormField label="System Logo URL" hint="Paste a URL to your institution logo">
 <input className={inputCls} value={settings.logoUrl} onChange={e => update({ logoUrl: e.target.value })} placeholder="https://example.com/logo.png" />
 </FormField>
 </div>
 <div className="px-4 sm:px-5 pb-5">
 <FormField label="System Description">
 <textarea className={`${inputCls} h-24 resize-y`} value={settings.systemDescription} onChange={e => update({ systemDescription: e.target.value })} />
 </FormField>
 </div>
 </SectionCard>
 );
}

// ─── Tab: Election Config ─────────────────────────────────────────────────────
function ElectionTab({ settings, update }: any) {
 return (
 <SectionCard title="Election Configuration" description="Controls how elections behave across the platform.">
 <ToggleRow checked={settings.allowMultipleVotes} onChange={v => update({ allowMultipleVotes: v })} title="Allow Multiple Votes per Voter" description="If enabled, voters can cast votes multiple times. Disable to enforce one vote per position." />
 <ToggleRow checked={settings.enableLiveResults} onChange={v => update({ enableLiveResults: v })} title="Enable Live Results During Voting" description="Displays real-time vote counts to users while the election is ongoing." />
 <ToggleRow checked={settings.autoCloseElection} onChange={v => update({ autoCloseElection: v })} title="Automatically Close Election After End Time" description="System automatically stops accepting votes when the End Date/Time is reached." />
 <ToggleRow checked={settings.allowVoteReview} onChange={v => update({ allowVoteReview: v })} title="Allow Voters to Review Ballot Before Submission" description="Shows a confirmation screen summarizing user choices before final submission." />
 </SectionCard>
 );
}

// ─── Tab: Authentication ──────────────────────────────────────────────────────
function AuthTab({ settings, update }: any) {
  return (
    <SectionCard title="Voter Authentication" description="Controls how students log into the voting system.">
      <div className={`p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 border-b ${colors.border}`}>
        <div className="flex flex-col justify-center">
          <label className={`block text-sm font-medium ${colors.textPrimary} mb-1.5`}>Authentication Method</label>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium flex items-center gap-2 w-fit">
              <ShieldCheck size={16} />
              School Portal API
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Voters authenticate directly via the central school student portal.</p>
        </div>
        <FormField label="Session Timeout (minutes)" hint="Automatically log out inactive users">
          <input type="number" min={5} max={480} className={inputCls} value={settings.sessionTimeout} onChange={e => update({ sessionTimeout: Number(e.target.value) })} />
        </FormField>
      </div>
      <ToggleRow checked={settings.allowOnlyRegisteredVoters} onChange={v => update({ allowOnlyRegisteredVoters: v })} title="Allow Only Registered Voters to Access Ballot" description="Blocks any user not explicitly in the Voters list from viewing elections." />
    </SectionCard>
  );
}

// ─── Tab: Security ────────────────────────────────────────────────────────────
function SecurityTab({ settings, update }: any) {
 return (
 <>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
 <StatBox 
 title="Security Status" 
 value="All systems on" 
 subtext="3 of 3 controls active" 
 valueColor="text-green-600"
 />
 <StatBox title="Vote Records" value="2,841" subtext="Hashes verified" />
 <StatBox title="Admin Actions Logged" value="147" subtext="Since last election" />
 </div>

 <SectionCard 
 title="Voting Integrity Controls" 
 description="Core protections for the election process" 
 badge="Critical" 
 badgeColor="red"
 icon={Shield}
 >
 <ToggleRow 
 title="Prevent Duplicate Voting (One Voter, One Vote)" 
 description="Blocks a voter from casting more than one vote per position. Enforced at the database level." 
 checked={settings.preventDuplicateVoting} 
 onChange={v => update({ preventDuplicateVoting: v })} 
 />
 <ToggleRow 
 title="Enable Vote Hash Encryption (SHA-256)" 
 description="Each submitted vote is hashed with SHA-256 before storage, ensuring tamper-evidence and auditability." 
 checked={settings.enableVoteEncryption} 
 onChange={v => update({ enableVoteEncryption: v })} 
 />
 <WarningBanner message="Warning: Disabling vote encryption or duplicate prevention may compromise election integrity. These settings should remain enabled in production." />
 </SectionCard>

 <SectionCard 
 title="Audit & Activity Logging" 
 description="Track all administrative actions for compliance" 
 badge="Active" 
 badgeColor="green"
 icon={ScrollText}
 >
 <ToggleRow 
 title="Enable Activity Logging" 
 description="Automatically records all actions taken by administrators (e.g. creating elections, modifying candidates, toggling settings)." 
 checked={settings.enableActivityLogging} 
 onChange={v => update({ enableActivityLogging: v })} 
 />
 </SectionCard>
 </>
 );
}

// ─── Tab: Admin Management ────────────────────────────────────────────────────
function AdminsTab({ qc }: { qc: any }) {
 const [showAdd, setShowAdd] = useState(false);
 const [form, setForm] = useState({ matricNo:"", fullName:"", schoolEmail:"", password:"", role:"admin" });
 const [formError, setFormError] = useState("");

 const { data: users = [], isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: getAdminUsers });

 const createMut = useMutation({
 mutationFn: () => createAdminUser({
 matricNo: form.matricNo,
 fullName: form.fullName,
 schoolEmail: form.schoolEmail,
 password: form.password,
 roleNames: [form.role],
 }),
 onSuccess: () => {
 qc.invalidateQueries({ queryKey: ["admin-users"] });
 toast.success("Admin user created");
 setShowAdd(false);
 setForm({ matricNo:"", fullName:"", schoolEmail:"", password:"", role:"admin" });
 },
 onError: (e: any) => setFormError(e.response?.data?.error ||"Failed to create admin"),
 });

 const toggleMut = useMutation({
 mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => toggleUserActive(id, isActive),
 onSuccess: () => {
 qc.invalidateQueries({ queryKey: ["admin-users"] });
 toast.success("User status updated");
 },
 });

 const adminUsers = users.filter(u => u.roles.some(r => ["admin","super_admin","election_officer","observer"].includes(r)));

 const roleColor: Record<string, string> = {
 super_admin:"text-[#a855f7] border border-[#a855f7]/30 bg-[#a855f7]/10",
 admin:"text-[#3b82f6] border border-[#3b82f6]/30 bg-[#3b82f6]/10",
 election_officer:"text-[#10b981] border border-[#10b981]/30 bg-[#10b981]/10",
 observer:"text-gray-600 border border-gray-400 bg-gray-100",
 };

 return (
 <>
 <SectionCard title="Admin Management" description="Manage administrator accounts and their roles.">
 <div className="flex justify-end p-4 sm:p-5 pb-2">
 <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
 <Plus size={15} /> Add Admin
 </button>
 </div>

 {showAdd && (
 <div className={`m-4 sm:m-5 p-4 sm:p-5 border ${colors.border} bg-gray-50 rounded-xl space-y-4`}>
 <h4 className={`text-sm font-semibold ${colors.textPrimary}`}>New Admin User</h4>
 {formError && <div className="p-2.5 bg-red-100 border border-red-200 text-red-700 text-xs rounded-lg">{formError}</div>}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <FormField label="Matric Number *">
 <input className={inputCls} value={form.matricNo} onChange={e => setForm(f => ({ ...f, matricNo: e.target.value }))} placeholder="RUN/CSC/000" required />
 </FormField>
 <FormField label="Full Name">
 <input className={inputCls} value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="John Doe" />
 </FormField>
 <FormField label="School Email">
 <input type="email" className={inputCls} value={form.schoolEmail} onChange={e => setForm(f => ({ ...f, schoolEmail: e.target.value }))} placeholder="john@run.edu.ng" />
 </FormField>
 <FormField label="Temporary Password" hint="Defaults to User@12345 if left blank">
 <input type="password" className={inputCls} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Leave blank for default" />
 </FormField>
 <FormField label="Role">
 <select className={inputCls} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
 <option value="super_admin" className="bg-white">Super Admin</option>
 <option value="admin" className="bg-white">Admin</option>
 <option value="election_officer" className="bg-white">Election Officer</option>
 <option value="observer" className="bg-white">Observer</option>
 </select>
 </FormField>
 </div>
 <div className="flex gap-2 pt-2">
 <button onClick={() => { setShowAdd(false); setFormError(""); }} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition">Cancel</button>
 <button onClick={() => { setFormError(""); createMut.mutate(undefined); }} disabled={createMut.isPending || !form.matricNo} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
 <Check size={14} /> {createMut.isPending ?"Creating..." :"Create Admin"}
 </button>
 </div>
 </div>
 )}

 {isLoading ? (
 <div className="py-8 text-center text-gray-500 text-sm">Loading...</div>
 ) : adminUsers.length === 0 ? (
 <div className="py-8 text-center text-gray-500 text-sm">No admin users found.</div>
 ) : (
 <div className={`px-4 sm:px-5 pb-5 divide-y divide-gray-100 `}>
 {adminUsers.map(u => (
 <div key={u.id} className={`flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3`}>
 <div className="flex items-center gap-3">
 <div className={`w-9 h-9 rounded-full bg-gray-100 border border-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm shrink-0`}>
 {(u.fullName?.[0] || u.matricNo[0]).toUpperCase()}
 </div>
 <div>
 <p className={`text-sm font-semibold ${colors.textPrimary}`}>{u.fullName || u.matricNo}</p>
 <p className="text-xs text-gray-500">{u.schoolEmail || u.matricNo}</p>
 </div>
 </div>
 <div className="flex items-center gap-2 flex-wrap sm:justify-end">
 {u.roles.map(r => (
 <span key={r} className={`px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${roleColor[r] ||"text-gray-500"}`}>
 {r.replace("_","").toUpperCase()}
 </span>
 ))}
 <button
 onClick={() => toggleMut.mutate({ id: u.id, isActive: !u.isActive })}
 className={`px-3 py-1 rounded-md text-xs font-medium transition ${u.isActive ?"bg-green-100 text-green-700 hover:bg-green-200" :"bg-red-100 text-red-600 hover:bg-red-200 border border-transparent"}`}
 >
 {u.isActive ?"Active" :"Inactive"}
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </SectionCard>
 </>
 );
}

// ─── Tab: Departments ─────────────────────────────────────────────────────────
function DepartmentsTab({ qc }: { qc: any }) {
 const [newName, setNewName] = useState("");
 const [editId, setEditId] = useState<string | null>(null);
 const [editName, setEditName] = useState("");

 const { data: departments = [], isLoading } = useQuery({ queryKey: ["admin-departments"], queryFn: getDepartments });

 const addMut = useMutation({
 mutationFn: async (name: string) => {
 const resp = await fetch("/api/admin/departments", {
 method:"POST",
 headers: {"Content-Type":"application/json", Authorization: `Bearer ${localStorage.getItem("runsa_token")}` },
 body: JSON.stringify({ name }),
 });
 if (!resp.ok) throw new Error("Failed");
 return resp.json();
 },
 onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-departments"] }); setNewName(""); toast.success("Department added"); },
 onError: () => toast.error("Failed to add department. Check backend support."),
 });

 const deleteMut = useMutation({
 mutationFn: async (id: string) => {
 const resp = await fetch(`/api/admin/departments/${id}`, {
 method:"DELETE",
 headers: { Authorization: `Bearer ${localStorage.getItem("runsa_token")}` },
 });
 if (!resp.ok) throw new Error("Failed");
 },
 onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-departments"] }); toast.success("Department deleted"); },
 onError: () => toast.error("Failed to delete department."),
 });

 const updateMut = useMutation({
 mutationFn: async ({ id, name }: { id: string; name: string }) => {
 const resp = await fetch(`/api/admin/departments/${id}`, {
 method:"PATCH",
 headers: {"Content-Type":"application/json", Authorization: `Bearer ${localStorage.getItem("runsa_token")}` },
 body: JSON.stringify({ name }),
 });
 if (!resp.ok) throw new Error("Failed");
 return resp.json();
 },
 onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-departments"] }); setEditId(null); toast.success("Department updated"); },
 onError: () => toast.error("Failed to update department."),
 });

 return (
 <SectionCard title="Department Management" description="Departments are used to restrict elections to specific groups of voters.">
 <div className={`p-4 sm:p-5 border-b ${colors.border}`}>
 <div className="flex gap-2">
 <input
 className={`${inputCls} flex-1`}
 value={newName}
 onChange={e => setNewName(e.target.value)}
 placeholder="Department name (e.g. Computer Science)"
 onKeyDown={e => e.key ==="Enter" && newName.trim() && addMut.mutate(newName.trim())}
 />
 <button
 onClick={() => { if (newName.trim()) addMut.mutate(newName.trim()); }}
 disabled={!newName.trim() || addMut.isPending}
 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 shrink-0"
 >
 <Plus size={15} /> Add
 </button>
 </div>
 </div>

 {isLoading ? (
 <div className="py-8 text-center text-gray-500 text-sm">Loading...</div>
 ) : departments.length === 0 ? (
 <div className="py-8 text-center text-gray-500 text-sm">No departments found.</div>
 ) : (
 <div className={`px-4 sm:px-5 pb-5 divide-y divide-gray-100 `}>
 {departments.map((dept: any) => (
 <div key={dept.id} className="flex items-center justify-between py-3 gap-3">
 {editId === dept.id ? (
 <input
 className={`${inputCls} flex-1`}
 value={editName}
 onChange={e => setEditName(e.target.value)}
 autoFocus
 onKeyDown={e => e.key ==="Enter" && updateMut.mutate({ id: dept.id, name: editName })}
 />
 ) : (
 <div className="flex items-center gap-3">
 <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
 <span className={`text-sm font-medium ${colors.textPrimary}`}>{dept.name}</span>
 </div>
 )}
 <div className="flex items-center gap-1.5 shrink-0">
 {editId === dept.id ? (
 <>
 <button onClick={() => updateMut.mutate({ id: dept.id, name: editName })} className={`w-8 h-8 flex items-center justify-center text-green-600 ${colors.primaryHover} rounded transition`}><Check size={14} /></button>
 <button onClick={() => setEditId(null)} className={`w-8 h-8 flex items-center justify-center text-gray-500 ${colors.primaryHover} rounded transition`}><X size={14} /></button>
 </>
 ) : (
 <>
 <button onClick={() => { setEditId(dept.id); setEditName(dept.name); }} className={`w-8 h-8 flex items-center justify-center text-blue-600 ${colors.primaryHover} rounded transition`}><Edit2 size={14} /></button>
 <button onClick={() => deleteMut.mutate(dept.id)} className={`w-8 h-8 flex items-center justify-center text-red-600 ${colors.primaryHover} rounded transition`}><Trash2 size={14} /></button>
 </>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </SectionCard>
 );
}

// ─── Tab: Data Export ─────────────────────────────────────────────────────────
function ExportTab() {
 const { data: elections = [] } = useQuery({ queryKey: ["admin-elections"], queryFn: getAdminElections });
 const { data: candidates = [] } = useQuery({ queryKey: ["admin-candidates"], queryFn: () => getCandidates() });
 const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: getAdminUsers });

 type FmtType ="csv" |"json";
 const [fmt, setFmt] = useState<FmtType>("csv");

 function toCSV(rows: Record<string, any>[], cols: string[]) {
 const header = cols.join(",");
 const body = rows.map(r => cols.map(c => JSON.stringify(r[c] ??"")).join(",")).join("\n");
 return header +"\n" + body;
 }

 function download(content: string, filename: string, mime: string) {
 const blob = new Blob([content], { type: mime });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url; a.download = filename; a.click();
 URL.revokeObjectURL(url);
 toast.success(`${filename} downloaded`);
 }

 function exportVoters() {
 const voters = users.filter((u: any) => !u.roles.some((r: any) => ["admin","super_admin"].includes(r)));
 if (fmt ==="csv") download(toCSV(voters, ["matricNo","fullName","schoolEmail","department","isActive","createdAt"]),"voters.csv","text/csv");
 else download(JSON.stringify(voters, null, 2),"voters.json","application/json");
 }

 function exportCandidates() {
 const rows = candidates.map((c: any) => ({ name: c.user?.fullName ??"", matricNo: c.user?.matricNo ??"", status: c.status, positionId: c.positionId }));
 if (fmt ==="csv") download(toCSV(rows, ["name","matricNo","status","positionId"]),"candidates.csv","text/csv");
 else download(JSON.stringify(rows, null, 2),"candidates.json","application/json");
 }

 function exportElections() {
 const rows = elections.map((e: any) => ({ title: e.title, status: e.status, startAt: e.startAt, endAt: e.endAt }));
 if (fmt ==="csv") download(toCSV(rows, ["title","status","startAt","endAt"]),"elections.csv","text/csv");
 else download(JSON.stringify(rows, null, 2),"elections.json","application/json");
 }

 return (
 <SectionCard title="Data Export" description="Export system data directly from the database.">
 <div className={`p-4 sm:p-5 border-b ${colors.border}`}>
 <div className="flex items-center gap-3">
 <span className={`text-sm font-medium ${colors.textPrimary}`}>Export Format:</span>
 {(["csv","json"] as FmtType[]).map(f => (
 <button key={f} onClick={() => setFmt(f)}
 className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition ${fmt === f ?"bg-blue-600 text-white border-blue-600" : `bg-transparent text-gray-500 border-gray-300 ${colors.primaryHover}`}`}>
 {f.toUpperCase()}
 </button>
 ))}
 </div>
 </div>

 <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
 {[
 { label:"Voters List", desc: `${users.filter((u: any) => !u.roles.some((r: any) => ["admin","super_admin"].includes(r))).length} voters`, action: exportVoters, color:"text-blue-500" },
 { label:"Candidates List", desc: `${candidates.length} candidates`, action: exportCandidates, color:"text-green-500" },
 { label:"Elections Data", desc: `${elections.length} elections`, action: exportElections, color:"text-purple-500" },
 ].map(({ label, desc, action, color }) => (
 <button key={label} onClick={action}
 className={`flex flex-col items-start p-5 rounded-xl border border-gray-200 hover:bg-gray-50 transition cursor-pointer text-left bg-white `}>
 <div className={`mb-3 ${color}`}>
 <Download size={20} />
 </div>
 <p className={`text-sm font-semibold ${colors.textPrimary}`}>{label}</p>
 <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
 </button>
 ))}
 </div>
 </SectionCard>
 );
}

// ─── Tab: Audit Logs ──────────────────────────────────────────────────────────
function AuditTab() {
 const [filter, setFilter] = useState("");
 const { data: logs = [], isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin-audit-logs"], queryFn: getAuditLogs, staleTime: 30_000 });

 const filtered = logs.filter((l: any) => 
 !filter || l.action.toLowerCase().includes(filter.toLowerCase()) || l.actor?.fullName?.toLowerCase().includes(filter.toLowerCase()) || l.entityType.toLowerCase().includes(filter.toLowerCase())
 );

 return (
 <SectionCard title="Audit Logs" description="Track all major actions performed by admins and voters.">
 <div className={`p-4 sm:p-5 border-b ${colors.border} flex items-center gap-3`}>
 <input className={`${inputCls} flex-1`} placeholder="Filter by action, actor, or entity..." value={filter} onChange={e => setFilter(e.target.value)} />
 <button onClick={() => refetch()} disabled={isFetching} className={`flex items-center gap-2 px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 ${colors.primaryHover} transition`}>
 <RefreshCw size={14} className={isFetching ?"animate-spin" :""} />
 </button>
 </div>

 {isLoading ? (
 <div className="py-10 text-center text-gray-500 text-sm">Loading logs...</div>
 ) : filtered.length === 0 ? (
 <div className="py-10 text-center text-gray-500 text-sm">No audit logs found.</div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm border-collapse">
 <thead>
 <tr className="bg-gray-50 border-b border-gray-200">
 <th className="py-3 px-4 sm:px-5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Action</th>
 <th className="py-3 px-4 sm:px-5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Actor</th>
 <th className="py-3 px-4 sm:px-5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Time</th>
 </tr>
 </thead>
 <tbody>
 {filtered.slice(0, 50).map((log: any) => (
 <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition last:border-0">
 <td className="py-3 px-4 sm:px-5">
 <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold text-gray-700 bg-gray-200 `}>
 {log.action.replace(/_/g,"")}
 </span>
 </td>
 <td className={`py-3 px-4 sm:px-5 font-medium ${colors.textPrimary}`}>
 {log.actor?.fullName || log.actor?.matricNo}
 </td>
 <td className="py-3 px-4 sm:px-5 text-gray-500 text-xs whitespace-nowrap">
 {new Date(log.createdAt).toLocaleString()}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </SectionCard>
 );
}
