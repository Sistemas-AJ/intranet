import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    User, LogOut, FileText, Calendar, CalendarDays, FileBarChart,
    Users, ShieldCheck, Landmark, Wallet, ShoppingCart, TrendingUp,
    Upload, Download, X
} from 'lucide-react';
import logo from './assets/LogoSolo.png';
import bgImage from './assets/bg-accountants.png';

import useDocumentSection from './hooks/useDocumentSection';
import DocumentSection from './components/DocumentSection';
import PlameSection from './components/PlameSection';

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

// ─── Declaraciones Mensuales (single file, año+mes, with filter) ──────────────
const DeclaracionesMensualesSection = ({ isClient }) => {
    const hook = useDocumentSection({ multiple: false });
    return (
        <DocumentSection
            hook={hook}
            isClient={isClient}
            icon={FileText}
            emptyMessage="No se encontraron declaraciones para los filtros seleccionados."
            uploadLabel="Subir Declaración Mensual"
            formTitle="Subir Nueva Declaración"
            deleteConfirm="¿Eliminar esta declaración?"
            fileAccept="application/pdf"
        />
    );
};

// ─── Declaraciones Anuales (sin mes) ─────────────────────────────────────────
const DeclaracionesAnualesSection = ({ isClient }) => {
    const [list, setList] = React.useState([]);
    const [filterYear, setFilterYear] = React.useState('');
    const [showForm, setShowForm] = React.useState(false);
    const [uploadYear, setUploadYear] = React.useState('');
    const [uploadFile, setUploadFile] = React.useState(null);

    const availableYears = [...new Set(list.map(d => d.year))].sort().reverse();
    const filteredList = list.filter(d => !filterYear || d.year === filterYear);

    const handleSave = () => {
        if (!uploadYear || !uploadFile) { alert('Por favor complete todos los campos'); return; }
        setList(prev => [...prev, {
            id: Date.now(), year: uploadYear,
            url: URL.createObjectURL(uploadFile),
            name: uploadFile.name,
        }]);
        setFilterYear(uploadYear);
        setUploadYear(''); setUploadFile(null); setShowForm(false);
    };

    const select = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' };

    if (showForm) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Subir Declaración Anual</h3>
            <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                <select value={uploadYear} onChange={e => setUploadYear(e.target.value)} style={select}>
                    <option value="">Seleccionar Año</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            <div style={{ border: '2px dashed #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                <input type="file" id="annual-upload" accept="application/pdf" style={{ display: 'none' }} onChange={e => setUploadFile(e.target.files[0])} />
                <label htmlFor="annual-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <Upload size={32} color="var(--color-aj-red)" />
                    <span style={{ fontWeight: '500', color: '#555' }}>{uploadFile ? uploadFile.name : 'Seleccionar PDF de Declaración Anual'}</span>
                </label>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleSave} style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: 'var(--color-aj-black)', color: 'white', cursor: 'pointer' }}>Guardar</button>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Filtrar por Año</label>
                <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={select}>
                    <option value="">Todos los años</option>
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            <div style={{ flex: 1, backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', overflowY: 'auto', minHeight: '300px', maxHeight: '500px', padding: '10px' }}>
                {filteredList.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredList.map(decl => (
                            <a key={decl.id} href={decl.url} download={decl.name}
                                style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', textDecoration: 'none', color: 'var(--color-aj-black)' }}>
                                <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '8px', color: '#2563eb' }}><FileText size={24} /></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600' }}>{decl.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>Declaración Anual {decl.year}</div>
                                </div>
                                <Download size={20} style={{ color: '#666' }} />
                                {!isClient && (
                                    <button onClick={e => { e.preventDefault(); e.stopPropagation(); if (window.confirm('¿Eliminar?')) setList(prev => prev.filter(d => d.id !== decl.id)); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                        <X size={20} />
                                    </button>
                                )}
                            </a>
                        ))}
                    </div>
                ) : (
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column' }}>
                        <FileText size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                        <p>No se encontraron declaraciones anuales.</p>
                    </div>
                )}
            </div>
            {!isClient && (
                <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: '15px', borderRadius: '6px', border: 'none', background: 'var(--color-aj-black)', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                    <Upload size={20} /> Subir Declaración Anual
                </button>
            )}
        </div>
    );
};

