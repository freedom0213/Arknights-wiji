import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchTodayStages, searchOperators } from '../api/client'
import type { Stage } from '../api/client'

// 关卡类别中文名（zoneNameSecond 的后备映射）
const ZONE_CATEGORY: Record<string, string> = {
  weekly_1: '术师/狙击芯片', weekly_2: '近卫/特种芯片',
  weekly_3: '医疗/辅助芯片', weekly_4: '先锋/重装芯片',
  weekly_5: '采购凭证', weekly_6: '碳素组',
  weekly_7: '作战记录', weekly_8: '技巧概要',
  weekly_9: '龙门币',
}

export default function HomePage() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  // 获取今日开放关卡
  const { data: todayData, isLoading } = useQuery({
    queryKey: ['today-stages'],
    queryFn: fetchTodayStages,
  })

  const openStages: Stage[] = todayData?.open_stages ?? []
  // 按 zoneId 分组
  const groupedStages: Record<string, Stage[]> = {}
  for (const s of openStages) {
    const zid = s.zoneId || 'unknown'
    if (!groupedStages[zid]) groupedStages[zid] = []
    groupedStages[zid].push(s)
  }

  // 干员搜索（防抖处理）
  const handleSearch = async (text: string) => {
    setSearchText(text)
    if (text.trim().length < 1) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const results = await searchOperators(text.trim(), 5)
      setSearchResults(results)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  // 按最高关卡理智排序
  const sortedZones = Object.entries(groupedStages).sort(([, a], [, b]) => {
    const maxA = Math.max(...a.map(s => s.apCost ?? 0))
    const maxB = Math.max(...b.map(s => s.apCost ?? 0))
    return maxB - maxA
  })

  return (
    <div>
      {/* 页头 */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--accent)' }}>ArkWiji</span> 明日方舟 Wiki
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '14px' }}>
          干员数据 · 关卡日程 · 敌人图鉴
        </p>
      </div>

      {/* 搜索栏 */}
      <div style={{ maxWidth: '480px', margin: '0 auto 32px', position: 'relative' }}>
        <input
          type="text"
          placeholder="搜索干员名称…"
          value={searchText}
          onChange={e => handleSearch(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: '8px',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', fontSize: '15px', outline: 'none',
          }}
        />
        {searchResults.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '0 0 8px 8px', marginTop: '2px', overflow: 'hidden',
          }}>
            {searchResults.map((op: any) => (
              <div
                key={op.id}
                onClick={() => { setSearchResults([]); setSearchText(''); navigate(`/operators/${op.id}`) }}
                style={{
                  padding: '10px 16px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border-color)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{op.name}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px', marginLeft: '8px' }}>
                  {'★'.repeat(typeof op.rarity === 'string'
                    ? ({ TIER_6: 6, TIER_5: 5, TIER_4: 4, TIER_3: 3, TIER_2: 2, TIER_1: 1 } as any)[op.rarity] || 1
                    : 1)}
                </span>
              </div>
            ))}
          </div>
        )}
        {searching && <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>搜索中…</p>}
      </div>

      {/* 今日开放关卡 */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: '8px', padding: '24px', marginBottom: '24px',
      }}>
        <div className="divider-diamond" style={{ marginBottom: '16px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600 }}>
            今日开放关卡
            {todayData?.today && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 400, marginLeft: '8px' }}>
                {todayData.today.date} {todayData.today.weekday_name}
              </span>
            )}
          </h2>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 0' }}>
            <div className="loading-spinner" />
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>加载中…</span>
          </div>
        ) : sortedZones.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>暂无开放数据</p>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {sortedZones.map(([zoneId, stages]) => {
              const category = ZONE_CATEGORY[zoneId] || zoneId
              const maxAp = Math.max(...stages.map(s => s.apCost ?? 0))
              const minAp = Math.min(...stages.map(s => s.apCost ?? 0))
              return (
                <Link
                  key={zoneId}
                  to="/stages"
                  className="no-underline"
                  style={{
                    padding: '14px', borderRadius: '6px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    display: 'block', transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '15px' }}>{category}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {stages.length} 关 · 理智 {minAp}~{maxAp}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {stages.map(s => (
                      <span key={s.id} style={{
                        background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '3px',
                        fontSize: '11px', color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                      }}>
                        {s.code}
                      </span>
                    ))}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* 快捷导航 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NavCard to="/operators" icon="◆" title="干员图鉴" desc="查询全部干员属性、技能、晋升材料" />
        <NavCard to="/stages" icon="◈" title="关卡日程" desc="查看资源收集关卡每日轮换" />
        <NavCard to="/enemies" icon="⬖" title="敌人图鉴" desc="查询小怪、精英怪、Boss数据" />
      </div>
    </div>
  )
}

function NavCard({ to, icon, title, desc }: { to: string; icon: string; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="no-underline p-6 transition-all hover:scale-[1.02]"
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px',
      }}
    >
      <div style={{ fontSize: '28px', color: 'var(--accent)', marginBottom: '12px' }}>{icon}</div>
      <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{desc}</p>
    </Link>
  )
}
