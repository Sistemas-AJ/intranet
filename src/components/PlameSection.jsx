import React from 'react';
import { FileText, ShieldCheck, FileBarChart, LogOut } from 'lucide-react';
import DocumentSection from './DocumentSection';
import useDocumentSection from '../hooks/useDocumentSection';

/**
 * Subcomponente para la sección PLAME.
 * Tiene su propia navegación interna: menú → boletas | constancias | nps
 */
const PlameSection = ({ isClient, ruc }) => {
    const [view, setView] = React.useState('menu'); // 'menu' | 'boletas' | 'constancias' | 'nps'

    const boletas = useDocumentSection({ multiple: true, hasZip: true, zipLabel: 'boletas', storageKey: `docs_${ruc}_plame_boletas` });
    const constancias = useDocumentSection({ multiple: true, zipLabel: 'constancias', storageKey: `docs_${ruc}_plame_constancias` });
    const nps = useDocumentSection({ multiple: true, zipLabel: 'nps', storageKey: `docs_${ruc}_plame_nps` });

    // Reset form state when navigating back to menu
    const goToMenu = () => {
        boletas.setShowForm(false);
        constancias.setShowForm(false);
        nps.setShowForm(false);
        setView('menu');
    };

    const subSections = {
        boletas: {
            hook: boletas,
            label: 'Boletas de Pago',
            icon: FileText,
            emptyMessage: 'No se encontraron boletas de pago.',
            uploadLabel: 'Subir Boletas de Pago',
            formTitle: 'Subir Boletas de Pago',
            deleteConfirm: '¿Eliminar esta boleta?',
            hasZip: true,
        },
        constancias: {
            hook: constancias,
            label: 'Constancias de Declaración',
            icon: ShieldCheck,
            emptyMessage: 'No se encontraron constancias de declaración.',
            uploadLabel: 'Subir Constancias',
            formTitle: 'Subir Constancias de Declaración',
            deleteConfirm: '¿Eliminar esta constancia?',
            hasZip: false,
        },
        nps: {
            hook: nps,
            label: 'NPS',
            icon: FileBarChart,
            emptyMessage: 'No se encontraron NPS.',
            uploadLabel: 'Subir los NPS',
            formTitle: 'Subir NPS',
            deleteConfirm: '¿Eliminar este NPS?',
            hasZip: false,
        },
    };

    if (view === 'menu') {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
                {[
                    { id: 'boletas', label: 'Boletas de Pago', icon: FileText },
                    { id: 'constancias', label: 'Constancias de Declaración', icon: ShieldCheck },
                    { id: 'nps', label: 'NPS', icon: FileBarChart, fullWidth: true },
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        style={{
                            gridColumn: item.fullWidth ? '1 / -1' : undefined,
                            justifySelf: item.fullWidth ? 'center' : undefined,
                            width: item.fullWidth ? '50%' : '100%',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', padding: '30px',
                            backgroundColor: 'white', border: '1px solid #e5e7eb',
                            borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)', gap: '15px'
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)';
                            e.currentTarget.style.borderColor = 'var(--color-aj-red)';
                            e.currentTarget.style.color = 'var(--color-aj-red)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.color = 'inherit';
                        }}
                    >
                        <div style={{ padding: '15px', backgroundColor: '#fff1f2', borderRadius: '50%', color: 'var(--color-aj-red)' }}>
                            <item.icon size={32} />
                        </div>
                        <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>{item.label}</span>
                    </button>
                ))}
            </div>
        );
    }

    const section = subSections[view];
    const SectionIcon = section.icon;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Sub-header with back button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                <button onClick={goToMenu} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '5px' }}>
                    <LogOut size={20} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <div style={{ color: 'var(--color-aj-red)', backgroundColor: '#fff1f2', padding: '10px', borderRadius: '50%' }}>
                    <SectionIcon size={24} />
                </div>
                <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{section.label}</h3>
            </div>

            <DocumentSection
                hook={section.hook}
                isClient={isClient}
                icon={section.icon}
                emptyMessage={section.emptyMessage}
                uploadLabel={section.uploadLabel}
                formTitle={section.formTitle}
                deleteConfirm={section.deleteConfirm}
                hasZip={section.hasZip}
                multiple
            />
        </div>
    );
};

export default PlameSection;
