import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { fetchOperators, searchOperators } from '../api/client'
import type { Operator } from '../api/client'
import { SkeletonCardGrid } from '../components/Skeleton'
import { ErrorState, EmptyState } from '../components/StateView'
import Pagination from '../components/Pagination'
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
const NATION_MAP: Record<string, string> = {
  rhodes: '罗德岛', yan: '炎', kjerag: '谢拉格', ursus: '乌萨斯',
  victoria: '维多利亚', siracusa: '叙拉古', laterano: '拉特兰',
  kazimierz: '卡西米尔', leithanien: '莱塔尼亚', sargon: '萨尔贡',
  bolivar: '玻利瓦尔', columbia: '哥伦比亚',
  rim: '雷姆必拓', minos: '米诺斯', higashi: '东', sami: '萨米',
  ib: '伊比利亚', egir: '阿戈尔', lungmen: '龙门',
  kazdel: '卡兹戴尔', dublinn: '深池', rhine: '莱茵生命',
  penguin: '企鹅物流', blacksteel: '黑钢', abyssal: '深海猎人',
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ rarity: '', profession: '' })

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
      {/* 标题 + 筛选器：一行，标题左 筛选右 */}
      <div className="flex justify-between items-center mb-4" style={{ minHeight: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
          ◆ 干员图鉴
          {!loading && !error && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 400, marginLeft: '8px' }}>
              共 {total} 名
            </span>
          )}
        </h1>

        <div className="flex gap-2 items-center">
          <input
            type="text" placeholder="搜索干员名…"
            value={search}
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
          <select
            value={filters.rarity}
            onChange={e => { setFilters(f => ({ ...f, rarity: e.target.value })); setPage(1) }}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', padding: '7px 10px', borderRadius: '6px', fontSize: '13px',
            }}>
            <option value="">全部稀有度</option>
            {[6, 5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{'★'.repeat(r)}</option>)}
          </select>
          <select
            value={filters.profession}
            onChange={e => { setFilters(f => ({ ...f, profession: e.target.value })); setPage(1) }}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', padding: '7px 10px', borderRadius: '6px', fontSize: '13px',
            }}>
            <option value="">全部职业</option>
            {Object.entries(PROF_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* 加载中 */}
      {loading && <SkeletonCardGrid count={12} columns="repeat(3, 1fr)" />}

      {/* 错误 */}
      {!loading && error && <ErrorState message={error} onRetry={loadData} />}

      {/* 空 */}
      {!loading && !error && operators.length === 0 && (
        <EmptyState message={debouncedSearch ? `未找到匹配 "${debouncedSearch}" 的干员` : '暂无干员数据'} />
      )}

      {/* 干员网格 */}
      {!loading && !error && operators.length > 0 && (
        <div className="grid gap-3" style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
        }}>
          {operators.map(op => (
            <Link
              key={op.id} to={`/operators/${op.id}`}
              className="no-underline card-hover"
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '8px', padding: '12px',
                display: 'flex', gap: '12px', alignItems: 'center',
              }}
            >
              {/* 左侧文字信息 */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ color: RARITY_MAP[op.rarity]?.color || '#909090', fontSize: '12px' }}>
                  {'★'.repeat(RARITY_MAP[op.rarity]?.stars || 1)}
                </div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '16px' }}>{op.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  {PROF_MAP[op.profession] || op.profession}
                  {op.subProfessionId ? ` · ${op.subProfessionId}` : ''}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '10px', opacity: 0.75 }}>
                  {op.position === 'MELEE' ? '近战位' : '远程位'}
                  {op.nationId ? ` · ${NATION_MAP[op.nationId.toLowerCase()] || op.nationId}` : ''}
                </div>
              </div>
              {/* 右侧半身像 */}
              <div style={{
                width: '72px', height: '72px', flexShrink: 0,
                borderRadius: '6px', overflow: 'hidden',
                background: 'rgba(35,39,70,0.3)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {(() => {
                  const imgSrc = op.defaultPortraitUrl || op.avatarUrl
                  const fallbackSrc = op.defaultPortraitUrl && op.avatarUrl ? op.avatarUrl : null
                  return imgSrc ? (
                    <img src={imgSrc} alt={op.name}
                      className="portrait-img"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                      loading="lazy"
                      onError={e => {
                        const img = e.target as HTMLImageElement
                        if (fallbackSrc && img.src !== fallbackSrc) {
                          img.src = fallbackSrc  // 半身像失败回退到头像
                        } else {
                          img.style.display = 'none'
                        }
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-secondary)', fontSize: '10px',
                    }}>暂无</div>
                  )
                })()}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 图片来源说明 */}
      {!loading && !error && operators.length > 0 && (
        <p style={{
          textAlign: 'center', color: 'var(--text-secondary)',
          fontSize: '11px', marginTop: '16px', opacity: 0.55,
        }}>
          ※ 干员立绘来源于社区资源仓库（<a href="https://github.com/yuanyan3060/ArknightsGameResource"
            target="_blank" rel="noopener"
            style={{ color: 'var(--accent)', opacity: 0.7 }}>ArknightsGameResource</a>），
          部分新干员资源尚未收录，暂以头像替代。
        </p>
      )}

      {/* 分页 */}
      {!debouncedSearch && total > 60 && (
        <Pagination current={page} total={total} pageSize={60} onChange={setPage} />
      )}
    </div>
  )
}
