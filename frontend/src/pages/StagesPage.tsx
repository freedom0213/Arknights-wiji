import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchStages, fetchZones, fetchWeeklySchedule } from '../api/client'
import type { Stage, ScheduleDay } from '../api/client'
import { SkeletonWeekGrid, SkeletonCardGrid } from '../components/Skeleton'
import { ErrorState } from '../components/StateView'

// 关卡类别中文名
const ZONE_CATEGORY: Record<string, string> = {
  weekly_1: '术师/狙击芯片', weekly_2: '近卫/特种芯片',
  weekly_3: '医疗/辅助芯片', weekly_4: '先锋/重装芯片',
  weekly_5: '采购凭证', weekly_6: '碳素组',
  weekly_7: '作战记录', weekly_8: '技巧概要',
  weekly_9: '龙门币',
}

// 按 zoneId 给关卡分组并生成标签
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
  const [stages, setStages] = useState<Stage[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoneFilter, setZoneFilter] = useState('')
  const [search, setSearch] = useState('')

  // 获取每周日程
  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['weekly-schedule'],
    queryFn: fetchWeeklySchedule,
  })

  // 获取章节列表
  useEffect(() => { fetchZones().then(setZones) }, [])

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

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: 'var(--text-primary)' }}>
        ◈ 关卡日程
      </h1>

      {/* 每周日程网格 */}
      {scheduleLoading ? (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: '8px', padding: '24px', marginBottom: '24px',
        }}>
          <SkeletonWeekGrid />
        </div>
      ) : scheduleData && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: '8px', padding: '24px', marginBottom: '24px',
        }}>
          <div className="divider-diamond" style={{ marginBottom: '16px' }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600 }}>本周开放日程</h2>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            {scheduleData.daily_schedule.map((day: ScheduleDay) => {
              const isToday = day.is_today
              // 按 zone 分组
              const grouped = groupStages(day.stages)
              return (
                <div key={day.weekday} style={{
                  padding: '12px', borderRadius: '6px',
                  background: isToday ? 'rgba(78,201,240,0.08)' : 'var(--bg-secondary)',
                  border: isToday ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px',
                  }}>
                    <span style={{
                      color: isToday ? 'var(--accent)' : 'var(--text-primary)',
                      fontWeight: isToday ? 700 : 500, fontSize: '15px',
                    }}>
                      {day.weekday_name}
                    </span>
                    {isToday && (
                      <span style={{
                        background: 'var(--accent)', color: '#000', fontSize: '10px',
                        padding: '1px 6px', borderRadius: '3px', fontWeight: 600,
                      }}>今天</span>
                    )}
                  </div>
                  {grouped.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>休息</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {grouped.map(g => (
                        <div key={g.zoneId} style={{ fontSize: '12px' }}>
                          <span style={{ color: 'var(--accent-gold)', fontWeight: 500 }}>{g.label}</span>
                          <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>
                            {g.stages.map(s => s.code).join(' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 关卡列表 */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: '8px', padding: '24px',
      }}>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
          全部关卡
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 400, marginLeft: '8px' }}>
            共 {total} 个
          </span>
        </h2>

        {/* 筛选 */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input type="text" placeholder="搜索关卡名/代码…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', padding: '8px 14px', borderRadius: '6px', outline: 'none', fontSize: '14px',
            }}
          />
          <select value={zoneFilter} onChange={e => { setZoneFilter(e.target.value); setPage(1) }}
            style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '6px', fontSize: '14px',
            }}>
            <option value="">全部章节</option>
            {zones.map((z: any) => (
              <option key={z.zoneID || z.id} value={z.zoneID || z.id}>
                {(z.zoneNameFirst || z.name || z.id)}
              </option>
            ))}
          </select>
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
        {total > 50 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: Math.ceil(total / 50) }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} style={{
                background: page === i + 1 ? 'var(--accent)' : 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: page === i + 1 ? '#000' : 'var(--text-secondary)',
                padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
              }}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
