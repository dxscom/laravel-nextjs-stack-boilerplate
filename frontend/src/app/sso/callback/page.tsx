'use client';

import { SsoCallback } from '@famgia/omnify-react-sso';
import { Spin, Alert, Button, Typography, Space } from 'antd';
import { ReloadOutlined, HomeOutlined, BugOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

function LoadingComponent() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            gap: '1rem'
        }}>
            <Spin size="large" />
            <div>Authenticating...</div>
        </div>
    );
}

function parseErrorMessage(error: Error): { title: string; description: string; suggestion: string } {
    const message = error.message || 'Unknown error';

    // API 500 error
    if (message.includes('500') || message.includes('Server Error')) {
        return {
            title: 'Backend Server Error',
            description: 'The backend API returned a server error (500).',
            suggestion: 'Please check if the backend server is running and properly configured. Run "php artisan serve" or check Laravel logs.',
        };
    }

    // Network/connection error
    if (message.includes('fetch') || message.includes('network') || message.includes('ECONNREFUSED')) {
        return {
            title: 'Connection Failed',
            description: 'Cannot connect to the backend API server.',
            suggestion: 'Make sure the backend server is running at the configured API URL.',
        };
    }

    // CORS error
    if (message.includes('CORS') || message.includes('cross-origin')) {
        return {
            title: 'CORS Error',
            description: 'Cross-Origin request blocked by the backend.',
            suggestion: 'Check the backend CORS configuration in config/cors.php.',
        };
    }

    // Invalid code
    if (message.includes('invalid') && message.includes('code')) {
        return {
            title: 'Invalid SSO Code',
            description: 'The SSO authorization code is invalid or expired.',
            suggestion: 'Please try logging in again.',
        };
    }

    // Default
    return {
        title: 'Authentication Failed',
        description: message,
        suggestion: 'Please try again or contact support if the problem persists.',
    };
}

function ErrorComponent(error: Error) {
    const { title, description, suggestion } = parseErrorMessage(error);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '2rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
                <Alert
                    title={title}
                    description={
                        <Space orientation="vertical" style={{ width: '100%' }}>
                            <Text>{description}</Text>
                            <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: '0.5rem' }}>
                                <BugOutlined /> {suggestion}
                            </Paragraph>
                        </Space>
                    }
                    type="error"
                    showIcon
                    style={{ marginBottom: '1.5rem' }}
                />

                <Space style={{ width: '100%', justifyContent: 'center' }}>
                    <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={() => window.location.href = '/'}
                    >
                        Try Again
                    </Button>
                    <Button
                        icon={<HomeOutlined />}
                        onClick={() => window.location.href = '/'}
                    >
                        Return Home
                    </Button>
                </Space>

                <details style={{ marginTop: '1.5rem' }}>
                    <summary style={{ cursor: 'pointer', color: '#999', fontSize: '12px' }}>
                        Technical Details
                    </summary>
                    <pre style={{
                        marginTop: '0.5rem',
                        padding: '1rem',
                        background: '#f5f5f5',
                        borderRadius: '4px',
                        fontSize: '11px',
                        overflow: 'auto',
                        maxHeight: '150px',
                    }}>
                        {error.message}
                        {error.stack && `\n\nStack:\n${error.stack}`}
                    </pre>
                </details>
            </div>
        </div>
    );
}

export default function SsoCallbackPage() {
    return (
        <SsoCallback
            redirectTo="/dashboard"
            loadingComponent={<LoadingComponent />}
            errorComponent={ErrorComponent}
            onSuccess={(user, orgs) => {
                console.log('[SSO] Login success:', user.email, 'orgs:', orgs.length);
            }}
            onError={(error) => {
                console.error('[SSO] Login error:', error);
            }}
        />
    );
}
