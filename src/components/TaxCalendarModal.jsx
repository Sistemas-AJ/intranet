import React from 'react';
import { Calendar, X, Edit3, Save, RotateCcw } from 'lucide-react';

// ─── Cronograma SUNAT 2026 ───────────────────────────────────────────────────
const PERIODS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const SUNAT_2026 = {
    Enero: { '0': '2026-02-16', '1': '2026-02-17', '2y3': '2026-02-18', '4y5': '2026-02-19', '6y7': '2026-02-20', '8y9': '2026-02-23', 'buenos': '2026-02-24' },
    Febrero: { '0': '2026-03-16', '1': '2026-03-17', '2y3': '2026-03-18', '4y5': '2026-03-19', '6y7': '2026-03-20', '8y9': '2026-03-23', 'buenos': '2026-03-24' },
    Marzo: { '0': '2026-04-17', '1': '2026-04-20', '2y3': '2026-04-21', '4y5': '2026-04-22', '6y7': '2026-04-23', '8y9': '2026-04-24', 'buenos': '2026-04-27' },
    Abril: { '0': '2026-05-18', '1': '2026-05-19', '2y3': '2026-05-20', '4y5': '2026-05-21', '6y7': '2026-05-22', '8y9': '2026-05-25', 'buenos': '2026-05-26' },
    Mayo: { '0': '2026-06-15', '1': '2026-06-16', '2y3': '2026-06-17', '4y5': '2026-06-18', '6y7': '2026-06-19', '8y9': '2026-06-22', 'buenos': '2026-06-23' },
    Junio: { '0': '2026-07-15', '1': '2026-07-16', '2y3': '2026-07-17', '4y5': '2026-07-20', '6y7': '2026-07-21', '8y9': '2026-07-22', 'buenos': '2026-07-24' },
    Julio: { '0': '2026-08-18', '1': '2026-08-19', '2y3': '2026-08-20', '4y5': '2026-08-21', '6y7': '2026-08-24', '8y9': '2026-08-25', 'buenos': '2026-08-26' },
    Agosto: { '0': '2026-09-15', '1': '2026-09-16', '2y3': '2026-09-17', '4y5': '2026-09-18', '6y7': '2026-09-21', '8y9': '2026-09-22', 'buenos': '2026-09-23' },
    Septiembre: { '0': '2026-10-16', '1': '2026-10-19', '2y3': '2026-10-20', '4y5': '2026-10-21', '6y7': '2026-10-22', '8y9': '2026-10-23', 'buenos': '2026-10-26' },
    Octubre: { '0': '2026-11-16', '1': '2026-11-17', '2y3': '2026-11-18', '4y5': '2026-11-19', '6y7': '2026-11-20', '8y9': '2026-11-23', 'buenos': '2026-11-24' },
    Noviembre: { '0': '2026-12-17', '1': '2026-12-18', '2y3': '2026-12-21', '4y5': '2026-12-22', '6y7': '2026-12-23', '8y9': '2026-12-24', 'buenos': '2026-12-28' },
    Diciembre: { '0': '2027-01-18', '1': '2027-01-19', '2y3': '2027-01-20', '4y5': '2027-01-21', '6y7': '2027-01-22', '8y9': '2027-01-25', 'buenos': '2027-01-26' },
};

const DIGIT_MAP = { '0': '0', '1': '1', '2': '2y3', '3': '2y3', '4': '4y5', '5': '4y5', '6': '6y7', '7': '6y7', '8': '8y9', '9': '8y9' };

const MONTH_NAMES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

function getDigitGroup(ruc) {
    const last = ruc.charAt(ruc.length - 1);
    return DIGIT_MAP[last] || '0';
}

function formatDate(iso) {
    const [y, m, d] = iso.split('-');
    return `${parseInt(d)} de ${MONTH_NAMES[parseInt(m)]} ${y}`;
}

function getStatus(iso) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(iso + 'T00:00:00');
    const diff = (due - today) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'vencido';
    if (diff <= 7) return 'proximo';
    return 'pendiente';
}

const STATUS = {
    vencido: { bg: '#fef2f2', text: '#dc2626', label: 'Vencido', border: '#fecaca' },
    proximo: { bg: '#fffbeb', text: '#d97706', label: 'Próximo', border: '#fde68a' },
    pendiente: { bg: '#f0fdf4', text: '#16a34a', label: 'Pendiente', border: '#bbf7d0' },
};

