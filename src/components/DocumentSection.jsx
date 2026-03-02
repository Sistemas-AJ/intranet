import React from 'react';
import { FileText, Upload, Download, X, Maximize2, Eye, Check, Trash2 } from 'lucide-react';

const YEARS = ['2030', '2029', '2028', '2027', '2026', '2025', '2024', '2023'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const selectStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' };
const primaryBtnStyle = {
    width: '100%', padding: '15px', borderRadius: '6px', border: 'none',
    background: 'var(--color-aj-red)', color: 'white', cursor: 'pointer',
    fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
};
const secondaryBtnStyle = {
    ...primaryBtnStyle,
    background: 'var(--color-aj-black)', marginBottom: '10px'
};

/**
 * Componente reutilizable de sección de documentos.
 *
 * Props:
 * - hook          : resultado de useDocumentSection()
 * - isClient      : boolean — oculta botones de admin
 * - icon          : componente Lucide para el ícono de cada documento en lista
 * - emptyMessage  : string — texto cuando no hay docs
 * - uploadLabel   : string — label del botón de subida (ej. 'Subir Declaración Mensual')
 * - fileAccept    : string — tipos de archivo (ej. 'application/pdf')
 * - multiple      : boolean — ¿permite múltiples archivos?
 * - formTitle     : string — título del formulario de subida
 * - deleteConfirm : string — mensaje de confirmación de eliminación
 * - hasZip        : boolean — mostrar botón de descarga masiva
 * - hasType       : boolean — mostrar selector de tipo de documento
 * - typeOptions   : string[] — opciones del selector de tipo
 * - showTypeForClient: boolean — show type options for clients too
 * - extraListContent: function(item) => JSX — renderizado extra en cada fila de lista
 *
 * Todos los campos salvo `hook` e `isClient` son opcionales.
 */
const DocumentSection = ({
    hook,
    isClient,
    icon: Icon = FileText,
    emptyMessage = 'No se encontraron documentos.',
    uploadLabel = 'Subir Documento',
    fileAccept = 'application/pdf',
    multiple = false,
    formTitle = 'Subir Documento',
    deleteConfirm = '¿Eliminar este documento?',
    hasZip = false,
    hasType = false,
    typeOptions = [],
    showTypeForClient = false,
    allowClientUpload = false,
    allowClientDelete = false,
    showNonDeducible = false,
    onCustomZipDownload = null,
    extraListContent = null,
}) => {
    const [rejectionItem, setRejectionItem] = React.useState(null);
    const [rejectionComment, setRejectionComment] = React.useState('');
    const [itemToDelete, setItemToDelete] = React.useState(null);
    const [tempToast, setTempToast] = React.useState('');

    // Función para extraer datos del nombre de archivo
    const parseInvoiceFileName = (name) => {
        const cleanName = name.replace(/\.[^/.]+$/, "").trim();

        let serie = '---';
        let empresa = '---';

        // Intentar detectar Serie-Número (Ej: E001-69 o F001-123)
        const serieRegex = /[A-Z]\d{3}-\d+/i;
        const serieMatch = cleanName.match(serieRegex);

        if (serieMatch) {
            serie = serieMatch[0];
            // Lo que sobra es la empresa
            const remaining = cleanName.replace(serie, "").replace(/^[- ]+|[- ]+$/g, "").trim();
            if (remaining) empresa = remaining;
        } else {
            // Fallback: tratar de partir por guion o espacio
            const parts = cleanName.split(/[- ]+/);
            if (parts.length >= 2) {
                serie = parts[0];
                empresa = parts.slice(1).join(' ');
            } else if (parts.length === 1) {
                serie = parts[0];
            }
        }

        return { serie, empresa };
    };

    const {
        filteredList,
        availableYears,
        filterYear, setFilterYear,
        filterMonth, setFilterMonth,
        showForm, setShowForm,
        uploadYear, setUploadYear,
        uploadMonth, setUploadMonth,
        uploadType, setUploadType,
        uploadFile, setUploadFile,
        uploadFiles, setUploadFiles,
        uploadDescription, setUploadDescription,
        handleUpload,
        handleSave,
        handleDelete,
        handleDownloadZip,
        toggleNonDeducible,
        setList,
        uploadError,
        setUploadError,
        successMessage,
    } = hook;

    const [expandedDoc, setExpandedDoc] = React.useState(null);
    const inputId = `doc-upload-${Math.random().toString(36).substr(2, 5)}`;
    const inputRef = React.useRef(null);

    // Clear error when closing form or changing data
    React.useEffect(() => {
        if (!showForm) setUploadError('');
    }, [showForm, uploadYear, uploadMonth]);

    if (showForm) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{formTitle}</h3>

                {!hook.noPeriod && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                            <select value={uploadYear} onChange={e => setUploadYear(e.target.value)} style={selectStyle}>
                                <option value="">Seleccionar Año</option>
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        {!hook.noMonth && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                <select value={uploadMonth} onChange={e => setUploadMonth(e.target.value)} style={selectStyle}>
                                    <option value="">Seleccionar Mes</option>
                                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {hasType && typeOptions.length > 0 && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>Tipo de Documento</label>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            {typeOptions.map(opt => {
                                const isSelected = uploadType === opt;
                                // For clients, only show the first type option unless showTypeForClient
                                if (isClient && !showTypeForClient && opt !== typeOptions[0]) return null;
                                return (
                                    <button
                                        key={opt}
                                        onClick={() => setUploadType(opt)}
                                        style={{
                                            flex: 1, padding: '15px', borderRadius: '8px',
                                            border: `2px solid ${isSelected ? 'var(--color-aj-red)' : '#eee'}`,
                                            backgroundColor: isSelected ? '#fff1f2' : 'white',
                                            cursor: 'pointer', fontWeight: '600',
                                            color: isSelected ? 'var(--color-aj-red)' : '#555'
                                        }}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {uploadError && (
                    <div style={{
                        padding: '12px 15px',
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fca5a5',
                        borderRadius: '6px',
                        color: '#b91c1c',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        textAlign: 'center'
                    }}>
                        {uploadError}
                    </div>
                )}

                <div style={{ position: 'relative', border: '2px dashed #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    {/* Botón X negra para modo simple */}
                    {!multiple && uploadFile && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setUploadFile(null);
                                setUploadError('');
                            }}
                            style={{
                                position: 'absolute', top: '10px', right: '10px',
                                background: 'white', border: '1px solid #ccc',
                                borderRadius: '50%', width: '24px', height: '24px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', zIndex: 10
                            }}
                            title="Quitar archivo"
                        >
                            <X size={14} color="black" />
                        </button>
                    )}

                    <input
                        ref={inputRef}
                        type="file"
                        id={inputId}
                        accept={fileAccept}
                        multiple={multiple}
                        style={{ display: 'none' }}
                        onChange={handleUpload}
                    />
                    <label htmlFor={inputId} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <Upload size={32} color="var(--color-aj-red)" />
                        <span style={{ fontWeight: '500', color: '#555' }}>
                            {multiple
                                ? (uploadFiles.length > 0 ? `${uploadFiles.length} archivo(s) seleccionado(s)` : 'Seleccionar archivos')
                                : (uploadFile ? uploadFile.name : 'Seleccionar archivo')
                            }
                        </span>
                    </label>
                </div>

                {/* Tabla de archivos múltiples (modo Excel) */}
                {multiple && uploadFiles.length > 0 && (
                    <div style={{ marginTop: '10px', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>#</th>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Serie y Número</th>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Empresa</th>
                                    <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {uploadFiles.map((f, i) => {
                                    const meta = parseInvoiceFileName(f.name);
                                    const isDuplicateInQueue = uploadFiles.filter(val => val.name === f.name).length > 1;
                                    const isAlreadySaved = hook.list.some(item => item.name === f.name);
                                    const isExisting = isDuplicateInQueue || isAlreadySaved;

                                    return (
                                        <tr key={i} style={{ backgroundColor: isExisting ? '#fee2e2' : 'white' }}>
                                            <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{i + 1}</td>
                                            <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{meta.serie}</td>
                                            <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{meta.empresa}</td>
                                            <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setUploadFiles(prev => prev.filter((_, idx) => idx !== i));
                                                        setUploadError('');
                                                        setTempToast('Comprobante eliminado');
                                                        setTimeout(() => setTempToast(''), 2000);
                                                    }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', margin: '0 auto' }}
                                                    title="Quitar"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
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

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Descripción (Opcional)</label>
                    <textarea
                        value={uploadDescription}
                        onChange={e => setUploadDescription(e.target.value)}
                        placeholder="Escribe una breve descripción aquí..."
                        style={{ ...selectStyle, height: '80px', resize: 'none' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => setShowForm(false)}
                        style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            // Validar duplicados antes de guardar
                            const hasDuplicates = multiple
                                ? uploadFiles.some(f => uploadFiles.filter(v => v.name === f.name).length > 1 || hook.list.some(saved => saved.name === f.name))
                                : (uploadFile && hook.list.some(saved => saved.name === uploadFile.name));

                            if (hasDuplicates) {
                                setUploadError('No puedes guardar archivos duplicados. Elimina las filas rojas primero.');
                                return;
                            }
                            handleSave({ uploadedBy: isClient ? 'client' : 'admin' });
                        }}
                        style={{
                            padding: '10px 20px', borderRadius: '4px', border: 'none',
                            background: 'var(--color-aj-black)', color: 'white', cursor: 'pointer',
                            opacity: (multiple && uploadFiles.some(f => uploadFiles.filter(v => v.name === f.name).length > 1 || hook.list.some(saved => saved.name === f.name))) ? 0.5 : 1
                        }}
                    >
                        Guardar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Filters */}
            {!hook.noPeriod && (
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                        <select
                            value={filterYear}
                            onChange={e => { setFilterYear(e.target.value); setFilterMonth(''); }}
                            style={selectStyle}
                        >
                            <option value="">Todos los años</option>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    {!hook.noMonth && (
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                            <select
                                value={filterMonth}
                                onChange={e => setFilterMonth(e.target.value)}
                                style={selectStyle}
                                disabled={!filterYear}
                            >
                                <option value="">Todos los meses</option>
                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* List */}
            <div style={{
                flex: 1, backgroundColor: '#f9f9f9', borderRadius: '8px',
                border: '1px solid #eee', overflowY: 'auto',
                minHeight: '300px', maxHeight: '500px', padding: '10px'
            }}>
                {filteredList.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredList.map(item => (
                            <div
                                key={item.id}
                                style={{
                                    display: 'flex', alignItems: 'stretch', gap: '0',
                                    backgroundColor: item.isNonDeducible ? '#fee2e2' : 'white',
                                    borderRadius: '8px', border: `1px solid ${item.isNonDeducible ? '#fca5a5' : '#e5e7eb'}`,
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Preview thumbnail */}
                                {!!item.url && !!item.name && /\.(pdf|png|jpe?g|gif|webp)$/i.test(item.name) && (
                                    <div
                                        className="preview-thumb-container"
                                        style={{
                                            width: '120px', minHeight: '80px',
                                            backgroundColor: '#f3f4f6', borderRight: '1px solid #e5e7eb',
                                            position: 'relative', overflow: 'hidden', flexShrink: 0,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setExpandedDoc(item)}
                                    >
                                        {/\.(png|jpe?g|gif|webp)$/i.test(item.name) ? (
                                            <img src={item.url} alt={item.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <iframe src={item.url} title={item.name}
                                                style={{ width: '200%', height: '200%', border: 'none', transform: 'scale(0.5)', transformOrigin: 'top left', pointerEvents: 'none' }} />
                                        )}
                                        {/* Overlay on hover */}
                                        <div className="preview-overlay" style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                            backgroundColor: 'rgba(0,0,0,0.4)', color: 'white',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            opacity: 0, transition: 'opacity 0.2s', gap: '5px'
                                        }}>
                                            <Eye size={24} />
                                            <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>VER</span>
                                        </div>
                                        <style>{`
                                            .preview-thumb-container:hover .preview-overlay { opacity: 1 !important; }
                                        `}</style>
                                    </div>
                                )}

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '15px', padding: '15px' }}>
                                    <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '8px', color: '#2563eb', flexShrink: 0 }}>
                                        <Icon size={24} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span
                                                style={{
                                                    fontWeight: '600',
                                                    minWidth: 0,
                                                    overflowWrap: 'anywhere',
                                                    wordBreak: 'break-word',
                                                    lineHeight: '1.4'
                                                }}
                                                title={item.name}
                                            >
                                                {item.name}
                                            </span>
                                            {!!item.type && item.type !== 'Documento' && (
                                                <span style={{
                                                    fontSize: '0.75rem', padding: '2px 8px',
                                                    borderRadius: '12px', backgroundColor: '#dbeafe',
                                                    color: '#1e40af', fontWeight: '600', border: '1px solid #bfdbfe',
                                                    flexShrink: 0
                                                }}>
                                                    {item.type}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                            {new Date(item.timestamp).toLocaleDateString()}
                                            {!hook.noPeriod && <> - {!hook.noMonth && <>{item.month} </>}{item.year}</>}
                                        </div>
                                        {!!extraListContent && extraListContent(item)}
                                        {!!item.description && (
                                            <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '6px', fontStyle: 'italic', backgroundColor: '#f3f4f6', padding: '6px 10px', borderRadius: '4px' }}>
                                                <strong>Descripción:</strong> {item.description}
                                            </div>
                                        )}
                                        {!!item.isNonDeducible && (
                                            <div style={{ marginTop: '8px', padding: '8px', borderRadius: '6px', backgroundColor: '#fff1f2', border: '1px solid #fecaca' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#e11d48', textTransform: 'uppercase', marginBottom: '2px' }}>No Deducible</div>
                                                {!!item.adminComment && <div style={{ fontSize: '0.85rem', color: '#9f1239' }}><strong>Motivo:</strong> {item.adminComment}</div>}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, alignSelf: 'center' }}>
                                        <a
                                            href={item.url}
                                            download={item.name}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#64748b', display: 'flex' }}
                                            title="Descargar"
                                        >
                                            <Download size={20} />
                                        </a>

                                        {!isClient && showNonDeducible && (
                                            <div style={{ display: 'flex' }}>
                                                {!item.isNonDeducible ? (
                                                    <button
                                                        onClick={() => {
                                                            setRejectionItem(item);
                                                            setRejectionComment('');
                                                        }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0', display: 'flex' }}
                                                        title="Marcar como No Deducible"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            toggleNonDeducible(item.id, false);
                                                        }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e', padding: '0', display: 'flex' }}
                                                        title="Volver a marcar como Deducible"
                                                    >
                                                        <Check size={20} />
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {(!isClient || (allowClientDelete && item.uploadedBy === 'client')) && (
                                            <button
                                                onClick={() => setItemToDelete(item)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0', display: 'flex' }}
                                                onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                                                onMouseOut={e => e.currentTarget.style.color = '#64748b'}
                                                title="Eliminar"
                                            >
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
                        <Icon size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                        <p>{emptyMessage}</p>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            {hasZip && (
                <button onClick={onCustomZipDownload || handleDownloadZip} style={secondaryBtnStyle}>
                    <Download size={20} />
                    Descargas masivas
                </button>
            )}
            {(!isClient || allowClientUpload) && (
                <button onClick={() => setShowForm(true)} style={primaryBtnStyle}>
                    <Upload size={20} />
                    {uploadLabel}
                </button>
            )}
            {/* Expanded Preview Modal */}
            {expandedDoc && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex',
                        flexDirection: 'column', zIndex: 9999
                    }}
                    onClick={() => setExpandedDoc(null)}
                >
                    {/* Top bar */}
                    <div
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '15px 25px', backgroundColor: 'var(--color-aj-black)', color: 'white'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Eye size={20} />
                            <span style={{ fontWeight: '600', fontSize: '1rem' }}>{expandedDoc.name}</span>
                            {!!expandedDoc.month && <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>— {expandedDoc.month} {expandedDoc.year}</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <a
                                href={expandedDoc.url}
                                download={expandedDoc.name}
                                target="_blank"
                                rel="noopener noreferrer"
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
                                onClick={() => setExpandedDoc(null)}
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
                    {/* Preview area */}
                    <div
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/\.(png|jpe?g|gif|webp)$/i.test(expandedDoc.name) ? (
                            <img src={expandedDoc.url} alt={expandedDoc.name}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 30px rgba(0,0,0,0.4)' }} />
                        ) : (
                            <iframe
                                src={expandedDoc.url} title={expandedDoc.name}
                                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px', boxShadow: '0 4px 30px rgba(0,0,0,0.4)', backgroundColor: 'white' }}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Eliminación Personalizado */}
            {itemToDelete && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
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
                                    handleDelete(itemToDelete.id, isClient);
                                    setItemToDelete(null);
                                    setTempToast('Comprobante eliminado');
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

            {/* Modal de Motivo de Rechazo (No Deducible) */}
            {rejectionItem && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 3000
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '30px', borderRadius: '12px',
                        width: '90%', maxWidth: '450px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{ margin: '0 0 15px', color: '#1e293b' }}>Añadir motivo de eliminación</h3>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '15px' }}>
                            Describe el motivo por el cual este documento es NO DEDUCIBLE. (Opcional)
                        </p>
                        <textarea
                            value={rejectionComment}
                            onChange={(e) => setRejectionComment(e.target.value)}
                            placeholder="Escribe el motivo aquí..."
                            style={{
                                width: '100%', height: '100px', padding: '12px',
                                borderRadius: '8px', border: '2px solid #e2e8f0',
                                marginBottom: '20px', resize: 'none', fontSize: '0.95rem'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setRejectionItem(null)}
                                style={{
                                    padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                    backgroundColor: 'white', color: '#64748b', fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    toggleNonDeducible(rejectionItem.id, true, rejectionComment);
                                    setRejectionItem(null);
                                }}
                                style={{
                                    padding: '10px 25px', borderRadius: '8px', border: 'none',
                                    backgroundColor: 'var(--color-aj-red)', color: 'white',
                                    fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Notificación de éxito */}
            {successMessage && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '16px', padding: '40px 50px',
                        textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                        animation: 'fadeIn 0.3s ease'
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
                            {successMessage}
                        </h3>
                        <p style={{ color: '#888', fontSize: '0.9rem' }}>Este aviso se cerrará automáticamente</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(DocumentSection);
