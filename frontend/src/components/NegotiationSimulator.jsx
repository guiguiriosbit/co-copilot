import React, { useState, useEffect } from 'react';
import { User, DollarSign, Check, X, Star, Car } from 'lucide-react';

const NegotiationSimulator = () => {
    const [negotiation, setNegotiation] = useState(null);
    const [counterPrice, setCounterPrice] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const data = localStorage.getItem('active_negotiation');
            if (data) {
                const parsed = JSON.parse(data);
                // Only update if something changed to avoid losing focus/local state
                if (JSON.stringify(parsed) !== JSON.stringify(negotiation)) {
                    setNegotiation(parsed);
                }
            } else {
                setNegotiation(null);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [negotiation]);

    const updateNegotiation = (updates) => {
        const newData = { ...negotiation, ...updates, lastUpdate: Date.now(), updatedBy: 'driver' };
        localStorage.setItem('active_negotiation', JSON.stringify(newData));
        setNegotiation(newData);
    };

    const handleAccept = () => {
        updateNegotiation({ status: 'accepted' });
    };

    const handleReject = () => {
        updateNegotiation({ status: 'rejected' });
        setTimeout(() => localStorage.removeItem('active_negotiation'), 2000);
    };

    const handleCounterOffer = () => {
        if (!counterPrice) return;
        updateNegotiation({
            price: `$${counterPrice}`,
            status: 'countered',
            message: `El conductor sugiere ${counterPrice}`
        });
        setCounterPrice('');
    };

    if (!negotiation) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h2 style={styles.title}>Simulador de Conductor</h2>
                    <div style={styles.emptyState}>
                        <div style={styles.pulse}></div>
                        <p>Esperando ofertas de pasajeros...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <h2 style={styles.title}>¡Nueva Oferta!</h2>
                    <div style={styles.statusBadge}>{negotiation.status.toUpperCase()}</div>
                </div>

                <div style={styles.passengerInfo}>
                    <div style={styles.avatar}>
                        <User size={30} color="white" />
                    </div>
                    <div>
                        <div style={styles.name}>Pasajero Interesado</div>
                        <div style={styles.rating}>
                            <Star size={14} fill="#facc15" color="#facc15" /> 4.9 (124 viajes)
                        </div>
                    </div>
                </div>

                <div style={styles.offerSection}>
                    <div style={styles.label}>Oferta Actual</div>
                    <div style={styles.price}>{negotiation.price}</div>
                </div>

                {negotiation.status === 'pending' || negotiation.status === 'accepted_by_passenger' ? (
                    <div style={styles.actions}>
                        <button onClick={handleAccept} style={styles.acceptButton}>
                            <Check size={20} /> Aceptar Oferta
                        </button>

                        <div style={styles.counterGroup}>
                            <input
                                type="number"
                                placeholder="Tu precio"
                                value={counterPrice}
                                onChange={(e) => setCounterPrice(e.target.value)}
                                style={styles.input}
                            />
                            <button onClick={handleCounterOffer} style={styles.counterButton}>
                                Contra-oferta
                            </button>
                        </div>

                        <button onClick={handleReject} style={styles.rejectButton}>
                            <X size={20} /> Rechazar
                        </button>
                    </div>
                ) : negotiation.status === 'accepted' ? (
                    <div style={styles.successState}>
                        <Check size={40} color="#10b981" />
                        <h3>¡Viaje Confirmado!</h3>
                        <p>Ve a recoger al pasajero.</p>
                        <button onClick={() => localStorage.removeItem('active_negotiation')} style={styles.resetButton}>
                            Terminar Viaje
                        </button>
                    </div>
                ) : (
                    <div style={styles.waitingState}>
                        <p>Esperando respuesta del pasajero...</p>
                        <button onClick={handleReject} style={styles.rejectButton}>
                            Cancelar Negociación
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        width: '100vw', height: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', sans-serif", padding: '20px'
    },
    card: {
        width: '100%', maxWidth: '400px',
        backgroundColor: '#1e293b', borderRadius: '24px', padding: '30px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)'
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
    title: { color: 'white', margin: 0, fontSize: '1.5rem' },
    statusBadge: {
        backgroundColor: '#38bdf8', color: '#0f172a',
        padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold'
    },
    passengerInfo: { display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '30px' },
    avatar: { width: '50px', height: '50px', backgroundColor: '#334155', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    name: { color: 'white', fontWeight: 'bold', fontSize: '1.1rem' },
    rating: { color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' },
    offerSection: {
        backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '20px', borderRadius: '16px',
        textAlign: 'center', marginBottom: '30px', border: '1px dashed #38bdf8'
    },
    label: { color: '#38bdf8', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px' },
    price: { color: 'white', fontSize: '2.5rem', fontWeight: 'bold' },
    actions: { display: 'flex', flexDirection: 'column', gap: '12px' },
    acceptButton: {
        backgroundColor: '#10b981', color: 'white', border: 'none',
        padding: '16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
    },
    counterGroup: { display: 'flex', gap: '10px' },
    input: {
        flex: 1, backgroundColor: '#0f172a', border: '1px solid #334155',
        borderRadius: '12px', padding: '12px', color: 'white', outline: 'none'
    },
    counterButton: {
        backgroundColor: '#f59e0b', color: 'white', border: 'none',
        padding: '12px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'
    },
    rejectButton: {
        backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444',
        padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
        marginTop: '10px'
    },
    emptyState: { textAlign: 'center', padding: '50px 0', color: '#94a3b8' },
    pulse: {
        width: '15px', height: '15px', backgroundColor: '#38bdf8', borderRadius: '50%',
        margin: '0 auto 20px', animation: 'pulse 2s infinite'
    },
    successState: { textAlign: 'center', color: 'white' },
    resetButton: {
        marginTop: '20px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none',
        padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'
    },
    waitingState: { textAlign: 'center', color: '#94a3b8', padding: '20px' }
};

export default NegotiationSimulator;
