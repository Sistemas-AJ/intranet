import React, { useState } from 'react';
import { Search, Loader2, Eye, EyeOff } from 'lucide-react';

const CreateUserModal = ({ onClose, onCreate, initialData, isEdit, existingCompanies = [] }) => {
    const [formData, setFormData] = useState({
        ruc: initialData?.ruc || '',
        razonSocial: initialData?.razonsocial || initialData?.razonSocial || '',
        direccion: initialData?.direccion || '',
        usuario: initialData?.usuario || '',
        contrasena: '',
    });

    const [permissions, setPermissions] = useState(initialData?.permissions || {
        fichaRuc: false,
        declaracionesMensuales: false,
        declaracionesAnuales: false,
        reporteTributario: false,
        plame: false,
        afpNet: false,
        bancos: false,
        cajaChica: false,
        compras: false,
        ventas: false,
        otrosDocumentos: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const permissionLabels = {
        fichaRuc: 'Ficha RUC',
        declaracionesMensuales: 'Declaraciones Mensuales',
        declaracionesAnuales: 'Declaraciones Anuales',
        reporteTributario: 'Reporte Tributario',
        plame: 'Plame',
        afpNet: 'AFP NET',
        bancos: 'Bancos',
        cajaChica: 'Control de Caja',
        compras: 'Compras',
        ventas: 'Ventas',
        otrosDocumentos: 'Otros Documentos',
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (name) => {
        setPermissions(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const handleSelectAll = () => {
        const allSelected = Object.values(permissions).every(val => val);
        const newState = {};
        Object.keys(permissions).forEach(key => {
            newState[key] = !allSelected;
        });
        setPermissions(newState);
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

        // Validar unicidad de RUC y de usuario (solo si no es edición o si el campo cambió)
        if (!isEdit || (initialData && formData.ruc !== initialData.ruc)) {
            const rucExists = existingCompanies.some(c => c.ruc === formData.ruc);
            if (rucExists) {
                alert('Este RUC ya esta registrado');
                return;
            }
        }

        if (!isEdit || (initialData && formData.usuario !== initialData.usuario)) {
            const userExists = existingCompanies.some(c => c.usuario === formData.usuario);
            if (userExists) {
                alert('Este nombre de usuario ya esta en uso');
                return;
            }
        }

        const newCompany = { ...formData, permissions };
        // console.log('Creating/Updating User:', newCompany);
        alert(isEdit ? 'Empresa actualizada exitosamente' : 'Usuario creado exitosamente');

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
                    {isEdit ? 'Editar Empresa' : 'Crear Usuario de Empresa'}
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
                                        width: isEdit ? '100%' : '50%',
                                        padding: '8px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        backgroundColor: isEdit ? '#f0f0f0' : 'white',
                                        cursor: isEdit ? 'not-allowed' : 'text'
                                    }}
                                />
                                {!isEdit && (
                                    <button
                                        type="button"
                                        onClick={handleSearchRuc}
                                        disabled={isLoadingRuc}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 16px',
                                            backgroundColor: 'var(--color-aj-black)',
                                            color: 'var(--color-aj-white)',
                                            borderRadius: '4px',
                                            fontSize: '0.9rem',
                                            transition: 'background-color 0.2s',
                                            opacity: isLoadingRuc ? 0.7 : 1,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {isLoadingRuc ? <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
                                        CONSULTA SUNAT
                                    </button>
                                )}
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
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    backgroundColor: 'white',
                                    cursor: 'text'
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
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    backgroundColor: 'white',
                                    cursor: 'text'
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
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="contrasena"
                                        value={formData.contrasena}
                                        onChange={handleInputChange}
                                        required={!isEdit}
                                        placeholder={isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña de acceso'}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            paddingRight: '35px',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '4px',
                                            backgroundColor: 'white',
                                            cursor: 'text'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#666'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>Permisos</h3>
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                style={{
                                    fontSize: '0.85rem',
                                    padding: '4px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--color-aj-red)',
                                    background: 'transparent',
                                    color: 'var(--color-aj-red)',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => {
                                    e.currentTarget.style.background = 'var(--color-aj-red)';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--color-aj-red)';
                                }}
                            >
                                Seleccionar todo
                            </button>
                        </div>
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
