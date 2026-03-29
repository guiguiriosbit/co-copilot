import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ label, value, color = '#3b82f6', sub }) => (
    <div style={{
        background: '#1e293b',
        border: `1px solid ${color}33`,
        borderRadius: '16px',
        padding: '24px',
        flex: '1 1 160px',
        minWidth: '160px',
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '2.5rem', fontWeight: '800', color }}>{value ?? '—'}</div>
        <div style={{ color: '#94a3b8', marginTop: '6px', fontSize: '0.9rem' }}>{label}</div>
        {sub && <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>{sub}</div>}
    </div>
);

const Bar = ({ label, value, max, color = '#3b82f6' }) => (
    <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#cbd5e1', fontSize: '0.85rem', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{value}</span>
        </div>
        <div style={{ background: '#0f172a', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
            <div style={{
                width: max > 0 ? `${Math.round((value / max) * 100)}%` : '0%',
                background: color,
                height: '100%',
                borderRadius: '999px',
                transition: 'width 0.6s ease'
            }} />
        </div>
    </div>
);

const AnalyticsPage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/analytics/impressions');
            if (!res.ok) throw new Error('Failed to load');
            const json = await res.json();
            setData(json);
        } catch (e) {
            setError('No se pudieron cargar las métricas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const maxBusiness = data?.topBusinesses?.length > 0 ? parseInt(data.topBusinesses[0].count) : 1;
    const maxHour = data?.byHour ? Math.max(...data.byHour, 1) : 1;

    const style = {
        page: {
            minHeight: '100vh',
            background: '#0f172a',
            color: 'white',
            fontFamily: "'Inter', sans-serif",
            padding: '0 0 60px'
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '24px 32px',
            borderBottom: '1px solid #1e293b'
        },
        section: {
            background: '#1e293b',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px'
        },
        sectionTitle: {
            color: '#e2e8f0',
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        }
    };

    return (
        <div style={style.page}>
            {/* Header */}
            <div style={style.header}>
                <button
                    onClick={() => navigate('/select-profile')}
                    style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer' }}
                >
                    ← Volver
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.4rem' }}>📊 Dashboard de Analytics</h1>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Métricas de impresiones en tiempo real</p>
                </div>
                <button
                    onClick={fetchData}
                    style={{ marginLeft: 'auto', background: '#1d4ed8', border: 'none', color: 'white', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                    🔄 Actualizar
                </button>
            </div>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
                {loading && (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '60px' }}>Cargando métricas...</div>
                )}
                {error && (
                    <div style={{ textAlign: 'center', color: '#f87171', padding: '60px' }}>{error}</div>
                )}

                {data && !loading && (
                    <>
                        {/* KPI Cards */}
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
                            <StatCard label="Total Impresiones" value={data.totals.all.toLocaleString()} color="#3b82f6" />
                            <StatCard label="Anuncios (Geo)" value={data.totals.ads.toLocaleString()} color="#f59e0b" sub="Campañas con geofencing" />
                            <StatCard label="Clics / Escaneos" value={data.totals.clicks.toLocaleString()} color="#ec4899" sub="Interacciones totales" />
                            <StatCard
                                label="CTR (Engagement)"
                                value={`${data.totals.ctr}%`}
                                color="#10b981"
                                sub="Clics por cada 100 impresiones"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            {/* Top Businesses by Impression */}
                            <div style={style.section}>
                                <div style={style.sectionTitle}>🏢 Top Negocios por Impresiones</div>
                                {data.topBusinesses.length === 0 ? (
                                    <p style={{ color: '#475569', textAlign: 'center' }}>Sin datos aún</p>
                                ) : (
                                    data.topBusinesses.map((b, i) => (
                                        <Bar
                                            key={i}
                                            label={b.businessName || 'Sin nombre'}
                                            value={parseInt(b.count)}
                                            max={maxBusiness}
                                            color={i === 0 ? '#f59e0b' : '#3b82f6'}
                                        />
                                    ))
                                )}
                            </div>

                            {/* Top Businesses by Click */}
                            <div style={style.section}>
                                <div style={style.sectionTitle}>🖱️ Top Negocios por Clics / CTR</div>
                                {data.topBusinessesByClick?.length === 0 ? (
                                    <p style={{ color: '#475569', textAlign: 'center' }}>Sin clics registrados</p>
                                ) : (
                                    data.topBusinessesByClick?.map((b, i) => {
                                        const maxClick = Math.max(...data.topBusinessesByClick.map(x => parseInt(x.count)), 1);
                                        return (
                                            <Bar
                                                key={i}
                                                label={b.businessName || 'Sin nombre'}
                                                value={parseInt(b.count)}
                                                max={maxClick}
                                                color="#ec4899"
                                            />
                                        );
                                    })
                                )}
                            </div>

                            {/* By Language */}
                            <div style={style.section}>
                                <div style={style.sectionTitle}>🌐 Impresiones por Idioma</div>
                                {data.byLanguage.length === 0 ? (
                                    <p style={{ color: '#475569', textAlign: 'center' }}>Sin datos aún</p>
                                ) : (
                                    data.byLanguage.map((l, i) => {
                                        const maxLang = Math.max(...data.byLanguage.map(x => parseInt(x.count)), 1);
                                        return (
                                            <Bar key={i}
                                                label={{ es: '🇪🇸 Español', en: '🇺🇸 English', pt: '🇧🇷 Português', fr: '🇫🇷 Français' }[l.language] || l.language}
                                                value={parseInt(l.count)}
                                                max={maxLang}
                                                color="#06b6d4"
                                            />
                                        );
                                    })
                                )}

                                <div style={{ ...style.sectionTitle, marginTop: '28px' }}>🌤️ Por Clima</div>
                                {data.byWeather.length === 0 ? (
                                    <p style={{ color: '#475569', textAlign: 'center' }}>Sin datos aún</p>
                                ) : (
                                    data.byWeather.map((w, i) => {
                                        const maxW = Math.max(...data.byWeather.map(x => parseInt(x.count)), 1);
                                        return (
                                            <Bar key={i} label={w.weather} value={parseInt(w.count)} max={maxW} color="#34d399" />
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Impresiones por hora */}
                        <div style={style.section}>
                            <div style={style.sectionTitle}>🕐 Impresiones por Hora del Día (últimos 7 días)</div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
                                {data.byHour.map((count, h) => (
                                    <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <div
                                            title={`${h}:00 — ${count} impresiones`}
                                            style={{
                                                width: '100%',
                                                height: `${maxHour > 0 ? Math.round((count / maxHour) * 80) + 4 : 4}px`,
                                                background: count > 0 ? '#3b82f6' : '#1e293b',
                                                borderRadius: '4px 4px 0 0',
                                                transition: 'height 0.4s ease'
                                            }}
                                        />
                                        {h % 6 === 0 && (
                                            <span style={{ color: '#475569', fontSize: '0.65rem' }}>{h}h</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent impressions table */}
                        <div style={style.section}>
                            <div style={style.sectionTitle}>📋 Últimas 50 Impresiones</div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                    <thead>
                                        <tr style={{ color: '#64748b', borderBottom: '1px solid #334155' }}>
                                            {['Negocio', 'Tipo', 'Duración', 'Idioma', 'Clima', 'Screen', 'Fecha'].map(h => (
                                                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: '500' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.recent.length === 0 ? (
                                            <tr><td colSpan={7} style={{ padding: '24px', color: '#475569', textAlign: 'center' }}>Sin impresiones registradas aún</td></tr>
                                        ) : (
                                            data.recent.map((imp, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                                                    <td style={{ padding: '8px 12px', color: '#e2e8f0', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{imp.businessName || '—'}</td>
                                                    <td style={{ padding: '8px 12px' }}>
                                                        <span style={{ background: imp.isAd ? '#78350f' : '#14532d', color: imp.isAd ? '#fbbf24' : '#4ade80', borderRadius: '999px', padding: '2px 8px', fontSize: '0.75rem' }}>
                                                            {imp.isAd ? 'Anuncio' : 'Loop'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{imp.durationSeconds ? `${imp.durationSeconds.toFixed(1)}s` : '—'}</td>
                                                    <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{imp.language || '—'}</td>
                                                    <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{imp.weather || '—'}</td>
                                                    <td style={{ padding: '8px 12px', color: '#64748b', fontSize: '0.75rem' }}>{imp.screenId || '—'}</td>
                                                    <td style={{ padding: '8px 12px', color: '#64748b', fontSize: '0.75rem' }}>{new Date(imp.createdAt).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AnalyticsPage;
