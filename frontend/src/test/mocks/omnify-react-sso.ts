/**
 * SSO Mock for Vitest
 *
 * Note: When @famgia/omnify-react-sso is published to npm, you can use:
 *   import { ... } from '@famgia/omnify-react-sso/testing';
 *
 * For now (linked package), we implement mocks locally.
 */

import { vi } from "vitest";

// =============================================================================
// Types (aligned with @famgia/omnify-react-sso)
// =============================================================================

export interface SsoUser {
  id: number;
  consoleUserId: number;
  email: string;
  name: string;
}

export interface SsoOrganization {
  id: number;
  name: string;
  slug: string;
  orgRole: string;
  serviceRole: string | null;
}

export interface MockSsoContextValue {
  user: SsoUser | null;
  organizations: SsoOrganization[];
  currentOrg: SsoOrganization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasMultipleOrgs: boolean;
  login: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  globalLogout: ReturnType<typeof vi.fn>;
  switchOrg: ReturnType<typeof vi.fn>;
}

// =============================================================================
// Mock Data Factories
// =============================================================================

export function createMockUser(overrides?: Partial<SsoUser>): SsoUser {
  return {
    id: 1,
    consoleUserId: 100,
    email: "test@example.com",
    name: "Test User",
    ...overrides,
  };
}

export function createMockOrganization(overrides?: Partial<SsoOrganization>): SsoOrganization {
  return {
    id: 1,
    name: "Test Organization",
    slug: "test-org",
    orgRole: "owner",
    serviceRole: "admin",
    ...overrides,
  };
}

// =============================================================================
// Default Mock Context
// =============================================================================

export const mockSsoContext: MockSsoContextValue = {
  user: createMockUser(),
  organizations: [createMockOrganization()],
  currentOrg: createMockOrganization(),
  isLoading: false,
  isAuthenticated: true,
  hasMultipleOrgs: false,
  login: vi.fn(),
  logout: vi.fn(),
  globalLogout: vi.fn(),
  switchOrg: vi.fn(),
};

// =============================================================================
// Mutable Mock Data
// =============================================================================

let currentMockData: MockSsoContextValue = { ...mockSsoContext };

export function setMockSsoData(data: Partial<MockSsoContextValue>): void {
  currentMockData = { ...mockSsoContext, ...data };
}

export function resetMockSsoData(): void {
  currentMockData = { ...mockSsoContext };
}

export function getMockSsoData(): MockSsoContextValue {
  return currentMockData;
}

// =============================================================================
// Mock Hooks
// =============================================================================

export const useSso = () => currentMockData;

// Re-export types
export type { Role, Permission } from "./sso-types";
