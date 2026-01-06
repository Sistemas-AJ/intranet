import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import logo from './assets/LogoSolo.png';
import bgImage from './assets/bg-accountants.png';
import CreateUserModal from './CreateUserModal';

const Dashboard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/');
    };

    // Assuming user is ADMIN for now as per requirements
    const userName = "ADMIN";

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
                color: 'var(--color-aj-white)'
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

            {/* Main Content */}
            <main style={{ flex: 1, padding: '40px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{
                    backgroundColor: 'var(--color-aj-white)',
                    padding: '40px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    marginBottom: '30px',
                    borderLeft: '8px solid var(--color-aj-red)',
                    background: 'linear-gradient(to right, #fff, #f9f9f9)'
                }}>
                    <h2 style={{ fontSize: '2.2rem', marginBottom: '15px', color: 'var(--color-aj-black)' }}>
                        ¡Bienvenido al Centro de Control, {userName}!
                    </h2>
                    <p style={{ color: '#555', fontSize: '1.1rem', maxWidth: '800px', lineHeight: '1.8' }}>
                        Has ingresado a la <strong>Intranet de AJ Contratistas Generales</strong>.
                        Desde este panel podrás gestionar usuarios, administrar permisos y supervisar las actividades de la empresa con total eficiencia.
                        Todas las herramientas administrativas están listas para su uso.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            padding: '30px',
                            backgroundColor: 'var(--color-aj-white)',
                            border: '2px solid var(--color-aj-black)',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '200px'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-aj-black)';
                            e.currentTarget.style.color = 'var(--color-aj-white)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-aj-white)';
                            e.currentTarget.style.color = 'var(--color-text)';
                        }}
                    >
                        <span style={{ fontSize: '3rem', marginBottom: '10px' }}>+</span>
                        Crear Usuario de Empresa
                    </button>
                </div>
            </main>

            {isModalOpen && <CreateUserModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default Dashboard;
