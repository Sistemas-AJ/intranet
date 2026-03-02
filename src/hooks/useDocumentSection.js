import React from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import api from '../api';

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
            const res = await api.get('/docs', { params: { key: storageKey } });
            if (res.status === 200) {
                const data = res.data;
                if (data && data.list) {
                    return { source: 'server', data: data.list, metadata: data.metadata };
                }
            }
        } catch (e) {
            console.warn('[docsApi] Error cargando desde servidor:', e);
        }
        return { source: 'empty', data: [], metadata: { unreadForAdmin: false, unreadForClient: false, events: [] } };
    },

    async saveMetadata(storageKey, metadataUpdates) {
        try {
            await api.post('/docs-metadata', { key: storageKey, ...metadataUpdates });
        } catch (e) {
            console.error('[docsApi] Error actualizando metadata:', e);
        }
    },

    async updateDocs(id, updates) {
        try {
            await api.post('/docs/update', updates, { params: { id } });
        } catch (e) {
            console.error('[docsApi] Error actualizando documento:', e);
        }
    },

    async deleteDoc(id, extra = {}) {
        try {
            const params = { id };
            if (extra.isClient) params.isClient = true;
            if (extra.companyName) params.companyName = extra.companyName;
            if (extra.sectionLabel) params.sectionLabel = extra.sectionLabel;

            const res = await api.delete('/docs', { params });
            return res.status === 200;
        } catch (e) {
            console.error('[docsApi] Error eliminando documento:', e);
            return false;
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
    noPeriod = false,
    noMonth = false,
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
        const loadData = async () => {
            const { data, metadata: serverMeta } = await docsApi.load(storageKey);
            if (!cancelled) {
                setList(data || []);
                if (serverMeta) setMetadata(serverMeta);
                setLoaded(true);
            }
        };
        loadData();
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
        // docsApi.save(storageKey, list, metadata); // This line is commented out as server-side persistence is now handled by /api/upload and /api/docs-metadata
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
        if (!noPeriod && !noMonth && (!uploadYear || !uploadMonth)) {
            alert('Por favor complete todos los campos');
            return false;
        }
        if (noMonth && !uploadYear) {
            alert('Por favor seleccione el año');
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
        } else {
            const error = await validateFile(uploadFile, noPeriod ? 'Actual' : uploadYear, noPeriod ? 'Siempre' : (noMonth ? 'Anual' : uploadMonth));
            if (error) {
                setUploadError(error);
                return false;
            }
        }

        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const role = currentUser.role || 'client';

        // Determinar RUC y Sección desde el storageKey (ej: docs_12345_compras)
        const parts = storageKey.split('_');
        const ruc = parts[1] || '00000000000';
        const section = parts[2] || 'otros';

        const formData = new FormData();
        formData.append('ruc', ruc);
        formData.append('section', section);
        formData.append('year', noPeriod ? 'Actual' : uploadYear);
        formData.append('month', noPeriod ? 'Siempre' : (noMonth ? 'Anual' : uploadMonth));
        formData.append('storageKey', storageKey);

        const extraData = {
            type: uploadType,
            description: uploadDescription,
            isNonDeducible: false,
            uploadedBy: role,
            companyName: companyName,
            sectionLabel: sectionLabel,
            ...extraFields
        };
        formData.append('extraData', JSON.stringify(extraData));

        const filesToUpload = multiple ? uploadFiles : [uploadFile];
        filesToUpload.forEach(f => formData.append('file', f));

        try {
            const response = await api.post('/upload', formData);
            if (response.status === 200) {
                const result = response.data;
                if (result.ok) {
                    setList(prev => [...prev, ...result.documents]);

                    // Si es cliente, el servidor ya marcó unreadForAdmin = 1 en el plugin
                    // Solo actualizamos el estado local si es necesario
                    if (role === 'client') {
                        // Recargar para obtener la lista de eventos actualizada
                        const reload = await docsApi.load(storageKey);
                        setMetadata(reload.metadata);
                    }

                    setSuccessMessage('Archivo(s) subido(s) con éxito.');
                    setUploadFile(null);
                    setUploadFiles([]);
                    setUploadDescription('');
                    setShowForm(false);
                } else {
                    throw new Error(result.message || 'Error en la subida');
                }
            } else {
                throw new Error('Error en la subida');
            }
        } catch (e) {
            setUploadError('Error al subir archivos: ' + e.message);
            return false;
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
    }, [uploadYear, uploadMonth, uploadType, uploadDescription, uploadFiles, uploadFile, multiple, storageKey, companyName, sectionLabel]);

    const handleDelete = React.useCallback(async (id, isClient = false) => {
        const itemToDelete = list.find(item => item.id === id);

        const ok = await docsApi.deleteDoc(id, {
            isClient,
            companyName: companyName,
            sectionLabel: sectionLabel
        });

        if (ok) {
            setList(prev => prev.filter(item => item.id !== id));
            // Recargar metadata para ver el evento de eliminación si somos clientes
            if (isClient) {
                const reload = await docsApi.load(storageKey);
                setMetadata(reload.metadata);
            }
        }
    }, [list, storageKey, companyName, sectionLabel]);

    const toggleNonDeducible = React.useCallback(async (id, isNonDeducible, comment = '') => {
        const updates = { isNonDeducible, adminComment: comment, seenByClient: false };
        setList(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
        setMetadata(prev => ({ ...prev, unreadForClient: true }));

        await docsApi.updateDocs(id, updates);
        await docsApi.saveMetadata(storageKey, { unreadForClient: true });
    }, [storageKey]);

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
                const response = await api.get(item.url, { responseType: 'blob' });
                const blob = response.data;
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

    const markAsRead = React.useCallback(async () => {
        setMetadata(prev => ({ ...prev, unreadForAdmin: false }));
        await docsApi.saveMetadata(storageKey, { unreadForAdmin: false });
    }, [storageKey]);

    const clearNotifications = React.useCallback(async () => {
        setMetadata(prev => ({ ...prev, unreadForAdmin: false, events: [] }));
        await docsApi.saveMetadata(storageKey, { unreadForAdmin: false, clearEvents: true });
    }, [storageKey]);

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
        toggleNonDeducible,
        setList,
        setMetadata,
        noPeriod,
        noMonth,
        uploadError,
        setUploadError,
        successMessage,
        setSuccessMessage,
    }), [
        list, metadata, filteredList, availableYears, filterYear, filterMonth, showForm,
        uploadYear, uploadMonth, uploadType, uploadDescription, uploadFile, uploadFiles,
        handleUpload, handleSave, handleDelete, handleDownloadZip,
        markAllAsSeenByAdmin, markAllAsSeenByClient, markAsRead, clearNotifications, uploadError, successMessage, noPeriod, noMonth
    ]);
};

export default useDocumentSection;
