import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { App, ConfigProvider } from "antd";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

// Create a fresh query client for each test
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Mock SSO context data
export const mockSsoUser = {
  email: "test@example.com",
  name: "Test User",
  consoleUserId: "user-123",
};

export const mockOrganization = {
  id: "org-1",
  name: "Test Organization",
  slug: "test-org",
  orgRole: "owner",
  serviceRole: "admin",
};

export const mockSsoContext = {
  user: mockSsoUser,
  organizations: [mockOrganization],
  currentOrg: mockOrganization,
  isLoading: false,
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
  globalLogout: vi.fn(),
  switchOrg: vi.fn(),
};

// Provider wrapper for tests
interface TestProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

export function TestProviders({ children, queryClient }: TestProvidersProps) {
  const client = queryClient ?? createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <ConfigProvider>
        <App>{children}</App>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

// Custom render with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { queryClient?: QueryClient }
) {
  const { queryClient, ...renderOptions } = options ?? {};

  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders queryClient={queryClient}>{children}</TestProviders>
    ),
    ...renderOptions,
  });
}

// Re-export testing library utilities
export * from "@testing-library/react";
export { renderWithProviders as render };
