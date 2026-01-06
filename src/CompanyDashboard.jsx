import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import logo from './assets/LogoSolo.png';
import bgImage from './assets/bg-accountants.png';

const CompanyDashboard = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        navigate('/');
    };

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
                    <span style={{ fontWeight: '500' }}>{currentUser.razonSocial || 'Empresa'}</span>
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
                    >
                        <LogOut size={16} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '40px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{
                    backgroundColor: 'var(--color-aj-white)',
                    padding: '40px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    borderLeft: '8px solid var(--color-aj-red)',
                    textAlign: 'center',
                    maxWidth: '800px'
                }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', color: 'var(--color-aj-black)' }}>
                        Bienvenido, {currentUser.razonSocial || 'Usuario'}
                    </h2>
                    <p style={{ color: '#555', fontSize: '1.2rem', lineHeight: '1.8' }}>
                        Has ingresado exitosamente a tu portal de empresa.
                        <br />
                        Aquí podrás visualizar tus declaraciones, reportes y estado actual.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default CompanyDashboard;
