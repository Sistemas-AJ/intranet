import React from 'react';
import { BookCopy, BookOpenText, FolderArchive, LogOut } from 'lucide-react';
import DocumentSection from './DocumentSection';

/**
 * Subcomponente para la sección Libros y Registros.
 * Tiene su propia navegación interna: menú → sire | libroDiario | otrosLibros
 */
const LibrosRegistrosSection = ({ isClient, hooks }) => {
    const { sire, libroDiario, otrosLibros } = hooks;
    const [view, setView] = React.useState('menu');

    const goToMenu = () => {
        sire.setShowForm(false);
        libroDiario.setShowForm(false);
        otrosLibros.setShowForm(false);
        setView('menu');
    };

    const subSections = {
        sire: {
            hook: sire,
            label: 'Sire',
            icon: BookCopy,
            emptyMessage: 'No se encontraron documentos de Sire.',
            uploadLabel: 'Subir Sire',
            formTitle: 'Subir documentos de Sire',
            deleteConfirm: '¿Eliminar este documento de Sire?',
            hasZip: true,
        },
        libroDiario: {
            hook: libroDiario,
            label: 'Libro Diario',
            icon: BookOpenText,
            emptyMessage: 'No se encontraron documentos de Libro Diario.',
            uploadLabel: 'Subir Libro Diario',
            formTitle: 'Subir Libro Diario',
            deleteConfirm: '¿Eliminar este documento de Libro Diario?',
            hasZip: true,
        },
        otrosLibros: {
            hook: otrosLibros,
            label: 'Otros Libros',
            icon: FolderArchive,
            emptyMessage: 'No se encontraron documentos en Otros Libros.',
            uploadLabel: 'Subir Otros Libros',
            formTitle: 'Subir Otros Libros',
            deleteConfirm: '¿Eliminar este documento?',
            hasZip: true,
        },
    };

    if (view === 'menu') {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
                {[
                    { id: 'sire', label: 'Sire', icon: BookCopy },
                    { id: 'libroDiario', label: 'Libro Diario', icon: BookOpenText },
                    { id: 'otrosLibros', label: 'Otros Libros', icon: FolderArchive, fullWidth: true },
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
                allowClientUpload={false}
                allowClientDelete={false}
                hasZip={section.hasZip}
                multiple
            />
        </div>
    );
};

export default React.memo(LibrosRegistrosSection);