// ─── Componente ──────────────────────────────────────────────────────────────
const TaxCalendarModal = ({ ruc, isClient, onClose }) => {
    const digitGroup = getDigitGroup(ruc);
    const lastDigit = ruc.charAt(ruc.length - 1);

    // Fechas personalizadas (localStorage)
    const storageKey = `taxCalendar_${ruc}_custom`;
    const loadCustom = () => {
        try { const s = localStorage.getItem(storageKey); return s ? JSON.parse(s) : {}; }
        catch { return {}; }
    };

    const [customDates, setCustomDates] = React.useState(loadCustom);
    const [isEditing, setIsEditing] = React.useState(false);
    const [editDates, setEditDates] = React.useState({});

    React.useEffect(() => {
        try { localStorage.setItem(storageKey, JSON.stringify(customDates)); }
        catch (e) { console.error('Error guardando calendario:', e); }
    }, [customDates, storageKey]);

    const getDueDate = (period) => customDates[period] || SUNAT_2026[period][digitGroup];

    const startEditing = () => {
        const current = {};
        PERIODS.forEach(p => { current[p] = getDueDate(p); });
        setEditDates(current);
        setIsEditing(true);
    };

    const saveEditing = () => {
        const custom = {};
        PERIODS.forEach(p => {
            const def = SUNAT_2026[p][digitGroup];
            if (editDates[p] && editDates[p] !== def) custom[p] = editDates[p];
        });
        setCustomDates(custom);
        setIsEditing(false);
    };

    const resetToDefaults = () => {
        if (window.confirm('¿Restablecer todas las fechas a los valores predeterminados de SUNAT?')) {
            setCustomDates({});
            setIsEditing(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
                justifyContent: 'center', alignItems: 'center', zIndex: 2000,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: 'white', borderRadius: '16px',
                    width: '90%', maxWidth: '720px', maxHeight: '90vh',
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ──────────────────────────────────────────── */}
                <div style={{
                    padding: '24px 30px',
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    color: 'white',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', padding: '10px', borderRadius: '12px' }}>
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>
                                    Calendario Tributario 2026
                                </h2>
                                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', opacity: 0.75 }}>
                                    RUC: <strong>{ruc}</strong> — Grupo: <strong>{digitGroup}</strong>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'white', display: 'flex',
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* ── Body ────────────────────────────────────────────── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 30px' }}>
                    {/* Column headers */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr 110px', gap: '10px',
                        padding: '10px 15px', backgroundColor: '#f8fafc', borderRadius: '8px',
                        fontWeight: '700', fontSize: '0.78rem', color: '#64748b',
                        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px',
                    }}>
                        <span>Período Tributario</span>
                        <span>Fecha de Vencimiento</span>
                        <span style={{ textAlign: 'center' }}>Estado</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {PERIODS.map(period => {
                            const dueDate = isEditing ? (editDates[period] || getDueDate(period)) : getDueDate(period);
                            const status = getStatus(dueDate);
                            const colors = STATUS[status];
                            const isCustom = !!customDates[period];

                            return (
                                <div
                                    key={period}
                                    style={{
                                        display: 'grid', gridTemplateColumns: '1fr 1fr 110px', gap: '10px',
                                        padding: '12px 15px', backgroundColor: 'white', borderRadius: '8px',
                                        border: `1px solid ${status === 'vencido' ? '#fecaca' : status === 'proximo' ? '#fde68a' : '#e2e8f0'}`,
                                        alignItems: 'center', transition: 'all 0.15s',
                                    }}
                                >
                                    {/* Período */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.92rem' }}>
                                            {period} 2026
                                        </span>
                                        {isCustom && !isEditing && (
                                            <span style={{
                                                fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px',
                                                backgroundColor: '#dbeafe', color: '#2563eb', fontWeight: '600',
                                            }}>
                                                Personalizado
                                            </span>
                                        )}
                                    </div>

                                    {/* Fecha */}
                                    <div>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={editDates[period] || dueDate}
                                                onChange={e => setEditDates(prev => ({ ...prev, [period]: e.target.value }))}
                                                style={{
                                                    padding: '6px 10px', borderRadius: '6px',
                                                    border: '1px solid #d1d5db', fontSize: '0.88rem',
                                                    width: '100%', color: '#374151',
                                                }}
                                            />
                                        ) : (
                                            <span style={{ fontWeight: '500', color: '#374151', fontSize: '0.92rem' }}>
                                                {formatDate(dueDate)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Estado */}
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <span style={{
                                            fontSize: '0.72rem', fontWeight: '700', padding: '4px 12px',
                                            borderRadius: '20px', backgroundColor: colors.bg,
                                            color: colors.text, border: `1px solid ${colors.border}`,
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {colors.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Footer (admin only) ─────────────────────────────── */}
                {!isClient && (
                    <div style={{
                        padding: '16px 30px', borderTop: '1px solid #e2e8f0',
                        display: 'flex', gap: '10px', justifyContent: 'flex-end',
                        backgroundColor: '#f8fafc',
                    }}>
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    style={{
                                        padding: '10px 20px', borderRadius: '8px',
                                        border: '1px solid #d1d5db', backgroundColor: 'white',
                                        cursor: 'pointer', fontWeight: '500', fontSize: '0.88rem',
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={resetToDefaults}
                                    style={{
                                        padding: '10px 20px', borderRadius: '8px', border: 'none',
                                        backgroundColor: '#64748b', color: 'white', cursor: 'pointer',
                                        fontWeight: '600', fontSize: '0.88rem',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                    }}
                                >
                                    <RotateCcw size={16} /> Restablecer
                                </button>
                                <button
                                    onClick={saveEditing}
                                    style={{
                                        padding: '10px 20px', borderRadius: '8px', border: 'none',
                                        backgroundColor: 'var(--color-aj-red)', color: 'white',
                                        cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                    }}
                                >
                                    <Save size={16} /> Guardar
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={startEditing}
                                style={{
                                    padding: '10px 24px', borderRadius: '8px', border: 'none',
                                    backgroundColor: 'var(--color-aj-red)', color: 'white',
                                    cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    transition: 'background 0.2s',
                                }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = '#b91c1c'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--color-aj-red)'}
                            >
                                <Edit3 size={16} /> Cronograma Personalizado
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaxCalendarModal;
