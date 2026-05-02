import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:3001/api'

function StatCard({ label, value, color, bg, icon }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e8ecf0',
      borderRadius: '14px',
      padding: '24px',
      flex: 1,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        width: '70px',
        height: '70px',
        borderRadius: '50%',
        background: bg,
        opacity: 0.15
      }} />
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        marginBottom: '16px'
      }}>
        {icon}
      </div>
      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>{label}</div>
      <div style={{ fontSize: '36px', fontWeight: '800', color: color, letterSpacing: '-1px' }}>{value}</div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/stats`)
      .then(r => setStats(r.data))
      .catch(() => setStats({ total_reviews: 0, repos_monitored: 0, latest_review: null }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#6b7280' }}>
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%',
        border: '2px solid #667eea', borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite'
      }} />
      Loading...
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1a1f2e', letterSpacing: '-0.5px' }}>
          Dashboard
        </h1>
        <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '15px' }}>
          Welcome back! Here's your GitGuard overview.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
        <StatCard
          label="Total Reviews"
          value={stats.total_reviews}
          color="#667eea"
          bg="#667eea20"
          icon="🔍"
        />
        <StatCard
          label="Repos Monitored"
          value={stats.repos_monitored}
          color="#10b981"
          bg="#10b98120"
          icon="📁"
        />
        <StatCard
          label="Status"
          value="Active"
          color="#f59e0b"
          bg="#f59e0b20"
          icon="⚡"
        />
      </div>

      <div style={{
        background: '#ffffff',
        border: '1px solid #e8ecf0',
        borderRadius: '14px',
        padding: '28px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: '#667eea20', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            🕐
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1f2e' }}>Latest Review</h2>
        </div>

        {stats.latest_review ? (
          <div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span style={{
                background: '#667eea15',
                border: '1px solid #667eea30',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '12px',
                color: '#667eea',
                fontWeight: '600'
              }}>
                PR #{stats.latest_review.pr_number}
              </span>
              <span style={{
                background: '#f3f4f6',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '12px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                {stats.latest_review.repo_name}
              </span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1f2e', marginBottom: '8px' }}>
              {stats.latest_review.pr_title}
            </div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>
              by <strong style={{ color: '#6b7280' }}>{stats.latest_review.pr_author}</strong>
              {' '}· {new Date(stats.latest_review.created_at).toLocaleString()}
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#9ca3af'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤖</div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
              No reviews yet
            </div>
            <div style={{ fontSize: '13px' }}>
              Open a Pull Request in a monitored repo to get started!
            </div>
          </div>
        )}
      </div>

      <div style={{
        marginTop: '24px',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        borderRadius: '14px',
        padding: '24px 28px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 16px rgba(102,126,234,0.3)'
      }}>
        <div>
          <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
            🚀 Ready to review code
          </div>
          <div style={{ fontSize: '13px', opacity: 0.85 }}>
            GitGuard is watching for new Pull Requests
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '10px',
          padding: '10px 20px',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          Webhook Active
        </div>
      </div>
    </div>
  )
}