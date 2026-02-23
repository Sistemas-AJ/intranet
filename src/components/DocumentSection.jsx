import React from 'react';
import { FileText, Upload, Download, X } from 'lucide-react';

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
    extraListContent = null,
}) => {
    const {
        filteredList,
        availableYears,
        filterYear, setFilterYear,
        filterMonth, setFilterMonth,
        showForm, setShowForm,
        uploadYear, setUploadYear,
        uploadMonth, setUploadMonth,
        uploadType, setUploadType,
        uploadFile,
        uploadFiles,
        handleUpload,
        handleSave,
        handleDelete,
        handleDownloadZip,
    } = hook;

    const inputId = `doc-upload-${Math.random().toString(36).substr(2, 5)}`;
    const inputRef = React.useRef(null);

    if (showForm) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{formTitle}</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                        <select value={uploadYear} onChange={e => setUploadYear(e.target.value)} style={selectStyle}>
                            <option value="">Seleccionar Año</option>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                        <select value={uploadMonth} onChange={e => setUploadMonth(e.target.value)} style={selectStyle}>
                            <option value="">Seleccionar Mes</option>
                            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>

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

                <div style={{ border: '2px dashed #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
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
                    {multiple && uploadFiles.length > 0 && (
                        <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#666', maxHeight: '100px', overflowY: 'auto' }}>
                            {uploadFiles.map((f, i) => <div key={i}>{f.name}</div>)}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => setShowForm(false)}
                        style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => handleSave()}
                        style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: 'var(--color-aj-black)', color: 'white', cursor: 'pointer' }}
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
            <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                    <select
                        value={filterYear}
                        onChange={e => { setFilterYear(e.target.value); setFilterMonth(''); }}
                        style={selectStyle}
                    >
                        <option value="">Todos los años</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                    <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={selectStyle}>
                        <option value="">Todos los meses</option>
                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            </div>

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
                                    display: 'flex', alignItems: 'center', gap: '15px',
                                    padding: '15px', backgroundColor: 'white',
                                    borderRadius: '8px', border: '1px solid #e5e7eb'
                                }}
                            >
                                <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '8px', color: '#2563eb' }}>
                                    <Icon size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                        {item.name}
                                        {item.type && item.type !== 'Documento' && (
                                            <span style={{
                                                marginLeft: '8px', fontSize: '0.75rem', padding: '2px 8px',
                                                borderRadius: '12px', backgroundColor: '#dbeafe',
                                                color: '#1e40af', fontWeight: '600', border: '1px solid #bfdbfe'
                                            }}>
                                                {item.type}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                        {item.month} {item.year}
                                        {extraListContent && extraListContent(item)}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <a href={item.url} download={item.name} style={{ color: '#666' }}>
                                        <Download size={20} />
                                    </a>
                                    {!isClient && (
                                        <button
                                            onClick={() => handleDelete(item.id, deleteConfirm)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                            title="Eliminar"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
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
                <button onClick={handleDownloadZip} style={secondaryBtnStyle}>
                    <Download size={20} />
                    Descargas masivas
                </button>
            )}
            {!isClient && (
                <button onClick={() => setShowForm(true)} style={primaryBtnStyle}>
                    <Upload size={20} />
                    {uploadLabel}
                </button>
            )}
        </div>
    );
};

export default DocumentSection;
