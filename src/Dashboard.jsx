import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Menu } from 'lucide-react';

import api from './api';
import logo from './assets/LogoSolo.png';
import bgImage from './assets/bg-accountants.png';
import CreateUserModal from './CreateUserModal';
import CompaniesSidebar from './components/CompaniesSidebar';
// usuarios.json removed — credentials are managed server-side

const Dashboard = () => {
    const [companies, setCompanies] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    useEffect(() => {
        const sync = async () => {
            try {
                const { data } = await api.get('/companies');
                if (Array.isArray(data)) {
                    setCompanies(data);
                    localStorage.setItem('companies', JSON.stringify(data));
                }
            } catch (err) {
                console.error('Error syncing companies:', err);
                const saved = localStorage.getItem('companies');
                if (saved) setCompanies(JSON.parse(saved));
            }
        };
        sync();
    }, []);

    // Password logging removed for security — credentials never leave the server


    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        navigate('/');
    };

    const handleCreateCompany = async (companyData) => {
        try {
            const newCompany = { ...companyData, role: 'client' };
            const res = await api.post('/companies', newCompany);
            if (res.status >= 200 && res.status < 300) {
                // Re-fetch everything to stay in sync
                const { data } = await api.get('/companies');
                setCompanies(data);
                localStorage.setItem('companies', JSON.stringify(data));
                setIsModalOpen(false);
                setEditingCompany(null);
                console.log('%c✅ Usuario guardado en DB', 'color: #059669; font-weight: bold;');
            }
        } catch (err) {
            console.error('Error al guardar empresa:', err);
            alert('Error al conectar con el servidor.');
        }
    };

    const handleDeleteCompany = async (ruc) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta empresa?')) {
            try {
                const res = await api.delete(`/companies/${ruc}`);
                if (res.status >= 200 && res.status < 300) {
                    const updated = companies.filter(c => c.ruc !== ruc);
                    setCompanies(updated);
                    localStorage.setItem('companies', JSON.stringify(updated));
                }
            } catch (err) {
                console.error('Error al eliminar:', err);
            }
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

            <CompaniesSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                companies={companies}
                onCompanyClick={(c) => navigate(`/company/${c.ruc}`)}
                onEditClick={handleEditClick}
                onDeleteCompany={handleDeleteCompany}
            />

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
                    existingCompanies={companies}
                />
            )}

            <style>{`
                @keyframes bell-vibrate {
                    0% { transform: rotate(0); }
                    10% { transform: rotate(15deg); }
                    20% { transform: rotate(-15deg); }
                    30% { transform: rotate(10deg); }
                    40% { transform: rotate(-10deg); }
                    50% { transform: rotate(0); }
                    100% { transform: rotate(0); }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
