import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import CompanyDashboard from './CompanyDashboard';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

function App() {
  // component that reloads the page when a /clientes/* URL is visited
  function ClientFileRedirect() {
    const loc = useLocation();
    useEffect(() => {
      // force a full HTTP request so the static file is served by Express
      window.location.href = loc.pathname + loc.search;
    }, [loc]);
    return null;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/company/:ruc" element={<CompanyDashboard />} />
        <Route path="/clientes/*" element={<ClientFileRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
