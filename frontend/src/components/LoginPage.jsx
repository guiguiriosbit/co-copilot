import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const requestFullscreen = () => {
        const element = document.documentElement;
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (res.ok && data.ok) {
                requestFullscreen();
                localStorage.setItem('isAuthenticated', 'true');
                navigate('/select-profile');
            } else {
                setError(data.error || t('loginPage.invalidCredentials'));
            }
        } catch (err) {
            setError('Error conectando con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#0f172a',
            color: 'white'
        }}>
            <h1>{t('loginPage.title')}</h1>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>{t('loginPage.subtitle')}</p>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '300px' }}>
                <input
                    type="password"
                    placeholder={t('loginPage.password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: '10px', borderRadius: '5px', border: 'none', fontSize: '1rem' }}
                />
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: '10px',
                        background: loading ? '#1e40af' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                    }}
                >
                    {loading ? 'Verificando...' : t('loginPage.loginButton')}
                </button>
            </form>
            {error && <p style={{ color: '#f87171', marginTop: '10px' }}>{error}</p>}
        </div>
    );
};

export default LoginPage;
