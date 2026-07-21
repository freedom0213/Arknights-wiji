import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchStages, fetchZones, fetchWeeklySchedule } from '../api/client'
import type { Stage, ScheduleDay } from '../api/client'
import { SkeletonWeekGrid, SkeletonCardGrid } from '../components/Skeleton'
import { ErrorState } from '../components/StateView'
import TabBar from '../components/TabBar'
import Pagination from '../components/Pagination'

// 关卡类别中文名
const ZONE_CATEGORY: Record<string, string> = {
  weekly_1: '术师/狙击芯片', weekly_2: '近卫/特种芯片',
  weekly_3: '医疗/辅助芯片', weekly_4: '先锋/重装芯片',
  weekly_5: '采购凭证', weekly_6: '碳素组',
  weekly_7: '作战记录', weekly_8: '技巧概要',
  weekly_9: '龙门币',
}

// 按 zoneId 给关卡分组
function groupStages(stages: Stage[]): { zoneId: string; label: string; stages: Stage[] }[] {
  const map: Record<string, Stage[]> = {}
  for (const s of stages) {
    const zid = s.zoneId || 'unknown'
    if (!map[zid]) map[zid] = []
    map[zid].push(s)
  }
  return Object.entries(map).map(([zid, list]) => ({
    zoneId: zid,
    label: ZONE_CATEGORY[zid] || zid,
    stages: list.sort((a, b) => (a.apCost ?? 0) - (b.apCost ?? 0)),
  }))
}

