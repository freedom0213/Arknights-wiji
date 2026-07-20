import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchEnemies, searchEnemies } from '../api/client'
import type { Enemy } from '../api/client'

const LEVEL_LABEL: Record<string, string> = {
  NORMAL: '普通', ELITE: '精英', BOSS: 'Boss',
}

export default function EnemiesPage() {
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    if (search) {
      searchEnemies(search).then(data => {
        setEnemies(data)
        setTotal(data.length)
        setLoading(false)
      })
    } else {
      const params: Record<string, string | number> = { page, page_size: 60 }
      if (levelFilter) params.enemy_type = levelFilter
      fetchEnemies(params).then(data => {
        setEnemies(data.items)
        setTotal(data.total)
        setLoading(false)
      })
    }
  }, [page, search, levelFilter])

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
        ⬖ 敌人图鉴
      </h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text" placeholder="搜索敌人名..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '6px', outline: 'none' }}
        />
        <select
          value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '6px' }}
        >
          <option value="">全部等级</option>
          <option value="NORMAL">普通</option>
          <option value="ELITE">精英</option>
          <option value="BOSS">Boss</option>
        </select>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
        共 {total} 个敌人
      </p>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>加载中...</p>
      ) : (
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {enemies.map(enemy => (
            <Link
              key={enemy.id} to={`/enemies/${enemy.id}`}
              className="no-underline p-3 transition-colors hover:brightness-110"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span style={{
                  fontSize: '11px', padding: '1px 8px', borderRadius: '3px',
                  background: enemy.enemyLevel === 'BOSS' ? 'rgba(224,80,80,0.2)' :
                             enemy.enemyLevel === 'ELITE' ? 'rgba(240,192,96,0.2)' :
                             'rgba(144,144,176,0.2)',
                  color: enemy.enemyLevel === 'BOSS' ? 'var(--danger)' :
                         enemy.enemyLevel === 'ELITE' ? 'var(--accent-gold)' :
                         'var(--text-secondary)',
                }}>
                  {LEVEL_LABEL[enemy.enemyLevel] || enemy.enemyLevel}
                </span>
                {enemy.attackType && (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                    {enemy.attackType}
                  </span>
                )}
              </div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px' }}>
                {enemy.name}
              </div>
              {enemy.ability && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {enemy.ability}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {!search && total > 60 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.ceil(total / 60) }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              style={{
                background: page === i + 1 ? 'var(--accent)' : 'var(--bg-card)',
                border: '1px solid var(--border-color)', color: page === i + 1 ? '#000' : 'var(--text-secondary)',
                padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
              }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
