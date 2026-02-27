import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SquarePen, Bell, FilePenLine, Trash2 } from 'lucide-react';

// Helper that mirrors the earlier implementation in Dashboard.jsx
function checkClientUploads(ruc) {
    try {
        const sections = ['compras', 'ventas'];
        return sections.some(sec => {
            const data = localStorage.getItem(`docs_${ruc}_${sec}`);
            if (!data) return false;
            const list = JSON.parse(data);
            return list.some(item => item.uploadedBy === 'client' && !item.seenByAdmin);
        });
    } catch {
        return false;
    }
}

const CompaniesSidebar = ({
    isOpen,
    onClose,
    companies = [],
    onCompanyClick,
    onEditClick,
    onDeleteCompany
}) => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.role !== 'admin') return null; // sólo admins ven la barra

    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);

    const filteredCompanies = companies.filter(company =>
        company.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.ruc.includes(searchTerm)
    );

    const notificationCount = companies.reduce((acc, c) => acc + (checkClientUploads(c.ruc) ? 1 : 0), 0);

    return (
        <>
            {isOpen && (
                <div
                    onClick={onClose}
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

            <div style={{
                position: 'absolute',
                top: '72px',
                left: isOpen ? 0 : '-300px',
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: '#f0f4f8', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-aj-black)' }}>
                                <Bell size={20} color={notificationCount > 0 ? 'var(--color-aj-red)' : '#666'} />
                                <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Notificaciones Globales</span>
                            </div>
                            {notificationCount > 0 && (
                                <span style={{
                                    backgroundColor: 'var(--color-aj-red)',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold'
                                }}>
                                    {notificationCount}
                                </span>
                            )}
                        </div>
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
                                            onClick={() => onCompanyClick(company)}
                                        >
                                            {company.razonSocial}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#666' }}>RUC: {company.ruc}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {checkClientUploads(company.ruc) && (
                                            <div
                                                title="El cliente subió documentos nuevos"
                                                style={{
                                                    color: '#ef4444',
                                                    animation: 'bell-vibrate 2s infinite ease-in-out',
                                                    position: 'relative'
                                                }}
                                            >
                                                <Bell size={18} fill="#ef4444" />
                                                <span style={{
                                                    position: 'absolute',
                                                    top: '-5px',
                                                    right: '-5px',
                                                    backgroundColor: 'white',
                                                    color: 'var(--color-aj-red)',
                                                    fontSize: '0.6rem',
                                                    fontWeight: 'bold',
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: '1px solid var(--color-aj-red)'
                                                }}>!</span>
                                            </div>
                                        )}
                                        {isEditMode && (onEditClick || onDeleteCompany) && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {onEditClick && (
                                                    <button
                                                        onClick={() => onEditClick(company)}
                                                        title="Editar"
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#555' }}
                                                    >
                                                        <FilePenLine size={18} />
                                                    </button>
                                                )}
                                                {onDeleteCompany && (
                                                    <button
                                                        onClick={() => onDeleteCompany(company.ruc)}
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
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </>
    );
};

export default CompaniesSidebar;
