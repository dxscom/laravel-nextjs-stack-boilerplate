import { vi } from "vitest";

// Mock SSO user type (aligned with @famgia/omnify-react-sso)
export interface SsoUser {
  id: number;
  consoleUserId: number;
  email: string;
  name: string;
}

// Mock organization type (aligned with @famgia/omnify-react-sso)
export interface SsoOrganization {
  id: number;
  name: string;
  slug: string;
  orgRole: string;
  serviceRole: string | null;
}

// Mock SSO context value type
export interface MockSsoContextValue {
  user: SsoUser | null;
  organizations: SsoOrganization[];
  currentOrg: SsoOrganization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  globalLogout: ReturnType<typeof vi.fn>;
  switchOrg: ReturnType<typeof vi.fn>;
}

// Mock SSO context
export const mockSsoContext: MockSsoContextValue = {
  user: {
    id: 1,
    email: "test@example.com",
    name: "Test User",
    consoleUserId: 100,
  },
  organizations: [
    {
      id: 1,
      name: "Test Organization",
      slug: "test-org",
      orgRole: "owner",
      serviceRole: "admin",
    },
  ],
  currentOrg: {
    id: 1,
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
let currentMockData: MockSsoContextValue = { ...mockSsoContext };

export const setMockSsoData = (data: Partial<MockSsoContextValue>) => {
  currentMockData = { ...mockSsoContext, ...data };
};

export const resetMockSsoData = () => {
  currentMockData = { ...mockSsoContext };
};

// Mock useSso hook
export const useSso = () => currentMockData;

// Export types that might be used
export type { Role, Permission } from "./sso-types";
