import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, LogOut, FileText, Calendar, CalendarDays, FileBarChart, Users, ShieldCheck, Landmark, Wallet, ShoppingCart, TrendingUp, Upload, Download, X } from 'lucide-react';
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
        // localStorage.removeItem('currentUser'); // Optional: depend on desired behavior
        navigate('/dashboard'); // Go back to main dashboard instead of logging out completely
    };

    const permissionConfig = {
        fichaRuc: { label: 'Ficha RUC', icon: FileText },
        declaracionesMensuales: { label: 'Declaraciones Mensuales', icon: Calendar },
        declaracionesAnuales: { label: 'Declaraciones Anuales', icon: CalendarDays },
        reporteTributario: { label: 'Reporte Tributario', icon: FileBarChart },
        plame: { label: 'Plame', icon: Users },
        afpNet: { label: 'AFP NET', icon: ShieldCheck },
        bancos: { label: 'Bancos', icon: Landmark },
        cajaChica: { label: 'Caja Chica', icon: Wallet },
        compras: { label: 'Compras', icon: ShoppingCart },
        ventas: { label: 'Ventas', icon: TrendingUp },
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
                        <span style={{ fontWeight: '500' }}>Administrador</span>
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
                        <span>Volver</span>
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
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
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

                            {/* Generic Upload Button - Only show if NOT monthly declarations, annual declarations, or Plame */}
                            {!['declaracionesMensuales', 'declaracionesAnuales', 'plame'].includes(selectedPermission) && (
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
                                                    onChange={(e) => setFilterYear(e.target.value)}
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
                                    </div>
                                )}
                            </div>
                        ) : selectedPermission === 'plame' ? (
                            /* Special UI for Plame */
                            <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', width: '100%', gap: '20px' }}>
                                    {[
                                        { label: 'Boletas de Pago', icon: FileText },
                                        { label: 'Constancias de Declaración', icon: ShieldCheck },
                                        { label: 'NPS', icon: FileBarChart }
                                    ].map((item, index) => (
                                        <button
                                            key={index}
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
                                                width: '250px', // Fixed width for consistency
                                                flex: '0 0 auto' // Prevent stretching
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
            )}
        </div>
    );
};

export default CompanyDashboard;
