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
      {loading && <SkeletonCardGrid count={12} columns="repeat(3, 1fr)" />}

      {/* 错误 */}
      {!loading && error && <ErrorState message={error} onRetry={loadData} />}

      {/* 空 */}
      {!loading && !error && enemies.length === 0 && (
        <EmptyState message={debouncedSearch ? `未找到匹配 "${debouncedSearch}" 的敌人` : '暂无敌人数据'} />
      )}

      {/* 敌人网格 */}
      {!loading && !error && enemies.length > 0 && (
        <div className="grid gap-3" style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
        }}>
          {enemies.map(enemy => (
            <Link key={enemy.id} to={`/enemies/${enemy.id}`}
              className="no-underline card-hover"
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '8px', padding: '12px',
                display: 'flex', gap: '12px', alignItems: 'center',
              }}
            >
              {/* 左侧文字信息 */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: '3px', fontWeight: 500,
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
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '16px' }}>{enemy.name}</div>
                {enemy.ability && (
                  <div style={{
                    color: 'var(--text-secondary)', fontSize: '11px', lineHeight: 1.4,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {enemy.ability}
                  </div>
                )}
              </div>
              {/* 右侧敌人图片 */}
              <div style={{
                width: '72px', height: '72px', flexShrink: 0,
                borderRadius: '6px', overflow: 'hidden',
                background: 'rgba(35,39,70,0.3)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {enemy.imageUrl ? (
                  <img src={enemy.imageUrl} alt={enemy.name}
                    className="enemy-img"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-secondary)', fontSize: '10px',
                  }}>无图</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 图片来源说明 */}
      {!loading && !error && enemies.length > 0 && (
        <p style={{
          textAlign: 'center', color: 'var(--text-secondary)',
          fontSize: '11px', marginTop: '16px', opacity: 0.55,
        }}>
          ※ 敌人图片来源于社区资源仓库（<a href="https://github.com/yuanyan3060/ArknightsGameResource"
            target="_blank" rel="noopener"
            style={{ color: 'var(--accent)', opacity: 0.7 }}>ArknightsGameResource</a>），
          部分新敌人资源尚未收录。
        </p>
      )}

      {/* 分页 */}
      {!debouncedSearch && total > 60 && (
        <Pagination current={page} total={total} pageSize={60} onChange={setPage} />
      )}
    </div>
  )
}
