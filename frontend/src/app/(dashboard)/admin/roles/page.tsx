"use client";

import { useState } from "react";
import { Button, Table, Space, Typography, App, Modal, Tag, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ColumnsType } from "antd/es/table";
import { roleService } from "@/services/roles";
import { queryKeys } from "@/lib/queryKeys";
import type { Role } from "@famgia/omnify-react-sso";

const { Title } = Typography;

// System roles cannot be deleted
const SYSTEM_ROLES = ["admin", "manager", "member"];

export default function RolesPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Helper to safely get id as string (handles both string and number ids)
  const getIdAsString = (id: string | number): string => String(id);

  // Fetch roles
  const { data: roles, isLoading } = useQuery({
    queryKey: queryKeys.sso.roles.all,
    queryFn: roleService.list,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: roleService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sso.roles.all });
      message.success(t("messages.deleted"));
      setDeleteId(null);
    },
    onError: (error: any) => {
      if (error.response?.data?.error === "CANNOT_DELETE_SYSTEM_ROLE") {
        message.error(t("admin.roles.cannotDeleteSystem"));
      } else {
        message.error(t("messages.error"));
      }
      setDeleteId(null);
    },
  });

  const handleDelete = (role: Role) => {
    if (SYSTEM_ROLES.includes(role.slug)) {
      message.warning(t("admin.roles.cannotDeleteSystem"));
      return;
    }

    modal.confirm({
      title: t("messages.confirmDelete"),
      content: `${t("admin.roles.role")}: ${role.name}`,
      okText: t("common.delete"),
      okType: "danger",
      cancelText: t("common.cancel"),
      onOk: () => {
        const id = getIdAsString(role.id);
        setDeleteId(id);
        deleteMutation.mutate(id);
      },
    });
  };

  const columns: ColumnsType<Role> = [
    {
      title: t("admin.roles.name"),
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Role) => (
        <Space>
          {name}
          {SYSTEM_ROLES.includes(record.slug) && (
            <Tooltip title={t("admin.roles.systemRole")}>
              <LockOutlined style={{ color: "#999" }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: t("admin.roles.slug"),
      dataIndex: "slug",
      key: "slug",
      render: (slug: string) => <Tag>{slug}</Tag>,
    },
    {
      title: t("admin.roles.level"),
      dataIndex: "level",
      key: "level",
      width: 100,
      align: "center",
      sorter: (a, b) => a.level - b.level,
    },
    {
      title: t("admin.roles.permissionsCount"),
      dataIndex: "permissions_count",
      key: "permissions_count",
      width: 120,
      align: "center",
      render: (count: number, record: Role) => (
        <Link href={`/admin/roles/${getIdAsString(record.id)}/permissions`}>
          <Tag color="blue">{count ?? 0}</Tag>
        </Link>
      ),
    },
    {
      title: t("common.actions"),
      key: "actions",
      width: 150,
      render: (_: any, record: Role) => (
        <Space>
          <Link href={`/admin/roles/${getIdAsString(record.id)}/edit`}>
            <Button type="text" icon={<EditOutlined />} size="small" />
          </Link>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record)}
            loading={deleteId === getIdAsString(record.id)}
            disabled={SYSTEM_ROLES.includes(record.slug)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          {t("admin.roles.title")}
        </Title>
        <Link href="/admin/roles/new">
          <Button type="primary" icon={<PlusOutlined />}>
            {t("common.create")}
          </Button>
        </Link>
      </div>

      <Table
        columns={columns}
        dataSource={roles ?? []}
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
}
