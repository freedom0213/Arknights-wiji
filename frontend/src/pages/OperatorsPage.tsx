import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { fetchOperators, searchOperators } from '../api/client'
import type { Operator } from '../api/client'
import { SkeletonCardGrid } from '../components/Skeleton'
import { ErrorState, EmptyState } from '../components/StateView'
import { useDebounce } from '../hooks/useDebounce'

const PROF_MAP: Record<string, string> = {
  WARRIOR: '近卫', SNIPER: '狙击', MEDIC: '医疗', TANK: '重装',
  SUPPORT: '辅助', CASTER: '术师', SPECIAL: '特种', PIONEER: '先锋',
}
const RARITY_MAP: Record<string, { stars: number; color: string }> = {
  TIER_6: { stars: 6, color: '#f0c060' }, TIER_5: { stars: 5, color: '#f0c060' },
  TIER_4: { stars: 4, color: '#c0a0f0' }, TIER_3: { stars: 3, color: '#80c8f0' },
  TIER_2: { stars: 2, color: '#80c080' }, TIER_1: { stars: 1, color: '#909090' },
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ rarity: '', profession: '', position: '' })

  // 搜索防抖 300ms
  const debouncedSearch = useDebounce(search, 300)

  const loadData = useCallback(() => {
    setLoading(true)
    setError(null)
    const promise = debouncedSearch
      ? searchOperators(debouncedSearch).then(data => {
          setOperators(data)
          setTotal(data.length)
        })
      : (() => {
          const params: Record<string, string | number> = { page, page_size: 60 }
          if (filters.rarity) params.rarity = Number(filters.rarity)
          if (filters.profession) params.profession = filters.profession
          if (filters.position) params.position = filters.position
          return fetchOperators(params).then(data => {
            setOperators(data.items)
            setTotal(data.total)
          })
        })()
    promise
      .then(() => setLoading(false))
      .catch(err => { setError(err?.message || '请求失败'); setLoading(false) })
  }, [page, debouncedSearch, filters])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
        ◆ 干员图鉴
      </h1>

      {/* 搜索和筛选 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text" placeholder="搜索干员名…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', padding: '8px 14px', borderRadius: '6px',
            minWidth: '200px', outline: 'none', fontSize: '14px',
          }}
        />
        {debouncedSearch !== search && (
          <span style={{ color: 'var(--text-secondary)', fontSize: '12px', alignSelf: 'center' }}>输入中…</span>
        )}
        <select
          value={filters.rarity}
          onChange={e => setFilters(f => ({ ...f, rarity: e.target.value }))}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '6px', fontSize: '14px',
          }}>
          <option value="">全部稀有度</option>
          {[6, 5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{'★'.repeat(r)}</option>)}
        </select>
        <select
          value={filters.profession}
          onChange={e => setFilters(f => ({ ...f, profession: e.target.value }))}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '6px', fontSize: '14px',
          }}>
          <option value="">全部职业</option>
          {Object.entries(PROF_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* 加载中：骨架屏 */}
      {loading && <SkeletonCardGrid count={12} />}

      {/* 错误状态 */}
      {!loading && error && <ErrorState message={error} onRetry={loadData} />}

      {/* 空状态 */}
      {!loading && !error && operators.length === 0 && (
        <EmptyState message={debouncedSearch ? `未找到匹配 "${debouncedSearch}" 的干员` : '暂无干员数据'} />
      )}

      {/* 结果计数 + 干员网格 */}
      {!loading && !error && operators.length > 0 && (
        <>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
            共 {total} 名干员 {debouncedSearch && `匹配 "${debouncedSearch}"`}
          </p>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {operators.map(op => (
              <Link
                key={op.id} to={`/operators/${op.id}`}
                className="no-underline p-3 card-hover"
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
              >
                <div style={{ color: RARITY_MAP[op.rarity]?.color || '#909090', fontSize: '12px', marginBottom: '4px' }}>
                  {'★'.repeat(RARITY_MAP[op.rarity]?.stars || 1)}
                </div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px' }}>{op.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>
                  {PROF_MAP[op.profession] || op.profession}
                  {op.subProfessionId ? ` · ${op.subProfessionId}` : ''}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* 分页 */}
      {!debouncedSearch && total > 60 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.ceil(total / 60) }, (_, i) => (
            <button key={i} onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              style={{
                background: page === i + 1 ? 'var(--accent)' : 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: page === i + 1 ? '#000' : 'var(--text-secondary)',
                padding: '6px 14px', borderRadius: '4px', cursor: 'pointer',
                fontSize: '13px', transition: 'background 0.15s',
              }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
