"use client";

import { useState } from "react";
import { Button, Table, Space, Typography, App, Tag, Input } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ColumnsType } from "antd/es/table";
import { permissionService } from "@/services/permissions";
import { queryKeys } from "@/lib/queryKeys";
import type { Permission } from "@famgia/omnify-react-sso";

const { Title } = Typography;

export default function PermissionsPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Helper to safely get id as string (handles both string and number ids)
  const getIdAsString = (id: string | number): string => String(id);
  const [searchText, setSearchText] = useState("");

  // Fetch permissions
  const { data: permissions, isLoading } = useQuery({
    queryKey: queryKeys.sso.permissions.all,
    queryFn: permissionService.list,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: permissionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sso.permissions.all });
      message.success(t("messages.deleted"));
      setDeleteId(null);
    },
    onError: () => {
      message.error(t("messages.error"));
      setDeleteId(null);
    },
  });

  const handleDelete = (permission: Permission) => {
    modal.confirm({
      title: t("messages.confirmDelete"),
      content: `${t("admin.permissions.permission")}: ${permission.name}`,
      okText: t("common.delete"),
      okType: "danger",
      cancelText: t("common.cancel"),
      onOk: () => {
        const id = getIdAsString(permission.id);
        setDeleteId(id);
        deleteMutation.mutate(id);
      },
    });
  };

  // Filter permissions by search text
  const filteredPermissions = permissions?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchText.toLowerCase()) ||
      (p.group ?? "").toLowerCase().includes(searchText.toLowerCase())
  );

  // Group permissions by group
  const groupedPermissions = filteredPermissions?.reduce(
    (acc, p) => {
      const group = p.group ?? "other";
      if (!acc[group]) acc[group] = [];
      acc[group].push(p);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  const columns: ColumnsType<Permission> = [
    {
      title: t("admin.permissions.name"),
      dataIndex: "name",
      key: "name",
    },
    {
      title: t("admin.permissions.slug"),
      dataIndex: "slug",
      key: "slug",
      render: (slug: string) => <Tag color="geekblue">{slug}</Tag>,
    },
    {
      title: t("admin.permissions.group"),
      dataIndex: "group",
      key: "group",
      render: (group: string | null) =>
        group ? <Tag color="purple">{group}</Tag> : <Tag>-</Tag>,
      filters: Object.keys(groupedPermissions ?? {}).map((g) => ({
        text: g,
        value: g,
      })),
      onFilter: (value, record) => (record.group ?? "other") === value,
    },
    {
      title: t("common.actions"),
      key: "actions",
      width: 120,
      render: (_: any, record: Permission) => (
        <Space>
          <Link href={`/admin/permissions/${getIdAsString(record.id)}/edit`}>
            <Button type="text" icon={<EditOutlined />} size="small" />
          </Link>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record)}
            loading={deleteId === getIdAsString(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          {t("admin.permissions.title")}
        </Title>
        <Space>
          <Input
            placeholder={t("common.search")}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            allowClear
          />
          <Link href="/admin/permissions/new">
            <Button type="primary" icon={<PlusOutlined />}>
              {t("common.create")}
            </Button>
          </Link>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredPermissions ?? []}
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
}
