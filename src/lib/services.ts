import api from "./api";
import { User } from "./authStore";

// ─── Auth ───────────────────────────────────────────────
export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

// ─── Elections ──────────────────────────────────────────
export interface Election {
  id: string;
  title: string;
  typeId: string;
  type?: { id: string; name: string };
  departmentId: string | null;
  department?: { id: string; name: string } | null;
  status: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
  isPublished: boolean;
  registrationOpen: boolean;
  startAt?: string | null;
  endAt?: string | null;
  createdById: string;
  createdAt: string;
  positions?: Position[];
}

export interface CreateElectionPayload {
  title: string;
  typeName: string;
  departmentId?: string | null;
  startAt?: string;
  endAt?: string;
}

export async function getEligibleElections(): Promise<Election[]> {
  const { data } = await api.get("/elections");
  return data.elections;
}

export async function getClosedElections(): Promise<Election[]> {
  const { data } = await api.get("/elections/closed");
  return data.elections;
}

export async function getAdminElections(): Promise<Election[]> {
  const { data } = await api.get("/admin/elections");
  return Array.isArray(data) ? data : data.elections ?? [];
}

export async function createElection(payload: CreateElectionPayload): Promise<Election> {
  const { data } = await api.post("/admin/elections", payload);
  return data;
}

export async function updateElectionStatus(
  id: string,
  status: Election["status"]
): Promise<Election> {
  const { data } = await api.patch(`/admin/elections/${id}/status`, { status });
  return data;
}

export async function deleteAllElections(): Promise<{ ok: boolean; deleted: number }> {
  const { data } = await api.delete("/admin/elections");
  return data;
}


export async function setAllowedRoles(
  electionId: string,
  roleNames: string[]
): Promise<void> {
  await api.post(`/admin/elections/${electionId}/allowed-roles`, { roleNames });
}

// ─── Positions ──────────────────────────────────────────
export interface Position {
  id: string;
  name: string;
  maxWinners: number;
  electionId: string;
  election?: Election;
  candidates?: Candidate[];
  createdAt: string;
}

export interface CreatePositionPayload {
  name: string;
  electionId: string;
  maxWinners?: number;
}

export async function getPositions(electionId?: string): Promise<Position[]> {
  const params = electionId ? { electionId } : {};
  const { data } = await api.get("/admin/positions", { params });
  return Array.isArray(data) ? data : data.positions ?? [];
}

// Voter-facing: get positions for a specific election (no admin required)
export async function getVoterPositions(electionId: string): Promise<Position[]> {
  const { data } = await api.get(`/elections/${electionId}/positions`);
  return Array.isArray(data) ? data : data.positions ?? [];
}

export async function createPosition(payload: CreatePositionPayload): Promise<Position> {
  const { data } = await api.post("/admin/positions", payload);
  return data;
}

// ─── Candidates ─────────────────────────────────────────
export interface Candidate {
  id: string;
  manifesto: string;
  photoUrl?: string;
  positionId: string;
  position?: Position;
  userId: string;
  user?: { id: string; fullName: string; matricNo: string };
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface CreateCandidatePayload {
  userId: string;
  positionId: string;
  manifesto?: string;
  photoUrl?: string;
}

export async function getCandidates(positionId?: string): Promise<Candidate[]> {
  const params = positionId ? { positionId } : {};
  const { data } = await api.get("/admin/candidates", { params });
  return Array.isArray(data) ? data : data.candidates ?? [];
}

export async function createCandidate(payload: CreateCandidatePayload): Promise<Candidate> {
  const { data } = await api.post("/admin/candidates", payload);
  return data;
}

export async function updateCandidateDecision(
  id: string,
  decision: "APPROVED" | "REJECTED"
): Promise<Candidate> {
  const { data } = await api.patch(`/admin/candidates/${id}/decision`, {
    status: decision,
  });
  return data;
}

// ─── Voting ─────────────────────────────────────────────
export interface VotePayload {
  positionId: string;
  candidateId: string;
}

export interface VoteResponse {
  ok: boolean;
  receiptId: string;
  voteHash: string;
}

export async function castVote(payload: VotePayload): Promise<VoteResponse> {
  const { data } = await api.post("/votes", payload);
  return data;
}

// ─── Results ────────────────────────────────────────────
export interface PositionResult {
  positionId: string;
  positionName: string;
  results: {
    candidateId: string;
    name: string;
    count: number;
  }[];
}

export interface ElectionResults {
  electionId: string;
  tally: PositionResult[];
}

export async function getElectionResults(electionId: string): Promise<ElectionResults> {
  const { data } = await api.get(`/admin/results/elections/${electionId}`);
  return data;
}

// ─── Vote Verification ─────────────────────────────────
export interface VerifyVoteResponse {
  ok: boolean;
  voteId: string;
  electionId: string;
  valid: boolean;
  stored: string;
  recomputed: string;
}

export async function verifyVote(voteId: string): Promise<VerifyVoteResponse> {
  const { data } = await api.get(`/admin/votes/${voteId}/verify`);
  return data;
}

// ─── Audit Logs ─────────────────────────────────────────
export interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  actor?: { id: string; fullName: string; matricNo: string };
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const { data } = await api.get("/admin/audit-logs");
  return Array.isArray(data) ? data : data.logs ?? [];
}

