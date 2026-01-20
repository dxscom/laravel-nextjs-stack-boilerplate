import { vi } from "vitest";

// Mock SSO user type
export interface SsoUser {
  email: string;
  name: string | null;
  consoleUserId: string;
}

// Mock organization type
export interface SsoOrganization {
  id: string;
  name: string;
  slug: string;
  orgRole: string;
  serviceRole: string;
}

// Mock SSO context
export const mockSsoContext = {
  user: {
    email: "test@example.com",
    name: "Test User",
    consoleUserId: "user-123",
  },
  organizations: [
    {
      id: "org-1",
      name: "Test Organization",
      slug: "test-org",
      orgRole: "owner",
      serviceRole: "admin",
    },
  ],
  currentOrg: {
    id: "org-1",
    name: "Test Organization",
    slug: "test-org",
    orgRole: "owner",
    serviceRole: "admin",
  },
  isLoading: false,
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
  globalLogout: vi.fn(),
  switchOrg: vi.fn(),
};

// Mutable mock data that tests can modify
let currentMockData = { ...mockSsoContext };

export const setMockSsoData = (data: Partial<typeof mockSsoContext>) => {
  currentMockData = { ...mockSsoContext, ...data };
};

export const resetMockSsoData = () => {
  currentMockData = { ...mockSsoContext };
};

// Mock useSso hook
export const useSso = () => currentMockData;

// Export types that might be used
export type { Role, Permission } from "./sso-types";
