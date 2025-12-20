import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Simple mock validation for MVP
        if (username === 'client' && password === 'demo') {
            // In a real app, you'd store a token here
            localStorage.setItem('isAuthenticated', 'true');
            navigate('/player');
        } else {
            setError(t('loginPage.invalidCredentials'));
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
                    type="text"
                    placeholder={t('loginPage.username')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
                />
                <input
                    type="password"
                    placeholder={t('loginPage.password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
                />
                <button type="submit" style={{
                    padding: '10px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}>
                    {t('loginPage.loginButton')}
                </button>
            </form>
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            <p style={{ marginTop: '20px', fontSize: '0.8em', color: '#64748b' }}>
                Hint: client / demo
            </p>
        </div>
    );
};

export default LoginPage;
