import { useState } from 'react'
import Dashboard from './components/Dashboard'
import Reviews from './components/Reviews'
import Settings from './components/Settings'

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'reviews', icon: '📋', label: 'Reviews' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: '240px',
        background: '#ffffff',
        borderRight: '1px solid #e8ecf0',
        padding: '0',
        position: 'fixed',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          padding: '28px 24px',
          borderBottom: '1px solid #e8ecf0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>
            🛡️ GitGuard
          </div>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.75)',
            marginTop: '4px',
            fontWeight: '500'
          }}>
            AI Code Reviewer
          </div>
        </div>

        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: '#9ca3af', letterSpacing: '1px', padding: '8px 12px 4px' }}>
            NAVIGATION
          </div>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                width: '100%',
                padding: '11px 14px',
                marginBottom: '2px',
                background: activePage === item.id
                  ? 'linear-gradient(135deg, #667eea15, #764ba215)'
                  : 'transparent',
                border: activePage === item.id
                  ? '1px solid #667eea30'
                  : '1px solid transparent',
                borderRadius: '8px',
                color: activePage === item.id ? '#667eea' : '#6b7280',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: activePage === item.id ? '600' : '400',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {activePage === item.id && (
                <span style={{
                  marginLeft: 'auto',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#667eea'
                }} />
              )}
            </button>
          ))}
        </nav>

        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e8ecf0',
          background: '#fafbfc'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 6px #10b98160'
            }} />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>System Online</span>
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>v1.0.0 · Free Tier</div>
        </div>
      </aside>

      <main style={{
        marginLeft: '240px',
        flex: 1,
        padding: '40px',
        maxWidth: 'calc(100vw - 240px)'
      }}>
        {activePage === 'dashboard' && <Dashboard />}
        {activePage === 'reviews' && <Reviews />}
        {activePage === 'settings' && <Settings />}
      </main>
    </div>
  )
}