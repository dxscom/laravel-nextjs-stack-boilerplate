import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, mockSsoContext } from "@/test/utils";
import { setMockSsoData, resetMockSsoData } from "@/test/mocks/omnify-react-sso";
import DashboardPage from "../page";

// Mock the SSO service
const mockRolesData = {
  data: [
    { id: "role-1", name: "Admin", slug: "admin", level: 100, description: "Admin role" },
    { id: "role-2", name: "Manager", slug: "manager", level: 50, description: "Manager role" },
    { id: "role-3", name: "Member", slug: "member", level: 10, description: "Member role" },
  ],
};

const mockPermissionsData = {
  data: [
    { id: "perm-1", name: "Create Users", slug: "users.create", group: "users" },
    { id: "perm-2", name: "Read Users", slug: "users.read", group: "users" },
    { id: "perm-3", name: "Create Posts", slug: "posts.create", group: "posts" },
  ],
};

const mockMatrixData = {
  matrix: {
    "role-1": ["perm-1", "perm-2", "perm-3"],
    "role-2": ["perm-2", "perm-3"],
    "role-3": ["perm-2"],
  },
};

const mockBranchesData = {
  all_branches_access: false,
  primary_branch_id: 1,
  organization: { id: 1, slug: "test-org", name: "Test Organization" },
  branches: [
    {
      id: 1,
      code: "HQ",
      name: "Headquarters",
      is_headquarters: true,
      is_primary: true,
      is_assigned: true,
      access_type: "explicit" as const,
      timezone: "Asia/Tokyo",
      currency: "JPY",
      locale: "ja",
    },
    {
      id: 2,
      code: "BR1",
      name: "Branch 1",
      is_headquarters: false,
      is_primary: false,
      is_assigned: true,
      access_type: "explicit" as const,
      timezone: null,
      currency: null,
      locale: null,
    },
  ],
};

vi.mock("@/lib/ssoService", () => ({
  roleService: {
    list: vi.fn(() => Promise.resolve(mockRolesData)),
  },
  permissionService: {
    list: vi.fn(() => Promise.resolve(mockPermissionsData)),
    getMatrix: vi.fn(() => Promise.resolve(mockMatrixData)),
  },
  branchService: {
    list: vi.fn(() => Promise.resolve(mockBranchesData)),
  },
}));

// Mock queryKeys
vi.mock("@/lib/queryKeys", () => ({
  queryKeys: {
    sso: {
      roles: {
        list: () => ["sso", "roles", "list"],
      },
      permissions: {
        list: () => ["sso", "permissions", "list"],
        matrix: () => ["sso", "permissions", "matrix"],
      },
      branches: {
        list: (slug?: string) => ["sso", "branches", "list", slug],
      },
    },
  },
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockSsoData();
  });

  describe("正常系", () => {
    it("正常: renders user information correctly", async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      });

      // User info should be displayed
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    it("正常: displays organization information", async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        // Organization name appears in multiple places (user info + org list)
        expect(screen.getAllByText("Test Organization").length).toBeGreaterThan(0);
      });
    });

    it("正常: shows statistics cards", async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Organizations")).toBeInTheDocument();
        // "Branches" appears as card title and section title
        expect(screen.getAllByText("Branches").length).toBeGreaterThan(0);
        // "Roles" appears as statistic and table
        expect(screen.getAllByText(/Roles/i).length).toBeGreaterThan(0);
        // "Permissions" appears multiple times
        expect(screen.getAllByText(/Permissions/i).length).toBeGreaterThan(0);
      });
    });

    it("正常: displays branches list", async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        // Branch names may appear multiple times (in card + dropdown)
        expect(screen.getAllByText("Headquarters").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Branch 1").length).toBeGreaterThan(0);
      });
    });

    it("正常: shows My Permissions section when branch is selected", async () => {
      renderWithProviders(<DashboardPage />);

      // Wait for branches to load
      await waitFor(() => {
        expect(screen.getAllByText("Headquarters").length).toBeGreaterThan(0);
      });

      // Primary branch is auto-selected, so My Permissions should show
      await waitFor(() => {
        expect(screen.getByText("My Permissions")).toBeInTheDocument();
      });
    });

    it("正常: displays roles table", async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("All Roles")).toBeInTheDocument();
      });
    });

    it("正常: displays permissions grouped by category", async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("All Permissions")).toBeInTheDocument();
      });
    });
  });

  describe("異常系", () => {
    it("異常: shows loading spinner when SSO is loading", () => {
      setMockSsoData({
        isLoading: true,
        user: null,
      });

      renderWithProviders(<DashboardPage />);

      // Should show loading spinner
      expect(document.querySelector(".ant-spin")).toBeInTheDocument();
    });

    it("異常: returns null when user is not set", async () => {
      setMockSsoData({
        isLoading: false,
        isAuthenticated: true,
        user: null,
      });

      renderWithProviders(<DashboardPage />);

      // Component returns null when user is not set, so Dashboard title won't appear
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    });

    it("異常: shows warning when user has no role", async () => {
      setMockSsoData({
        currentOrg: { ...mockSsoContext.currentOrg!, serviceRole: "" },
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("My Permissions")).toBeInTheDocument();
      });

      // Should show warning about no role
      expect(screen.getByText("No role assigned")).toBeInTheDocument();
    });
  });
});
