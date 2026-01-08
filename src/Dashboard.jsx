import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Menu, Search, SquarePen, Trash2, FilePenLine } from 'lucide-react';
import logo from './assets/LogoSolo.png';
import bgImage from './assets/bg-accountants.png';
import CreateUserModal from './CreateUserModal';

const Dashboard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Load companies from localStorage on initial render
    const [companies, setCompanies] = useState(() => {
        const savedCompanies = localStorage.getItem('companies');
        return savedCompanies ? JSON.parse(savedCompanies) : [];
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const navigate = useNavigate();

    const filteredCompanies = companies.filter(company =>
        company.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.ruc.includes(searchTerm)
    );

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        navigate('/');
    };

    const handleCreateCompany = (companyData) => {
        let updatedCompanies;

        if (editingCompany) {
            // Update existing company
            updatedCompanies = companies.map(company =>
                company.ruc === editingCompany.ruc ? { ...company, ...companyData } : company
            );
        } else {
            // Create new company
            // Add role to company data for login purposes
            const newCompany = { ...companyData, role: 'company' };
            updatedCompanies = [...companies, newCompany];
        }

        setCompanies(updatedCompanies);
        localStorage.setItem('companies', JSON.stringify(updatedCompanies));
        setIsModalOpen(false);
        setEditingCompany(null);
    };

    const handleDeleteCompany = (ruc) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta empresa?')) {
            const updatedCompanies = companies.filter(company => company.ruc !== ruc);
            setCompanies(updatedCompanies);
            localStorage.setItem('companies', JSON.stringify(updatedCompanies));
        }
    };

    const handleEditClick = (company) => {
        setEditingCompany(company);
        setIsModalOpen(true);
    };

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userName = currentUser.razonSocial || currentUser.usuario || "ADMIN";

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
                        <span style={{ fontWeight: '500' }}>{userName}</span>
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
                            fontSize: '0.9rem'
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
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        zIndex: 15
                    }}
                />
            )}

            {/* Sidebar */}
            <div style={{
                position: 'absolute',
                top: '72px', // Approximate header height
                left: isSidebarOpen ? 0 : '-300px',
                width: '300px',
                height: 'calc(100% - 72px)',
                backgroundColor: 'var(--color-aj-white)',
                boxShadow: '2px 0 10px rgba(0,0,0,0.2)',
                transition: 'left 0.3s ease',
                zIndex: 16,
                padding: '20px',
                overflowY: 'auto'
            }}>
                <h3 style={{ borderBottom: '2px solid var(--color-aj-red)', paddingBottom: '10px', marginBottom: '20px', color: 'var(--color-aj-black)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Empresas Registradas
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isEditMode ? 'var(--color-aj-red)' : 'inherit' }}
                    >
                        <SquarePen size={20} />
                    </button>
                </h3>

                <div style={{ marginBottom: '20px', position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Buscar por Razón Social o RUC..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 10px 10px 35px',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            fontSize: '0.9rem'
                        }}
                    />
                    <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                </div>

                {filteredCompanies.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>
                        {searchTerm ? 'No se encontraron empresas.' : 'No hay empresas registradas.'}
                    </p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {filteredCompanies.map((company, index) => (
                            <li key={index} style={{
                                padding: '15px',
                                borderBottom: '1px solid #eee',
                                backgroundColor: '#f9f9f9',
                                marginBottom: '10px',
                                borderRadius: '4px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div
                                        style={{ fontWeight: 'bold', marginBottom: '5px', cursor: 'pointer', textDecoration: 'underline' }}
                                        onClick={() => navigate(`/company/${company.ruc}`)}
                                    >
                                        {company.razonSocial}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#666' }}>RUC: {company.ruc}</div>
                                </div>
                                {isEditMode && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            // Edit functionality
                                            onClick={() => handleEditClick(company)}
                                            title="Editar"
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#555' }}
                                        >
                                            <FilePenLine size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCompany(company.ruc)}
                                            title="Eliminar"
                                            style={{
                                                border: 'none',
                                                background: '#fee2e2',
                                                borderRadius: '4px',
                                                padding: '4px',
                                                cursor: 'pointer',
                                                color: '#ef4444',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '40px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'stretch', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {/* Welcome Message */}
                    <div style={{
                        backgroundColor: 'var(--color-aj-white)',
                        padding: '40px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        borderLeft: '8px solid var(--color-aj-red)',
                        maxWidth: '700px',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', color: 'var(--color-aj-black)', lineHeight: '1.2' }}>
                            ¡Bienvenido al Centro de Control, {userName}!
                        </h2>
                        <p style={{ color: '#555', fontSize: '1.2rem', lineHeight: '1.6' }}>
                            Has ingresado a la <strong>Intranet de AJ Contratistas Generales</strong>. Desde este panel podrás gestionar usuarios, administrar permisos y supervisar las actividades de la empresa con total eficiencia. Todas las herramientas administrativas están listas para su uso.
                        </p>
                    </div>

                    {/* Create User Card */}
                    <div
                        onClick={() => {
                            setEditingCompany(null);
                            setIsModalOpen(true);
                        }}
                        style={{
                            backgroundColor: 'var(--color-aj-red)',
                            padding: '40px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '280px', // Fixed width for square-ish look
                            minHeight: '280px',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            textAlign: 'center'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
                        }}
                    >
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            padding: '20px',
                            marginBottom: '20px',
                            color: 'var(--color-aj-red)'
                        }}>
                            <User size={48} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Crear Usuario de Empresa</h3>
                        <p style={{ marginTop: '10px', opacity: 0.9 }}>Registrar nuevo cliente</p>
                    </div>
                </div>
            </main>

            {isModalOpen && (
                <CreateUserModal
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingCompany(null);
                    }}
                    onCreate={handleCreateCompany}
                    initialData={editingCompany}
                    isEdit={!!editingCompany}
                />
            )}
        </div>
    );
};

export default Dashboard;
