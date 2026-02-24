import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    User, LogOut, FileText, Calendar, CalendarDays, FileBarChart,
    Users, ShieldCheck, Landmark, Wallet, ShoppingCart, TrendingUp,
    Upload, Download, X, FolderDown, Maximize2, Eye, Bell, Trash2, Clock, Check
} from 'lucide-react';
import logo from './assets/LogoSolo.png';
import bgImage from './assets/bg-accountants.png';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import useDocumentSection from './hooks/useDocumentSection';
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
                    const response = await fetch(doc.url);
                    const blob = await response.blob();
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
    const [expandedAnnualDoc, setExpandedAnnualDoc] = React.useState(null);
    const [isDownloadingZip, setIsDownloadingZip] = React.useState(false);
    const [successMsg, setSuccessMsg] = React.useState('');
    const [itemToDelete, setItemToDelete] = React.useState(null);
    const [tempToast, setTempToast] = React.useState('');

    const { list, setList, showForm, setShowForm, uploadYear, setUploadYear, uploadFile, setUploadFile, handleUpload, setMetadata } = hook;

    const handleSave = async (extraFields = {}) => {
        if (!uploadYear || !uploadFile) {
            alert('Por favor complete todos los campos');
            return;
        }
        const base64Url = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(uploadFile);
        });
        const newItem = {
            id: Date.now(),
            year: uploadYear,
            url: base64Url,
            name: uploadFile.name,
            uploadedBy: isClient ? 'client' : 'admin',
            seenByClient: !isClient ? false : true,
            seenByAdmin: isClient ? false : true,
            ...extraFields
        };
        const exists = list.some(d => d.year === uploadYear);
        if (exists) {
            setList(prev => prev.map(d => d.year === uploadYear ? newItem : d));
        } else {
            setList(prev => [...prev, newItem]);
        }

        // Notification logic
        if (isClient) {
            setMetadata(prev => ({ ...prev, unreadForAdmin: true }));
        } else {
            setMetadata(prev => ({ ...prev, unreadForClient: true }));
        }

        setShowForm(false);
        setUploadYear('');
        setUploadFile(null);
        setSuccessMsg('El archivo se subió correctamente');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleDelete = (id) => {
        setList(prev => prev.filter(d => d.id !== id));
        if (isClient) {
            setMetadata(prev => ({ ...prev, unreadForAdmin: true }));
        } else {
            setMetadata(prev => ({ ...prev, unreadForClient: true }));
        }
    };

    const filteredList = list.filter(d => !hook.filterYear || d.year === hook.filterYear);
    const selectStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' };

    const handleBulkDownload = async () => {
        if (list.length === 0) { alert('No hay declaraciones para descargar.'); return; }
        setIsDownloadingZip(true);
        try {
            const zip = new JSZip();
            for (const decl of list) {
                if (decl.url && decl.name && decl.year) {
                    const folder = zip.folder(decl.year);
                    const response = await fetch(decl.url);
                    const blob = await response.blob();
                    folder.file(decl.name, blob);
                }
            }
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `Declaraciones_Anuales_${ruc}.zip`);
        } catch (error) {
            console.error('Error generando ZIP:', error);
            alert('Error al generar el archivo ZIP.');
        }
        setIsDownloadingZip(false);
    };

    if (showForm) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Subir Declaración Anual</h3>
            <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                <select value={uploadYear} onChange={e => setUploadYear(e.target.value)} style={selectStyle}>
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
                <button onClick={() => handleSave()} style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: 'var(--color-aj-black)', color: 'white', cursor: 'pointer' }}>Guardar</button>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Filtrar por Año</label>
                <select value={hook.filterYear} onChange={e => hook.setFilterYear(e.target.value)} style={selectStyle}>
                    <option value="">Todos los años</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div style={{ flex: 1, backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', overflowY: 'auto', minHeight: '300px', maxHeight: '500px', padding: '10px' }}>
                {filteredList.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredList.map(decl => (
                            <div key={decl.id}
                                style={{
                                    display: 'flex', alignItems: 'stretch', gap: '0',
                                    backgroundColor: 'white', borderRadius: '8px',
                                    border: '1px solid #e5e7eb', overflow: 'hidden'
                                }}>
                                {/* Preview thumbnail */}
                                {decl.url && decl.name && /\.(pdf|png|jpe?g|gif|webp)$/i.test(decl.name) && (
                                    <div
                                        style={{
                                            width: '120px', minHeight: '80px',
                                            backgroundColor: '#f3f4f6', borderRight: '1px solid #e5e7eb',
                                            position: 'relative', overflow: 'hidden', flexShrink: 0,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setExpandedAnnualDoc(decl)}
                                        title="Ver vista previa"
                                    >
                                        {/\.(png|jpe?g|gif|webp)$/i.test(decl.name) ? (
                                            <img src={decl.url} alt={decl.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <iframe src={decl.url} title={decl.name}
                                                style={{ width: '200%', height: '200%', border: 'none', transform: 'scale(0.5)', transformOrigin: 'top left', pointerEvents: 'none' }} />
                                        )}
                                    </div>
                                )}
                                {/* Info */}
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '15px', padding: '15px' }}>
                                    <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '8px', color: '#2563eb' }}><FileText size={24} /></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600' }}>{decl.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Declaración Anual {decl.year}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '2px' }}>{decl.uploadedBy === 'client' ? 'Subido por Cliente' : 'Subido por AJ'}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button
                                            onClick={() => setExpandedAnnualDoc(decl)}
                                            style={{
                                                background: 'var(--color-aj-red)', border: 'none', cursor: 'pointer',
                                                color: 'white', borderRadius: '6px', padding: '8px 12px',
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                fontSize: '0.8rem', fontWeight: '600', transition: 'background 0.2s'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.background = '#b91c1c'}
                                            onMouseOut={e => e.currentTarget.style.background = 'var(--color-aj-red)'}
                                            title="Expandir vista previa"
                                        >
                                            <Maximize2 size={16} />
                                            <span>Ver</span>
                                        </button>
                                        <a href={decl.url} download={decl.name} style={{ color: '#666', display: 'flex' }}>
                                            <Download size={20} />
                                        </a>
                                        {!isClient && (
                                            <button onClick={e => { e.preventDefault(); e.stopPropagation(); setItemToDelete(decl); }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}
                                                onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                                                onMouseOut={e => e.currentTarget.style.color = '#64748b'}
                                                title="Eliminar">
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
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
            {list.length > 0 && (
                <button
                    onClick={handleBulkDownload}
                    disabled={isDownloadingZip}
                    style={{
                        width: '100%', padding: '15px', borderRadius: '6px', border: 'none',
                        background: isDownloadingZip ? '#9ca3af' : 'var(--color-aj-red)',
                        color: 'white', cursor: isDownloadingZip ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                        transition: 'background 0.2s'
                    }}
                >
                    <FolderDown size={20} />
                    {isDownloadingZip ? 'Generando ZIP...' : 'Descarga Masiva'}
                </button>
            )}

            {tempToast && (
                <div style={{
                    position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#333', color: 'white', padding: '10px 20px', borderRadius: '20px',
                    fontSize: '0.9rem', zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    {tempToast}
                </div>
            )}

            {/* Modal de Eliminación Personalizado */}
            {itemToDelete && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 12100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', maxWidth: '450px', width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ backgroundColor: '#fee2e2', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#ef4444' }}>
                            <Trash2 size={30} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '15px', color: '#111' }}>Confirmar acción</h3>
                        <p style={{ color: '#555', marginBottom: '25px', lineHeight: '1.6' }}>
                            Estimado usuario, ¿Seguro que desea eliminar el comprobante <strong>{itemToDelete.name}</strong>?
                        </p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button
                                onClick={() => setItemToDelete(null)}
                                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    handleDelete(itemToDelete.id);
                                    setItemToDelete(null);
                                    setTempToast('Declaración eliminada');
                                    setTimeout(() => setTempToast(''), 3000);
                                }}
                                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Vista Expandida */}
            {expandedAnnualDoc && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 12000,
                        display: 'flex', flexDirection: 'column'
                    }}
                    onClick={() => setExpandedAnnualDoc(null)}
                >
                    <div
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '15px 25px', backgroundColor: 'var(--color-aj-black)', color: 'white'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Eye size={20} />
                            <span style={{ fontWeight: '600', fontSize: '1rem' }}>{expandedAnnualDoc.name}</span>
                            <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>— Año {expandedAnnualDoc.year}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <a
                                href={expandedAnnualDoc.url} download={expandedAnnualDoc.name}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    backgroundColor: 'var(--color-aj-red)', color: 'white',
                                    padding: '8px 16px', borderRadius: '6px', textDecoration: 'none',
                                    fontSize: '0.85rem', fontWeight: '600'
                                }}
                            >
                                <Download size={16} /> Descargar
                            </a>
                            <button
                                onClick={() => setExpandedAnnualDoc(null)}
                                style={{
                                    background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
                                    color: 'white', cursor: 'pointer', borderRadius: '6px',
                                    padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <X size={16} /> Cerrar
                            </button>
                        </div>
                    </div>
                    <div
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/\.(png|jpe?g|gif|webp)$/i.test(expandedAnnualDoc.name) ? (
                            <img src={expandedAnnualDoc.url} alt={expandedAnnualDoc.name}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 30px rgba(0,0,0,0.4)' }} />
                        ) : (
                            <iframe
                                src={expandedAnnualDoc.url} title={expandedAnnualDoc.name}
                                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px', boxShadow: '0 4px 30px rgba(0,0,0,0.4)', backgroundColor: 'white' }}
                            />
                        )}
                    </div>
                </div>
            )}
            {/* Notificación de éxito */}
            {successMsg && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px 50px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#22c55e' }}>
                            <Check size={40} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111', marginBottom: '8px' }}>{successMsg}</h3>
                        <p style={{ color: '#888', fontSize: '0.9rem' }}>Este aviso se cerrará automáticamente</p>
                    </div>
                </div>
            )}
        </div>
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

