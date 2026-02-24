import React from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Convierte un File a Base64 string.
 */
const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

// ── Funciones de API para sincronización con el servidor ────────────────────
const docsApi = {
    async load(storageKey) {
        try {
            const res = await fetch(`/api/docs?key=${encodeURIComponent(storageKey)}`);
            if (res.ok) {
                const data = await res.json();
                // Validar si es el formato nuevo { list, metadata } o el viejo []
                if (data && (Array.isArray(data) || data.list)) {
                    return { source: 'server', data };
                }
            }
        } catch (e) {
            console.warn('[docsApi] Error cargando desde servidor:', e);
        }
        // Fallback / merge con localStorage
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const localData = JSON.parse(saved);
                if (Array.isArray(localData) && localData.length > 0) {
                    return { source: 'localStorage', data: localData };
                }
            }
        } catch { /* vacío */ }
        return { source: 'empty', data: [] };
    },

    async save(storageKey, data, metadata = {}) {
        const listToSave = (Array.isArray(data) ? data : []).map(({ file, ...rest }) => rest);
        const toSave = { list: listToSave, metadata };

        // Guardar en localStorage como cache
        try {
            localStorage.setItem(storageKey, JSON.stringify(toSave));
        } catch (e) {
            console.error('Error guardando en localStorage:', e);
        }
        // Guardar en servidor
        try {
            const res = await fetch('/api/docs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: storageKey, data: toSave }),
            });
            if (!res.ok) {
                console.error('[docsApi] Error respuesta servidor:', res.status);
            }
        } catch (e) {
            console.error('[docsApi] Error guardando en servidor:', e);
        }
    }
};

/**
 * Hook genérico para cualquier sección de documentos con subida, lista, filtrado y descarga ZIP.
 */
