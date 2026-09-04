import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        color: 'var(--text-subtle)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '2px solid var(--border-default)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 0.75rem'
          }} />
          <p style={{ fontSize: '0.8125rem' }}>Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      <Navbar currentView={currentView} onSelectView={setCurrentView} />
      
      <main style={{ flex: 1 }}>
        {currentView === 'dashboard' && <DashboardPage />}
        {currentView === 'admin' && <AdminPage />}
      </main>

      <footer style={{
        padding: '1.25rem',
        borderTop: '1px solid var(--border-subtle)',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-subtle)',
        background: '#FFFFFF'
      }}>
        BrainWave Custom Employee Portal • Role-Based Access Control • Zoho One Integration
      </footer>
    </div>
  );
}
