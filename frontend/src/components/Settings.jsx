 import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:3001/api'

function Toggle({ label, description, checked, onChange }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '18px 0',
      borderBottom: '1px solid #f0f2f5'
    }}>
      <div style={{ flex: 1, paddingRight: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1f2e', marginBottom: '3px' }}>
          {label}
        </div>
        <div style={{ fontSize: '13px', color: '#9ca3af' }}>{description}</div>
      </div>
      <div
        onClick={onChange}
        style={{
          width: '48px',
          height: '26px',
          background: checked
            ? 'linear-gradient(135deg, #667eea, #764ba2)'
            : '#e5e7eb',
          borderRadius: '13px',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
          boxShadow: checked ? '0 2px 8px rgba(102,126,234,0.4)' : 'none'
        }}
      >
        <div style={{
          width: '20px',
          height: '20px',
          background: '#ffffff',
          borderRadius: '50%',
          position: 'absolute',
          top: '3px',
          left: checked ? '25px' : '3px',
          transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
        }} />
      </div>
    </div>
  )
}

export default function Settings() {
  const [repo, setRepo] = useState('')
  const [settings, setSettings] = useState({ strict_mode: false, ignore_styling: false, enabled: true })
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  function loadSettings() {
    if (!repo.trim()) return
    setLoading(true)
    axios.get(`${API}/settings/${encodeURIComponent(repo)}`)
      .then(r => {
        setSettings({
          strict_mode: r.data.strict_mode === 1,
          ignore_styling: r.data.ignore_styling === 1,
          enabled: r.data.enabled === 1
        })
        setLoaded(true)
        setSaved(false)
      })
      .finally(() => setLoading(false))
  }

  function saveSettings() {
    axios.post(`${API}/settings/${encodeURIComponent(repo)}`, {
      strict_mode: settings.strict_mode,
      ignore_styling: settings.ignore_styling,
      enabled: settings.enabled
    }).then(() => setSaved(true))
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1a1f2e', letterSpacing: '-0.5px' }}>
          Settings
        </h1>
        <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '15px' }}>
          Configure GitGuard per repository
        </p>
      </div>

      <div style={{
        background: '#ffffff',
        border: '1px solid #e8ecf0',
        borderRadius: '14px',
        padding: '28px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1f2e', marginBottom: '4px' }}>
          Repository
        </div>
        <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '14px' }}>
          Enter the repository name in owner/repo format
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            value={repo}
            onChange={e => { setRepo(e.target.value); setLoaded(false); setSaved(false) }}
            placeholder="e.g. Raksha-1225/test-repo"
            onKeyDown={e => e.key === 'Enter' && loadSettings()}
            style={{
              flex: 1,
              background: '#f8fafc',
              border: '1px solid #e8ecf0',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#1a1f2e',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.15s'
            }}
          />
          <button
            onClick={loadSettings}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(102,126,234,0.3)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '...' : 'Load'}
          </button>
        </div>
      </div>

      {loaded && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e8ecf0',
          borderRadius: '14px',
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1f2e', marginBottom: '4px' }}>
            ⚙️ Settings for {repo}
          </div>
          <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
            Changes apply to new PRs only
          </div>

          <Toggle
            label="GitGuard Enabled"
            description="Review PRs automatically in this repository"
            checked={settings.enabled}
            onChange={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
          />
          <Toggle
            label="Strict Mode"
            description="Flag all issues including minor ones"
            checked={settings.strict_mode}
            onChange={() => setSettings(s => ({ ...s, strict_mode: !s.strict_mode }))}
          />
          <Toggle
            label="Ignore Styling Issues"
            description="Skip code style and formatting feedback"
            checked={settings.ignore_styling}
            onChange={() => setSettings(s => ({ ...s, ignore_styling: !s.ignore_styling }))}
          />

          <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={saveSettings}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none',
                borderRadius: '8px',
                padding: '11px 24px',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 2px 8px rgba(102,126,234,0.3)'
              }}
            >
              Save Settings
            </button>
            {saved && (
              <span style={{
                color: '#10b981',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                ✅ Saved successfully!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}