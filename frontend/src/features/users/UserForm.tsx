"use client";

import { Form, Input, Button, Space } from "antd";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { User } from "@/services/users";

// =============================================================================
// Types
// =============================================================================

interface UserFormProps {
  initialValues?: Partial<User>;
  onSubmit: (values: UserFormValues) => void;
  loading?: boolean;
}

export interface UserFormValues {
  name: string;
  email: string;
}

// =============================================================================
// Component
// =============================================================================

export function UserForm({ initialValues, onSubmit, loading }: UserFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [form] = Form.useForm<UserFormValues>();

  const handleFinish = (values: UserFormValues) => {
    onSubmit(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleFinish}
      style={{ maxWidth: 600 }}
    >
      <Form.Item
        label={t("nav.profile")}
        name="name"
        rules={[
          { required: true, message: t("validation.required", { field: t("nav.profile") }) },
          { max: 255, message: t("validation.maxLength", { field: t("nav.profile"), max: 255 }) },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label={t("auth.email")}
        name="email"
        rules={[
          { required: true, message: t("validation.required", { field: t("auth.email") }) },
          { type: "email", message: t("validation.email") },
        ]}
      >
        <Input type="email" />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {t("common.save")}
          </Button>
          <Button onClick={() => router.back()}>
            {t("common.cancel")}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
