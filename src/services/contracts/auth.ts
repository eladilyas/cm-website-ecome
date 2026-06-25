// AuthService — session + identity contract.
//
// Implementations:
//   • impl/demo/   — localStorage-backed (current accountStore)
//   • impl/platform/ — Better-Auth + Postgres (Phase 2)
//
// The contract intentionally does NOT expose passwords or session tokens.
// Those stay inside the implementation; consumers receive `Session` +
// `User` shapes only.

import type {
  PermissionAction,
  PermissionResource,
  RoleSlug,
  Session,
  User,
  UserId,
} from "./types";

export type SignUpInput = Readonly<{
  email: string;
  password?: string; // optional for magic-link flows
  fullName: string;
  phone?: string;
  companyName?: string;
}>;

export type SignInInput = Readonly<{
  email: string;
  password: string;
}>;

export interface AuthService {
  // Identity ────────────────────────────────────────────────────────────
  signUp(input: SignUpInput): Promise<{ user: User; session: Session }>;
  signIn(input: SignInInput): Promise<{ user: User; session: Session }>;
  signOut(sessionId: string): Promise<void>;

  // Current-session access
  getCurrentUser(): Promise<User | null>;
  getCurrentSession(): Promise<Session | null>;

  // Profile (self-service)
  updateProfile(
    userId: UserId,
    patch: Partial<Pick<User, "fullName" | "phone">>,
  ): Promise<User>;

  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  verifyEmail(token: string): Promise<void>;

  // Authorisation ───────────────────────────────────────────────────────
  /** Returns true if the user has permission to perform `action` on
   *  `resource`. Authoritative — every server-action gates on this. */
  can(
    user: User,
    action: PermissionAction,
    resource: PermissionResource,
  ): Promise<boolean>;

  // Admin (gated by `can(user, "update", "users")`) ────────────────────
  listUsers(filter?: Readonly<{ role?: RoleSlug }>): Promise<User[]>;
  grantRole(userId: UserId, role: RoleSlug): Promise<User>;
  revokeRole(userId: UserId, role: RoleSlug): Promise<User>;
  disableUser(userId: UserId, reason?: string): Promise<User>;
  enableUser(userId: UserId): Promise<User>;
}