// ─── Roles ──────────────────────────────────────────────
export interface Role {
  id: string;
  name: string;
  description?: string;
  isAdminRole: boolean;
  canVote: boolean;
}

export async function getRoles(): Promise<Role[]> {
  const { data } = await api.get("/admin/roles");
  return Array.isArray(data) ? data : data.roles ?? [];
}

// ─── Departments ────────────────────────────────────────
export interface Department {
  id: string;
  name: string;
}

export async function getDepartments(): Promise<Department[]> {
  const { data } = await api.get("/admin/departments");
  return Array.isArray(data) ? data : data.departments ?? [];
}

// ─── Election Types ─────────────────────────────────────
export interface ElectionType {
  id: string;
  name: string;
}

export async function getElectionTypes(): Promise<ElectionType[]> {
  const { data } = await api.get("/admin/election-types");
  // Backend returns a raw array directly
  return Array.isArray(data) ? data : data.types ?? [];
}

// ─── User Info ──────────────────────────────────────────
export async function getCurrentUser() {
  const { data } = await api.get("/me");
  return data.user;
}

// ─── Admin User Management ──────────────────────────────
export interface AdminUser {
  id: string;
  matricNo: string;
  fullName: string | null;
  schoolEmail: string | null;
  isActive: boolean;
  department: string | null;
  roles: string[];
  createdAt: string;
}

export interface CreateAdminUserPayload {
  matricNo: string;
  schoolEmail?: string;
  fullName?: string;
  password?: string;
  roleNames: string[];
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const { data } = await api.get("/admin/users");
  return Array.isArray(data) ? data : [];
}

export async function createAdminUser(payload: CreateAdminUserPayload) {
  const { data } = await api.post("/admin/users", payload);
  return data;
}

export async function toggleUserActive(id: string, isActive: boolean) {
  const { data } = await api.patch(`/admin/users/${id}/activate`, { isActive });
  return data;
}

// ─── Department CRUD ────────────────────────────────────
export async function createDepartment(name: string): Promise<Department> {
  const { data } = await api.post("/admin/departments", { name });
  return data;
}

export async function updateDepartment(id: string, name: string): Promise<Department> {
  const { data } = await api.patch(`/admin/departments/${id}`, { name });
  return data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await api.delete(`/admin/departments/${id}`);
}

// ─── Roles ──────────────────────────────────────────────
export async function createRole(payload: { name: string; description?: string; isAdminRole?: boolean }): Promise<Role> {
  const { data } = await api.post("/admin/roles", payload);
  return data;
}

// ─── Voter Settings & History ──────────────────────────
export interface VoteReceiptHistory {
  id: string;
  receiptId: string;
  electionId: string;
  positionId: string;
  createdAt: string;
  election: {
    id: string;
    title: string;
    status: string;
    endAt: string | null;
  };
  position: {
    id: string;
    name: string;
  };
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
  const { data } = await api.post("/auth/change-password", payload);
  return data;
}

export async function getVoteHistory(): Promise<VoteReceiptHistory[]> {
  const { data } = await api.get("/votes/my-history");
  return data.receipts;
}

export interface VoterActivity {
  id: string;
  action: string;
  details: any;
  createdAt: string;
}

export async function getVoterActivity(): Promise<VoterActivity[]> {
  const { data } = await api.get("/activity");
  return data.logs;
}



