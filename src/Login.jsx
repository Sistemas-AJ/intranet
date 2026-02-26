import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import logo from './assets/LogoSolo.png';
import logoHorizontal from './assets/Logo Horizonal.png';
import officeBg from './assets/office_bg.png';

// ⚠️  usuarios.json removed — authentication is now handled server-side via /api/login

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: username, contrasena: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Usuario o contraseña incorrectos');
        return;
      }

      // Store only safe fields — password is NEVER stored client-side
      const { user } = data;
      localStorage.setItem('currentUser', JSON.stringify({
        ruc: user.ruc,
        razonSocial: user.razonSocial,
        usuario: user.usuario,
        role: user.role,
        permissions: user.permissions,
      }));

      if (user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate(`/company/${user.ruc}`);
      }
    } catch (err) {
      setError('Error de conexión con el servidor. Intenta de nuevo.');
      console.error('[Login error]', err);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--color-aj-white)',
        borderBottom: '4px solid var(--color-aj-red)'
      }}>
        <img src={logo} alt="AJ Logo" style={{ height: '50px', marginRight: '15px' }} />
        <h1 style={{ color: 'var(--color-aj-black)', fontSize: '1.5rem', fontWeight: 'bold' }}>
          Adolfo Jurado Contratistas Generales
        </h1>
      </header>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'var(--bg-light)',
        backgroundImage: `url(${officeBg})`,
        backgroundSize: '120% auto', // Zoomed in slightly to allow panning
        animation: 'panBackground 30s ease-in-out infinite',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}>
        <div style={{
          backgroundColor: 'var(--color-aj-white)',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <img src={logoHorizontal} alt="AJ Logo" style={{ height: '80px', marginBottom: '20px' }} />

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: error ? '1px solid var(--color-error)' : '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '25px', textAlign: 'left', position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    paddingRight: '40px',
                    border: error ? '1px solid var(--color-error)' : '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '1rem'
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
                    color: '#666'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--color-error)', marginBottom: '20px', fontWeight: 'bold' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--color-aj-black)',
                color: 'var(--color-aj-white)',
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#333'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'var(--color-aj-black)'}
            >
              Ingresar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
