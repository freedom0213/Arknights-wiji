import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { fetchEnemies, searchEnemies } from '../api/client'
import type { Enemy } from '../api/client'
import { SkeletonCardGrid } from '../components/Skeleton'
import { ErrorState, EmptyState } from '../components/StateView'
import Pagination from '../components/Pagination'
import { useDebounce } from '../hooks/useDebounce'

const LEVEL_LABEL: Record<string, string> = {
  NORMAL: '普通', ELITE: '精英', BOSS: 'Boss',
}

export default function EnemiesPage() {
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('')

  const debouncedSearch = useDebounce(search, 300)

  const loadData = useCallback(() => {
    setLoading(true)
    setError(null)
    const promise = debouncedSearch
      ? searchEnemies(debouncedSearch).then(data => {
          setEnemies(data)
          setTotal(data.length)
        })
      : (() => {
          const params: Record<string, string | number> = { page, page_size: 60 }
          if (levelFilter) params.enemy_type = levelFilter
          return fetchEnemies(params).then(data => {
            setEnemies(data.items)
            setTotal(data.total)
          })
        })()
    promise
      .then(() => setLoading(false))
      .catch(err => { setError(err?.message || '请求失败'); setLoading(false) })
  }, [page, debouncedSearch, levelFilter])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div>
      {/* 标题 + 筛选器：一行，标题左 筛选右 */}
      <div className="flex justify-between items-center mb-4" style={{ minHeight: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
          ⬖ 敌人图鉴
          {!loading && !error && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 400, marginLeft: '8px' }}>
              共 {total} 个
            </span>
          )}
        </h1>

        <div className="flex gap-2 items-center">
          <input
            type="text" placeholder="搜索敌人名…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', padding: '7px 12px', borderRadius: '6px',
              fontSize: '13px', outline: 'none', width: '150px',
            }}
          />
          {debouncedSearch !== search && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>…</span>
          )}
          <select value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1) }}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', padding: '7px 10px', borderRadius: '6px', fontSize: '13px',
            }}>
            <option value="">全部等级</option>
            <option value="NORMAL">普通</option>
            <option value="ELITE">精英</option>
            <option value="BOSS">Boss</option>
          </select>
        </div>
      </div>

      {/* 加载中 */}
      {loading && <SkeletonCardGrid count={12} columns="repeat(auto-fill, minmax(240px, 1fr))" />}

      {/* 错误 */}
      {!loading && error && <ErrorState message={error} onRetry={loadData} />}

      {/* 空 */}
      {!loading && !error && enemies.length === 0 && (
        <EmptyState message={debouncedSearch ? `未找到匹配 "${debouncedSearch}" 的敌人` : '暂无敌人数据'} />
      )}

      {/* 敌人网格 */}
      {!loading && !error && enemies.length > 0 && (
        <div className="grid gap-2" style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          justifyContent: 'center',
        }}>
          {enemies.map(enemy => (
            <Link key={enemy.id} to={`/enemies/${enemy.id}`}
              className="no-underline p-3 card-hover"
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '6px',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span style={{
                  fontSize: '11px', padding: '1px 8px', borderRadius: '3px',
                  background: enemy.enemyLevel === 'BOSS' ? 'rgba(224,80,80,0.2)' :
                    enemy.enemyLevel === 'ELITE' ? 'rgba(240,192,96,0.2)' : 'rgba(144,144,176,0.2)',
                  color: enemy.enemyLevel === 'BOSS' ? 'var(--danger)' :
                    enemy.enemyLevel === 'ELITE' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                }}>
                  {LEVEL_LABEL[enemy.enemyLevel] || enemy.enemyLevel}
                </span>
                {enemy.attackType && (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{enemy.attackType}</span>
                )}
              </div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px' }}>{enemy.name}</div>
              {enemy.ability && (
                <div style={{
                  color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {enemy.ability}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* 分页 */}
      {!debouncedSearch && total > 60 && (
        <Pagination current={page} total={total} pageSize={60} onChange={setPage} />
      )}
    </div>
  )
}
