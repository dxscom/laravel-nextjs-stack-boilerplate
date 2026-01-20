'use client';

import {
    Card,
    Typography,
    Row,
    Col,
    Statistic,
    Button,
    Avatar,
    Space,
    Descriptions,
    Table,
    Tag,
    Spin,
    Alert,
    Collapse,
    Badge,
    Select,
} from 'antd';
import {
    UserOutlined,
    LogoutOutlined,
    TeamOutlined,
    MailOutlined,
    SafetyOutlined,
    KeyOutlined,
    CrownOutlined,
    IdcardOutlined,
    BankOutlined,
    HomeOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { useSso } from '@famgia/omnify-client-sso-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ssoService, branchService, Role, Permission, Branch } from '@/lib/ssoService';
import { queryKeys } from '@/lib/queryKeys';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

/**
 * Dashboard page - SSO認証後のメインページ
 */
export default function DashboardPage() {
    const { user, organizations, currentOrg, isLoading, isAuthenticated, logout, globalLogout, switchOrg } = useSso();
    const router = useRouter();
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

    // Fetch roles
    const {
        data: rolesData,
        isLoading: rolesLoading,
        error: rolesError,
    } = useQuery({
        queryKey: queryKeys.sso.roles.list(),
        queryFn: () => ssoService.getRoles(),
        enabled: isAuthenticated,
    });

    // Fetch permissions
    const {
        data: permissionsData,
        isLoading: permissionsLoading,
        error: permissionsError,
    } = useQuery({
        queryKey: queryKeys.sso.permissions.list(),
        queryFn: () => ssoService.getPermissions(),
        enabled: isAuthenticated,
    });

    // Fetch permission matrix
    const { data: matrixData, isLoading: matrixLoading } = useQuery({
        queryKey: queryKeys.sso.permissions.matrix(),
        queryFn: () => ssoService.getPermissionMatrix(),
        enabled: isAuthenticated,
    });

    // Fetch branches
    const {
        data: branchesData,
        isLoading: branchesLoading,
        error: branchesError,
    } = useQuery({
        queryKey: queryKeys.sso.branches.list(currentOrg?.slug),
        queryFn: () => branchService.getBranches(currentOrg?.slug),
        enabled: isAuthenticated && !!currentOrg?.slug,
    });

    const roles = rolesData?.data ?? [];
    const permissions = permissionsData?.data ?? [];
    const branches = branchesData?.branches ?? [];
    const primaryBranchId = branchesData?.primary_branch_id;
    const allBranchesAccess = branchesData?.all_branches_access ?? false;

    // Set initial selected branch to primary
    useEffect(() => {
        if (primaryBranchId && !selectedBranchId) {
            setSelectedBranchId(primaryBranchId);
        }
    }, [primaryBranchId, selectedBranchId]);

    // Group permissions by group
    const permissionsByGroup = permissions.reduce(
        (acc, perm) => {
            const group = perm.group || 'other';
            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push(perm);
            return acc;
        },
        {} as Record<string, Permission[]>
    );

    // 未認証の場合はホームにリダイレクト
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    // Role columns
    const roleColumns: ColumnsType<Role> = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (name, record) => (
                <Space>
                    <CrownOutlined style={{ color: getRoleLevelColor(record.level) }} />
                    <Text strong>{name}</Text>
                </Space>
            ),
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            render: (slug) => <Tag>{slug}</Tag>,
        },
        {
            title: 'Level',
            dataIndex: 'level',
            key: 'level',
            sorter: (a, b) => b.level - a.level,
            render: (level) => (
                <Badge
                    count={level}
                    style={{ backgroundColor: getRoleLevelColor(level) }}
                    overflowCount={9999}
                />
            ),
        },
        {
            title: 'Permissions',
            key: 'permissions',
            render: (_, record) => {
                const permCount = matrixData?.matrix[record.id]?.length ?? 0;
                return <Tag color="blue">{permCount} permissions</Tag>;
            },
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (desc) => desc || <Text type="secondary">-</Text>,
        },
    ];

    // Permission columns
    const permissionColumns: ColumnsType<Permission> = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (name) => (
                <Space>
                    <KeyOutlined />
                    <Text>{name}</Text>
                </Space>
            ),
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            render: (slug) => <Tag color="green">{slug}</Tag>,
        },
        {
            title: 'Group',
            dataIndex: 'group',
            key: 'group',
            render: (group) =>
                group ? <Tag color="purple">{group}</Tag> : <Text type="secondary">-</Text>,
        },
    ];

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Dashboard</Title>
                <Space>
                    <Button icon={<LogoutOutlined />} onClick={() => logout()}>
                        Logout
                    </Button>
                    <Button type="primary" danger icon={<LogoutOutlined />} onClick={() => globalLogout('/')}>
                        Global Logout
                    </Button>
                </Space>
            </div>

            {/* User Info Card */}
            <Card title="User Information" style={{ marginBottom: 24 }}>
                <Space size="large">
                    <Avatar size={64} icon={<UserOutlined />} />
                    <Descriptions column={2} size="small">
                        <Descriptions.Item label={<Space><MailOutlined />Email</Space>}>
                            {user.email}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Space><UserOutlined />Name</Space>}>
                            {user.name || 'Not set'}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Space><IdcardOutlined />Console User ID</Space>}>
                            {user.consoleUserId}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Space><TeamOutlined />Current Org</Space>}>
                            {currentOrg?.name || 'None'}
                        </Descriptions.Item>
                    </Descriptions>
                </Space>
            </Card>

            {/* Stats - Full width 5 columns */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={4}>
                    <Card>
                        <Statistic
                            title="Organizations"
                            value={organizations.length}
                            prefix={<TeamOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={5}>
                    <Card>
                        <Statistic
                            title="Branches"
                            value={branches.length}
                            prefix={<BankOutlined />}
                            loading={branchesLoading}
                            suffix={allBranchesAccess ? <Tag color="green" style={{ marginLeft: 8 }}>All</Tag> : null}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={5}>
                    <Card>
                        <Statistic
                            title="Roles"
                            value={roles.length}
                            prefix={<CrownOutlined />}
                            loading={rolesLoading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={5}>
                    <Card>
                        <Statistic
                            title="Permissions"
                            value={permissions.length}
                            prefix={<KeyOutlined />}
                            loading={permissionsLoading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={5}>
                    <Card>
                        <Statistic
                            title="Permission Groups"
                            value={Object.keys(permissionsByGroup).length}
                            prefix={<SafetyOutlined />}
                            loading={permissionsLoading}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Organizations */}
            <Card
                title={<Space><TeamOutlined />Your Organizations</Space>}
                style={{ marginBottom: 24 }}
            >
                {organizations.length > 0 ? (
                    <Row gutter={[16, 16]}>
                        {organizations.map((org) => (
                            <Col key={org.id} xs={24} sm={12} lg={8}>
                                <Card
                                    size="small"
                                    style={{
                                        borderColor: currentOrg?.id === org.id ? '#1890ff' : undefined,
                                        backgroundColor: currentOrg?.id === org.id ? '#e6f7ff' : undefined,
                                    }}
                                >
                                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <div>
                                            <Text strong>{org.name}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                Org Role: <Tag>{org.orgRole}</Tag>
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                Service Role: <Tag>{org.serviceRole}</Tag>
                                            </Text>
                                        </div>
                                        {currentOrg?.id !== org.id && (
                                            <Button size="small" onClick={() => switchOrg(org.slug)}>
                                                Switch
                                            </Button>
                                        )}
                                    </Space>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Text type="secondary">No organizations found</Text>
                )}
            </Card>

            {/* Branches */}
            <Card
                title={<Space><BankOutlined />Branches</Space>}
                extra={
                    <Space>
                        {allBranchesAccess && <Tag color="green">All Branches Access</Tag>}
                        <Select
                            placeholder="Select Branch"
                            style={{ width: 200 }}
                            value={selectedBranchId}
                            onChange={setSelectedBranchId}
                            loading={branchesLoading}
                            options={branches.map((branch) => ({
                                value: branch.id,
                                label: (
                                    <Space>
                                        {branch.is_headquarters && <HomeOutlined style={{ color: '#faad14' }} />}
                                        {branch.name}
                                        {branch.is_primary && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                    </Space>
                                ),
                            }))}
                        />
                    </Space>
                }
                style={{ marginBottom: 24 }}
            >
                {branchesError ? (
                    <Alert
                        type="error"
                        message="Failed to load branches"
                        description="Could not fetch branches for this organization."
                    />
                ) : branchesLoading ? (
                    <Spin />
                ) : branches.length > 0 ? (
                    <Row gutter={[16, 16]}>
                        {branches.map((branch) => (
                            <Col key={branch.id} xs={24} sm={12} lg={8}>
                                <Card
                                    size="small"
                                    style={{
                                        borderColor: selectedBranchId === branch.id ? '#1890ff' : undefined,
                                        backgroundColor: selectedBranchId === branch.id ? '#e6f7ff' : undefined,
                                    }}
                                    onClick={() => setSelectedBranchId(branch.id)}
                                    hoverable
                                >
                                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <div>
                                            <Space>
                                                <BankOutlined />
                                                <Text strong>{branch.name}</Text>
                                                {branch.is_headquarters && (
                                                    <Tag color="gold" icon={<HomeOutlined />}>HQ</Tag>
                                                )}
                                                {branch.is_primary && (
                                                    <Tag color="green" icon={<CheckCircleOutlined />}>Primary</Tag>
                                                )}
                                            </Space>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                Code: <Tag>{branch.code}</Tag>
                                            </Text>
                                            {branch.access_type === 'implicit' && (
                                                <Tag color="blue" style={{ marginLeft: 4 }}>Implicit</Tag>
                                            )}
                                        </div>
                                    </Space>
                                    {(branch.timezone || branch.currency || branch.locale) && (
                                        <div style={{ marginTop: 8 }}>
                                            {branch.timezone && <Tag>{branch.timezone}</Tag>}
                                            {branch.currency && <Tag>{branch.currency}</Tag>}
                                            {branch.locale && <Tag>{branch.locale}</Tag>}
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Text type="secondary">No branches found for this organization</Text>
                )}
            </Card>

            {/* Roles */}
            <Card
                title={<Space><CrownOutlined />All Roles</Space>}
                style={{ marginBottom: 24 }}
            >
                {rolesError ? (
                    <Alert
                        type="error"
                        message="Failed to load roles"
                        description="You may not have permission to view roles."
                    />
                ) : (
                    <Table
                        columns={roleColumns}
                        dataSource={roles}
                        rowKey="id"
                        loading={rolesLoading || matrixLoading}
                        pagination={false}
                        size="small"
                    />
                )}
            </Card>

            {/* Permissions by Group */}
            <Card title={<Space><KeyOutlined />All Permissions</Space>}>
                {permissionsError ? (
                    <Alert
                        type="error"
                        message="Failed to load permissions"
                        description="You may not have permission to view permissions."
                    />
                ) : permissionsLoading ? (
                    <Spin />
                ) : (
                    <Collapse
                        items={Object.entries(permissionsByGroup).map(([group, perms]) => ({
                            key: group,
                            label: (
                                <Space>
                                    <Tag color="purple">{group}</Tag>
                                    <Text type="secondary">({perms.length} permissions)</Text>
                                </Space>
                            ),
                            children: (
                                <Table
                                    columns={permissionColumns}
                                    dataSource={perms}
                                    rowKey="id"
                                    pagination={false}
                                    size="small"
                                />
                            ),
                        }))}
                        defaultActiveKey={Object.keys(permissionsByGroup).slice(0, 2)}
                    />
                )}
            </Card>
        </div>
    );
}

// Helper function to get color based on role level
function getRoleLevelColor(level: number): string {
    if (level >= 100) return '#f5222d'; // Admin - Red
    if (level >= 50) return '#fa8c16'; // Manager - Orange
    if (level >= 30) return '#1890ff'; // Editor - Blue
    return '#52c41a'; // Member - Green
}