// ─── Generic File Preview (Ficha RUC, Reporte Tributario) ─────────────────────
const GenericFilePreview = ({ files, selectedPermission, isClient, onFileUpload }) => {
    const [expanded, setExpanded] = React.useState(false);
    const fileData = files[selectedPermission];

    if (!fileData) {
        return (
            <div style={{ color: '#555', lineHeight: '1.6', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', border: '2px dashed #eee', borderRadius: '8px', padding: '40px' }}>
                    <FileText size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                    <p>No ha subido ningún documento para este permiso.</p>
                    <p style={{ fontSize: '0.9rem' }}>Utilice el botón "Subir Archivo" para adjuntar un PDF.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ color: '#555', lineHeight: '1.6', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ flex: 1, backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', overflow: 'hidden', height: '500px' }}>
                    {/\.(png|jpe?g|gif|webp)$/i.test(fileData.name) ? (
                        <img src={fileData.url} alt={fileData.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                        <iframe src={fileData.url} title="PDF Preview" style={{ width: '100%', height: '100%', border: 'none' }} />
                    )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                        onClick={() => setExpanded(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            backgroundColor: 'var(--color-aj-red)', color: 'white',
                            padding: '10px 20px', borderRadius: '6px', border: 'none',
                            fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#b91c1c'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--color-aj-red)'}
                    >
                        <Maximize2 size={18} /> Expandir
                    </button>
                    <a href={fileData.url} download={fileData.name}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-aj-black)', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem' }}>
                        <Download size={18} /> Descargar
                    </a>
                </div>
            </div>

            {/* Fullscreen expanded modal */}
            {expanded && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex',
                        flexDirection: 'column', zIndex: 9999
                    }}
                    onClick={() => setExpanded(false)}
                >
                    <div
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '15px 25px', backgroundColor: 'var(--color-aj-black)', color: 'white'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Eye size={20} />
                            <span style={{ fontWeight: '600', fontSize: '1rem' }}>{fileData.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <a
                                href={fileData.url} download={fileData.name}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    backgroundColor: 'var(--color-aj-red)', color: 'white',
                                    padding: '8px 16px', borderRadius: '6px', textDecoration: 'none',
                                    fontSize: '0.85rem', fontWeight: '600'
                                }}
                            >
                                <Download size={16} /> Descargar
                            </a>
                            <button
                                onClick={() => setExpanded(false)}
                                style={{
                                    background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
                                    color: 'white', cursor: 'pointer', borderRadius: '6px',
                                    padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <X size={16} /> Cerrar
                            </button>
                        </div>
                    </div>
                    <div
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/\.(png|jpe?g|gif|webp)$/i.test(fileData.name) ? (
                            <img src={fileData.url} alt={fileData.name}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 30px rgba(0,0,0,0.4)' }} />
                        ) : (
                            <iframe
                                src={fileData.url} title={fileData.name}
                                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px', boxShadow: '0 4px 30px rgba(0,0,0,0.4)', backgroundColor: 'white' }}
                            />
                        )}
                    </div>
                </div>
            )}
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
    const [showCalendar, setShowCalendar] = React.useState(false);
    const [generalSuccessMsg, setGeneralSuccessMsg] = React.useState('');

    // ─── Lógica de Alerta de Vencimiento ─────────────────────────────────────
    const getDigitGroup = (r) => {
        const last = r.charAt(r.length - 1);
        const map = { '0': '0', '1': '1', '2': '2y3', '3': '2y3', '4': '4y5', '5': '4y5', '6': '6y7', '7': '6y7', '8': '8y9', '9': '8y9' };
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



    // Generic single-file sections (fichaRuc, reporteTributario) – sincronizadas con servidor
    const genericStorageKey = `docs_${ruc}_genericFiles`;
    const [files, setFiles] = React.useState({});
    const [genericLoaded, setGenericLoaded] = React.useState(false);

    // Cargar archivos genéricos desde servidor al montar
    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            let data = {};
            try {
                const res = await fetch(`/api/docs?key=${encodeURIComponent(genericStorageKey)}`);
                if (res.ok) {
                    const parsed = await res.json();
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 0) {
                        data = parsed;
                    }
                }
            } catch (e) { console.warn('Error cargando genéricos:', e); }

            // Si servidor vacío, migrar de localStorage
            if (Object.keys(data).length === 0) {
                try {
                    const saved = localStorage.getItem(genericStorageKey);
                    if (saved) {
                        const localData = JSON.parse(saved);
                        if (localData && typeof localData === 'object' && !Array.isArray(localData) && Object.keys(localData).length > 0) {
                            data = localData;
                            fetch('/api/docs', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ key: genericStorageKey, data: localData }),
                            }).catch(() => { });
                        }
                    }
                } catch { /* vacío */ }
            }

            if (!cancelled) {
                setFiles(data);
                setGenericLoaded(true);
            }
        })();
        return () => { cancelled = true; };
    }, [genericStorageKey]);

    // Persistir archivos genéricos en servidor + localStorage (solo tras loaded)
    React.useEffect(() => {
        if (!genericLoaded) return;
        try {
            localStorage.setItem(genericStorageKey, JSON.stringify(files));
        } catch (e) {
            console.error('Error guardando archivos genéricos:', e);
        }
        fetch('/api/docs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: genericStorageKey, data: files }),
        }).catch(e => console.error('Error sync genéricos:', e));
    }, [files, genericStorageKey, genericLoaded]);

    // ── Hooks para secciones de documentos ──────────────────────────────────
    const compName = company?.razonSocial || ruc;
    const declaracionesMensuales = useDocumentSection({ sectionLabel: 'Declaraciones Mensuales', companyName: compName, storageKey: `docs_${ruc}_declaracionesMensuales` });
    const declaracionesAnuales = useDocumentSection({ sectionLabel: 'Declaraciones Anuales', companyName: compName, storageKey: `docs_${ruc}_declaracionesAnuales` });
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

        if (sectionKey === 'plame') return isUnread(plame_boletas) || isUnread(plame_constancias) || isUnread(plame_nps);
        if (sectionKey === 'otrosDocumentos') return isUnread(otros_notificaciones) || isUnread(otros_varios) || isUnread(otros_constitucion);

        const hks = {
            declaracionesMensuales, declaracionesAnuales, afpNet, bancos, cajaChica, compras, ventas
        };
        return isUnread(hks[sectionKey]);
    }, [isClient, plame_boletas, plame_constancias, plame_nps, otros_notificaciones, otros_varios, otros_constitucion, declaracionesMensuales, declaracionesAnuales, afpNet, bancos, cajaChica, compras, ventas]);

    // Global Notification Helper
    const hasAnyUnread = React.useMemo(() =>
        Object.keys(permissionConfig).some(key => hasSectionUnread(key)),
        [hasSectionUnread]
    );

    // ─── Agregador de Notificaciones Detalladas ────────────────────────────
    const allHooks = [
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
    }, [declaracionesMensuales.metadata, declaracionesAnuales.metadata, afpNet.metadata, bancos.metadata, cajaChica.metadata, compras.metadata, ventas.metadata, plame_boletas.metadata, plame_constancias.metadata, plame_nps.metadata, otros_notificaciones.metadata, otros_varios.metadata, otros_constitucion.metadata]);

    const hasUnreadEvents = React.useMemo(() => {
        return allHooks.some(hook => hook.metadata?.unreadForAdmin);
    }, [declaracionesMensuales.metadata, declaracionesAnuales.metadata, afpNet.metadata, bancos.metadata, cajaChica.metadata, compras.metadata, ventas.metadata, plame_boletas.metadata, plame_constancias.metadata, plame_nps.metadata, otros_notificaciones.metadata, otros_varios.metadata, otros_constitucion.metadata]);

    const markAllAsRead = React.useCallback(() => {
        allHooks.forEach(hook => hook.markAsRead());
    }, [allHooks]);

    const clearAllNotifications = React.useCallback(() => {
        allHooks.forEach(hook => hook.clearNotifications());
    }, [allHooks]);

    const [showNotifications, setShowNotifications] = React.useState(false);

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
                    declaracionesMensuales, declaracionesAnuales, afpNet, bancos, cajaChica, compras, ventas
                };
                markAsSeen(hks[selectedPermission]);
            }
        }
    }, [selectedPermission, isClient, declaracionesMensuales, declaracionesAnuales, plame_boletas, plame_constancias, plame_nps, afpNet, bancos, cajaChica, compras, ventas, otros_notificaciones, otros_varios, otros_constitucion]);

    // ── Descarga Masiva para Compras (excluir no deducibles) ──────────────────
    const handleComprasBulkDownload = async () => {
        const allDocs = (compras.list || []).filter(doc => !doc.isNonDeducible);
        if (allDocs.length === 0) { alert('No hay comprobantes deducibles para descargar.'); return; }
        try {
            const zip = new JSZip();
            for (const doc of allDocs) {
                if (doc.url && doc.name && doc.year && doc.month) {
                    const folder = zip.folder(doc.year).folder(doc.month);
                    const response = await fetch(doc.url);
                    const blob = await response.blob();
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
                    const response = await fetch(doc.url);
                    const blob = await response.blob();
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
                                const response = await fetch(doc.url);
                                const blob = await response.blob();
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
                            const response = await fetch(fileData.url);
                            const blob = await response.blob();
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

    const handleGenericFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && selectedPermission) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFiles(prev => ({ ...prev, [selectedPermission]: { url: e.target.result, name: file.name } }));
                setGeneralSuccessMsg('El archivo se subió correctamente');
                setTimeout(() => setGeneralSuccessMsg(''), 3000);
            };
            reader.readAsDataURL(file);
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
                        allowClientUpload={true}
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