export default function StagesPage() {
  const [activeTab, setActiveTab] = useState<'weekly' | 'all'>('weekly')

  // 每周日程
  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['weekly-schedule'],
    queryFn: fetchWeeklySchedule,
  })

  // 日导航：默认今天
  const todayIdx = scheduleData?.daily_schedule?.findIndex((d: ScheduleDay) => d.is_today) ?? 0
  const [activeDayIdx, setActiveDayIdx] = useState(todayIdx)

  // 同步今天索引
  useEffect(() => { setActiveDayIdx(todayIdx) }, [todayIdx])

  // 全部关卡
  const [stages, setStages] = useState<Stage[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoneFilter, setZoneFilter] = useState('')
  const [search, setSearch] = useState('')

  // 获取章节列表
  useEffect(() => {
    fetchZones()
      .then(setZones)
      .catch(() => setZones([]))
  }, [])

  // 获取关卡列表
  const loadStages = useCallback(() => {
    setLoading(true)
    setError(null)
    const params: Record<string, string | number> = { page, page_size: 50 }
    if (zoneFilter) params.zone_id = zoneFilter
    fetchStages(params).then(data => {
      let items = data.items
      if (search) {
        items = items.filter(s =>
          (s.code && s.code.includes(search)) ||
          (s.name && s.name.includes(search))
        )
        setTotal(items.length)
      } else {
        setTotal(data.total)
      }
      setStages(items)
      setLoading(false)
    }).catch(err => {
      setError(err?.message || '加载失败')
      setLoading(false)
    })
  }, [page, zoneFilter, search])

  useEffect(() => { loadStages() }, [loadStages])

  // 日导航：上一日 / 下一日
  const goPrevDay = () => { setActiveDayIdx(prev => (prev > 0 ? prev - 1 : 6)) }
  const goNextDay = () => { setActiveDayIdx(prev => (prev < 6 ? prev + 1 : 0)) }

  const activeDay = scheduleData?.daily_schedule?.[activeDayIdx] as ScheduleDay | undefined

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
        ◈ 关卡日程
      </h1>

      <TabBar
        tabs={[{ key: 'weekly', label: '本周日程' }, { key: 'all', label: '全部关卡' }]}
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'weekly' | 'all')}
      />

      {/* ========== 本周日程 ========== */}
      {activeTab === 'weekly' && (
        <>
          {scheduleLoading ? (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '8px', padding: '24px',
            }}>
              <SkeletonWeekGrid />
            </div>
          ) : scheduleData && activeDay ? (
            <div>
              {/* 日导航栏 */}
              <div className="flex items-center justify-center gap-1 mb-4" style={{ flexWrap: 'wrap' }}>
                <button onClick={goPrevDay} style={navArrowStyle}>‹</button>
                {scheduleData.daily_schedule.map((day: ScheduleDay, idx: number) => {
                  const isActive = idx === activeDayIdx
                  const isToday = day.is_today
                  return (
                    <button
                      key={day.weekday}
                      onClick={() => setActiveDayIdx(idx)}
                      style={{
                        ...(isActive ? navDayActiveStyle : navDayStyle),
                        color: isActive ? 'var(--accent)' : isToday ? 'var(--accent-gold)' : 'var(--text-secondary)',
                        fontWeight: isActive || isToday ? 600 : 400,
                        borderColor: isActive ? 'var(--accent)' : isToday ? 'var(--accent-gold)' : 'var(--border-color)',
                        background: isActive ? 'rgba(78,201,240,0.1)' : isToday ? 'rgba(240,192,96,0.08)' : 'var(--bg-card)',
                      }}
                    >
                      {day.weekday_name}
                      {isToday && <span style={todayDotStyle}> 今天</span>}
                    </button>
                  )
                })}
                <button onClick={goNextDay} style={navArrowStyle}>›</button>
              </div>

              {/* 当天关卡详情 */}
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '8px', padding: '24px',
              }}>
                <h2 style={{
                  color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600,
                  marginBottom: '16px',
                }}>
                  {activeDay.weekday_name}
                  {activeDay.is_today && (
                    <span style={{
                      background: 'var(--accent)', color: '#000', fontSize: '11px',
                      padding: '2px 8px', borderRadius: '3px', fontWeight: 600,
                      marginLeft: '10px',
                    }}>今天</span>
                  )}
                </h2>
                {groupStages(activeDay.stages).length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>该日无资源关卡开放</p>
                ) : (
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {groupStages(activeDay.stages).map(g => {
                      const apVals = g.stages.map(s => s.apCost ?? 0).filter(v => v > 0)
                      return (
                        <div key={g.zoneId} style={{
                          padding: '14px', borderRadius: '6px',
                          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '14px' }}>{g.label}</span>
                            {apVals.length > 0 && (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                理智 {Math.min(...apVals)}~{Math.max(...apVals)}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {g.stages.map(s => (
                              <span key={s.id} style={{
                                background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '3px',
                                fontSize: '11px', color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color)',
                              }}>{s.code}</span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* ========== 全部关卡 ========== */}
      {activeTab === 'all' && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: '8px', padding: '24px',
        }}>
          {/* 标题 + 筛选器：一行 */}
          <div className="flex justify-between items-center mb-4">
            <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              全部关卡
              {!loading && !error && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 400, marginLeft: '8px' }}>
                  共 {total} 个
                </span>
              )}
            </h2>
            <div className="flex gap-2 items-center">
              <input type="text" placeholder="搜索关卡…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)', padding: '7px 12px', borderRadius: '6px',
                  outline: 'none', fontSize: '13px', width: '150px',
                }}
              />
              <select value={zoneFilter} onChange={e => { setZoneFilter(e.target.value); setPage(1) }}
                style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)', padding: '7px 10px', borderRadius: '6px', fontSize: '13px',
                }}>
                <option value="">全部章节</option>
                {zones.map((z: any) => (
                  <option key={z.zoneID || z.id} value={z.zoneID || z.id}>
                    {(z.zoneNameFirst || z.name || z.id)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 关卡列表 */}
          {loading ? (
            <SkeletonCardGrid count={8} columns="repeat(auto-fill, minmax(300px, 1fr))" />
          ) : error ? (
            <ErrorState message={error} onRetry={loadStages} />
          ) : stages.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
              {search ? `未找到匹配 "${search}" 的关卡` : '暂无关卡数据'}
            </p>
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {stages.map(stage => (
                <div key={stage.id} style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  borderRadius: '6px', padding: '12px',
                }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{
                      color: 'var(--accent)', fontWeight: 700, fontSize: '14px',
                      background: 'rgba(78,201,240,0.1)', padding: '2px 8px', borderRadius: '4px',
                    }}>
                      {stage.code || stage.stageId}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {stage.stageType === 'MAIN' ? '主线' :
                       stage.stageType === 'DAILY' ? '资源收集' :
                       stage.stageType === 'ACTIVITY' ? '活动' : stage.stageType}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 500 }}>
                    {stage.name}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
                    难度: {stage.difficulty || 'NORMAL'}
                    {stage.apCost != null && ` · 理智: ${stage.apCost}`}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {!search && total > 50 && (
            <Pagination current={page} total={total} pageSize={50} onChange={setPage} />
          )}
        </div>
      )}
    </div>
  )
}

// 日导航样式
const navArrowStyle: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)', padding: '6px 10px', borderRadius: '6px',
  cursor: 'pointer', fontSize: '16px', lineHeight: 1,
}

const navDayStyle: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
  padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
  transition: 'all 0.15s',
}

const navDayActiveStyle: React.CSSProperties = {
  ...navDayStyle,
  borderWidth: '2px',
}

const todayDotStyle: React.CSSProperties = {
  background: 'var(--accent-gold)', color: '#000', fontSize: '9px',
  padding: '0px 4px', borderRadius: '2px', fontWeight: 600,
}
