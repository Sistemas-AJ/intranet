import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, LogOut, FileText, Calendar, CalendarDays, FileBarChart, Users, ShieldCheck, Landmark, Wallet, ShoppingCart, TrendingUp, Upload, Download, X, FileSpreadsheet } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import logo from './assets/LogoSolo.png';
import bgImage from './assets/bg-accountants.png';

const CompanyDashboard = () => {
    const { ruc } = useParams();
    const navigate = useNavigate();

    // Find the company in localStorage
    const [company, setCompany] = React.useState(null);
    const [selectedPermission, setSelectedPermission] = React.useState(null);
    const [files, setFiles] = React.useState({});

    // State for Monthly Declarations
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const isClient = currentUser?.role === 'client';

    const [monthlyDeclarations, setMonthlyDeclarations] = React.useState([]);
    const [showUploadForm, setShowUploadForm] = React.useState(false);
    const [filterYear, setFilterYear] = React.useState('');
    const [filterMonth, setFilterMonth] = React.useState('');

    // Upload Form State
    const [uploadYear, setUploadYear] = React.useState('');
    const [uploadMonth, setUploadMonth] = React.useState('');
    const [uploadFile, setUploadFile] = React.useState(null);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && selectedPermission) {
            const fileUrl = URL.createObjectURL(file);
            // If handling generic upload
            setFiles(prev => ({
                ...prev,
                [selectedPermission]: {
                    url: fileUrl,
                    name: file.name,
                    type: file.type
                }
            }));
        }
    };

    const handleSaveDeclaration = () => {
        if (!uploadYear || !uploadMonth || !uploadFile) {
            alert('Por favor complete todos los campos');
            return;
        }

        const fileUrl = URL.createObjectURL(uploadFile);
        const newDeclaration = {
            id: Date.now(),
            year: uploadYear,
            month: uploadMonth,
            url: fileUrl,
            name: uploadFile.name,
            type: uploadFile.type
        };

        setMonthlyDeclarations(prev => [...prev, newDeclaration]);

        // Reset and close form
        setUploadYear('');
        setUploadMonth('');
        setUploadFile(null);
        setShowUploadForm(false);

        // Auto-select the newly added date
        setFilterYear(uploadYear);
        setFilterMonth(uploadMonth);
    };

    const handleDeleteDeclaration = (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este documento?')) {
            setMonthlyDeclarations(prev => prev.filter(d => d.id !== id));
        }
    };

    // State for Annual Declarations
    const [annualDeclarations, setAnnualDeclarations] = React.useState([]);
    const [showAnnualUploadForm, setShowAnnualUploadForm] = React.useState(false);
    const [filterAnnualYear, setFilterAnnualYear] = React.useState('');

    // Upload Form State for Annual
    const [uploadAnnualYear, setUploadAnnualYear] = React.useState('');
    const [uploadAnnualFile, setUploadAnnualFile] = React.useState(null);

    // State for Plame - Boletas de Pago
    const [plameView, setPlameView] = React.useState('menu'); // 'menu', 'boletas', 'upload_boletas'
    const [boletasList, setBoletasList] = React.useState([]); // List of uploaded boletas
    const [boletasFilterYear, setBoletasFilterYear] = React.useState('');
    const [boletasFilterMonth, setBoletasFilterMonth] = React.useState('');

    // Upload Boletas Form State
    const [uploadBoletasYear, setUploadBoletasYear] = React.useState('');
    const [uploadBoletasMonth, setUploadBoletasMonth] = React.useState('');
    const [uploadBoletasFiles, setUploadBoletasFiles] = React.useState([]); // Supports multiple files

    const handleBoletasUpload = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            setUploadBoletasFiles(prev => [...prev, ...files]);
        }
    };

    const handleSaveBoletas = () => {
        if (!uploadBoletasYear || !uploadBoletasMonth || uploadBoletasFiles.length === 0) {
            alert('Por favor complete todos los campos y seleccione al menos un archivo');
            return;
        }

        const newBoletas = uploadBoletasFiles.map(file => ({
            id: Date.now() + Math.random(),
            year: uploadBoletasYear,
            month: uploadBoletasMonth,
            url: URL.createObjectURL(file), // Mock URL for preview
            name: file.name,
            type: file.type,
            file: file // Store actual file for zipping
        }));

        setBoletasList(prev => [...prev, ...newBoletas]);

        // Reset and go back to list
        setUploadBoletasYear('');
        setUploadBoletasMonth('');
        setUploadBoletasFiles([]);
        setPlameView('boletas');

        // Auto-select filter to show new items
        setBoletasFilterYear(uploadBoletasYear);
        setBoletasFilterMonth(uploadBoletasMonth);
    };

    const handleDownloadBoletasZip = async () => {
        const filteredBoletas = boletasList.filter(b =>
            (!boletasFilterYear || b.year === boletasFilterYear) &&
            (!boletasFilterMonth || b.month === boletasFilterMonth)
        );

        if (filteredBoletas.length === 0) {
            alert('No hay boletas para descargar con el filtro seleccionado.');
            return;
        }

        const zip = new JSZip();

        filteredBoletas.forEach(item => {
            if (item.file) {
                zip.file(item.name, item.file);
            }
        });

        try {
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `boletas_${boletasFilterMonth || 'todos'}_${boletasFilterYear || 'todos'}.zip`);
        } catch (error) {
            console.error("Error creating zip:", error);
            alert("Error al crear el archivo ZIP");
        }
    };

    const handleDeleteBoleta = (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta boleta?')) {
            setBoletasList(prev => prev.filter(b => b.id !== id));
        }
    };

    // State for Plame - Constancias de Declaración
    const [constanciasList, setConstanciasList] = React.useState([]);
    const [constanciasFilterYear, setConstanciasFilterYear] = React.useState('');
    const [constanciasFilterMonth, setConstanciasFilterMonth] = React.useState('');

    // Upload Constancias Form State
    const [uploadConstanciasYear, setUploadConstanciasYear] = React.useState('');
    const [uploadConstanciasMonth, setUploadConstanciasMonth] = React.useState('');
    const [uploadConstanciasFiles, setUploadConstanciasFiles] = React.useState([]);

    const handleConstanciasUpload = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            setUploadConstanciasFiles(prev => [...prev, ...files]);
        }
    };

    const handleSaveConstancias = () => {
        if (!uploadConstanciasYear || !uploadConstanciasMonth || uploadConstanciasFiles.length === 0) {
            alert('Por favor complete todos los campos y seleccione al menos un archivo');
            return;
        }

        const newConstancias = uploadConstanciasFiles.map(file => ({
            id: Date.now() + Math.random(),
            year: uploadConstanciasYear,
            month: uploadConstanciasMonth,
            url: URL.createObjectURL(file), // Mock URL
            name: file.name,
            type: file.type
        }));

        setConstanciasList(prev => [...prev, ...newConstancias]);

        // Reset
        setUploadConstanciasYear('');
        setUploadConstanciasMonth('');
        setUploadConstanciasFiles([]);
        setPlameView('constancias');

        setConstanciasFilterYear(uploadConstanciasYear);
        setConstanciasFilterMonth(uploadConstanciasMonth);
    };

    const handleDeleteConstancia = (id) => {
        if (window.confirm('¿Eliminar constancia?')) {
            setConstanciasList(prev => prev.filter(c => c.id !== id));
        }
    };



    // State for Plame - NPS
    const [npsList, setNpsList] = React.useState([]);
    const [npsFilterYear, setNpsFilterYear] = React.useState('');
    const [npsFilterMonth, setNpsFilterMonth] = React.useState('');

    // Upload NPS Form State
    const [uploadNpsYear, setUploadNpsYear] = React.useState('');
    const [uploadNpsMonth, setUploadNpsMonth] = React.useState('');
    const [uploadNpsFiles, setUploadNpsFiles] = React.useState([]);

    const handleNpsUpload = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            setUploadNpsFiles(prev => [...prev, ...files]);
        }
    };

    const handleSaveNps = () => {
        if (!uploadNpsYear || !uploadNpsMonth || uploadNpsFiles.length === 0) {
            alert('Por favor complete todos los campos y seleccione al menos un archivo');
            return;
        }

        const newNps = uploadNpsFiles.map(file => ({
            id: Date.now() + Math.random(),
            year: uploadNpsYear,
            month: uploadNpsMonth,
            url: URL.createObjectURL(file),
            name: file.name,
            type: file.type
        }));

        setNpsList(prev => [...prev, ...newNps]);

        // Reset and go back to list
        setUploadNpsYear('');
        setUploadNpsMonth('');
        setUploadNpsFiles([]);
        setPlameView('nps');

        // Auto-select filter to show new items
        setNpsFilterYear(uploadNpsYear);
        setNpsFilterMonth(uploadNpsMonth);
    };

    const handleDeleteNps = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este NPS?')) {
            setNpsList(prev => prev.filter(n => n.id !== id));
        }
    };



    // State for AFP NET
    const [afpNetList, setAfpNetList] = React.useState([]);
    const [afpFilterYear, setAfpFilterYear] = React.useState('');
    const [afpFilterMonth, setAfpFilterMonth] = React.useState('');

    // Upload AFP NET Form State
    const [showAfpUploadForm, setShowAfpUploadForm] = React.useState(false);
    const [uploadAfpYear, setUploadAfpYear] = React.useState('');
    const [uploadAfpMonth, setUploadAfpMonth] = React.useState('');
    const [uploadAfpType, setUploadAfpType] = React.useState(''); // 'Detalle' or 'Ticket'
    const [uploadAfpFile, setUploadAfpFile] = React.useState(null);

    const handleAfpUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadAfpFile(file);
        }
    };

    const handleSaveAfp = () => {
        if (!uploadAfpYear || !uploadAfpMonth || !uploadAfpType || !uploadAfpFile) {
            alert('Por favor complete todos los campos, seleccione el tipo y un archivo');
            return;
        }

        const newAfp = {
            id: Date.now(),
            year: uploadAfpYear,
            month: uploadAfpMonth,
            type: uploadAfpType,
            url: URL.createObjectURL(uploadAfpFile),
            name: uploadAfpFile.name
        };

        setAfpNetList(prev => [...prev, newAfp]);

        // Reset and close form
        setUploadAfpYear('');
        setUploadAfpMonth('');
        setUploadAfpType('');
        setUploadAfpFile(null);
        setShowAfpUploadForm(false);

        // Auto-select filter
        setAfpFilterYear(uploadAfpYear);
        setAfpFilterMonth(uploadAfpMonth);
    };

    const handleDeleteAfp = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este documento de AFP NET?')) {
            setAfpNetList(prev => prev.filter(a => a.id !== id));
        }
    };

    // State for Bancos
    const [bancosList, setBancosList] = React.useState([]);
    const [bancosFilterYear, setBancosFilterYear] = React.useState('');
    const [bancosFilterMonth, setBancosFilterMonth] = React.useState('');

    // Upload Bancos Form State
    const [showBancosUploadForm, setShowBancosUploadForm] = React.useState(false);
    const [uploadBancosYear, setUploadBancosYear] = React.useState('');
    const [uploadBancosMonth, setUploadBancosMonth] = React.useState('');
    const [uploadBancosType, setUploadBancosType] = React.useState(''); // 'Extracto Bancario' or 'Conciliacion Bancaria'
    const [uploadBancosFile, setUploadBancosFile] = React.useState(null);

    const handleBancosUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadBancosFile(file);
        }
    };

    const handleSaveBancos = () => {
        if (!uploadBancosYear || !uploadBancosMonth || !uploadBancosType || !uploadBancosFile) {
            alert('Por favor complete todos los campos, seleccione el tipo y un archivo');
            return;
        }

        const newBanco = {
            id: Date.now(),
            year: uploadBancosYear,
            month: uploadBancosMonth,
            type: uploadBancosType,
            url: URL.createObjectURL(uploadBancosFile),
            name: uploadBancosFile.name
        };

        setBancosList(prev => [...prev, newBanco]);

        // Reset and close form
        setUploadBancosYear('');
        setUploadBancosMonth('');
        setUploadBancosType('');
        setUploadBancosFile(null);
        setShowBancosUploadForm(false);

        // Auto-select filter
        setBancosFilterYear(uploadBancosYear);
        setBancosFilterMonth(uploadBancosMonth);
    };

    const handleDeleteBancos = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este documento de bancos?')) {
            setBancosList(prev => prev.filter(b => b.id !== id));
        }
    };

    const handleSaveAnnualDeclaration = () => {
        if (!uploadAnnualYear || !uploadAnnualFile) {
            alert('Por favor complete todos los campos');
            return;
        }

        const fileUrl = URL.createObjectURL(uploadAnnualFile);
        const newDeclaration = {
            id: Date.now(),
            year: uploadAnnualYear,
            url: fileUrl,
            name: uploadAnnualFile.name,
            type: uploadAnnualFile.type
        };

        setAnnualDeclarations(prev => [...prev, newDeclaration]);

        // Reset and close form
        setUploadAnnualYear('');
        setUploadAnnualFile(null);
        setShowAnnualUploadForm(false);

        // Auto-select the newly added date
        setFilterAnnualYear(uploadAnnualYear);
    };

    const handleDeleteAnnualDeclaration = (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta declaración anual?')) {
            setAnnualDeclarations(prev => prev.filter(d => d.id !== id));
        }
    };

    React.useEffect(() => {
        const savedCompanies = localStorage.getItem('companies');
        if (savedCompanies) {
            const companies = JSON.parse(savedCompanies);
            const foundCompany = companies.find(c => c.ruc === ruc);
            setCompany(foundCompany);
        }
    }, [ruc]);

    const handleLogout = () => {
        if (isClient) {
            localStorage.removeItem('currentUser');
            navigate('/');
        } else {
            navigate('/dashboard');
        }
    };

    // State for Caja Chica
    const [cajaChicaList, setCajaChicaList] = React.useState([]);
    const [cajaChicaFilterYear, setCajaChicaFilterYear] = React.useState('');
    const [cajaChicaFilterMonth, setCajaChicaFilterMonth] = React.useState('');
    const [showCajaChicaUploadForm, setShowCajaChicaUploadForm] = React.useState(false);

    // Upload Caja Chica Form
    const [uploadCajaChicaYear, setUploadCajaChicaYear] = React.useState('');
    const [uploadCajaChicaMonth, setUploadCajaChicaMonth] = React.useState('');
    const [uploadCajaChicaType, setUploadCajaChicaType] = React.useState(''); // 'Control de Caja Chica' | 'Arqueo de Caja'
    const [uploadCajaChicaFile, setUploadCajaChicaFile] = React.useState(null);

    const handleCajaChicaUpload = (e) => {
        if (e.target.files[0]) setUploadCajaChicaFile(e.target.files[0]);
    };

    const handleSaveCajaChica = () => {
        if (!uploadCajaChicaYear || !uploadCajaChicaMonth || !uploadCajaChicaType || !uploadCajaChicaFile) {
            alert('Por favor complete todos los campos');
            return;
        }

        const newCaja = {
            id: Date.now(),
            year: uploadCajaChicaYear,
            month: uploadCajaChicaMonth,
            type: uploadCajaChicaType,
            url: URL.createObjectURL(uploadCajaChicaFile),
            name: uploadCajaChicaFile.name
        };

        setCajaChicaList(prev => [...prev, newCaja]);

        // Reset
        setUploadCajaChicaYear('');
        setUploadCajaChicaMonth('');
        setUploadCajaChicaType('');
        setUploadCajaChicaFile(null);
        setShowCajaChicaUploadForm(false);

        // Auto-select filter
        setCajaChicaFilterYear(uploadCajaChicaYear);
        setCajaChicaFilterMonth(uploadCajaChicaMonth);
    };

    const handleDeleteCajaChica = (id) => {
        if (window.confirm('¿Eliminar documento de Control de Caja?')) {
            setCajaChicaList(prev => prev.filter(c => c.id !== id));
        }
    };

    // State for Compras
    const [comprasList, setComprasList] = React.useState([]);
    const [comprasFilterYear, setComprasFilterYear] = React.useState('');
    const [comprasFilterMonth, setComprasFilterMonth] = React.useState('');

    // State for Otros Documentos
    const [otrosDocumentosList, setOtrosDocumentosList] = React.useState([]);
    const [showOtrosDocumentosUploadForm, setShowOtrosDocumentosUploadForm] = React.useState(false);
    const [otrosDocumentosFilterYear, setOtrosDocumentosFilterYear] = React.useState('');
    const [otrosDocumentosFilterMonth, setOtrosDocumentosFilterMonth] = React.useState('');
    const [showComprasUploadForm, setShowComprasUploadForm] = React.useState(false);

    // Upload Compras Form
    const [uploadComprasYear, setUploadComprasYear] = React.useState('');
    const [uploadComprasMonth, setUploadComprasMonth] = React.useState('');
    const [uploadComprasFiles, setUploadComprasFiles] = React.useState([]);

    const handleComprasUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setUploadComprasFiles(prev => [...prev, ...files]);
        }
    };

    const handleSaveCompras = () => {
        if (!uploadComprasYear || !uploadComprasMonth || uploadComprasFiles.length === 0) {
            alert('Por favor complete todos los campos y seleccione al menos un archivo');
            return;
        }

        const newCompras = uploadComprasFiles.map(file => ({
            id: Date.now() + Math.random(),
            year: uploadComprasYear,
            month: uploadComprasMonth,
            url: URL.createObjectURL(file), // Mock URL
            name: file.name,
            file: file // Store actual file for zipping
        }));

        setComprasList(prev => [...prev, ...newCompras]);

        // Reset
        setUploadComprasYear('');
        setUploadComprasMonth('');
        setUploadComprasFiles([]);
        setShowComprasUploadForm(false);

        // Auto-select filter
        setComprasFilterYear(uploadComprasYear);
        setComprasFilterMonth(uploadComprasMonth);
    };

    const handleDeleteCompras = (id) => {
        if (window.confirm('¿Eliminar comprobante?')) {
            setComprasList(prev => prev.filter(c => c.id !== id));
        }
    };

    const handleDownloadComprasZip = async () => {
        const filteredCompras = comprasList.filter(c =>
            (!comprasFilterYear || c.year === comprasFilterYear) &&
            (!comprasFilterMonth || c.month === comprasFilterMonth)
        );

        if (filteredCompras.length === 0) {
            alert('No hay comprobantes para descargar con el filtro seleccionado.');
            return;
        }

        const zip = new JSZip();

        // Add files to zip
        // Since we are using mock URLs for preview strings, strictly speaking we can't fetch them back easily if they were real URLs.
        // But here we stored the 'file' object in handleSaveCompras.
        filteredCompras.forEach(item => {
            if (item.file) {
                zip.file(item.name, item.file);
            }
        });

        try {
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `compras_${comprasFilterMonth || 'todos'}_${comprasFilterYear || 'todos'}.zip`);
        } catch (error) {
            console.error("Error creating zip:", error);
            alert("Error al crear el archivo ZIP");
        }
    };

    // State for Ventas
    const [ventasList, setVentasList] = React.useState([]);
    const [ventasFilterYear, setVentasFilterYear] = React.useState('');
    const [ventasFilterMonth, setVentasFilterMonth] = React.useState('');
    const [showVentasUploadForm, setShowVentasUploadForm] = React.useState(false);

    // Upload Ventas Form
    const [uploadVentasYear, setUploadVentasYear] = React.useState('');
    const [uploadVentasMonth, setUploadVentasMonth] = React.useState('');
    const [uploadVentasFiles, setUploadVentasFiles] = React.useState([]);

    // Upload Otros Documentos Form
    const [otrosDocumentosCategory, setOtrosDocumentosCategory] = React.useState(null); // 'notificaciones', 'constitucion', 'varios'
    const [uploadOtrosDocumentosYear, setUploadOtrosDocumentosYear] = React.useState('');
    const [uploadOtrosDocumentosMonth, setUploadOtrosDocumentosMonth] = React.useState('');
    const [uploadOtrosDocumentosFile, setUploadOtrosDocumentosFile] = React.useState(null);

    const handleVentasUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setUploadVentasFiles(prev => [...prev, ...files]);
        }
    };

    const handleSaveVentas = () => {
        if (!uploadVentasYear || !uploadVentasMonth || uploadVentasFiles.length === 0) {
            alert('Por favor complete todos los campos y seleccione al menos un archivo');
            return;
        }

        const newVentas = uploadVentasFiles.map(file => ({
            id: Date.now() + Math.random(),
            year: uploadVentasYear,
            month: uploadVentasMonth,
            url: URL.createObjectURL(file), // Mock URL
            name: file.name,
            file: file // Store actual file for zipping
        }));

        setVentasList(prev => [...prev, ...newVentas]);

        setUploadVentasYear('');
        setUploadVentasMonth('');
        setUploadVentasFiles([]);
        setShowVentasUploadForm(false);

        // Auto-select filter
        setVentasFilterYear(uploadVentasYear);
        setVentasFilterMonth(uploadVentasMonth);
    };

    const handleDeleteVentas = (id) => {
        if (window.confirm('¿Eliminar comprobante?')) {
            setVentasList(prev => prev.filter(c => c.id !== id));
        }
    };

    const handleDownloadVentasZip = async () => {
        const filteredVentas = ventasList.filter(v =>
            (!ventasFilterYear || v.year === ventasFilterYear) &&
            (!ventasFilterMonth || v.month === ventasFilterMonth)
        );

        if (filteredVentas.length === 0) {
            alert('No hay comprobantes para descargar con el filtro seleccionado.');
            return;
        }

        const zip = new JSZip();

        filteredVentas.forEach(item => {
            if (item.file) {
                zip.file(item.name, item.file);
            }
        });

        try {
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `ventas_${ventasFilterMonth || 'todos'}_${ventasFilterYear || 'todos'}.zip`);
        } catch (error) {
            console.error("Error creating zip:", error);
            alert("Error al crear el archivo ZIP");
        }
    };

    const handleOtrosDocumentosUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadOtrosDocumentosFile(file);
        }
    };

    const handleSaveOtrosDocumentos = () => {
        if (!uploadOtrosDocumentosYear || !uploadOtrosDocumentosMonth || !uploadOtrosDocumentosFile) {
            alert('Por favor complete todos los campos');
            return;
        }

        const newDoc = {
            id: Date.now(),
            year: uploadOtrosDocumentosYear,
            month: uploadOtrosDocumentosMonth,
            url: URL.createObjectURL(uploadOtrosDocumentosFile),
            name: uploadOtrosDocumentosFile.name,
            type: 'Documento',
            category: otrosDocumentosCategory // Save category
        };

        setOtrosDocumentosList(prev => [...prev, newDoc]);

        setUploadOtrosDocumentosYear('');
        setUploadOtrosDocumentosMonth('');
        setUploadOtrosDocumentosFile(null);
        setShowOtrosDocumentosUploadForm(false);

        setOtrosDocumentosFilterYear(uploadOtrosDocumentosYear);
        setOtrosDocumentosFilterMonth(uploadOtrosDocumentosMonth);
    };

    const handleDeleteOtrosDocumentos = (id) => {
        if (window.confirm('¿Eliminar documento?')) {
            setOtrosDocumentosList(prev => prev.filter(d => d.id !== id));
        }
    };

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

    if (!company) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando datos de la empresa...</div>;
    }

    // Get true permissions
    const activePermissions = Object.entries(company.permissions || {})
        .filter(([, isActive]) => isActive)
        .map(([key]) => key);

    const permissionLabelsList = activePermissions
        .map(key => permissionConfig[key]?.label)
        .filter(Boolean)
        .join(', ');

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {/* Background Image */}
            <div className="moving-background" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: -1,
                opacity: 0.15
            }}></div>

            {/* Header */}
            <header style={{
                padding: '15px 40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--color-aj-black)',
                color: 'var(--color-aj-white)',
                position: 'relative',
                zIndex: 20
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src={logo} alt="AJ Logo" style={{ height: '40px', marginRight: '15px', filter: 'brightness(0) invert(1)' }} />
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Adolfo Jurado Contratistas Generales</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '35px',
                            height: '35px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-aj-white)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-aj-black)'
                        }}>
                            <User size={20} />
                        </div>
                        <span style={{ fontWeight: '500' }}>
                            {isClient ? (currentUser.razonSocial || currentUser.usuario) : 'Administrador'}
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'transparent',
                            color: 'var(--color-aj-white)',
                            border: '1px solid var(--color-aj-white)',
                            padding: '8px 15px',
                            borderRadius: '4px',
                            transition: 'all 0.2s',
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-aj-white)';
                            e.currentTarget.style.color = 'var(--color-aj-black)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--color-aj-white)';
                        }}
                    >
                        <LogOut size={16} />
                        <span>{isClient ? 'Cerrar Sesión' : 'Volver'}</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main style={{
                flex: 1,
                padding: '40px',
                maxWidth: '1200px',
                margin: '0 auto',
                width: '100%',
                display: 'flex',
                flexDirection: 'column', // Stack vertically
                gap: '40px',
                alignItems: 'center', // Center items horizontally
                justifyContent: 'flex-start' // Start from top
            }}>

                {/* Top: Welcome Message */}
                <div style={{
                    width: '100%',
                    backgroundColor: 'var(--color-aj-white)',
                    padding: '40px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    borderLeft: '8px solid var(--color-aj-red)',
                    textAlign: 'left',
                }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--color-aj-black)' }}>
                        ¡Bienvenido al centro de Control de tu empresa, {company.razonSocial}!
                    </h2>
                    <p style={{ color: '#555', fontSize: '1.2rem', lineHeight: '1.6' }}>
                        Has ingresado a la <strong>Intranet de AJ Contratistas Generales</strong>. Desde este panel podrás gestionar toda tu información contable y tributaria, incluyendo la {permissionLabelsList}.
                    </p>
                </div>

                {/* Bottom: Permission Cards Grid */}
                <div style={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', // Auto-fill grid
                    gap: '20px',
                    justifyContent: 'center'
                }}>
                    {activePermissions.map(key => {
                        const config = permissionConfig[key];
                        if (!config) return null;
                        const Icon = config.icon;

                        return (
                            <div
                                key={key}
                                onClick={() => setSelectedPermission(key)}
                                style={{
                                    backgroundColor: 'white',
                                    padding: '25px',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    border: '1px solid #f0f0f0'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                                    e.currentTarget.style.borderColor = 'var(--color-aj-red)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';
                                    e.currentTarget.style.borderColor = '#f0f0f0';
                                }}
                            >
                                <div style={{
                                    color: 'var(--color-aj-red)',
                                    marginBottom: '15px',
                                    padding: '15px',
                                    backgroundColor: '#fff1f2',
                                    borderRadius: '50%'
                                }}>
                                    <Icon size={32} />
                                </div>
                                <h3 style={{
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    color: '#333'
                                }}>
                                    {config.label}
                                </h3>
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

            {/* Permission Modal */}
            {selectedPermission && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }} onClick={() => setSelectedPermission(null)}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '40px',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '600px',
                        position: 'relative',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        maxHeight: '90vh', // Limit height
                        overflowY: 'auto', // Enable scroll
                        display: 'flex', // Flex layout
                        flexDirection: 'column' // Column direction
                    }} onClick={(e) => e.stopPropagation()}>

                        <button
                            onClick={() => setSelectedPermission(null)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#666'
                            }}
                        >
                            <LogOut size={24} style={{ transform: 'rotate(45deg)' }} /> {/* Using LogOut as X icon for now, or just X */}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', borderBottom: '2px solid #f0f0f0', paddingBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{
                                    color: 'var(--color-aj-red)',
                                    padding: '15px',
                                    backgroundColor: '#fff1f2',
                                    borderRadius: '12px'
                                }}>
                                    {(() => {
                                        const Icon = permissionConfig[selectedPermission].icon;
                                        return <Icon size={40} />;
                                    })()}
                                </div>
                                <h2 style={{ fontSize: '1.8rem', color: 'var(--color-aj-black)', margin: 0 }}>
                                    {permissionConfig[selectedPermission].label}
                                </h2>
                            </div>

                            {/* Generic Upload Button - Only show if NOT monthly declarations, annual declarations, or Plame AND NOT CLIENT */}
                            {!['declaracionesMensuales', 'declaracionesAnuales', 'plame', 'afpNet', 'bancos', 'cajaChica', 'compras', 'ventas', 'otrosDocumentos'].includes(selectedPermission) && !isClient && (
                                <div>
                                    <input
                                        type="file"
                                        id="file-upload"
                                        accept="application/pdf"
                                        style={{ display: 'none' }}
                                        onChange={handleFileUpload}
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            backgroundColor: 'var(--color-aj-red)',
                                            color: 'white',
                                            padding: '10px 20px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: '500',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--color-aj-red)'}
                                    >
                                        <Upload size={18} />
                                        Subir Archivo
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Special UI for Declaraciones Mensuales */}
                        {selectedPermission === 'declaracionesMensuales' ? (
                            <div style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                                {showUploadForm ? (
                                    /* Upload Form */
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Subir Nueva Declaración</h3>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={uploadYear}
                                                    onChange={(e) => setUploadYear(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Año</option>
                                                    {['2030', '2029', '2028', '2027', '2026', '2025', '2024', '2023'].map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={uploadMonth}
                                                    onChange={(e) => setUploadMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Mes</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ border: '2px dashed #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                                            <input
                                                type="file"
                                                id="decl-upload"
                                                accept="application/pdf"
                                                style={{ display: 'none' }}
                                                onChange={(e) => setUploadFile(e.target.files[0])}
                                            />
                                            <label htmlFor="decl-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                <Upload size={32} color="var(--color-aj-red)" />
                                                <span style={{ fontWeight: '500', color: '#555' }}>
                                                    {uploadFile ? uploadFile.name : 'Seleccionar PDF de Declaración'}
                                                </span>
                                            </label>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => setShowUploadForm(false)}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSaveDeclaration}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: 'var(--color-aj-black)', color: 'white', cursor: 'pointer' }}
                                            >
                                                Guardar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* List View (Search/Filter) */
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={filterYear}
                                                    onChange={(e) => {
                                                        setFilterYear(e.target.value);
                                                        setFilterMonth('');
                                                    }}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los años</option>
                                                    {[...new Set(monthlyDeclarations.map(d => d.year))].sort().reverse().map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={filterMonth}
                                                    onChange={(e) => setFilterMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los meses</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                                                        <option key={m} value={m}>{m}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Display Result */}
                                        {/* Display Result - List of Files */}
                                        <div style={{ flex: 1, backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', overflowY: 'auto', minHeight: '300px', maxHeight: '500px', padding: '10px' }}>
                                            {(() => {
                                                // Filter declarations
                                                const filteredDeclarations = monthlyDeclarations.filter(d =>
                                                    (!filterYear || d.year === filterYear) &&
                                                    (!filterMonth || d.month === filterMonth)
                                                );

                                                if (filteredDeclarations.length > 0) {
                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {filteredDeclarations.map(decl => (
                                                                <a
                                                                    key={decl.id}
                                                                    href={decl.url}
                                                                    download={decl.name}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '15px',
                                                                        padding: '15px',
                                                                        backgroundColor: 'white',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #e5e7eb',
                                                                        textDecoration: 'none',
                                                                        color: 'var(--color-aj-black)',
                                                                        transition: 'transform 0.1s, box-shadow 0.1s'
                                                                    }}
                                                                    onMouseOver={(e) => {
                                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                                                                    }}
                                                                    onMouseOut={(e) => {
                                                                        e.currentTarget.style.transform = 'none';
                                                                        e.currentTarget.style.boxShadow = 'none';
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        backgroundColor: '#eff6ff',
                                                                        padding: '10px',
                                                                        borderRadius: '8px',
                                                                        color: '#2563eb'
                                                                    }}>
                                                                        <FileText size={24} />
                                                                    </div>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{decl.name}</div>
                                                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{decl.month} {decl.year}</div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                        <div style={{ color: '#666' }}>
                                                                            <Download size={20} />
                                                                        </div>
                                                                        {!isClient && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    handleDeleteDeclaration(decl.id);
                                                                                }}
                                                                                style={{
                                                                                    background: 'none',
                                                                                    border: 'none',
                                                                                    cursor: 'pointer',
                                                                                    color: '#ef4444',
                                                                                    padding: '4px',
                                                                                    borderRadius: '4px',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    transition: 'background-color 0.2s'
                                                                                }}
                                                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                                title="Eliminar documento"
                                                                            >
                                                                                <X size={20} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column' }}>
                                                            <FileText size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                                                            <p>No se encontraron declaraciones para los filtros seleccionados.</p>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>

                                        {!isClient && (
                                            <button
                                                onClick={() => setShowUploadForm(true)}
                                                style={{
                                                    width: '100%',
                                                    padding: '15px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'var(--color-aj-red)',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}
                                            >
                                                <Upload size={20} />
                                                Subir Declaración Mensual
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : selectedPermission === 'declaracionesAnuales' ? (
                            /* Special UI for Declaraciones Anuales */
                            <div style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                                {showAnnualUploadForm ? (
                                    /* Annual Upload Form */
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Subir Declaración Anual</h3>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={uploadAnnualYear}
                                                    onChange={(e) => setUploadAnnualYear(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Año</option>
                                                    {['2030', '2029', '2028', '2027', '2026', '2025', '2024', '2023'].map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ border: '2px dashed #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                                            <input
                                                type="file"
                                                id="annual-upload"
                                                accept="application/pdf"
                                                style={{ display: 'none' }}
                                                onChange={(e) => setUploadAnnualFile(e.target.files[0])}
                                            />
                                            <label htmlFor="annual-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                <Upload size={32} color="var(--color-aj-red)" />
                                                <span style={{ fontWeight: '500', color: '#555' }}>
                                                    {uploadAnnualFile ? uploadAnnualFile.name : 'Seleccionar PDF de Declaración Anual'}
                                                </span>
                                            </label>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => setShowAnnualUploadForm(false)}
                                                style={{
                                                    padding: '10px 20px',
                                                    borderRadius: '4px',
                                                    border: '1px solid #ccc',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}
                                            >
                                                <X size={16} /> {/* User requested X to cancel */}
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSaveAnnualDeclaration}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: 'var(--color-aj-black)', color: 'white', cursor: 'pointer' }}
                                            >
                                                Guardar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Annual List View */
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Filtrar por Año</label>
                                            <select
                                                value={filterAnnualYear}
                                                onChange={(e) => setFilterAnnualYear(e.target.value)}
                                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                            >
                                                <option value="">Todos los años</option>
                                                {[...new Set(annualDeclarations.map(d => d.year))].sort().reverse().map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Annual Declarations List */}
                                        <div style={{ flex: 1, backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', overflowY: 'auto', minHeight: '300px', maxHeight: '500px', padding: '10px' }}>
                                            {(() => {
                                                const filteredAnnual = annualDeclarations.filter(d =>
                                                    !filterAnnualYear || d.year === filterAnnualYear
                                                );

                                                if (filteredAnnual.length > 0) {
                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {filteredAnnual.map(decl => (
                                                                <a
                                                                    key={decl.id}
                                                                    href={decl.url}
                                                                    download={decl.name}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '15px',
                                                                        padding: '15px',
                                                                        backgroundColor: 'white',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #e5e7eb',
                                                                        textDecoration: 'none',
                                                                        color: 'var(--color-aj-black)',
                                                                        transition: 'transform 0.1s, box-shadow 0.1s'
                                                                    }}
                                                                    onMouseOver={(e) => {
                                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                                                                    }}
                                                                    onMouseOut={(e) => {
                                                                        e.currentTarget.style.transform = 'none';
                                                                        e.currentTarget.style.boxShadow = 'none';
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        backgroundColor: '#eff6ff',
                                                                        padding: '10px',
                                                                        borderRadius: '8px',
                                                                        color: '#2563eb'
                                                                    }}>
                                                                        <FileText size={24} />
                                                                    </div>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{decl.name}</div>
                                                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Declaración Anual {decl.year}</div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                        <div style={{ color: '#666' }}>
                                                                            <Download size={20} />
                                                                        </div>
                                                                        {!isClient && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    handleDeleteAnnualDeclaration(decl.id);
                                                                                }}
                                                                                style={{
                                                                                    background: 'none',
                                                                                    border: 'none',
                                                                                    cursor: 'pointer',
                                                                                    color: '#ef4444',
                                                                                    padding: '4px',
                                                                                    borderRadius: '4px',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    transition: 'background-color 0.2s'
                                                                                }}
                                                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                                title="Eliminar documento"
                                                                            >
                                                                                <X size={20} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column' }}>
                                                            <FileText size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                                                            <p>No se encontraron declaraciones anuales para el filtro seleccionado.</p>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>

                                        {!isClient && (
                                            <button
                                                onClick={() => setShowAnnualUploadForm(true)}
                                                style={{
                                                    width: '100%',
                                                    padding: '15px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'var(--color-aj-black)', /* Different Color for Annual */
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}
                                            >
                                                <Upload size={20} />
                                                Subir Declaración Anual
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : selectedPermission === 'plame' ? (
                            /* Special UI for Plame */
                            <div style={{ minHeight: '300px', width: '100%' }}>
                                {plameView === 'menu' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
                                        {[
                                            { label: 'Boletas de Pago', icon: FileText, action: () => setPlameView('boletas') },
                                            { label: 'Constancias de Declaración', icon: ShieldCheck, action: () => setPlameView('constancias') },
                                            { label: 'NPS', icon: FileBarChart, action: () => setPlameView('nps'), style: { gridColumn: '1 / -1', justifySelf: 'center', width: '50%' } }
                                        ].map((item, index) => (
                                            <button
                                                key={index}
                                                onClick={item.action}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: '30px',
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                                                    gap: '15px',
                                                    width: item.style && item.style.width ? item.style.width : '100%',
                                                    ...item.style
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                                    e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)';
                                                    e.currentTarget.style.borderColor = 'var(--color-aj-red)';
                                                    e.currentTarget.style.color = 'var(--color-aj-red)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.transform = 'none';
                                                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                                    e.currentTarget.style.color = 'inherit';
                                                }}
                                            >
                                                <div style={{
                                                    padding: '15px',
                                                    backgroundColor: '#fff1f2',
                                                    borderRadius: '50%',
                                                    color: 'var(--color-aj-red)'
                                                }}>
                                                    <item.icon size={32} />
                                                </div>
                                                <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {plameView === 'boletas' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                                            <button
                                                onClick={() => setPlameView('menu')}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '5px' }}
                                            >
                                                <LogOut size={20} style={{ transform: 'rotate(180deg)' }} />
                                            </button>
                                            <div style={{
                                                color: 'var(--color-aj-red)',
                                                backgroundColor: '#fff1f2',
                                                padding: '10px',
                                                borderRadius: '50%'
                                            }}>
                                                <FileText size={24} />
                                            </div>
                                            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Boletas de Pago</h3>
                                        </div>

                                        {/* Filters */}
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={boletasFilterYear}
                                                    onChange={(e) => {
                                                        setBoletasFilterYear(e.target.value);
                                                        setBoletasFilterMonth('');
                                                    }}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los años</option>
                                                    {[...new Set(boletasList.map(b => b.year))].sort().reverse().map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={boletasFilterMonth}
                                                    onChange={(e) => setBoletasFilterMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los meses</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                                                        <option key={m} value={m}>{m}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* List */}
                                        <div style={{ flex: 1, backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', overflowY: 'auto', minHeight: '300px', maxHeight: '500px', padding: '10px' }}>
                                            {(() => {
                                                const filteredBoletas = boletasList.filter(b =>
                                                    (!boletasFilterYear || b.year === boletasFilterYear) &&
                                                    (!boletasFilterMonth || b.month === boletasFilterMonth)
                                                );

                                                if (filteredBoletas.length > 0) {
                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {filteredBoletas.map(boleta => (
                                                                <div
                                                                    key={boleta.id}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '15px',
                                                                        padding: '15px',
                                                                        backgroundColor: 'white',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #e5e7eb'
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        backgroundColor: '#eff6ff',
                                                                        padding: '10px',
                                                                        borderRadius: '8px',
                                                                        color: '#2563eb'
                                                                    }}>
                                                                        <FileText size={24} />
                                                                    </div>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{boleta.name}</div>
                                                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{boleta.month} {boleta.year}</div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                        <a
                                                                            href={boleta.url}
                                                                            download={boleta.name}
                                                                            style={{ color: '#666' }}
                                                                        >
                                                                            <Download size={20} />
                                                                        </a>
                                                                        {!isClient && (
                                                                            <button
                                                                                onClick={() => handleDeleteBoleta(boleta.id)}
                                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                                            >
                                                                                <X size={20} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column' }}>
                                                            <FileText size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                                                            <p>No se encontraron boletas de pago.</p>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>

                                        <div style={{ marginBottom: '10px' }}>
                                            <button
                                                onClick={handleDownloadBoletasZip}
                                                style={{
                                                    width: '100%',
                                                    padding: '15px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'var(--color-aj-black)',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}
                                            >
                                                <Download size={20} />
                                                Descargas masivas
                                            </button>
                                        </div>



                                        {!isClient && (
                                            <button
                                                onClick={() => setPlameView('upload_boletas')}
                                                style={{
                                                    width: '100%',
                                                    padding: '15px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'var(--color-aj-red)',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}
                                            >
                                                <Upload size={20} />
                                                Subir Boletas de Pago
                                            </button>
                                        )}
                                    </div>
                                )}

                                {plameView === 'upload_boletas' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Subir Boletas de Pago</h3>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={uploadBoletasYear}
                                                    onChange={(e) => setUploadBoletasYear(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Año</option>
                                                    {['2030', '2029', '2028', '2027', '2026', '2025', '2024', '2023'].map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={uploadBoletasMonth}
                                                    onChange={(e) => setUploadBoletasMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Mes</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ border: '2px dashed #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                                            <input
                                                type="file"
                                                id="boletas-upload"
                                                accept="application/pdf"
                                                multiple
                                                style={{ display: 'none' }}
                                                onChange={handleBoletasUpload}
                                            />
                                            <label htmlFor="boletas-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                <Upload size={32} color="var(--color-aj-red)" />
                                                <span style={{ fontWeight: '500', color: '#555' }}>
                                                    {uploadBoletasFiles.length > 0
                                                        ? `${uploadBoletasFiles.length} archivo(s) seleccionado(s)`
                                                        : 'Seleccionar PDF(s) de Boletas'}
                                                </span>
                                            </label>
                                            {uploadBoletasFiles.length > 0 && (
                                                <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#666' }}>
                                                    {uploadBoletasFiles.map((f, i) => <div key={i}>{f.name}</div>)}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => {
                                                    setPlameView('boletas');
                                                    setUploadBoletasFiles([]);
                                                }}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSaveBoletas}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: 'var(--color-aj-black)', color: 'white', cursor: 'pointer' }}
                                            >
                                                Subir Boletas
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {plameView === 'constancias' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                                            <button
                                                onClick={() => setPlameView('menu')}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '5px' }}
                                            >
                                                <LogOut size={20} style={{ transform: 'rotate(180deg)' }} />
                                            </button>
                                            <div style={{
                                                color: 'var(--color-aj-red)',
                                                backgroundColor: '#fff1f2',
                                                padding: '10px',
                                                borderRadius: '50%'
                                            }}>
                                                <ShieldCheck size={24} />
                                            </div>
                                            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Constancias de Declaración</h3>
                                        </div>

                                        {/* Filters */}
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={constanciasFilterYear}
                                                    onChange={(e) => {
                                                        setConstanciasFilterYear(e.target.value);
                                                        setConstanciasFilterMonth('');
                                                    }}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los años</option>
                                                    {[...new Set(constanciasList.map(c => c.year))].sort().reverse().map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={constanciasFilterMonth}
                                                    onChange={(e) => setConstanciasFilterMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los meses</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                                                        <option key={m} value={m}>{m}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* List */}
                                        <div style={{ flex: 1, backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', overflowY: 'auto', minHeight: '300px', maxHeight: '500px', padding: '10px' }}>
                                            {(() => {
                                                const filteredConstancias = constanciasList.filter(c =>
                                                    (!constanciasFilterYear || c.year === constanciasFilterYear) &&
                                                    (!constanciasFilterMonth || c.month === constanciasFilterMonth)
                                                );

                                                if (filteredConstancias.length > 0) {
                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {filteredConstancias.map(constancia => (
                                                                <div
                                                                    key={constancia.id}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '15px',
                                                                        padding: '15px',
                                                                        backgroundColor: 'white',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #e5e7eb'
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        backgroundColor: '#eff6ff',
                                                                        padding: '10px',
                                                                        borderRadius: '8px',
                                                                        color: '#2563eb'
                                                                    }}>
                                                                        <ShieldCheck size={24} />
                                                                    </div>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{constancia.name}</div>
                                                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{constancia.month} {constancia.year}</div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                        <a
                                                                            href={constancia.url}
                                                                            download={constancia.name}
                                                                            style={{ color: '#666' }}
                                                                        >
                                                                            <Download size={20} />
                                                                        </a>
                                                                        {!isClient && (
                                                                            <button
                                                                                onClick={() => handleDeleteConstancia(constancia.id)}
                                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                                            >
                                                                                <X size={20} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column' }}>
                                                            <ShieldCheck size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                                                            <p>No se encontraron constancias de declaración.</p>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>

                                        {!isClient && (
                                            <button
                                                onClick={() => setPlameView('upload_constancias')}
                                                style={{
                                                    width: '100%',
                                                    padding: '15px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'var(--color-aj-red)',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}
                                            >
                                                <Upload size={20} />
                                                Subir constancias
                                            </button>
                                        )}
                                    </div>
                                )}

                                {plameView === 'upload_constancias' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Subir Constancias de Declaración</h3>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={uploadConstanciasYear}
                                                    onChange={(e) => setUploadConstanciasYear(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Año</option>
                                                    {['2030', '2029', '2028', '2027', '2026', '2025', '2024', '2023'].map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={uploadConstanciasMonth}
                                                    onChange={(e) => setUploadConstanciasMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Mes</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ border: '2px dashed #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                                            <input
                                                type="file"
                                                id="constancias-upload"
                                                accept="application/pdf"
                                                multiple
                                                style={{ display: 'none' }}
                                                onChange={handleConstanciasUpload}
                                            />
                                            <label htmlFor="constancias-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                <Upload size={32} color="var(--color-aj-red)" />
                                                <span style={{ fontWeight: '500', color: '#555' }}>
                                                    {uploadConstanciasFiles.length > 0
                                                        ? `${uploadConstanciasFiles.length} archivo(s) seleccionado(s)`
                                                        : 'Seleccionar PDF(s) de Constancias'}
                                                </span>
                                            </label>
                                            {uploadConstanciasFiles.length > 0 && (
                                                <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#666' }}>
                                                    {uploadConstanciasFiles.map((f, i) => <div key={i}>{f.name}</div>)}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => {
                                                    setPlameView('constancias');
                                                    setUploadConstanciasFiles([]);
                                                }}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSaveConstancias}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: 'var(--color-aj-black)', color: 'white', cursor: 'pointer' }}
                                            >
                                                Subir constancia
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {plameView === 'nps' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                                            <button
                                                onClick={() => setPlameView('menu')}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '5px' }}
                                            >
                                                <LogOut size={20} style={{ transform: 'rotate(180deg)' }} />
                                            </button>
                                            <div style={{
                                                color: 'var(--color-aj-red)',
                                                backgroundColor: '#fff1f2',
                                                padding: '10px',
                                                borderRadius: '50%'
                                            }}>
                                                <FileBarChart size={24} />
                                            </div>
                                            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>NPS</h3>
                                        </div>

                                        {/* Filters */}
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={npsFilterYear}
                                                    onChange={(e) => {
                                                        setNpsFilterYear(e.target.value);
                                                        setNpsFilterMonth('');
                                                    }}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los años</option>
                                                    {[...new Set(npsList.map(n => n.year))].sort().reverse().map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={npsFilterMonth}
                                                    onChange={(e) => setNpsFilterMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los meses</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                                                        <option key={m} value={m}>{m}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* List */}
                                        <div style={{ flex: 1, backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', overflowY: 'auto', minHeight: '300px', maxHeight: '500px', padding: '10px' }}>
                                            {(() => {
                                                const filteredNps = npsList.filter(n =>
                                                    (!npsFilterYear || n.year === npsFilterYear) &&
                                                    (!npsFilterMonth || n.month === npsFilterMonth)
                                                );

                                                if (filteredNps.length > 0) {
                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {filteredNps.map(n => (
                                                                <div
                                                                    key={n.id}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '15px',
                                                                        padding: '15px',
                                                                        backgroundColor: 'white',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #e5e7eb'
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        backgroundColor: '#eff6ff',
                                                                        padding: '10px',
                                                                        borderRadius: '8px',
                                                                        color: '#2563eb'
                                                                    }}>
                                                                        <FileBarChart size={24} />
                                                                    </div>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{n.name}</div>
                                                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{n.month} {n.year}</div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                        <a
                                                                            href={n.url}
                                                                            download={n.name}
                                                                            style={{ color: '#666' }}
                                                                        >
                                                                            <Download size={20} />
                                                                        </a>
                                                                        {!isClient && (
                                                                            <button
                                                                                onClick={() => handleDeleteNps(n.id)}
                                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                                            >
                                                                                <X size={20} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column' }}>
                                                            <FileBarChart size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                                                            <p>No se encontraron NPS.</p>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>

                                        {!isClient && (
                                            <button
                                                onClick={() => setPlameView('upload_nps')}
                                                style={{
                                                    width: '100%',
                                                    padding: '15px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'var(--color-aj-red)',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}
                                            >
                                                <Upload size={20} />
                                                Subir los NPS
                                            </button>
                                        )}
                                    </div>
                                )}

                                {plameView === 'upload_nps' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Subir NPS</h3>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={uploadNpsYear}
                                                    onChange={(e) => setUploadNpsYear(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Año</option>
                                                    {['2030', '2029', '2028', '2027', '2026', '2025', '2024', '2023'].map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={uploadNpsMonth}
                                                    onChange={(e) => setUploadNpsMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Mes</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ border: '2px dashed #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                                            <input
                                                type="file"
                                                id="nps-upload"
                                                accept="application/pdf"
                                                multiple
                                                style={{ display: 'none' }}
                                                onChange={handleNpsUpload}
                                            />
                                            <label htmlFor="nps-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                <Upload size={32} color="var(--color-aj-red)" />
                                                <span style={{ fontWeight: '500', color: '#555' }}>
                                                    {uploadNpsFiles.length > 0
                                                        ? `${uploadNpsFiles.length} archivo(s) seleccionado(s)`
                                                        : 'Seleccionar PDF(s) de NPS'}
                                                </span>
                                            </label>
                                            {uploadNpsFiles.length > 0 && (
                                                <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#666' }}>
                                                    {uploadNpsFiles.map((f, i) => <div key={i}>{f.name}</div>)}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => {
                                                    setPlameView('nps');
                                                    setUploadNpsFiles([]);
                                                }}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSaveNps}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: 'var(--color-aj-black)', color: 'white', cursor: 'pointer' }}
                                            >
                                                Subir NPS
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : selectedPermission === 'bancos' ? (
                            <div style={{ minHeight: '300px', width: '100%' }}>
                                {!showBancosUploadForm ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {/* Filters */}
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={bancosFilterYear}
                                                    onChange={(e) => {
                                                        setBancosFilterYear(e.target.value);
                                                        setBancosFilterMonth('');
                                                    }}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los años</option>
                                                    {[...new Set(bancosList.map(b => b.year))].sort().reverse().map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={bancosFilterMonth}
                                                    onChange={(e) => setBancosFilterMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los meses</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                                                        <option key={m} value={m}>{m}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* List */}
                                        <div style={{ flex: 1, backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', overflowY: 'auto', minHeight: '300px', maxHeight: '500px', padding: '10px' }}>
                                            {(() => {
                                                const filteredBancos = bancosList.filter(b =>
                                                    (!bancosFilterYear || b.year === bancosFilterYear) &&
                                                    (!bancosFilterMonth || b.month === bancosFilterMonth)
                                                );

                                                if (filteredBancos.length > 0) {
                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {filteredBancos.map(banco => (
                                                                <div
                                                                    key={banco.id}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '15px',
                                                                        padding: '15px',
                                                                        backgroundColor: 'white',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #e5e7eb'
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        backgroundColor: '#eff6ff',
                                                                        padding: '10px',
                                                                        borderRadius: '8px',
                                                                        color: '#2563eb'
                                                                    }}>
                                                                        <Landmark size={24} />
                                                                    </div>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                                                            <span style={{ fontWeight: '600' }}>{banco.name}</span>
                                                                            <span style={{
                                                                                fontSize: '0.75rem',
                                                                                padding: '2px 8px',
                                                                                borderRadius: '12px',
                                                                                backgroundColor: banco.type === 'Extracto Bancario' ? '#dbeafe' : '#fce7f3',
                                                                                color: banco.type === 'Extracto Bancario' ? '#1e40af' : '#9d174d',
                                                                                fontWeight: '600',
                                                                                border: '1px solid',
                                                                                borderColor: banco.type === 'Extracto Bancario' ? '#bfdbfe' : '#fbcfe8'
                                                                            }}>
                                                                                {banco.type}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{banco.month} {banco.year}</div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                        <a
                                                                            href={banco.url}
                                                                            download={banco.name}
                                                                            style={{ color: '#666' }}
                                                                        >
                                                                            <Download size={20} />
                                                                        </a>
                                                                        {!isClient && (
                                                                            <button
                                                                                onClick={() => handleDeleteBancos(banco.id)}
                                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                                            >
                                                                                <X size={20} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column' }}>
                                                            <Landmark size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                                                            <p>No se encontraron documentos de Bancos.</p>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>

                                        <button
                                            onClick={() => setShowBancosUploadForm(true)}
                                            style={{
                                                width: '100%',
                                                padding: '15px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: 'var(--color-aj-red)',
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '10px'
                                            }}
                                        >
                                            <Upload size={20} />
                                            Subir Documentación de Bancos
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Subir Documento de Bancos</h3>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={uploadBancosYear}
                                                    onChange={(e) => setUploadBancosYear(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Año</option>
                                                    {['2030', '2029', '2028', '2027', '2026', '2025', '2024', '2023'].map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={uploadBancosMonth}
                                                    onChange={(e) => setUploadBancosMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Mes</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Doc Type Selection */}
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>Tipo de Documento</label>
                                            <div style={{ display: 'flex', gap: '20px' }}>
                                                <button
                                                    onClick={() => setUploadBancosType('Extracto Bancario')}
                                                    style={{
                                                        flex: 1,
                                                        padding: '15px',
                                                        borderRadius: '8px',
                                                        border: `2px solid ${uploadBancosType === 'Extracto Bancario' ? 'var(--color-aj-red)' : '#eee'}`,
                                                        backgroundColor: uploadBancosType === 'Extracto Bancario' ? '#fff1f2' : 'white',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        color: uploadBancosType === 'Extracto Bancario' ? 'var(--color-aj-red)' : '#555'
                                                    }}
                                                >
                                                    Extracto Bancario
                                                </button>
                                                {!isClient && (
                                                    <button
                                                        onClick={() => setUploadBancosType('Conciliacion Bancaria')}
                                                        style={{
                                                            flex: 1,
                                                            padding: '15px',
                                                            borderRadius: '8px',
                                                            border: `2px solid ${uploadBancosType === 'Conciliacion Bancaria' ? 'var(--color-aj-red)' : '#eee'}`,
                                                            backgroundColor: uploadBancosType === 'Conciliacion Bancaria' ? '#fff1f2' : 'white',
                                                            cursor: 'pointer',
                                                            fontWeight: '600',
                                                            color: uploadBancosType === 'Conciliacion Bancaria' ? 'var(--color-aj-red)' : '#555'
                                                        }}
                                                    >
                                                        Conciliación Bancaria
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ border: '2px dashed #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                                            <input
                                                type="file"
                                                id="bancos-upload"
                                                accept=".pdf, .xlsx, .xls"
                                                style={{ display: 'none' }}
                                                onChange={handleBancosUpload}
                                            />
                                            <label htmlFor="bancos-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                <Upload size={32} color="var(--color-aj-red)" />
                                                <span style={{ fontWeight: '500', color: '#555' }}>
                                                    {uploadBancosFile ? uploadBancosFile.name : 'Seleccionar PDF o Excel'}
                                                </span>
                                            </label>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => {
                                                    setShowBancosUploadForm(false);
                                                    setUploadBancosType('');
                                                    setUploadBancosFile(null);
                                                }}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSaveBancos}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: 'var(--color-aj-black)', color: 'white', cursor: 'pointer' }}
                                            >
                                                Subir
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : selectedPermission === 'afpNet' ? (
                            <div style={{ minHeight: '300px', width: '100%' }}>
                                {!showAfpUploadForm ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>


                                        {/* Filters */}
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={afpFilterYear}
                                                    onChange={(e) => {
                                                        setAfpFilterYear(e.target.value);
                                                        setAfpFilterMonth('');
                                                    }}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los años</option>
                                                    {[...new Set(afpNetList.map(a => a.year))].sort().reverse().map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={afpFilterMonth}
                                                    onChange={(e) => setAfpFilterMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los meses</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                                                        <option key={m} value={m}>{m}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* List */}
                                        <div style={{ flex: 1, backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', overflowY: 'auto', minHeight: '300px', maxHeight: '500px', padding: '10px' }}>
                                            {(() => {
                                                const filteredAfp = afpNetList.filter(a =>
                                                    (!afpFilterYear || a.year === afpFilterYear) &&
                                                    (!afpFilterMonth || a.month === afpFilterMonth)
                                                );

                                                if (filteredAfp.length > 0) {
                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {filteredAfp.map(afp => (
                                                                <div
                                                                    key={afp.id}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '15px',
                                                                        padding: '15px',
                                                                        backgroundColor: 'white',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #e5e7eb'
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        backgroundColor: '#eff6ff',
                                                                        padding: '10px',
                                                                        borderRadius: '8px',
                                                                        color: '#2563eb'
                                                                    }}>
                                                                        <ShieldCheck size={24} />
                                                                    </div>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                                                            <span style={{ fontWeight: '600' }}>{afp.name}</span>
                                                                            <span style={{
                                                                                fontSize: '0.75rem',
                                                                                padding: '2px 8px',
                                                                                borderRadius: '12px',
                                                                                backgroundColor: afp.type === 'Detalle' ? '#dbeafe' : '#fce7f3',
                                                                                color: afp.type === 'Detalle' ? '#1e40af' : '#9d174d',
                                                                                fontWeight: '600',
                                                                                border: '1px solid',
                                                                                borderColor: afp.type === 'Detalle' ? '#bfdbfe' : '#fbcfe8'
                                                                            }}>
                                                                                {afp.type}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{afp.month} {afp.year}</div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                        <a
                                                                            href={afp.url}
                                                                            download={afp.name}
                                                                            style={{ color: '#666' }}
                                                                        >
                                                                            <Download size={20} />
                                                                        </a>
                                                                        {!isClient && (
                                                                            <button
                                                                                onClick={() => handleDeleteAfp(afp.id)}
                                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                                            >
                                                                                <X size={20} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column' }}>
                                                            <ShieldCheck size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                                                            <p>No se encontraron documentos de AFP NET.</p>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>

                                        {!isClient && (
                                            <button
                                                onClick={() => setShowAfpUploadForm(true)}
                                                style={{
                                                    width: '100%',
                                                    padding: '15px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'var(--color-aj-red)',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}
                                            >
                                                <Upload size={20} />
                                                Subir Documentación de AFP NET
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Subir Documentación AFP NET</h3>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={uploadAfpYear}
                                                    onChange={(e) => setUploadAfpYear(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Año</option>
                                                    {['2030', '2029', '2028', '2027', '2026', '2025', '2024', '2023'].map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={uploadAfpMonth}
                                                    onChange={(e) => setUploadAfpMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Mes</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Doc Type Selection */}
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>Tipo de Documento</label>
                                            <div style={{ display: 'flex', gap: '20px' }}>
                                                <button
                                                    onClick={() => setUploadAfpType('Detalle')}
                                                    style={{
                                                        flex: 1,
                                                        padding: '15px',
                                                        borderRadius: '8px',
                                                        border: `2px solid ${uploadAfpType === 'Detalle' ? 'var(--color-aj-red)' : '#eee'}`,
                                                        backgroundColor: uploadAfpType === 'Detalle' ? '#fff1f2' : 'white',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        color: uploadAfpType === 'Detalle' ? 'var(--color-aj-red)' : '#555'
                                                    }}
                                                >
                                                    Detalle
                                                </button>
                                                <button
                                                    onClick={() => setUploadAfpType('Ticket')}
                                                    style={{
                                                        flex: 1,
                                                        padding: '15px',
                                                        borderRadius: '8px',
                                                        border: `2px solid ${uploadAfpType === 'Ticket' ? 'var(--color-aj-red)' : '#eee'}`,
                                                        backgroundColor: uploadAfpType === 'Ticket' ? '#fff1f2' : 'white',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        color: uploadAfpType === 'Ticket' ? 'var(--color-aj-red)' : '#555'
                                                    }}
                                                >
                                                    Ticket
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ border: '2px dashed #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                                            <input
                                                type="file"
                                                id="afp-upload"
                                                accept="application/pdf"
                                                style={{ display: 'none' }}
                                                onChange={handleAfpUpload}
                                            />
                                            <label htmlFor="afp-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                <Upload size={32} color="var(--color-aj-red)" />
                                                <span style={{ fontWeight: '500', color: '#555' }}>
                                                    {uploadAfpFile ? uploadAfpFile.name : 'Seleccionar PDF'}
                                                </span>
                                            </label>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => {
                                                    setShowAfpUploadForm(false);
                                                    setUploadAfpType('');
                                                    setUploadAfpFile(null);
                                                }}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSaveAfp}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: 'var(--color-aj-black)', color: 'white', cursor: 'pointer' }}
                                            >
                                                Subir
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : selectedPermission === 'cajaChica' ? (
                            <div style={{ minHeight: '300px', width: '100%' }}>
                                {!showCajaChicaUploadForm ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {/* Filters */}
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={cajaChicaFilterYear}
                                                    onChange={(e) => {
                                                        setCajaChicaFilterYear(e.target.value);
                                                        setCajaChicaFilterMonth('');
                                                    }}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los años</option>
                                                    {[...new Set(cajaChicaList.map(c => c.year))].sort().reverse().map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={cajaChicaFilterMonth}
                                                    onChange={(e) => setCajaChicaFilterMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los meses</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                                                        <option key={m} value={m}>{m}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* List */}
                                        <div style={{ flex: 1, backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', overflowY: 'auto', minHeight: '300px', maxHeight: '500px', padding: '10px' }}>
                                            {(() => {
                                                const filteredCaja = cajaChicaList.filter(c =>
                                                    (!cajaChicaFilterYear || c.year === cajaChicaFilterYear) &&
                                                    (!cajaChicaFilterMonth || c.month === cajaChicaFilterMonth)
                                                );

                                                if (filteredCaja.length > 0) {
                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {filteredCaja.map(caja => (
                                                                <div
                                                                    key={caja.id}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '15px',
                                                                        padding: '15px',
                                                                        backgroundColor: 'white',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #e5e7eb'
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        backgroundColor: '#eff6ff',
                                                                        padding: '10px',
                                                                        borderRadius: '8px',
                                                                        color: '#2563eb'
                                                                    }}>
                                                                        <FileSpreadsheet size={24} />
                                                                    </div>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                                                            <span style={{ fontWeight: '600' }}>{caja.name}</span>
                                                                            <span style={{
                                                                                fontSize: '0.75rem',
                                                                                padding: '2px 8px',
                                                                                borderRadius: '12px',
                                                                                backgroundColor: caja.type === 'Control de Caja Chica' ? '#dbeafe' : '#fce7f3',
                                                                                color: caja.type === 'Control de Caja Chica' ? '#1e40af' : '#9d174d',
                                                                                fontWeight: '600',
                                                                                border: '1px solid',
                                                                                borderColor: caja.type === 'Control de Caja Chica' ? '#bfdbfe' : '#fbcfe8'
                                                                            }}>
                                                                                {caja.type}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{caja.month} {caja.year}</div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                        <a
                                                                            href={caja.url}
                                                                            download={caja.name}
                                                                            style={{ color: '#666' }}
                                                                        >
                                                                            <Download size={20} />
                                                                        </a>
                                                                        {!isClient && (
                                                                            <button
                                                                                onClick={() => handleDeleteCajaChica(caja.id)}
                                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                                            >
                                                                                <X size={20} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column' }}>
                                                            <FileSpreadsheet size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                                                            <p>No se encontraron documentos de Control de Caja.</p>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>

                                        <button
                                            onClick={() => setShowCajaChicaUploadForm(true)}
                                            style={{
                                                width: '100%',
                                                padding: '15px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: 'var(--color-aj-red)',
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '10px'
                                            }}
                                        >
                                            <Upload size={20} />
                                            Subir Excel de Control de Caja
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Subir Excel de Control de Caja</h3>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={uploadCajaChicaYear}
                                                    onChange={(e) => setUploadCajaChicaYear(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Año</option>
                                                    {['2030', '2029', '2028', '2027', '2026', '2025', '2024', '2023'].map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={uploadCajaChicaMonth}
                                                    onChange={(e) => setUploadCajaChicaMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Mes</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Doc Type Selection */}
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>Tipo de Documento</label>
                                            <div style={{ display: 'flex', gap: '20px' }}>
                                                <button
                                                    onClick={() => setUploadCajaChicaType('Control de Caja Chica')}
                                                    style={{
                                                        flex: 1,
                                                        padding: '15px',
                                                        borderRadius: '8px',
                                                        border: `2px solid ${uploadCajaChicaType === 'Control de Caja Chica' ? 'var(--color-aj-red)' : '#eee'}`,
                                                        backgroundColor: uploadCajaChicaType === 'Control de Caja Chica' ? '#fff1f2' : 'white',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        color: uploadCajaChicaType === 'Control de Caja Chica' ? 'var(--color-aj-red)' : '#555'
                                                    }}
                                                >
                                                    Control de Caja
                                                </button>
                                                {!isClient && (
                                                    <button
                                                        onClick={() => setUploadCajaChicaType('Arqueo de Caja')}
                                                        style={{
                                                            flex: 1,
                                                            padding: '15px',
                                                            borderRadius: '8px',
                                                            border: `2px solid ${uploadCajaChicaType === 'Arqueo de Caja' ? 'var(--color-aj-red)' : '#eee'}`,
                                                            backgroundColor: uploadCajaChicaType === 'Arqueo de Caja' ? '#fff1f2' : 'white',
                                                            cursor: 'pointer',
                                                            fontWeight: '600',
                                                            color: uploadCajaChicaType === 'Arqueo de Caja' ? 'var(--color-aj-red)' : '#555'
                                                        }}
                                                    >
                                                        Arqueo de Caja
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ border: '2px dashed #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                                            <input
                                                type="file"
                                                id="caja-upload"
                                                accept=".xlsx, .xls"
                                                style={{ display: 'none' }}
                                                onChange={handleCajaChicaUpload}
                                            />
                                            <label htmlFor="caja-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                <Upload size={32} color="var(--color-aj-red)" />
                                                <span style={{ fontWeight: '500', color: '#555' }}>
                                                    {uploadCajaChicaFile ? uploadCajaChicaFile.name : 'Seleccionar Excel'}
                                                </span>
                                            </label>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => {
                                                    setShowCajaChicaUploadForm(false);
                                                    setUploadCajaChicaType('');
                                                    setUploadCajaChicaFile(null);
                                                }}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSaveCajaChica}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: 'var(--color-aj-black)', color: 'white', cursor: 'pointer' }}
                                            >
                                                Subir
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : selectedPermission === 'compras' ? (
                            <div style={{ minHeight: '300px', width: '100%' }}>
                                {!showComprasUploadForm ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {/* Filters */}
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={comprasFilterYear}
                                                    onChange={(e) => {
                                                        setComprasFilterYear(e.target.value);
                                                        setComprasFilterMonth('');
                                                    }}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los años</option>
                                                    {[...new Set(comprasList.map(c => c.year))].sort().reverse().map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={comprasFilterMonth}
                                                    onChange={(e) => setComprasFilterMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los meses</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                                                        <option key={m} value={m}>{m}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* List */}
                                        <div style={{ flex: 1, backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', overflowY: 'auto', minHeight: '300px', maxHeight: '500px', padding: '10px' }}>
                                            {(() => {
                                                const filteredCompras = comprasList.filter(c =>
                                                    (!comprasFilterYear || c.year === comprasFilterYear) &&
                                                    (!comprasFilterMonth || c.month === comprasFilterMonth)
                                                );

                                                if (filteredCompras.length > 0) {
                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {filteredCompras.map(compra => (
                                                                <div
                                                                    key={compra.id}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '15px',
                                                                        padding: '15px',
                                                                        backgroundColor: 'white',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #e5e7eb'
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        backgroundColor: '#eff6ff',
                                                                        padding: '10px',
                                                                        borderRadius: '8px',
                                                                        color: '#2563eb'
                                                                    }}>
                                                                        <ShoppingCart size={24} />
                                                                    </div>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ fontWeight: '600' }}>{compra.name}</div>
                                                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{compra.month} {compra.year}</div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                        <a
                                                                            href={compra.url}
                                                                            download={compra.name}
                                                                            style={{ color: '#666' }}
                                                                        >
                                                                            <Download size={20} />
                                                                        </a>
                                                                        {!isClient && (
                                                                            <button
                                                                                onClick={() => handleDeleteCompras(compra.id)}
                                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                                            >
                                                                                <X size={20} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column' }}>
                                                            <ShoppingCart size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                                                            <p>No se encontraron comprobantes de compras.</p>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>

                                        {/* Buttons */}
                                        <div>
                                            <button
                                                onClick={handleDownloadComprasZip}
                                                style={{
                                                    width: '100%',
                                                    padding: '15px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'var(--color-aj-black)', // Updated to black
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    marginBottom: '10px'
                                                }}
                                            >
                                                <Download size={20} />
                                                Descargas masivas
                                            </button>
                                            <button
                                                onClick={() => setShowComprasUploadForm(true)}
                                                style={{
                                                    width: '100%',
                                                    padding: '15px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'var(--color-aj-red)',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}
                                            >
                                                <Upload size={20} />
                                                Subir compras
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Subir Comprobantes de Compras</h3>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={uploadComprasYear}
                                                    onChange={(e) => setUploadComprasYear(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Año</option>
                                                    {['2030', '2029', '2028', '2027', '2026', '2025', '2024', '2023'].map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={uploadComprasMonth}
                                                    onChange={(e) => setUploadComprasMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Mes</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ border: '2px dashed #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                                            <input
                                                type="file"
                                                id="compras-upload"
                                                accept="application/pdf"
                                                multiple
                                                style={{ display: 'none' }}
                                                onChange={handleComprasUpload}
                                            />
                                            <label htmlFor="compras-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                <Upload size={32} color="var(--color-aj-red)" />
                                                <span style={{ fontWeight: '500', color: '#555' }}>
                                                    {uploadComprasFiles.length > 0 ? `${uploadComprasFiles.length} archivos seleccionados` : 'Seleccionar PDF(s) - Máximo 200'}
                                                </span>
                                            </label>
                                            {uploadComprasFiles.length > 0 && (
                                                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666', maxHeight: '100px', overflowY: 'auto' }}>
                                                    {uploadComprasFiles.map((f, i) => <div key={i}>{f.name}</div>)}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => {
                                                    setShowComprasUploadForm(false);
                                                    setUploadComprasYear('');
                                                    setUploadComprasMonth('');
                                                    setUploadComprasFiles([]);
                                                }}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSaveCompras}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: 'var(--color-aj-black)', color: 'white', cursor: 'pointer' }}
                                            >
                                                Subir
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : selectedPermission === 'ventas' ? (
                            <div style={{ minHeight: '300px', width: '100%' }}>
                                {!showVentasUploadForm ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {/* Filters */}
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={ventasFilterYear}
                                                    onChange={(e) => {
                                                        setVentasFilterYear(e.target.value);
                                                        setVentasFilterMonth('');
                                                    }}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los años</option>
                                                    {[...new Set(ventasList.map(v => v.year))].sort().reverse().map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={ventasFilterMonth}
                                                    onChange={(e) => setVentasFilterMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Todos los meses</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                                                        <option key={m} value={m}>{m}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* List */}
                                        <div style={{ flex: 1, backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', overflowY: 'auto', minHeight: '300px', maxHeight: '500px', padding: '10px' }}>
                                            {(() => {
                                                const filteredVentas = ventasList.filter(v =>
                                                    (!ventasFilterYear || v.year === ventasFilterYear) &&
                                                    (!ventasFilterMonth || v.month === ventasFilterMonth)
                                                );

                                                if (filteredVentas.length > 0) {
                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {filteredVentas.map(venta => (
                                                                <div
                                                                    key={venta.id}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '15px',
                                                                        padding: '15px',
                                                                        backgroundColor: 'white',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #e5e7eb'
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        backgroundColor: '#eff6ff',
                                                                        padding: '10px',
                                                                        borderRadius: '8px',
                                                                        color: '#2563eb'
                                                                    }}>
                                                                        <TrendingUp size={24} />
                                                                    </div>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ fontWeight: '600' }}>{venta.name}</div>
                                                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{venta.month} {venta.year}</div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                        <a
                                                                            href={venta.url}
                                                                            download={venta.name}
                                                                            style={{ color: '#666' }}
                                                                        >
                                                                            <Download size={20} />
                                                                        </a>
                                                                        {!isClient && (
                                                                            <button
                                                                                onClick={() => handleDeleteVentas(venta.id)}
                                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                                            >
                                                                                <X size={20} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column' }}>
                                                            <TrendingUp size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                                                            <p>No se encontraron comprobantes de ventas.</p>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>

                                        {/* Buttons */}
                                        <div>
                                            <button
                                                onClick={handleDownloadVentasZip}
                                                style={{
                                                    width: '100%',
                                                    padding: '15px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'var(--color-aj-black)',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    marginBottom: '10px'
                                                }}
                                            >
                                                <Download size={20} />
                                                Descargas masivas
                                            </button>
                                            <button
                                                onClick={() => setShowVentasUploadForm(true)}
                                                style={{
                                                    width: '100%',
                                                    padding: '15px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'var(--color-aj-red)',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}
                                            >
                                                <Upload size={20} />
                                                Subir ventas
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Subir Comprobantes de Ventas</h3>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                <select
                                                    value={uploadVentasYear}
                                                    onChange={(e) => setUploadVentasYear(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Año</option>
                                                    {['2030', '2029', '2028', '2027', '2026', '2025', '2024', '2023'].map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                <select
                                                    value={uploadVentasMonth}
                                                    onChange={(e) => setUploadVentasMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">Seleccionar Mes</option>
                                                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ border: '2px dashed #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                                            <input
                                                type="file"
                                                id="ventas-upload"
                                                accept="application/pdf"
                                                multiple
                                                style={{ display: 'none' }}
                                                onChange={handleVentasUpload}
                                            />
                                            <label htmlFor="ventas-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                <Upload size={32} color="var(--color-aj-red)" />
                                                <span style={{ fontWeight: '500', color: '#555' }}>
                                                    {uploadVentasFiles.length > 0 ? `${uploadVentasFiles.length} archivos seleccionados` : 'Seleccionar PDF(s) - Máximo 200'}
                                                </span>
                                            </label>
                                            {uploadVentasFiles.length > 0 && (
                                                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666', maxHeight: '100px', overflowY: 'auto' }}>
                                                    {uploadVentasFiles.map((f, i) => <div key={i}>{f.name}</div>)}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => {
                                                    setShowVentasUploadForm(false);
                                                    setUploadVentasYear('');
                                                    setUploadVentasMonth('');
                                                    setUploadVentasFiles([]);
                                                }}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSaveVentas}
                                                style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: 'var(--color-aj-black)', color: 'white', cursor: 'pointer' }}
                                            >
                                                Subir
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : selectedPermission === 'otrosDocumentos' ? (
                            <div style={{ minHeight: '300px', width: '100%' }}>
                                {!otrosDocumentosCategory ? (
                                    /* Category Selection View */
                                    /* Category Selection View */
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                                        {/* Row 1: Notificaciones and Varios */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            {[
                                                { id: 'notificaciones', label: 'Notificaciones SUNAT', icon: FileText },
                                                { id: 'varios', label: 'Documentos Varios', icon: FileText }
                                            ].map(cat => (
                                                <div
                                                    key={cat.id}
                                                    onClick={() => setOtrosDocumentosCategory(cat.id)}
                                                    style={{
                                                        backgroundColor: 'white',
                                                        padding: '25px',
                                                        borderRadius: '12px',
                                                        border: '1px solid #e5e7eb',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '15px',
                                                        textAlign: 'center',
                                                        transition: 'all 0.2s',
                                                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.borderColor = 'var(--color-aj-red)';
                                                        e.currentTarget.style.boxShadow = '0 5px 15px rgba(220, 38, 38, 0.1)';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                                                    }}
                                                >
                                                    <div style={{
                                                        backgroundColor: '#fff1f2',
                                                        padding: '15px',
                                                        borderRadius: '50%',
                                                        color: 'var(--color-aj-red)'
                                                    }}>
                                                        <cat.icon size={32} />
                                                    </div>
                                                    <span style={{ fontWeight: '600', fontSize: '1.1rem', color: '#1f2937' }}>{cat.label}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Row 2: Constitucion (Centered) */}
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <div
                                                onClick={() => setOtrosDocumentosCategory('constitucion')}
                                                style={{
                                                    backgroundColor: 'white',
                                                    padding: '25px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #e5e7eb',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '15px',
                                                    textAlign: 'center',
                                                    transition: 'all 0.2s',
                                                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                                    width: '50%' // Optional: make it same width as others or just centered
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.borderColor = 'var(--color-aj-red)';
                                                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(220, 38, 38, 0.1)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                                                }}
                                            >
                                                <div style={{
                                                    backgroundColor: '#fff1f2',
                                                    padding: '15px',
                                                    borderRadius: '50%',
                                                    color: 'var(--color-aj-red)'
                                                }}>
                                                    <FileBarChart size={32} />
                                                </div>
                                                <span style={{ fontWeight: '600', fontSize: '1.1rem', color: '#1f2937' }}>Documentos de Constitucion de empresas</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Detail View for Category */
                                    <div>
                                        <div style={{ marginBottom: '20px' }}>
                                            <button
                                                onClick={() => {
                                                    setOtrosDocumentosCategory(null);
                                                    setShowOtrosDocumentosUploadForm(false);
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#666',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                ← Volver a categorías
                                            </button>
                                            <h3 style={{ fontSize: '1.5rem', marginTop: '10px', color: 'var(--color-aj-black)' }}>
                                                {otrosDocumentosCategory === 'notificaciones' ? 'Notificaciones SUNAT' :
                                                    otrosDocumentosCategory === 'constitucion' ? 'Documentos de Constitucion' : 'Documentos Varios'}
                                            </h3>
                                        </div>

                                        {!showOtrosDocumentosUploadForm ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                {/* Filters */}
                                                <div style={{ display: 'flex', gap: '20px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                        <select
                                                            value={otrosDocumentosFilterYear}
                                                            onChange={(e) => {
                                                                setOtrosDocumentosFilterYear(e.target.value);
                                                                setOtrosDocumentosFilterMonth('');
                                                            }}
                                                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                        >
                                                            <option value="">Todos los años</option>
                                                            {[...new Set(otrosDocumentosList.filter(d => d.category === otrosDocumentosCategory).map(d => d.year))].sort().reverse().map(y => (
                                                                <option key={y} value={y}>{y}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                        <select
                                                            value={otrosDocumentosFilterMonth}
                                                            onChange={(e) => setOtrosDocumentosFilterMonth(e.target.value)}
                                                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                        >
                                                            <option value="">Todos los meses</option>
                                                            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                                                                <option key={m} value={m}>{m}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* List */}
                                                <div style={{ flex: 1, backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', overflowY: 'auto', minHeight: '300px', maxHeight: '500px', padding: '10px' }}>
                                                    {(() => {
                                                        const filteredDocs = otrosDocumentosList.filter(d =>
                                                            d.category === otrosDocumentosCategory &&
                                                            (!otrosDocumentosFilterYear || d.year === otrosDocumentosFilterYear) &&
                                                            (!otrosDocumentosFilterMonth || d.month === otrosDocumentosFilterMonth)
                                                        );

                                                        if (filteredDocs.length > 0) {
                                                            return (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                    {filteredDocs.map(doc => (
                                                                        <div
                                                                            key={doc.id}
                                                                            style={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '15px',
                                                                                padding: '15px',
                                                                                backgroundColor: 'white',
                                                                                borderRadius: '8px',
                                                                                border: '1px solid #e5e7eb'
                                                                            }}
                                                                        >
                                                                            <div style={{
                                                                                backgroundColor: '#eff6ff',
                                                                                padding: '10px',
                                                                                borderRadius: '8px',
                                                                                color: '#2563eb'
                                                                            }}>
                                                                                <FileText size={24} />
                                                                            </div>
                                                                            <div style={{ flex: 1 }}>
                                                                                <div style={{ fontWeight: '600' }}>{doc.name}</div>
                                                                                <div style={{ fontSize: '0.85rem', color: '#666' }}>{doc.month} {doc.year}</div>
                                                                            </div>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                                <a
                                                                                    href={doc.url}
                                                                                    download={doc.name}
                                                                                    style={{ color: '#666' }}
                                                                                >
                                                                                    <Download size={20} />
                                                                                </a>
                                                                                {!isClient && (
                                                                                    <button
                                                                                        onClick={() => handleDeleteOtrosDocumentos(doc.id)}
                                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                                                    >
                                                                                        <X size={20} />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        } else {
                                                            return (
                                                                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column' }}>
                                                                    <FileText size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                                                                    <p>No se encontraron documentos en esta categoría.</p>
                                                                </div>
                                                            );
                                                        }
                                                    })()}
                                                </div>

                                                {(!isClient || otrosDocumentosCategory === 'constitucion') && (
                                                    <button
                                                        onClick={() => setShowOtrosDocumentosUploadForm(true)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '15px',
                                                            borderRadius: '6px',
                                                            border: 'none',
                                                            background: 'var(--color-aj-red)',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold',
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            gap: '10px'
                                                        }}
                                                    >
                                                        <Upload size={20} />
                                                        Subir Documento
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Subir Documento</h3>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año</label>
                                                        <select
                                                            value={uploadOtrosDocumentosYear}
                                                            onChange={(e) => setUploadOtrosDocumentosYear(e.target.value)}
                                                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                        >
                                                            <option value="">Seleccionar Año</option>
                                                            {['2030', '2029', '2028', '2027', '2026', '2025', '2024', '2023'].map(y => <option key={y} value={y}>{y}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mes</label>
                                                        <select
                                                            value={uploadOtrosDocumentosMonth}
                                                            onChange={(e) => setUploadOtrosDocumentosMonth(e.target.value)}
                                                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                        >
                                                            <option value="">Seleccionar Mes</option>
                                                            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => <option key={m} value={m}>{m}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div style={{ border: '2px dashed #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                                                    <input
                                                        type="file"
                                                        id="otros-upload"
                                                        accept="application/pdf, .doc, .docx, .xls, .xlsx"
                                                        style={{ display: 'none' }}
                                                        onChange={handleOtrosDocumentosUpload}
                                                    />
                                                    <label htmlFor="otros-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                        <Upload size={32} color="var(--color-aj-red)" />
                                                        <span style={{ fontWeight: '500', color: '#555' }}>
                                                            {uploadOtrosDocumentosFile ? uploadOtrosDocumentosFile.name : 'Seleccionar Archivo'}
                                                        </span>
                                                    </label>
                                                </div>

                                                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => {
                                                            setShowOtrosDocumentosUploadForm(false);
                                                            setUploadOtrosDocumentosYear('');
                                                            setUploadOtrosDocumentosMonth('');
                                                            setUploadOtrosDocumentosFile(null);
                                                        }}
                                                        style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        onClick={handleSaveOtrosDocumentos}
                                                        style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: 'var(--color-aj-black)', color: 'white', cursor: 'pointer' }}
                                                    >
                                                        Subir
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Generic UI for Other Permissions */
                            <div style={{ color: '#555', lineHeight: '1.6', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                                {files[selectedPermission] ? (
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{
                                            flex: 1,
                                            backgroundColor: '#f9f9f9',
                                            borderRadius: '8px',
                                            border: '1px solid #eee',
                                            overflow: 'hidden',
                                            height: '600px'
                                        }}>
                                            <iframe
                                                src={files[selectedPermission].url}
                                                title="PDF Preview"
                                                style={{ width: '100%', height: '100%', border: 'none' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <a
                                                href={files[selectedPermission].url}
                                                download={files[selectedPermission].name}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    backgroundColor: 'var(--color-aj-black)',
                                                    color: 'white',
                                                    padding: '10px 20px',
                                                    borderRadius: '6px',
                                                    textDecoration: 'none',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                <Download size={18} />
                                                Descargar PDF
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#999',
                                        border: '2px dashed #eee',
                                        borderRadius: '8px',
                                        padding: '40px'
                                    }}>
                                        <FileText size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                                        <p>No ha subido ningún documento para este permiso.</p>
                                        <p style={{ fontSize: '0.9rem' }}>Utilice el botón "Subir Archivo" para adjuntar un PDF.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default CompanyDashboard;