// ─── Otros Documentos (con categorías) ───────────────────────────────────────
const OtrosDocumentosSection = ({ isClient }) => {
    const [category, setCategory] = React.useState(null);
    const hook = useDocumentSection({ multiple: false });

    const CATEGORIES = [
        { id: 'notificaciones', label: 'Notificaciones SUNAT', icon: FileText },
        { id: 'varios', label: 'Documentos Varios', icon: FileText },
        { id: 'constitucion', label: 'Documentos de Constitución de empresas', icon: FileBarChart, centered: true },
    ];

    const filteredByCategory = {
        ...hook,
        filteredList: hook.filteredList.filter(d => d.category === category),
        availableYears: [...new Set(hook.list.filter(d => d.category === category).map(d => d.year))].sort().reverse(),
    };

    const handleSaveWithCategory = () => {
        hook.handleSave({ category });
    };

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

    // Override handleSave to inject category
    const hookWithCategory = {
        ...filteredByCategory,
        handleSave: handleSaveWithCategory,
    };

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
                hook={hookWithCategory}
                isClient={isClient && category !== 'constitucion'}
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

// ─── CompanyDashboard ────────────────────────────────────────────────────────
const CompanyDashboard = () => {
    const { ruc } = useParams();
    const navigate = useNavigate();

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const isClient = currentUser?.role === 'client';

    const [company, setCompany] = React.useState(null);
    const [selectedPermission, setSelectedPermission] = React.useState(null);
    // Generic single-file sections (fichaRuc, reporteTributario)
    const [files, setFiles] = React.useState({});

    // ── Hooks para secciones de documentos ──────────────────────────────────
    const afpNet = useDocumentSection({ hasType: true });
    const bancos = useDocumentSection({ hasType: true });
    const cajaChica = useDocumentSection({ hasType: true });
    const compras = useDocumentSection({ multiple: true, hasZip: true, zipLabel: 'compras' });
    const ventas = useDocumentSection({ multiple: true, hasZip: true, zipLabel: 'ventas' });

    React.useEffect(() => {
        const saved = localStorage.getItem('companies');
        if (saved) {
            const companies = JSON.parse(saved);
            setCompany(companies.find(c => c.ruc === ruc));
        }
    }, [ruc]);

    const handleLogout = () => {
        if (isClient) { localStorage.removeItem('currentUser'); navigate('/'); }
        else navigate('/dashboard');
    };

    const handleGenericFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && selectedPermission) {
            setFiles(prev => ({ ...prev, [selectedPermission]: { url: URL.createObjectURL(file), name: file.name } }));
        }
    };

    if (!company) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando datos de la empresa...</div>;

    const activePermissions = Object.entries(company.permissions || {}).filter(([, v]) => v).map(([k]) => k);
    const permissionLabelsList = activePermissions.map(k => permissionConfig[k]?.label).filter(Boolean).join(', ');

    // Permissions with custom sections (no generic upload button)
    const CUSTOM_PERMISSIONS = ['declaracionesMensuales', 'declaracionesAnuales', 'plame', 'afpNet', 'bancos', 'cajaChica', 'compras', 'ventas', 'otrosDocumentos'];

    const renderModalContent = () => {
        switch (selectedPermission) {
            case 'declaracionesMensuales':
                return <DeclaracionesMensualesSection isClient={isClient} />;
            case 'declaracionesAnuales':
                return <DeclaracionesAnualesSection isClient={isClient} />;
            case 'plame':
                return <PlameSection isClient={isClient} />;
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
                        showTypeForClient={false}
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
                    />
                );
            case 'compras':
                return (
                    <DocumentSection
                        hook={compras}
                        isClient={isClient}
                        icon={ShoppingCart}
                        emptyMessage="No se encontraron comprobantes de compras."
                        uploadLabel="Subir compras"
                        formTitle="Subir Comprobantes de Compras"
                        deleteConfirm="¿Eliminar comprobante?"
                        multiple
                        hasZip
                    />
                );
            case 'ventas':
                return (
                    <DocumentSection
                        hook={ventas}
                        isClient={isClient}
                        icon={TrendingUp}
                        emptyMessage="No se encontraron comprobantes de ventas."
                        uploadLabel="Subir ventas"
                        formTitle="Subir Comprobantes de Ventas"
                        deleteConfirm="¿Eliminar comprobante?"
                        multiple
                        hasZip
                    />
                );
            case 'otrosDocumentos':
                return <OtrosDocumentosSection isClient={isClient} />;
            default:
                // Generic single-file section (Ficha RUC, Reporte Tributario, etc.)
                return (
                    <div style={{ color: '#555', lineHeight: '1.6', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                        {files[selectedPermission] ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ flex: 1, backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', overflow: 'hidden', height: '600px' }}>
                                    <iframe src={files[selectedPermission].url} title="PDF Preview" style={{ width: '100%', height: '100%', border: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <a href={files[selectedPermission].url} download={files[selectedPermission].name}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-aj-black)', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem' }}>
                                        <Download size={18} /> Descargar PDF
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', border: '2px dashed #eee', borderRadius: '8px', padding: '40px' }}>
                                <FileText size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                                <p>No ha subido ningún documento para este permiso.</p>
                                <p style={{ fontSize: '0.9rem' }}>Utilice el botón "Subir Archivo" para adjuntar un PDF.</p>
                            </div>
                        )}
                    </div>
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
                    <button
                        onClick={handleLogout}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', color: 'var(--color-aj-white)', border: '1px solid var(--color-aj-white)', padding: '8px 15px', borderRadius: '4px', transition: 'all 0.2s', fontSize: '0.9rem', cursor: 'pointer' }}
                        onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--color-aj-white)'; e.currentTarget.style.color = 'var(--color-aj-black)'; }}
                        onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-aj-white)'; }}
                    >
                        <LogOut size={16} />
                        <span>{isClient ? 'Cerrar Sesión' : 'Volver'}</span>
                    </button>
                </div>
            </header>

            {/* Main */}
            <main style={{ flex: 1, padding: '40px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center', justifyContent: 'flex-start' }}>
                {/* Welcome */}
                <div style={{ width: '100%', backgroundColor: 'var(--color-aj-white)', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderLeft: '8px solid var(--color-aj-red)', textAlign: 'left' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--color-aj-black)' }}>
                        ¡Bienvenido al centro de Control de tu empresa, {company.razonSocial}!
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
                                style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', border: '1px solid #f0f0f0' }}
                                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = 'var(--color-aj-red)'; }}
                                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#f0f0f0'; }}
                            >
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

                            {/* Generic upload button (only for non-custom) */}
                            {!CUSTOM_PERMISSIONS.includes(selectedPermission) && !isClient && (
                                <div>
                                    <input type="file" id="file-upload" accept="application/pdf" style={{ display: 'none' }} onChange={handleGenericFileUpload} />
                                    <label htmlFor="file-upload" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-aj-red)', color: 'white', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}
                                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#b91c1c'}
                                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--color-aj-red)'}>
                                        <Upload size={18} /> Subir Archivo
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Modal content */}
                        {renderModalContent()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyDashboard;
