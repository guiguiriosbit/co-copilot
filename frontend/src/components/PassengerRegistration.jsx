import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaMapMarkerAlt, FaPhone, FaEnvelope, FaLocationArrow } from 'react-icons/fa';

const PassengerRegistration = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        address: '',
        cellphone: '',
        email: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await fetch('http://localhost:3001/api/passenger/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: '¡Registro exitoso! Redirigiendo...' });
                setFormData({ fullName: '', address: '', cellphone: '', email: '' });
                setTimeout(() => {
                    navigate('/tracking');
                }, 2000);
            } else {
                setStatus({ type: 'error', message: data.error || 'Error al registrar' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Error de conexión' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.container}>
            <div className="unified-card" style={styles.card}>
                <h2 style={styles.title}>Registro de Pasajero</h2>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <FaUser style={styles.icon} />
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Nombres Completos"
                            value={formData.fullName}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <FaMapMarkerAlt style={styles.icon} />
                        <input
                            type="text"
                            name="address"
                            placeholder="Dirección"
                            value={formData.address}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <FaPhone style={styles.icon} />
                        <input
                            type="tel"
                            name="cellphone"
                            placeholder="Celular"
                            value={formData.cellphone}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <FaEnvelope style={styles.icon} />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        style={{ ...styles.button, opacity: isSubmitting ? 0.7 : 1 }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Registrando...' : 'Registrar'}
                    </button>
                </form>

                {status.message && (
                    <div style={{
                        ...styles.message,
                        backgroundColor: status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: status.type === 'success' ? '#34d399' : '#f87171',
                        border: `1px solid ${status.type === 'success' ? '#059669' : '#dc2626'}`
                    }}>
                        {status.message}
                    </div>
                )}

                <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{ ...styles.button, backgroundColor: '#38bdf8', color: '#0f172a', width: '100%', padding: '12px' }}
                    >
                        <FaLocationArrow style={{ marginRight: '8px' }} /> Buscar Vehículos Cercanos
                    </button>
                    <button
                        onClick={() => navigate('/tracking')}
                        style={{ ...styles.button, backgroundColor: '#1e293b', color: 'white', width: '100%', padding: '12px' }}
                    >
                        <FaLocationArrow style={{ marginRight: '8px' }} /> Mi Mapa de Seguimiento
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--primary-color)',
        padding: '20px'
    },
    card: {
        width: '100%',
        maxWidth: '500px',
        animation: 'slideUp 0.5s ease-out'
    },
    title: {
        color: 'var(--accent-color)',
        textAlign: 'center',
        marginBottom: '1.5rem',
        fontSize: '1.8rem'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2rem'
    },
    inputGroup: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    icon: {
        position: 'absolute',
        left: '15px',
        color: '#94a3b8',
        fontSize: '1.1rem'
    },
    input: {
        width: '100%',
        padding: '12px 12px 12px 45px',
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '8px',
        color: 'white',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.2s'
    },
    button: {
        padding: '12px',
        backgroundColor: 'var(--accent-color)',
        color: 'var(--primary-color)',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '1rem',
        transition: 'transform 0.1s'
    },
    message: {
        marginTop: '1rem',
        padding: '10px',
        borderRadius: '8px',
        textAlign: 'center',
        fontSize: '0.95rem'
    }
};

export default PassengerRegistration;
