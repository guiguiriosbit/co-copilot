import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileSelectionPage = () => {
    const navigate = useNavigate();

    const profiles = [
        {
            id: 'admin',
            title: 'Administrador',
            subtitle: 'Gestión de negocios y bucles de video',
            icon: '⚙️',
            path: '/admin',
            color: '#38bdf8'
        },
        {
            id: 'player',
            title: 'Reproductor',
            subtitle: 'Visualización de anuncios y contenido en vivo',
            icon: '📺',
            path: '/player',
            color: '#22c55e'
        },
        {
            id: 'analytics',
            title: 'Analytics',
            subtitle: 'Métricas de impresiones y rendimiento',
            icon: '📊',
            path: '/analytics',
            color: '#a78bfa'
        }
    ];

    const logout = () => {
        localStorage.removeItem('isAuthenticated');
        navigate('/');
    };

    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f172a',
        color: 'white',
        fontFamily: "'Inter', sans-serif",
        padding: '20px'
    };

    const gridStyle = {
        display: 'flex',
        gap: '25px',
        marginTop: '40px',
        flexWrap: 'wrap',
        justifyContent: 'center'
    };

    const cardStyle = (color) => ({
        background: '#1e293b',
        border: `2px solid #334155`,
        borderRadius: '20px',
        padding: '40px',
        width: '300px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px'
    });

    const iconStyle = {
        fontSize: '4rem',
        marginBottom: '10px'
    };

    const handleHover = (e, color, isEnter) => {
        if (isEnter) {
            e.currentTarget.style.borderColor = color;
            e.currentTarget.style.transform = 'translateY(-10px)';
            e.currentTarget.style.boxShadow = `0 10px 30px ${color}44`;
        } else {
            e.currentTarget.style.borderColor = '#334155';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
        }
    };

    return (
        <div style={containerStyle}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Bienvenido a Commercial Copilot</h1>
                <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>Selecciona tu perfil para continuar</p>
            </div>

            <div style={gridStyle}>
                {profiles.map(profile => (
                    <div
                        key={profile.id}
                        style={cardStyle(profile.color)}
                        onMouseEnter={(e) => handleHover(e, profile.color, true)}
                        onMouseLeave={(e) => handleHover(e, profile.color, false)}
                        onClick={() => navigate(profile.path)}
                    >
                        <div style={iconStyle}>{profile.icon}</div>
                        <h2 style={{ margin: 0 }}>{profile.title}</h2>
                        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>{profile.subtitle}</p>
                        <div style={{
                            marginTop: '10px',
                            padding: '8px 20px',
                            background: profile.color,
                            color: '#0f172a',
                            borderRadius: '50px',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                        }}>
                            Ingresar
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={logout}
                style={{
                    marginTop: '50px',
                    background: 'transparent',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    padding: '10px 25px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}
            >
                Cerrar Sesión
            </button>
        </div>
    );
};

export default ProfileSelectionPage;
