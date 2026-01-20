"use client";

import { useState, useMemo } from "react";
import {
  Button,
  Table,
  Space,
  Typography,
  App,
  Tag,
  Select,
  Card,
  Empty,
  Spin,
  Tooltip,
  Checkbox,
  Divider,
} from "antd";
import {
  BranchesOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { ColumnsType } from "antd/es/table";
import { userService, type User } from "@/services/users";
import {
  roleService,
  permissionService,
  userRoleService,
  branchService,
  getScopeLabel,
} from "@/lib/ssoService";
import type { Permission, Branch } from "@/omnify/schemas";
import type { RoleAssignment } from "@famgia/omnify-react-sso";
import { queryKeys } from "@/lib/queryKeys";
import { useSso, type ServiceRole as Role } from "@famgia/omnify-react-sso";

const { Title, Text } = Typography;

export default function BranchPermissionsPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { currentOrg } = useSso();

  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fetch branches for current organization
  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: queryKeys.sso.branches.list(currentOrg?.slug),
    queryFn: () => branchService.list(currentOrg?.slug),
    enabled: !!currentOrg?.slug,
  });

  // Fetch all roles
  const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
    queryKey: queryKeys.sso.roles.list(),
    queryFn: () => roleService.list(),
  });
  const roles = rolesResponse?.data;

  // Fetch all permissions
  const { data: permissionsResponse } = useQuery({
    queryKey: queryKeys.sso.permissions.list(),
    queryFn: () => permissionService.list(),
  });
  const permissions = permissionsResponse?.data;

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => userService.list({ per_page: 100 }),
  });

  // Selected branch info
  const selectedBranch = useMemo(
    () => branchesData?.branches?.find((b: Branch) => b.id === selectedBranchId),
    [branchesData, selectedBranchId]
  );

  // Fetch role assignments for selected user
  const { data: userRoleAssignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: [...queryKeys.sso.userRoles.list(selectedUserId ?? ""), selectedBranchId],
    queryFn: () => userRoleService.list(selectedUserId!),
    enabled: !!selectedUserId,
  });

  // Filter role assignments that apply to selected branch
  const branchRoleAssignments = useMemo(() => {
    if (!userRoleAssignments || !selectedBranch || !branchesData?.organization) {
      return [];
    }

    const orgId = String(branchesData.organization.id);
    const branchId = selectedBranch.id ? String(selectedBranch.id) : null;

    return userRoleAssignments.filter((a: RoleAssignment) => {
      // Global applies everywhere
      if (a.console_org_id === null) return true;
      // Must be same org
      if (a.console_org_id !== orgId) return false;
      // Org-wide applies to all branches
      if (a.console_branch_id === null) return true;
      // Branch-specific must match
      return a.console_branch_id === branchId;
    });
  }, [userRoleAssignments, selectedBranch, branchesData]);

  // Mutation for syncing roles
  const syncRolesMutation = useMutation({
    mutationFn: (params: { userId: string; roleIds: string[] }) =>
      userRoleService.sync(params.userId, {
        roles: params.roleIds,
        console_org_id: branchesData?.organization?.id
          ? String(branchesData.organization.id)
          : null,
        console_branch_id: selectedBranchId ? String(selectedBranchId) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sso.userRoles.all() });
      message.success(t("messages.saved"));
    },
    onError: () => {
      message.error(t("messages.error"));
    },
  });

  // Handle role toggle for a user
  const handleRoleToggle = (userId: string, roleId: string, checked: boolean) => {
    if (!selectedBranch || !roles) return;

    const currentRoleIds = branchRoleAssignments
      .filter((a: RoleAssignment) => a.console_branch_id === String(selectedBranchId))
      .map((a: RoleAssignment) => a.role.id);

    let newRoleIds: string[];
    if (checked) {
      newRoleIds = [...currentRoleIds, roleId];
    } else {
      newRoleIds = currentRoleIds.filter((id: string) => id !== roleId);
    }

    syncRolesMutation.mutate({ userId, roleIds: newRoleIds });
  };

  // Group permissions by group
  const groupedPermissions = useMemo(() => {
    if (!permissions) return {};
    return permissions.reduce(
      (acc, p) => {
        const group = p.group ?? "other";
        if (!acc[group]) acc[group] = [];
        acc[group].push(p);
        return acc;
      },
      {} as Record<string, Permission[]>
    );
  }, [permissions]);

  // Get effective permissions for selected user at selected branch
  const effectivePermissions = useMemo(() => {
    if (!branchRoleAssignments || !roles) return new Set<string>();

    const perms = new Set<string>();
    for (const assignment of branchRoleAssignments) {
      const role = roles.find((r: Role) => String(r.id) === assignment.role.id);
      // Role type doesn't have permissions, need to fetch separately or cast
      const roleWithPerms = role as Role & { permissions?: Array<{ slug?: string } | string> };
      if (roleWithPerms?.permissions) {
        for (const perm of roleWithPerms.permissions) {
          if (typeof perm === "string") {
            perms.add(perm);
          } else if (perm.slug) {
            perms.add(perm.slug);
          }
        }
      }
    }
    return perms;
  }, [branchRoleAssignments, roles]);

  // User columns
  const userColumns: ColumnsType<User> = [
    {
      title: t("common.name"),
      dataIndex: "name",
      key: "name",
      render: (name: string, record) => (
        <Space>
          <UserOutlined />
          <span>{name}</span>
          {record.id === selectedUserId && <Tag color="blue">Selected</Tag>}
        </Space>
      ),
    },
    {
      title: t("common.email"),
      dataIndex: "email",
      key: "email",
    },
    {
      title: t("common.actions"),
      key: "actions",
      width: 100,
      render: (_: unknown, record: User) => (
        <Button
          type={record.id === selectedUserId ? "primary" : "default"}
          size="small"
          onClick={() => setSelectedUserId(record.id)}
        >
          {t("admin.permissions.manage")}
        </Button>
      ),
    },
  ];

  const isLoading = branchesLoading || rolesLoading || usersLoading;

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <SafetyCertificateOutlined style={{ marginRight: 8 }} />
          {t("admin.permissions.branchTitle")}
        </Title>
        <Text type="secondary">{t("admin.permissions.branchDescription")}</Text>
      </div>

      {/* Branch Selector */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large" align="center">
          <Space>
            <BranchesOutlined style={{ fontSize: 20 }} />
            <Text strong>{t("admin.permissions.selectBranch")}:</Text>
          </Space>
          <Select
            style={{ width: 300 }}
            placeholder={t("admin.permissions.selectBranchPlaceholder")}
            value={selectedBranchId}
            onChange={(value) => {
              setSelectedBranchId(value);
              setSelectedUserId(null);
            }}
            loading={branchesLoading}
            options={branchesData?.branches?.map((branch: Branch) => ({
              value: branch.id,
              label: (
                <Space>
                  {branch.name}
                  {branch.is_headquarters && (
                    <Tag color="gold" style={{ marginLeft: 8 }}>
                      HQ
                    </Tag>
                  )}
                  {branch.is_primary && (
                    <Tag color="blue" style={{ marginLeft: 4 }}>
                      Primary
                    </Tag>
                  )}
                </Space>
              ),
            }))}
          />
          {selectedBranch && (
            <Tag color="green">
              {selectedBranch.code} - {selectedBranch.name}
            </Tag>
          )}
        </Space>
      </Card>

      {!selectedBranchId ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("admin.permissions.selectBranchFirst")}
        />
      ) : (
        <div style={{ display: "flex", gap: 24 }}>
          {/* Users List */}
          <Card
            title={
              <Space>
                <UserOutlined />
                {t("admin.permissions.users")}
              </Space>
            }
            style={{ flex: 1 }}
          >
            <Table
              columns={userColumns}
              dataSource={usersData?.data ?? []}
              loading={usersLoading}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 10 }}
              onRow={(record) => ({
                onClick: () => setSelectedUserId(record.id),
                style: {
                  cursor: "pointer",
                  backgroundColor: record.id === selectedUserId ? "#e6f7ff" : undefined,
                },
              })}
            />
          </Card>

          {/* Permissions Panel */}
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined />
                {t("admin.permissions.userPermissions")}
                {selectedUserId && (
                  <Tag color="blue">
                    {usersData?.data?.find((u) => u.id === selectedUserId)?.name}
                  </Tag>
                )}
              </Space>
            }
            style={{ flex: 1 }}
            extra={
              selectedUserId && (
                <Tooltip title={t("admin.permissions.scopeInfo")}>
                  <InfoCircleOutlined style={{ cursor: "pointer" }} />
                </Tooltip>
              )
            }
          >
            {!selectedUserId ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("admin.permissions.selectUserFirst")}
              />
            ) : assignmentsLoading ? (
              <Spin />
            ) : (
              <div>
                {/* Role assignments */}
                <div style={{ marginBottom: 16 }}>
                  <Text strong>{t("admin.permissions.assignedRoles")}:</Text>
                  <div style={{ marginTop: 8 }}>
                    {roles?.map((role: Role) => {
                      const assignment = branchRoleAssignments.find(
                        (a: RoleAssignment) => a.role.id === String(role.id)
                      );
                      const isAssigned = !!assignment;
                      const scope = assignment?.scope;

                      return (
                        <div key={role.id} style={{ marginBottom: 8 }}>
                          <Checkbox
                            checked={isAssigned}
                            onChange={(e) =>
                              handleRoleToggle(selectedUserId, String(role.id), e.target.checked)
                            }
                            disabled={syncRolesMutation.isPending}
                          >
                            <Space>
                              <span>{role.name}</span>
                              <Tag color="purple">Level {role.level}</Tag>
                              {scope && (
                                <Tag
                                  color={
                                    scope === "global"
                                      ? "red"
                                      : scope === "org-wide"
                                        ? "orange"
                                        : "green"
                                  }
                                >
                                  {getScopeLabel(scope, "vi")}
                                </Tag>
                              )}
                            </Space>
                          </Checkbox>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Divider />

                {/* Effective permissions */}
                <div>
                  <Text strong>{t("admin.permissions.effectivePermissions")}:</Text>
                  <div style={{ marginTop: 8 }}>
                    {Object.entries(groupedPermissions).map(([group, perms]) => (
                      <div key={group} style={{ marginBottom: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {group.toUpperCase()}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          {perms.map((perm) => {
                            const hasPermission = effectivePermissions.has(perm.slug);
                            return (
                              <Tag
                                key={perm.id}
                                color={hasPermission ? "green" : "default"}
                                style={{
                                  marginBottom: 4,
                                  opacity: hasPermission ? 1 : 0.5,
                                }}
                              >
                                {perm.name}
                              </Tag>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
