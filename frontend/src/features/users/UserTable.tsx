"use client";

import { Table, Space, Button, Popconfirm, Tag } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { FilterValue, SorterResult } from "antd/es/table/interface";
import type { User, UserListParams } from "@/services/users";

// =============================================================================
// Types
// =============================================================================

interface UserTableProps {
  users: User[];
  loading: boolean;
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  sortField?: UserListParams["sort"];
  onPageChange: (page: number, pageSize: number) => void;
  onSortChange: (sort: UserListParams["sort"]) => void;
  onDelete: (user: User) => void;
  deleteLoading: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function UserTable({
  users,
  loading,
  pagination,
  sortField,
  onPageChange,
  onSortChange,
  onDelete,
  deleteLoading,
}: UserTableProps) {
  const t = useTranslations();

  const columns: ColumnsType<User> = [
    {
      title: t("auth.email"),
      dataIndex: "email",
      key: "email",
      sorter: true,
      sortOrder: sortField?.field === "email" ? (sortField.order === "asc" ? "ascend" : "descend") : undefined,
    },
    {
      title: t("nav.profile"),
      dataIndex: "name",
      key: "name",
      sorter: true,
      sortOrder: sortField?.field === "name" ? (sortField.order === "asc" ? "ascend" : "descend") : undefined,
    },
    {
      title: "SSO",
      dataIndex: "console_user_id",
      key: "sso",
      width: 100,
      render: (value: string | null) =>
        value ? <Tag color="green">SSO</Tag> : <Tag color="default">Local</Tag>,
    },
    {
      title: t("common.actions"),
      key: "actions",
      width: 120,
      render: (_: unknown, record: User) => (
        <Space>
          <Link href={`/users/${record.id}/edit`}>
            <Button type="text" icon={<EditOutlined />} size="small" />
          </Link>
          <Popconfirm
            title={t("messages.confirmDelete")}
            onConfirm={() => onDelete(record)}
            okText={t("common.yes")}
            cancelText={t("common.no")}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              loading={deleteLoading}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleTableChange = (
    paginationConfig: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<User> | SorterResult<User>[]
  ) => {
    // Handle pagination
    if (paginationConfig.current && paginationConfig.pageSize) {
      onPageChange(paginationConfig.current, paginationConfig.pageSize);
    }

    // Handle sorting (sorter can be array for multi-column sort)
    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    if (singleSorter?.field) {
      onSortChange({
        field: singleSorter.field as string,
        order: singleSorter.order === "ascend" ? "asc" : "desc",
      });
    } else {
      onSortChange(undefined);
    }
  };

  return (
    <Table
      columns={columns}
      dataSource={users}
      loading={loading}
      rowKey="id"
      onChange={handleTableChange}
      pagination={
        pagination
          ? {
            current: pagination.current_page,
            pageSize: pagination.per_page,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `${total} ${t("nav.users").toLowerCase()}`,
          }
          : false
      }
    />
  );
}