const useDocumentSection = ({
    multiple = false,
    hasZip = false,
    zipLabel = 'docs',
    hasType = false,
    storageKey = '',
    sectionLabel = 'Documentos',
    companyName = '',
} = {}) => {
    const [list, setList] = React.useState([]);
    const [metadata, setMetadata] = React.useState({ unreadForAdmin: false, unreadForClient: false, events: [] });
    const [loaded, setLoaded] = React.useState(false);
    const [filterYear, setFilterYear] = React.useState('');
    const [filterMonth, setFilterMonth] = React.useState('');
    const [showForm, setShowForm] = React.useState(false);

    const [uploadYear, setUploadYear] = React.useState('');
    const [uploadMonth, setUploadMonth] = React.useState('');
    const [uploadType, setUploadType] = React.useState('');
    const [uploadDescription, setUploadDescription] = React.useState('');
    const [uploadFile, setUploadFile] = React.useState(null);
    const [uploadFiles, setUploadFiles] = React.useState([]);
    const [uploadError, setUploadError] = React.useState('');
    const [successMessage, setSuccessMessage] = React.useState('');

    const monthMap = {
        'Enero': '01', 'Febrero': '02', 'Marzo': '03', 'Abril': '04', 'Mayo': '05', 'Junio': '06',
        'Julio': '07', 'Agosto': '08', 'Septiembre': '09', 'Octubre': '10', 'Noviembre': '11', 'Diciembre': '12'
    };

    // ── Cargar datos desde el servidor al montar ────────────────────────────
    React.useEffect(() => {
        if (!storageKey) return;
        let cancelled = false;
        docsApi.load(storageKey).then(result => {
            if (!cancelled) {
                if (result.data && !Array.isArray(result.data) && result.data.list) {
                    setList(result.data.list);
                    setMetadata(result.data.metadata || { unreadForAdmin: false, unreadForClient: false, events: [] });
                } else {
                    setList(result.data || []);
                    setMetadata({ unreadForAdmin: false, unreadForClient: false, events: [] });
                }
                setLoaded(true);
                // Sincronizar al servidor si viene de localStorage
                if (result.source === 'localStorage') {
                    const dataToSync = result.data && !Array.isArray(result.data) && result.data.list ? result.data.list : result.data;
                    const metaToSync = result.data && !Array.isArray(result.data) && result.data.metadata ? result.data.metadata : { unreadForAdmin: false, unreadForClient: false };
                    docsApi.save(storageKey, dataToSync, metaToSync);
                }
            }
        });
        return () => { cancelled = true; };
    }, [storageKey]);

    const validateFile = async (file, year, month) => {
        const isDuplicate = list.some(item => item.name === file.name);
        if (isDuplicate) {
            return `El archivo "${file.name}" ya ha sido subido anteriormente.`;
        }

        const datePatterns = [
            /(\d{4})[./-](\d{2})[./-](\d{2})/,
            /(\d{2})[./-](\d{2})[./-](\d{4})/,
            /(\d{4})(\d{2})(\d{2})/
        ];

        let extractedDate = null;
        for (const pattern of datePatterns) {
            const match = file.name.match(pattern);
            if (match) {
                if (match[1].length === 4) {
                    extractedDate = { year: match[1], month: match[2] };
                } else {
                    extractedDate = { year: match[3], month: match[2] };
                }
                break;
            }
        }

        if (extractedDate) {
            const targetMonthNum = monthMap[month];
            if (extractedDate.year !== year || extractedDate.month !== targetMonthNum) {
                return "El comprobante no coincide con periodo seleccionado";
            }
        }

        return null;
    };

    // ── Prevenir guardados redundantes si la data no ha cambiado realmente ──
    const lastSavedRef = React.useRef(null);

    // ── Persistir en servidor cada vez que cambia la lista (solo después de loaded) ──
    React.useEffect(() => {
        if (!storageKey || !loaded) return;
        const currentData = JSON.stringify({ list, metadata });
        if (lastSavedRef.current === currentData) return;

        lastSavedRef.current = currentData;
        docsApi.save(storageKey, list, metadata);
    }, [list, metadata, storageKey, loaded]);

    const handleUpload = React.useCallback((event) => {
        if (multiple) {
            const files = Array.from(event.target.files);
            if (files.length > 0) setUploadFiles(prev => [...prev, ...files]);
        } else {
            const file = event.target.files[0];
            if (file) setUploadFile(file);
        }
    }, [multiple]);

    const handleSave = React.useCallback(async (extraFields = {}) => {
        setUploadError('');
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
            for (const file of uploadFiles) {
                const error = await validateFile(file, uploadYear, uploadMonth);
                if (error) {
                    setUploadError(error);
                    return false;
                }
            }
            const newItems = await Promise.all(
                uploadFiles.map(async (file) => ({
                    id: Date.now() + Math.random(),
                    year: uploadYear,
                    month: uploadMonth,
                    url: await fileToBase64(file),
                    name: file.name,
                    type: uploadType || 'Documento',
                    description: uploadDescription,
                    adminComment: '',
                    isNonDeducible: false,
                    uploadedBy: extraFields.uploadedBy || 'admin',
                    seenByAdmin: extraFields.uploadedBy === 'client' ? false : true,
                    seenByClient: extraFields.uploadedBy === 'client' ? true : false,
                    file,
                    ...extraFields,
                }))
            );
            setList(prev => [...prev, ...newItems]);
            if (extraFields.uploadedBy === 'client') {
                const newEvent = {
                    id: Date.now(),
                    message: `${companyName || 'Un cliente'} ha añadido comprobantes en la sección ${sectionLabel}`,
                    timestamp: new Date().toISOString()
                };
                setMetadata(prev => ({
                    ...prev,
                    unreadForAdmin: true,
                    events: [...(prev.events || []), newEvent]
                }));
            } else {
                setMetadata(prev => ({ ...prev, unreadForClient: true }));
            }
        } else {
            const error = await validateFile(uploadFile, uploadYear, uploadMonth);
            if (error) {
                setUploadError(error);
                return false;
            }
            const base64Url = await fileToBase64(uploadFile);
            const newItem = {
                id: Date.now(),
                year: uploadYear,
                month: uploadMonth,
                url: base64Url,
                name: uploadFile.name,
                type: uploadType || 'Documento',
                description: uploadDescription,
                adminComment: '',
                isNonDeducible: false,
                uploadedBy: extraFields.uploadedBy || 'admin',
                seenByAdmin: extraFields.uploadedBy === 'client' ? false : true,
                seenByClient: extraFields.uploadedBy === 'client' ? true : false,
                ...extraFields,
            };
            setList(prev => [...prev, newItem]);
            if (extraFields.uploadedBy === 'client') {
                const newEvent = {
                    id: Date.now(),
                    message: `${companyName || 'Un cliente'} ha añadido un comprobante en la sección ${sectionLabel}: ${uploadFile.name}`,
                    timestamp: new Date().toISOString()
                };
                setMetadata(prev => ({
                    ...prev,
                    unreadForAdmin: true,
                    events: [...(prev.events || []), newEvent]
                }));
            } else {
                setMetadata(prev => ({ ...prev, unreadForClient: true }));
            }
        }

        setFilterYear(uploadYear);
        setFilterMonth(uploadMonth);

        setUploadYear('');
        setUploadMonth('');
        setUploadType('');
        setUploadDescription('');
        setUploadFile(null);
        setUploadFiles([]);
        setShowForm(false);
        setSuccessMessage('El archivo se subió correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
        return true;
    }, [uploadYear, uploadMonth, hasType, uploadType, multiple, uploadFiles, uploadFile, validateFile, uploadDescription, setFilterYear, setFilterMonth, companyName, sectionLabel]);

    const handleDelete = React.useCallback((id, isClient = false) => {
        const itemToDelete = list.find(item => item.id === id);
        setList(prev => prev.filter(item => item.id !== id));
        if (isClient) {
            const newEvent = {
                id: Date.now(),
                message: `${companyName || 'Un cliente'} ha eliminado un comprobante en la sección ${sectionLabel}${itemToDelete ? ': ' + itemToDelete.name : ''}`,
                timestamp: new Date().toISOString()
            };
            setMetadata(prev => ({
                ...prev,
                unreadForAdmin: true,
                events: [...(prev.events || []), newEvent]
            }));
        } else {
            setMetadata(prev => ({ ...prev, unreadForClient: true }));
        }
    }, [list, companyName, sectionLabel]);

    const handleDownloadZip = React.useCallback(async () => {
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
    }, [list, filterYear, filterMonth, zipLabel]);

    const filteredList = React.useMemo(() =>
        list.filter(item =>
            (!filterYear || item.year === filterYear) &&
            (!filterMonth || item.month === filterMonth)
        ), [list, filterYear, filterMonth]
    );

    const availableYears = React.useMemo(() =>
        [...new Set(list.map(item => item.year))].sort().reverse(),
        [list]
    );

    const markAllAsSeenByAdmin = React.useCallback(() => {
        const hasUnseen = list.some(item => !item.seenByAdmin);
        const hasUnreadMeta = metadata.unreadForAdmin;
        if (!hasUnseen && !hasUnreadMeta) return;

        if (hasUnseen) {
            setList(prev => prev.map(item => item.seenByAdmin ? item : { ...item, seenByAdmin: true }));
        }
        if (hasUnreadMeta) {
            setMetadata(prev => ({ ...prev, unreadForAdmin: false }));
        }
    }, [list, metadata.unreadForAdmin]);

    const markAllAsSeenByClient = React.useCallback(() => {
        const hasUnseen = list.some(item => !item.seenByClient);
        const hasUnreadMeta = metadata.unreadForClient;
        if (!hasUnseen && !hasUnreadMeta) return;

        if (hasUnseen) {
            setList(prev => prev.map(item => item.seenByClient ? item : { ...item, seenByClient: true }));
        }
        if (hasUnreadMeta) {
            setMetadata(prev => ({ ...prev, unreadForClient: false }));
        }
    }, [list, metadata.unreadForClient]);

    const markAsRead = React.useCallback(() => {
        setMetadata(prev => ({ ...prev, unreadForAdmin: false }));
    }, []);

    const clearNotifications = React.useCallback(() => {
        setMetadata(prev => ({ ...prev, unreadForAdmin: false, events: [] }));
    }, []);

    return React.useMemo(() => ({
        list,
        metadata,
        filteredList,
        availableYears,
        filterYear, setFilterYear,
        filterMonth, setFilterMonth,
        showForm, setShowForm,
        uploadYear, setUploadYear,
        uploadMonth, setUploadMonth,
        uploadType, setUploadType,
        uploadDescription, setUploadDescription,
        uploadFile, setUploadFile,
        uploadFiles, setUploadFiles,
        handleUpload,
        handleSave,
        handleDelete,
        handleDownloadZip,
        markAllAsSeenByAdmin,
        markAllAsSeenByClient,
        markAsRead,
        clearNotifications,
        setList,
        setMetadata,
        uploadError,
        setUploadError,
        successMessage,
        setSuccessMessage,
    }), [
        list, metadata, filteredList, availableYears, filterYear, filterMonth, showForm,
        uploadYear, uploadMonth, uploadType, uploadDescription, uploadFile, uploadFiles,
        handleUpload, handleSave, handleDelete, handleDownloadZip,
        markAllAsSeenByAdmin, markAllAsSeenByClient, markAsRead, clearNotifications, uploadError, successMessage
    ]);
};

export default useDocumentSection;
