import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

const CreateUserModal = ({ onClose, onCreate, initialData, isEdit }) => {
    const [formData, setFormData] = useState({
        ruc: initialData?.ruc || '',
        razonSocial: initialData?.razonSocial || '',
        direccion: initialData?.direccion || '',
        usuario: initialData?.usuario || '',
        contrasena: initialData?.contrasena || '',
    });

    const [permissions, setPermissions] = useState(initialData?.permissions || {
        fichaRuc: false,
        declaracionesMensuales: false,
        declaracionesAnuales: false,
        reporteTributario: false,
        plame: false,
        afpNet: false,
        bancos: false,
        bancos: false,
        cajaChica: false,
        compras: false,
        ventas: false,
    });

    const permissionLabels = {
        fichaRuc: 'Ficha RUC',
        declaracionesMensuales: 'Declaraciones Mensuales',
        declaracionesAnuales: 'Declaraciones Anuales',
        reporteTributario: 'Reporte Tributario',
        plame: 'Plame',
        afpNet: 'AFP NET',
        bancos: 'Bancos',
        bancos: 'Bancos',
        cajaChica: 'Caja Chica',
        compras: 'Compras',
        ventas: 'Ventas',
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (name) => {
        setPermissions(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const [isLoadingRuc, setIsLoadingRuc] = useState(false);

    const handleSearchRuc = async () => {
        if (!formData.ruc || formData.ruc.length !== 11) {
            alert('Por favor ingrese un RUC válido de 11 dígitos.');
            return;
        }

        setIsLoadingRuc(true);
        // Simulación de consulta a SUNAT (debido a restricciones de CORS y Captcha en el sitio real)
        setTimeout(() => {
            // Datos de prueba simulados
            const mockData = {
                razonSocial: 'AJ CONTRATISTAS GENERALES S.A.C.',
                direccion: 'AV. JAVIER PRADO ESTE 1234 - LIMA'
            };

            setFormData(prev => ({
                ...prev,
                razonSocial: mockData.razonSocial,
                direccion: mockData.direccion
            }));
            setIsLoadingRuc(false);
            alert('Datos encontrados de SUNAT (Simulado)');
        }, 1500);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newCompany = { ...formData, permissions };
        // console.log('Creating/Updating User:', newCompany);
        alert(isEdit ? 'Permisos actualizados exitosamente' : 'Usuario creado exitosamente');

        if (onCreate) {
            onCreate(newCompany);
        } else {
            onClose();
        }
    };

    return (
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
        }}>
            <div style={{
                backgroundColor: 'var(--color-aj-white)',
                padding: '30px',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative'
            }}>
                <h2 style={{ marginBottom: '20px', color: 'var(--color-aj-red)', borderBottom: '2px solid var(--color-aj-black)', paddingBottom: '10px' }}>
                    {isEdit ? 'Editar Permisos de Empresa' : 'Crear Usuario de Empresa'}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>RUC</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    name="ruc"
                                    value={formData.ruc}
                                    onChange={handleInputChange}
                                    required
                                    maxLength={11}
                                    placeholder="Ingrese RUC"
                                    disabled={isEdit}
                                    style={{
                                        width: '50%',
                                        padding: '8px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        backgroundColor: isEdit ? '#f0f0f0' : 'white',
                                        cursor: isEdit ? 'not-allowed' : 'text'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleSearchRuc}
                                    disabled={isLoadingRuc || isEdit}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 16px',
                                        backgroundColor: isEdit ? '#999' : 'var(--color-aj-black)',
                                        color: 'var(--color-aj-white)',
                                        borderRadius: '4px',
                                        fontSize: '0.9rem',
                                        transition: 'background-color 0.2s',
                                        opacity: isLoadingRuc || isEdit ? 0.7 : 1,
                                        cursor: isEdit ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isLoadingRuc ? <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
                                    CONSULTA SUNAT
                                </button>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Razón Social o Nombres</label>
                            <input
                                type="text"
                                name="razonSocial"
                                value={formData.razonSocial}
                                onChange={handleInputChange}
                                required
                                disabled={isEdit}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    backgroundColor: isEdit ? '#f0f0f0' : 'white',
                                    cursor: isEdit ? 'not-allowed' : 'text'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Dirección Fiscal</label>
                            <input
                                type="text"
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleInputChange}
                                required
                                disabled={isEdit}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    backgroundColor: isEdit ? '#f0f0f0' : 'white',
                                    cursor: isEdit ? 'not-allowed' : 'text'
                                }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Usuario</label>
                                <input
                                    type="text"
                                    name="usuario"
                                    value={formData.usuario}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Usuario para la empresa"
                                    disabled={isEdit}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        backgroundColor: isEdit ? '#f0f0f0' : 'white',
                                        cursor: isEdit ? 'not-allowed' : 'text'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Contraseña</label>
                                <input
                                    type="password"
                                    name="contrasena"
                                    value={formData.contrasena}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Contraseña de acceso"
                                    disabled={isEdit}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        backgroundColor: isEdit ? '#f0f0f0' : 'white',
                                        cursor: isEdit ? 'not-allowed' : 'text'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '10px', fontWeight: '600' }}>Permisos</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {Object.keys(permissions).map((key) => (
                                <label key={key} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={permissions[key]}
                                        onChange={() => handleCheckboxChange(key)}
                                        style={{ marginRight: '8px', accentColor: 'var(--color-aj-red)' }}
                                    />
                                    {permissionLabels[key]}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#999',
                                color: 'white',
                                borderRadius: '4px'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '10px 20px',
                                backgroundColor: 'var(--color-aj-red)',
                                color: 'white',
                                borderRadius: '4px'
                            }}
                        >
                            {isEdit ? 'Guardar Cambios' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUserModal;
