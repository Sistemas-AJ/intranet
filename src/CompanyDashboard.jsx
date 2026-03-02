import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    User, LogOut, Menu, FileText, Calendar, CalendarDays, FileBarChart,
    Users, ShieldCheck, Landmark, Wallet, ShoppingCart, TrendingUp,
    Upload, Download, X, FolderDown, Maximize2, Eye, Bell, Clock, Check
} from 'lucide-react';
import logo from './assets/LogoSolo.png';
import bgImage from './assets/bg-accountants.png';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import api from './api';

import useDocumentSection from './hooks/useDocumentSection';
import CompaniesSidebar from './components/CompaniesSidebar';
import DocumentSection from './components/DocumentSection';
import PlameSection from './components/PlameSection';
import TaxCalendarModal from './components/TaxCalendarModal';



const YEARS = ['2030', '2029', '2028', '2027', '2026', '2025', '2024', '2023'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const permissionConfig = {
    fichaRuc: { label: 'Ficha RUC', icon: FileText },
    declaracionesMensuales: { label: 'Declaraciones Mensuales', icon: Calendar },
    declaracionesAnuales: { label: 'Declaraciones Anuales', icon: CalendarDays },
    reporteTributario: { label: 'Reporte Tributario', icon: FileBarChart },
    plame: { label: 'Plame', icon: Users },
    afpNet: { label: 'AFP NET', icon: ShieldCheck },
    bancos: { label: 'Bancos', icon: Landmark },
    cajaChica: { label: 'Control de Caja', icon: Wallet },
    compras: { label: 'Compras', icon: ShoppingCart },
    ventas: { label: 'Ventas', icon: TrendingUp },
    otrosDocumentos: { label: 'Otros Documentos', icon: FileText },
};

// ─── Declaraciones Mensuales ──────────────────────────────────────────────────
const DeclaracionesMensualesSection = ({ isClient, ruc, hook }) => {
    const [isDownloadingZip, setIsDownloadingZip] = React.useState(false);
    const handleBulkDownload = async () => {
        const allDocs = hook.list || [];
        if (allDocs.length === 0) { alert('No hay declaraciones para descargar.'); return; }
        setIsDownloadingZip(true);
        try {
            const zip = new JSZip();
            const currentYear = new Date().getFullYear().toString();
            for (const doc of allDocs) {
                if (doc.url && doc.name && doc.month) {
                    const folder = zip.folder(doc.month);
                    const response = await api.get(doc.url, { responseType: 'blob' });
                    const blob = response.data;
                    folder.file(doc.name, blob);
                }
            }
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `Declaraciones Mensuales - ${currentYear}.zip`);
        } catch (error) {
            console.error('Error generando ZIP:', error);
            alert('Error al generar el archivo ZIP.');
        }
        setIsDownloadingZip(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <DocumentSection
                hook={hook}
                isClient={isClient}
                allowClientUpload={false}
                allowClientDelete={false}
                icon={FileText}
                emptyMessage="No se encontraron declaraciones para los filtros seleccionados."
                uploadLabel="Subir Declaración Mensual"
                formTitle="Subir Nueva Declaración"
                deleteConfirm="¿Eliminar esta declaración?"
                fileAccept="application/pdf"
            />
            {(hook.list || []).length > 0 && (
                <button
                    onClick={handleBulkDownload}
                    disabled={isDownloadingZip}
                    style={{
                        width: '100%', padding: '15px', borderRadius: '6px', border: 'none',
                        background: isDownloadingZip ? '#9ca3af' : 'var(--color-aj-red)',
                        color: 'white', cursor: isDownloadingZip ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                        marginTop: '10px', transition: 'background 0.2s'
                    }}
                >
                    <FolderDown size={20} />
                    {isDownloadingZip ? 'Generando ZIP...' : 'Descarga Masiva'}
                </button>
            )}
        </div>
    );
};

// ─── Declaraciones Anuales (sin mes) ─────────────────────────────────────────
const DeclaracionesAnualesSection = ({ isClient, ruc, hook }) => {
    return (
        <DocumentSection
            hook={hook}
            isClient={isClient}
            allowClientUpload={false}
            allowClientDelete={false}
            icon={CalendarDays}
            emptyMessage="No se encontraron declaraciones anuales."
            uploadLabel="Subir Declaración Anual"
            formTitle="Subir Nueva Declaración Anual"
            deleteConfirm="¿Eliminar esta declaración?"
            fileAccept="application/pdf"
            hasType={false}
        />
    );
};

// ─── Otros Documentos (con categorías) ───────────────────────────────────────
const OtrosDocumentosSection = ({ isClient, ruc, hooks }) => {
    const [category, setCategory] = React.useState(null);
    const hook = hooks[category || 'notificaciones'];

    const CATEGORIES = [
        { id: 'notificaciones', label: 'Notificaciones SUNAT', icon: FileText },
        { id: 'varios', label: 'Documentos Varios', icon: FileText },
        { id: 'constitucion', label: 'Documentos de Constitución de empresas', icon: FileBarChart, centered: true },
    ];

    if (!category) {
        const pairs = CATEGORIES.filter(c => !c.centered);
        const centered = CATEGORIES.filter(c => c.centered);
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {pairs.map(cat => (
                        <div key={cat.id} onClick={() => setCategory(cat.id)}
                            style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', textAlign: 'center', transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--color-aj-red)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}>
                            <div style={{ backgroundColor: '#fff1f2', padding: '15px', borderRadius: '50%', color: 'var(--color-aj-red)' }}><cat.icon size={32} /></div>
                            <span style={{ fontWeight: '600', fontSize: '1.1rem', color: '#1f2937' }}>{cat.label}</span>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {centered.map(cat => (
                        <div key={cat.id} onClick={() => setCategory(cat.id)}
                            style={{ width: '50%', backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', textAlign: 'center', transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--color-aj-red)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}>
                            <div style={{ backgroundColor: '#fff1f2', padding: '15px', borderRadius: '50%', color: 'var(--color-aj-red)' }}><cat.icon size={32} /></div>
                            <span style={{ fontWeight: '600', fontSize: '1.1rem', color: '#1f2937' }}>{cat.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const catLabel = CATEGORIES.find(c => c.id === category)?.label;

    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                <button onClick={() => { setCategory(null); hook.setShowForm(false); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', fontWeight: '500' }}>
                    ← Volver a categorías
                </button>
                <h3 style={{ fontSize: '1.5rem', marginTop: '10px', color: 'var(--color-aj-black)' }}>{catLabel}</h3>
            </div>
            <DocumentSection
                hook={hook}
                isClient={isClient && category !== 'constitucion'}
                allowClientUpload={category !== 'constitucion'}
                allowClientDelete={false}
                icon={FileText}
                emptyMessage="No se encontraron documentos en esta categoría."
                uploadLabel="Subir Documento"
                formTitle="Subir Documento"
                deleteConfirm="¿Eliminar documento?"
                fileAccept="application/pdf, .doc, .docx, .xls, .xlsx"
            />
        </div>
    );
};

// ─── Generic File Preview (Ficha RUC, Reporte Tributario) ─────────────────────
const GenericFilePreview = ({ hook, isClient, label, allowClientUpload = false, allowClientDelete = false }) => {
    const fileData = hook.list && hook.list[0]; // Mostrar el más reciente

    if (!fileData) {
        return (
            <DocumentSection
                hook={hook}
                isClient={isClient}
                icon={FileText}
                emptyMessage={`No hay ${label} subida.`}
                uploadLabel={`Subir ${label}`}
                formTitle={`Subir ${label}`}
                deleteConfirm={`¿Eliminar ${label}?`}
                allowClientUpload={allowClientUpload}
                allowClientDelete={allowClientDelete}
                fileAccept="application/pdf"
            />
        );
    }

    return (
        <DocumentSection
            hook={hook}
            isClient={isClient}
            icon={FileText}
            emptyMessage={`No se encontró ${label}.`}
            uploadLabel={`Actualizar ${label}`}
            formTitle={`Actualizar ${label}`}
            deleteConfirm={`¿Eliminar este documento?`}
            allowClientUpload={allowClientUpload}
            allowClientDelete={allowClientDelete}
            fileAccept="application/pdf"
        />
    );
};

// ─── CompanyDashboard ────────────────────────────────────────────────────────
const CompanyDashboard = () => {
    const { ruc } = useParams();
    const navigate = useNavigate();

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const isClient = currentUser?.role !== 'admin';

    // ── sidebar control and company list (admin only)
    const [companies, setCompanies] = React.useState(() => {
        try { return JSON.parse(localStorage.getItem('companies') || '[]'); }
        catch { return []; }
    });
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    // keep the company list in sync with the server just like Dashboard
    React.useEffect(() => {
        const sync = async () => {
            try {
                const { data } = await api.get('/companies');
                if (Array.isArray(data)) {
                    setCompanies(data);
                    localStorage.setItem('companies', JSON.stringify(data));
                }
            } catch (err) {
                console.error('Error sincronizando empresas:', err);
                const saved = localStorage.getItem('companies');
                if (saved) setCompanies(JSON.parse(saved));
            }
        };
        sync();
    }, []);

    const [company, setCompany] = React.useState(null);
    const [selectedPermission, setSelectedPermission] = React.useState(null);

    // helpers for sidebar actions (admin only)
    const handleEditClick = (company) => {
        // navigate back to dashboard and open edit modal
        navigate('/dashboard', { state: { editCompany: company } });
    };

    const handleDeleteCompany = async (ruc) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta empresa?')) {
            try {
                const res = await api.delete(`/companies/${ruc}`);
                if (res.status >= 200 && res.status < 300) {
                    const updated = companies.filter(c => c.ruc !== ruc);
                    setCompanies(updated);
                    localStorage.setItem('companies', JSON.stringify(updated));
                    // if we deleted the current company, go back to dashboard
                    if (ruc === company?.ruc) {
                        navigate('/');
                    }
                }
            } catch (err) {
                console.error('Error al eliminar:', err);
            }
        }
    };

    // ─── Lógica de Alerta de Vencimiento ─────────────────────────────────────
    const getDigitGroup = (r) => {
        const last = r.charAt(r.length - 1);
        const map = { '0': '0', '1': '1', '2y3': '2y3', '3': '2y3', '4y5': '4y5', '5': '4y5', '6y7': '6y7', '7': '6y7', '8y9': '8y9', '9': '8y9' };
        return map[last] || '0';
    };

    const nextDeadline = React.useMemo(() => {
        const SUNAT_2026 = {
            Enero: { '0': '2026-02-16', '1': '2026-02-17', '2y3': '2026-02-18', '4y5': '2026-02-19', '6y7': '2026-02-20', '8y9': '2026-02-23' },
            Febrero: { '0': '2026-03-16', '1': '2026-03-17', '2y3': '2026-03-18', '4y5': '2026-03-19', '6y7': '2026-03-20', '8y9': '2026-03-23' },
            Marzo: { '0': '2026-04-17', '1': '2026-04-20', '2y3': '2026-04-21', '4y5': '2026-04-22', '6y7': '2026-04-23', '8y9': '2026-04-24' },
            Abril: { '0': '2026-05-18', '1': '2026-05-19', '2y3': '2026-05-20', '4y5': '2026-05-21', '6y7': '2026-05-22', '8y9': '2026-05-25' },
            Mayo: { '0': '2026-06-15', '1': '2026-06-16', '2y3': '2026-06-17', '4y5': '2026-06-18', '6y7': '2026-06-19', '8y9': '2026-06-22' },
            Junio: { '0': '2026-07-15', '1': '2026-07-16', '2y3': '2026-07-17', '4y5': '2026-07-20', '6y7': '2026-07-21', '8y9': '2026-07-22' },
            Julio: { '0': '2026-08-18', '1': '2026-08-19', '2y3': '2026-08-20', '4y5': '2026-08-21', '6y7': '2026-08-24', '8y9': '2026-08-25' },
            Agosto: { '0': '2026-09-15', '1': '2026-09-16', '2y3': '2026-09-17', '4y5': '2026-09-18', '6y7': '2026-09-21', '8y9': '2026-09-22' },
            Septiembre: { '0': '2026-10-16', '1': '2026-10-19', '2y3': '2026-10-20', '4y5': '2026-10-21', '6y7': '2026-10-22', '8y9': '2026-10-23' },
            Octubre: { '0': '2026-11-16', '1': '2026-11-17', '2y3': '2026-11-18', '4y5': '2026-11-19', '6y7': '2026-11-20', '8y9': '2026-11-23' },
            Noviembre: { '0': '2026-12-17', '1': '2026-12-18', '2y3': '2026-12-21', '4y5': '2026-12-22', '6y7': '2026-12-23', '8y9': '2026-12-24' },
            Diciembre: { '0': '2027-01-18', '1': '2027-01-19', '2y3': '2027-01-20', '4y5': '2027-01-21', '6y7': '2027-01-22', '8y9': '2027-01-25' },
        };
        const group = getDigitGroup(ruc);
        const dates = Object.values(SUNAT_2026).map(m => new Date(m[group] + 'T00:00:00'));
        const now = new Date();
        const future = dates.filter(d => d > now).sort((a, b) => a - b);
        return future.length > 0 ? future[0] : null;
    }, [ruc]);

    const isNearDeadline = React.useMemo(() => {
        if (!nextDeadline) return false;
        const diffHours = (nextDeadline - new Date()) / (1000 * 60 * 60);
        return diffHours > 0 && diffHours <= 96;
    }, [nextDeadline]);


    // ── Hooks para secciones de documentos ──────────────────────────────────
    const compName = company?.razonsocial || ruc;
    const fichaRuc = useDocumentSection({ noPeriod: true, sectionLabel: 'Ficha RUC', companyName: compName, storageKey: `docs_${ruc}_fichaRuc` });
    const reporteTributario = useDocumentSection({ sectionLabel: 'Reporte Tributario', companyName: compName, storageKey: `docs_${ruc}_reporteTributario` });
    const declaracionesMensuales = useDocumentSection({ sectionLabel: 'Declaraciones Mensuales', companyName: compName, storageKey: `docs_${ruc}_declaracionesMensuales` });
    const declaracionesAnuales = useDocumentSection({ noMonth: true, sectionLabel: 'Declaraciones Anuales', companyName: compName, storageKey: `docs_${ruc}_declaracionesAnuales` });
    const plame_boletas = useDocumentSection({ multiple: true, hasZip: true, zipLabel: 'boletas', sectionLabel: 'Plame - Boletas', companyName: compName, storageKey: `docs_${ruc}_plame_boletas` });
    const plame_constancias = useDocumentSection({ multiple: true, zipLabel: 'constancias', sectionLabel: 'Plame - Constancias', companyName: compName, storageKey: `docs_${ruc}_plame_constancias` });
    const plame_nps = useDocumentSection({ multiple: true, zipLabel: 'nps', sectionLabel: 'Plame - NPS', companyName: compName, storageKey: `docs_${ruc}_plame_nps` });
    const afpNet = useDocumentSection({ hasType: true, sectionLabel: 'AFP NET', companyName: compName, storageKey: `docs_${ruc}_afpNet` });
    const bancos = useDocumentSection({ hasType: true, sectionLabel: 'Bancos', companyName: compName, storageKey: `docs_${ruc}_bancos` });
    const cajaChica = useDocumentSection({ hasType: true, sectionLabel: 'Control de Caja', companyName: compName, storageKey: `docs_${ruc}_cajaChica` });
    const compras = useDocumentSection({ multiple: true, hasZip: true, zipLabel: 'compras', sectionLabel: 'Compras', companyName: compName, storageKey: `docs_${ruc}_compras` });
    const ventas = useDocumentSection({ multiple: true, hasZip: true, zipLabel: 'ventas', sectionLabel: 'Ventas', companyName: compName, storageKey: `docs_${ruc}_ventas` });
    const otros_notificaciones = useDocumentSection({ sectionLabel: 'Otros - Notificaciones', companyName: compName, storageKey: `docs_${ruc}_otrosDocumentos_notificaciones` });
    const otros_varios = useDocumentSection({ sectionLabel: 'Otros - Varios', companyName: compName, storageKey: `docs_${ruc}_otrosDocumentos_varios` });
    const otros_constitucion = useDocumentSection({ sectionLabel: 'Otros - Constitución', companyName: compName, storageKey: `docs_${ruc}_otrosDocumentos_constitucion` });

    // ─── Lógica de Notificaciones Seccionadas ──────────────────────────────
    // Usamos los datos del hook directamente para notificaciones más responsivas
    const hasSectionUnread = React.useCallback((sectionKey) => {
        const isUnread = (h) => {
            if (!h) return false;
            // Primero chequear metadata nueva
            if (isClient && h.metadata?.unreadForClient) return true;
            if (!isClient && h.metadata?.unreadForAdmin) return true;

            // Fallback para items individuales
            if (isClient) {
                return h.list.some(item => item.isNonDeducible && !item.seenByClient);
            } else {
                return h.list.some(item => item.uploadedBy === 'client' && !item.seenByAdmin);
            }
        };

        if (sectionKey === 'fichaRuc') return isUnread(fichaRuc);
        if (sectionKey === 'reporteTributario') return isUnread(reporteTributario);
        if (sectionKey === 'plame') return isUnread(plame_boletas) || isUnread(plame_constancias) || isUnread(plame_nps);
        if (sectionKey === 'otrosDocumentos') return isUnread(otros_notificaciones) || isUnread(otros_varios) || isUnread(otros_constitucion);

        const hks = {
            declaracionesMensuales, declaracionesAnuales, afpNet, bancos, cajaChica, compras, ventas
        };
        return isUnread(hks[sectionKey]);
    }, [isClient, fichaRuc, reporteTributario, plame_boletas, plame_constancias, plame_nps, otros_notificaciones, otros_varios, otros_constitucion, declaracionesMensuales, declaracionesAnuales, afpNet, bancos, cajaChica, compras, ventas]);

    // Global Notification Helper
    const hasAnyUnread = React.useMemo(() =>
        Object.keys(permissionConfig).some(key => hasSectionUnread(key)),
        [hasSectionUnread]
    );

    // ─── Agregador de Notificaciones Detalladas ────────────────────────────
    const allHooks = [
        fichaRuc, reporteTributario,
        declaracionesMensuales, declaracionesAnuales, afpNet, bancos, cajaChica, compras, ventas,
        plame_boletas, plame_constancias, plame_nps,
        otros_notificaciones, otros_varios, otros_constitucion
    ];

    const notificationEvents = React.useMemo(() => {
        const events = [];
        allHooks.forEach(hook => {
            if (hook.metadata?.events) {
                events.push(...hook.metadata.events);
            }
        });
        return events.sort((a, b) => b.id - a.id);
    }, [fichaRuc.metadata, reporteTributario.metadata, declaracionesMensuales.metadata, declaracionesAnuales.metadata, afpNet.metadata, bancos.metadata, cajaChica.metadata, compras.metadata, ventas.metadata, plame_boletas.metadata, plame_constancias.metadata, plame_nps.metadata, otros_notificaciones.metadata, otros_varios.metadata, otros_constitucion.metadata]);

    const hasUnreadEvents = React.useMemo(() => {
        return allHooks.some(hook => hook.metadata?.unreadForAdmin);
    }, [fichaRuc.metadata, reporteTributario.metadata, declaracionesMensuales.metadata, declaracionesAnuales.metadata, afpNet.metadata, bancos.metadata, cajaChica.metadata, compras.metadata, ventas.metadata, plame_boletas.metadata, plame_constancias.metadata, plame_nps.metadata, otros_notificaciones.metadata, otros_varios.metadata, otros_constitucion.metadata]);

    const markAllAsRead = React.useCallback(() => {
        allHooks.forEach(hook => hook.markAsRead());
    }, [allHooks]);

    const clearAllNotifications = React.useCallback(() => {
        allHooks.forEach(hook => hook.clearNotifications());
    }, [allHooks]);

    const [showNotifications, setShowNotifications] = React.useState(false);
    const [showCalendar, setShowCalendar] = React.useState(false);
    const [generalSuccessMsg, setGeneralSuccessMsg] = React.useState('');

    const handleBellClick = () => {
        if (!showNotifications && hasUnreadEvents) {
            markAllAsRead();
        }
        setShowNotifications(!showNotifications);
    };

    // Al entrar a una sección, marcar como visto
    React.useEffect(() => {
        if (selectedPermission) {
            const markAsSeen = (h) => {
                if (!h) return;
                if (isClient) h.markAllAsSeenByClient();
                else h.markAllAsSeenByAdmin();
            };

            if (selectedPermission === 'plame') {
                markAsSeen(plame_boletas); markAsSeen(plame_constancias); markAsSeen(plame_nps);
            } else if (selectedPermission === 'otrosDocumentos') {
                markAsSeen(otros_notificaciones); markAsSeen(otros_varios); markAsSeen(otros_constitucion);
            } else {
                const hks = {
                    fichaRuc, reporteTributario, declaracionesMensuales, declaracionesAnuales, afpNet, bancos, cajaChica, compras, ventas
                };
                markAsSeen(hks[selectedPermission]);
            }
        }
    }, [selectedPermission, isClient, fichaRuc, reporteTributario, declaracionesMensuales, declaracionesAnuales, plame_boletas, plame_constancias, plame_nps, afpNet, bancos, cajaChica, compras, ventas, otros_notificaciones, otros_varios, otros_constitucion]);

    // ── Descarga Masiva para Compras (excluir no deducibles) ──────────────────
    const handleComprasBulkDownload = async () => {
        const allDocs = (compras.list || []).filter(doc => !doc.isNonDeducible);
        if (allDocs.length === 0) { alert('No hay comprobantes deducibles para descargar.'); return; }
        try {
            const zip = new JSZip();
            for (const doc of allDocs) {
                if (doc.url && doc.name && doc.year && doc.month) {
                    const folder = zip.folder(doc.year).folder(doc.month);
                    const response = await api.get(doc.url, { responseType: 'blob' });
                    const blob = response.data;
                    folder.file(doc.name, blob);
                }
            }
            const content = await zip.generateAsync({ type: 'blob' });
            const razon = company?.razonSocial || ruc;
            saveAs(content, `Compras - ${razon}.zip`);
        } catch (error) {
            console.error('Error generando ZIP de compras:', error);
            alert('Error al generar el archivo ZIP.');
        }
    };

    // ── Descarga Masiva para Ventas (todos los archivos) ─────────────────────
    const handleVentasBulkDownload = async () => {
        const allDocs = ventas.list || [];
        if (allDocs.length === 0) { alert('No hay comprobantes para descargar.'); return; }
        try {
            const zip = new JSZip();
            for (const doc of allDocs) {
                if (doc.url && doc.name && doc.year && doc.month) {
                    const folder = zip.folder(doc.year).folder(doc.month);
                    const response = await api.get(doc.url, { responseType: 'blob' });
                    const blob = response.data;
                    folder.file(doc.name, blob);
                }
            }
            const content = await zip.generateAsync({ type: 'blob' });
            const razon = company?.razonSocial || ruc;
            saveAs(content, `Ventas - ${razon}.zip`);
        } catch (error) {
            console.error('Error generando ZIP de ventas:', error);
            alert('Error al generar el archivo ZIP.');
        }
    };

    React.useEffect(() => {
        // fetch the specific company as before
        const fetchCompany = async () => {
            try {
                const res = await api.get('/companies', { params: { ruc } });
                if (res.status === 200) {
                    const data = res.data;
                    setCompany(data);
                    // Actualizar caché local
                    const saved = JSON.parse(localStorage.getItem('companies') || '[]');
                    const idx = saved.findIndex(c => String(c.ruc) === String(ruc));
                    if (idx > -1) saved[idx] = data;
                    else saved.push(data);
                    localStorage.setItem('companies', JSON.stringify(saved));
                } else {
                    console.error('Empresa no encontrada en DB');
                    const saved = JSON.parse(localStorage.getItem('companies') || '[]');
                    const found = saved.find(c => String(c.ruc) === String(ruc));
                    if (found) setCompany(found);
                }
            } catch (err) {
                console.error('Error al obtener datos de empresa:', err);
            }
        };
        fetchCompany();

        // also sync full companies list for sidebar
        const syncCompanies = async () => {
            try {
                const { data } = await api.get('/companies');
                if (Array.isArray(data)) {
                    setCompanies(data);
                    localStorage.setItem('companies', JSON.stringify(data));
                }
            } catch (e) {
                console.error('Error sincronizando empresas:', e);
                const saved = localStorage.getItem('companies');
                if (saved) setCompanies(JSON.parse(saved));
            }
        };
        syncCompanies();
    }, [ruc]);

    const handleLogout = () => {
        // remove only authentication-related items; keep cached companies/docs intact
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        // always return to login screen rather than silently "volver"
        navigate('/');
    };

    // ── Descargar TODOS los documentos del cliente en ZIP organizado por carpetas ──
    const [isDownloading, setIsDownloading] = React.useState(false);

    const handleDownloadAllClientDocs = async () => {
        setIsDownloading(true);
        try {
            const zip = new JSZip();
            let totalFiles = 0;

            // Mapeo de secciones a nombres de carpeta
            const sectionFolders = {
                declaracionesMensuales: 'Declaraciones Mensuales',
                declaracionesAnuales: 'Declaraciones Anuales',
                afpNet: 'AFP NET',
                bancos: 'Bancos',
                cajaChica: 'Control de Caja',
                compras: 'Compras',
                ventas: 'Ventas',
                plame_boletas: 'Plame - Boletas de Pago',
                plame_constancias: 'Plame - Constancias',
                plame_nps: 'Plame - NPS',
                otrosDocumentos_notificaciones: 'Otros Documentos - Notificaciones SUNAT',
                otrosDocumentos_varios: 'Otros Documentos - Documentos Varios',
                otrosDocumentos_constitucion: 'Otros Documentos - Constitucion',
            };

            // Recopilar documentos de cada sección desde localStorage
            for (const [sectionKey, folderName] of Object.entries(sectionFolders)) {
                const storageKey = `docs_${ruc}_${sectionKey}`;
                try {
                    const saved = localStorage.getItem(storageKey);
                    if (saved) {
                        const docs = JSON.parse(saved);
                        for (const doc of docs) {
                            if (doc.url && doc.name) {
                                const response = await api.get(doc.url, { responseType: 'blob' });
                                const blob = response.data;
                                const subFolder = doc.year ? `${folderName}/${doc.year}` : folderName;
                                zip.file(`${subFolder}/${doc.name}`, blob);
                                totalFiles++;
                            }
                        }
                    }
                } catch (e) {
                    console.warn(`Error leyendo ${sectionKey}:`, e);
                }
            }

            // Archivos genéricos (fichaRuc, reporteTributario)
            const genericKey = `docs_${ruc}_genericFiles`;
            try {
                const savedGeneric = localStorage.getItem(genericKey);
                if (savedGeneric) {
                    const genericFiles = JSON.parse(savedGeneric);
                    for (const [permKey, fileData] of Object.entries(genericFiles)) {
                        if (fileData && fileData.url && fileData.name) {
                            const folderName = permissionConfig[permKey]?.label || permKey;
                            const response = await api.get(fileData.url, { responseType: 'blob' });
                            const blob = response.data;
                            zip.file(`${folderName}/${fileData.name}`, blob);
                            totalFiles++;
                        }
                    }
                }
            } catch (e) {
                console.warn('Error leyendo archivos genéricos:', e);
            }

            if (totalFiles === 0) {
                alert('No hay documentos guardados para este cliente.');
                setIsDownloading(false);
                return;
            }

            const content = await zip.generateAsync({ type: 'blob' });
            const clientName = company?.razonSocial || ruc;
            const safeName = clientName.replace(/[^a-zA-Z0-9 ]/g, '').trim();
            saveAs(content, `${safeName}_${ruc}_Documentos.zip`);
            console.log(`%c📦 ZIP descargado: ${totalFiles} archivos de ${clientName}`, 'color: #059669; font-weight: bold;');
        } catch (error) {
            console.error('Error al generar ZIP:', error);
            alert('Error al generar el archivo ZIP.');
        }
        setIsDownloading(false);
    };

    if (!company || String(company.ruc) !== String(ruc)) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando datos de la empresa...</div>;
    }

    const permissions = company.permissions || {};
    const activePermissions = Object.entries(permissions).filter(([, v]) => v).map(([k]) => k);
    const permissionLabelsList = activePermissions.map(k => permissionConfig[k]?.label).filter(Boolean).join(', ');

    // Permissions with custom sections (no generic upload button)
    const CUSTOM_PERMISSIONS = ['fichaRuc', 'reporteTributario', 'declaracionesMensuales', 'declaracionesAnuales', 'plame', 'afpNet', 'bancos', 'cajaChica', 'compras', 'ventas', 'otrosDocumentos'];

    const renderModalContent = () => {
        switch (selectedPermission) {
            case 'fichaRuc':
                return <GenericFilePreview hook={fichaRuc} isClient={isClient} label="Ficha RUC" allowClientUpload={false} allowClientDelete={false} />;
            case 'reporteTributario':
                return <GenericFilePreview hook={reporteTributario} isClient={isClient} label="Reporte Tributario" allowClientUpload={false} allowClientDelete={false} />;
            case 'declaracionesMensuales':
                return <DeclaracionesMensualesSection isClient={isClient} ruc={ruc} hook={declaracionesMensuales} />;
            case 'declaracionesAnuales':
                return <DeclaracionesAnualesSection isClient={isClient} ruc={ruc} hook={declaracionesAnuales} />;
            case 'plame':
                return <PlameSection isClient={isClient} ruc={ruc} hooks={{ boletas: plame_boletas, constancias: plame_constancias, nps: plame_nps }} />;
            case 'afpNet':
                return (
                    <DocumentSection
                        hook={afpNet}
                        isClient={isClient}
                        icon={ShieldCheck}
                        emptyMessage="No se encontraron documentos de AFP NET."
                        uploadLabel="Subir Documentación de AFP NET"
                        formTitle="Subir Documentación AFP NET"
                        deleteConfirm="¿Eliminar este documento de AFP NET?"
                        hasType
                        typeOptions={['Detalle', 'Ticket']}
                        allowClientUpload={false}
                        allowClientDelete={false}
                    />
                );
            case 'bancos':
                return (
                    <DocumentSection
                        hook={bancos}
                        isClient={isClient}
                        icon={Landmark}
                        emptyMessage="No se encontraron documentos de Bancos."
                        uploadLabel="Subir Documentación de Bancos"
                        formTitle="Subir Documento de Bancos"
                        deleteConfirm="¿Eliminar este documento de Bancos?"
                        fileAccept=".pdf, .xlsx, .xls"
                        hasType
                        typeOptions={['Extracto Bancario', 'Conciliacion Bancaria']}
                        showTypeForClient={true}
                        allowClientUpload={true}
                        allowClientDelete={true}
                    />
                );
            case 'cajaChica':
                return (
                    <DocumentSection
                        hook={cajaChica}
                        isClient={isClient}
                        icon={Wallet}
                        emptyMessage="No se encontraron documentos de Control de Caja."
                        uploadLabel="Subir Excel de Control de Caja"
                        formTitle="Subir Excel de Control de Caja"
                        deleteConfirm="¿Eliminar documento de Control de Caja?"
                        fileAccept=".xlsx, .xls"
                        hasType
                        typeOptions={['Control de Caja Chica', 'Arqueo de Caja']}
                        showTypeForClient={false}
                        allowClientUpload={false}
                        allowClientDelete={false}
                    />
                );
            case 'compras':
                return (
                    <DocumentSection
                        hook={compras}
                        isClient={isClient}
                        allowClientUpload={true}
                        allowClientDelete={true}
                        showNonDeducible={true}
                        icon={ShoppingCart}
                        emptyMessage="No se encontraron comprobantes de compras."
                        uploadLabel="Subir compras"
                        formTitle="Subir Comprobantes de Compras"
                        deleteConfirm="¿Eliminar comprobante?"
                        multiple
                        hasZip
                        onCustomZipDownload={handleComprasBulkDownload}
                    />
                );
            case 'ventas':
                return (
                    <DocumentSection
                        hook={ventas}
                        isClient={isClient}
                        allowClientUpload={true}
                        allowClientDelete={true}
                        icon={TrendingUp}
                        emptyMessage="No se encontraron comprobantes de ventas."
                        uploadLabel="Subir ventas"
                        formTitle="Subir Comprobantes de Ventas"
                        deleteConfirm="¿Eliminar comprobante?"
                        multiple
                        hasZip
                        onCustomZipDownload={handleVentasBulkDownload}
                    />
                );
            case 'otrosDocumentos':
                return <OtrosDocumentosSection isClient={isClient} ruc={ruc} hooks={{ notificaciones: otros_notificaciones, varios: otros_varios, constitucion: otros_constitucion }} />;
            default:
                // Generic single-file section (Ficha RUC, Reporte Tributario, etc.)
                return (
                    <GenericFilePreview
                        files={files}
                        selectedPermission={selectedPermission}
                        isClient={isClient}
                        onFileUpload={handleGenericFileUpload}
                    />
                );
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {/* Background */}
            <div className="moving-background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: -1, opacity: 0.15 }} />

            {/* Header */}
            <header style={{ padding: '15px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--color-aj-black)', color: 'var(--color-aj-white)', position: 'relative', zIndex: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            marginRight: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Menu size={28} />
                    </button>
                    <img src={logo} alt="AJ Logo" style={{ height: '40px', marginRight: '15px', filter: 'brightness(0) invert(1)' }} />
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Adolfo Jurado Contratistas Generales</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: 'var(--color-aj-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-aj-black)' }}>
                            <User size={20} />
                        </div>
                        <span style={{ fontWeight: '500' }}>{isClient ? (currentUser.razonSocial || currentUser.usuario) : 'Administrador'}</span>
                    </div>
                    {!isClient && (
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <div
                                onClick={handleBellClick}
                                style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title={notificationEvents.length > 0 ? `Tienes ${notificationEvents.length} notificaciones` : 'No hay novedades'}
                            >
                                <Bell
                                    size={24}
                                    color={hasUnreadEvents ? 'var(--color-aj-red)' : 'white'}
                                    fill={hasUnreadEvents ? 'var(--color-aj-red)' : 'none'}
                                    style={{ animation: hasUnreadEvents ? 'vibrate 2s infinite linear' : 'none', opacity: (hasUnreadEvents || notificationEvents.length > 0) ? 1 : 0.6 }}
                                />
                                {hasUnreadEvents && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-8px',
                                        right: '-8px',
                                        backgroundColor: 'var(--color-aj-red)',
                                        color: 'white',
                                        fontSize: '0.65rem',
                                        fontWeight: 'bold',
                                        minWidth: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid var(--color-aj-black)',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}>
                                        {notificationEvents.length}
                                    </span>
                                )}
                            </div>

                            {showNotifications && (
                                <div style={{
                                    position: 'absolute',
                                    top: '40px',
                                    right: '0',
                                    width: '320px',
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                    zIndex: 1000,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: '1px solid #eee'
                                }}>
                                    <div style={{ padding: '12px 15px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-aj-black)', fontWeight: 'bold' }}>Notificaciones</h4>
                                        {notificationEvents.length > 0 && (
                                            <button
                                                onClick={() => { clearAllNotifications(); setShowNotifications(false); }}
                                                style={{ background: 'none', border: 'none', color: 'var(--color-aj-red)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', padding: '2px 5px' }}
                                            >
                                                Limpiar
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        {notificationEvents.length === 0 ? (
                                            <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>
                                                No hay notificaciones nuevas
                                            </div>
                                        ) : (
                                            notificationEvents.map(event => (
                                                <div key={event.id} style={{ padding: '12px 15px', borderBottom: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#333', lineHeight: '1.4' }}>
                                                        {event.message}
                                                    </p>
                                                    <span style={{ fontSize: '0.7rem', color: '#999' }}>
                                                        {new Date(event.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tax Calendar Button */}
                    <div style={{ position: 'relative' }}>
                        {isNearDeadline && (
                            <div style={{
                                position: 'absolute', top: '-12px', right: '-8px',
                                backgroundColor: '#ef4444', color: 'white', borderRadius: '50%',
                                padding: '4px', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                                zIndex: 30, animation: 'vibrate 0.5s infinite linear'
                            }}>
                                <Clock size={14} />
                            </div>
                        )}
                        <button
                            onClick={() => setShowCalendar(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                backgroundColor: 'white', color: 'var(--color-aj-black)',
                                border: 'none', padding: '8px 15px', borderRadius: '4px',
                                transition: 'all 0.2s', fontSize: '0.9rem', cursor: 'pointer',
                            }}
                            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                            onMouseOut={e => { e.currentTarget.style.backgroundColor = 'white'; }}
                            title="Ver Calendario Tributario"
                        >
                            <Calendar size={18} color="var(--color-aj-red)" />
                            <span style={{ fontWeight: '600' }}>Cronograma</span>
                        </button>
                    </div>

                    <style>{`
                        @keyframes vibrate {
                            0% { transform: rotate(0deg); }
                            25% { transform: rotate(10deg); }
                            50% { transform: rotate(0deg); }
                            75% { transform: rotate(-10deg); }
                            100% { transform: rotate(0deg); }
                        }
                    `}</style>

                    <button
                        onClick={handleLogout}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', color: 'var(--color-aj-white)', border: '1px solid var(--color-aj-white)', padding: '8px 15px', borderRadius: '4px', transition: 'all 0.2s', fontSize: '0.9rem', cursor: 'pointer' }}
                        onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--color-aj-white)'; e.currentTarget.style.color = 'var(--color-aj-black)'; }}
                        onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-aj-white)'; }}
                    >
                        <LogOut size={16} />
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </header>


            <CompaniesSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                companies={companies}
                onCompanyClick={(c) => navigate(`/company/${c.ruc}`)}
                onEditClick={handleEditClick}
                onDeleteCompany={handleDeleteCompany}
            />

            {/* Main */}
            <main style={{ flex: 1, padding: '40px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center', justifyContent: 'flex-start' }}>
                {/* Welcome */}
                <div style={{ width: '100%', backgroundColor: 'var(--color-aj-white)', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderLeft: '8px solid var(--color-aj-red)', textAlign: 'left' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--color-aj-black)' }}>
                        ¡Bienvenido al centro de Control de tu empresa, {company.razonsocial}!
                    </h2>
                    <p style={{ color: '#555', fontSize: '1.2rem', lineHeight: '1.6' }}>
                        Has ingresado a la <strong>Intranet de AJ Contratistas Generales</strong>. Desde este panel podrás gestionar toda tu información contable y tributaria, incluyendo la {permissionLabelsList}.
                    </p>
                </div>

                {/* Permission Cards Grid */}
                <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', justifyContent: 'center' }}>
                    {activePermissions.map(key => {
                        const config = permissionConfig[key];
                        if (!config) return null;
                        const Icon = config.icon;
                        return (
                            <div
                                key={key}
                                onClick={() => setSelectedPermission(key)}
                                style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', border: '1px solid #f0f0f0', position: 'relative' }}
                                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = 'var(--color-aj-red)'; }}
                                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#f0f0f0'; }}
                            >
                                {hasSectionUnread(key) && (
                                    <div style={{
                                        position: 'absolute', top: '8px', right: '12px',
                                        color: '#ef4444', animation: 'vibrate 2s infinite linear'
                                    }}>
                                        <Bell size={18} fill="#ef4444" />
                                    </div>
                                )}
                                <div style={{ color: 'var(--color-aj-red)', marginBottom: '15px', padding: '15px', backgroundColor: '#fff1f2', borderRadius: '50%' }}>
                                    <Icon size={32} />
                                </div>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#333' }}>{config.label}</h3>
                            </div>
                        );
                    })}
                    {activePermissions.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666', fontStyle: 'italic', padding: '20px' }}>
                            No hay permisos habilitados para esta empresa.
                        </div>
                    )}
                </div>
            </main>

            {/* Modal */}
            {selectedPermission && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}
                    onClick={() => setSelectedPermission(null)}
                >
                    <div
                        style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', width: '90%', maxWidth: '600px', position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button onClick={() => setSelectedPermission(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#666' }}>
                            <X size={24} />
                        </button>

                        {/* Modal header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', borderBottom: '2px solid #f0f0f0', paddingBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ color: 'var(--color-aj-red)', padding: '15px', backgroundColor: '#fff1f2', borderRadius: '12px' }}>
                                    {(() => { const Icon = permissionConfig[selectedPermission].icon; return <Icon size={40} />; })()}
                                </div>
                                <h2 style={{ fontSize: '1.8rem', color: 'var(--color-aj-black)', margin: 0 }}>
                                    {permissionConfig[selectedPermission].label}
                                </h2>
                            </div>

                        </div>

                        {/* Modal content */}
                        {renderModalContent()}
                    </div>
                </div>
            )}

            {/* Tax Calendar Modal */}
            {showCalendar && (
                <TaxCalendarModal
                    ruc={ruc}
                    isClient={isClient}
                    onClose={() => setShowCalendar(false)}
                />
            )}
            {/* Notificación de éxito general */}
            {generalSuccessMsg && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 10000
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '16px', padding: '40px 50px',
                        textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    }}>
                        <div style={{
                            width: '70px', height: '70px', borderRadius: '50%',
                            backgroundColor: '#dcfce7', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px', color: '#22c55e'
                        }}>
                            <Check size={40} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111', marginBottom: '8px' }}>
                            {generalSuccessMsg}
                        </h3>
                        <p style={{ color: '#888', fontSize: '0.9rem' }}>Este aviso se cerrará automáticamente</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyDashboard;
