import React from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Convierte un File a Base64 string.
 */
const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // ya incluye el data URL con MIME type
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

/**
 * Hook genérico para cualquier sección de documentos con subida, lista, filtrado y descarga ZIP.
 *
 * @param {object} options
 * @param {boolean} [options.multiple=false]     - ¿Acepta múltiples archivos?
 * @param {boolean} [options.hasZip=false]       - ¿Tiene botón de descarga masiva ZIP?
 * @param {string}  [options.zipLabel='docs']    - Prefijo para el nombre del ZIP
 * @param {boolean} [options.hasType=false]      - ¿El formulario tiene selector de tipo?
 * @param {string}  [options.storageKey='']      - Clave de localStorage (ej: 'docs_20501234_afpNet')
 */
const useDocumentSection = ({
    multiple = false,
    hasZip = false,
    zipLabel = 'docs',
    hasType = false,
    storageKey = '',
} = {}) => {
    // ── Inicializar lista desde localStorage ──────────────────────────────────
    const loadFromStorage = () => {
        if (!storageKey) return [];
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    };

    const [list, setList] = React.useState(loadFromStorage);
    const [filterYear, setFilterYear] = React.useState('');
    const [filterMonth, setFilterMonth] = React.useState('');
    const [showForm, setShowForm] = React.useState(false);

    const [uploadYear, setUploadYear] = React.useState('');
    const [uploadMonth, setUploadMonth] = React.useState('');
    const [uploadType, setUploadType] = React.useState('');
    // Single file mode
    const [uploadFile, setUploadFile] = React.useState(null);
    // Multiple files mode
    const [uploadFiles, setUploadFiles] = React.useState([]);

    // ── Persistir en localStorage cada vez que cambia la lista ────────────────
    React.useEffect(() => {
        if (!storageKey) return;
        try {
            // Guardamos todos los campos excepto 'file' (el objeto File original)
            const toSave = list.map(({ file, ...rest }) => rest);
            localStorage.setItem(storageKey, JSON.stringify(toSave));
        } catch (e) {
            console.error('Error guardando en localStorage:', e);
        }
    }, [list, storageKey]);

    const handleUpload = (event) => {
        if (multiple) {
            const files = Array.from(event.target.files);
            if (files.length > 0) setUploadFiles(prev => [...prev, ...files]);
        } else {
            const file = event.target.files[0];
            if (file) setUploadFile(file);
        }
    };

    const handleSave = async (extraFields = {}) => {
        if (!uploadYear || !uploadMonth) {
            alert('Por favor complete todos los campos');
            return false;
        }
        if (hasType && !uploadType) {
            alert('Por favor complete todos los campos');
            return false;
        }
        if (multiple && uploadFiles.length === 0) {
            alert('Por favor seleccione al menos un archivo');
            return false;
        }
        if (!multiple && !uploadFile) {
            alert('Por favor seleccione un archivo');
            return false;
        }

        if (multiple) {
            // Convertir todos a Base64
            const newItems = await Promise.all(
                uploadFiles.map(async (file) => ({
                    id: Date.now() + Math.random(),
                    year: uploadYear,
                    month: uploadMonth,
                    url: await fileToBase64(file),
                    name: file.name,
                    type: uploadType || 'Documento',
                    file, // mantener referencia para el ZIP (solo en memoria de esta sesión)
                    ...extraFields,
                }))
            );
            setList(prev => [...prev, ...newItems]);
        } else {
            const base64Url = await fileToBase64(uploadFile);
            const newItem = {
                id: Date.now(),
                year: uploadYear,
                month: uploadMonth,
                url: base64Url,
                name: uploadFile.name,
                type: uploadType || 'Documento',
                ...extraFields,
            };
            setList(prev => [...prev, newItem]);
        }

        // Auto-filter to the newly uploaded period
        setFilterYear(uploadYear);
        setFilterMonth(uploadMonth);

        // Reset form
        setUploadYear('');
        setUploadMonth('');
        setUploadType('');
        setUploadFile(null);
        setUploadFiles([]);
        setShowForm(false);
        return true;
    };

    const handleDelete = (id, confirmMsg = '¿Estás seguro de eliminar este documento?') => {
        if (window.confirm(confirmMsg)) {
            setList(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleDownloadZip = async () => {
        const filtered = list.filter(item =>
            (!filterYear || item.year === filterYear) &&
            (!filterMonth || item.month === filterMonth)
        );

        if (filtered.length === 0) {
            alert('No hay archivos para descargar con el filtro seleccionado.');
            return;
        }

        const zip = new JSZip();

        for (const item of filtered) {
            if (item.url) {
                // Si es base64 data URL, convertir a blob
                const response = await fetch(item.url);
                const blob = await response.blob();
                zip.file(item.name, blob);
            }
        }

        try {
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `${zipLabel}_${filterMonth || 'todos'}_${filterYear || 'todos'}.zip`);
        } catch (error) {
            console.error('Error creating zip:', error);
            alert('Error al crear el archivo ZIP');
        }
    };

    const filteredList = list.filter(item =>
        (!filterYear || item.year === filterYear) &&
        (!filterMonth || item.month === filterMonth)
    );

    const availableYears = [...new Set(list.map(item => item.year))].sort().reverse();

    return {
        list,
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
        handleUpload,
        handleSave,
        handleDelete,
        handleDownloadZip,
    };
};

export default useDocumentSection;
