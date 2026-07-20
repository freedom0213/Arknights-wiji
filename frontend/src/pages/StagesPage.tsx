import { useState, useEffect } from 'react'
import { fetchStages, fetchZones } from '../api/client'
import type { Stage } from '../api/client'

export default function StagesPage() {
  const [stages, setStages] = useState<Stage[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [zoneFilter, setZoneFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchZones().then(setZones)
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string | number> = { page, page_size: 50 }
    if (zoneFilter) params.zone_id = zoneFilter
    fetchStages(params).then(data => {
      // 客户端搜索过滤
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
    })
  }, [page, zoneFilter, search])

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
        ◈ 关卡列表
      </h1>

      {/* 筛选 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text" placeholder="搜索关卡名/代码..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '6px', outline: 'none' }}
        />
        <select
          value={zoneFilter} onChange={e => { setZoneFilter(e.target.value); setPage(1) }}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '6px' }}
        >
          <option value="">全部章节</option>
          {zones.map((z: any) => (
            <option key={z.zoneID || z.id} value={z.zoneID || z.id}>
              {(z.zoneNameFirst || z.name || z.id)}
            </option>
          ))}
        </select>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
        共 {total} 个关卡
      </p>

      {/* 关卡列表 */}
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>加载中...</p>
      ) : (
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {stages.map(stage => (
            <div
              key={stage.id}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '6px', padding: '12px',
              }}
            >
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
                {stage.apCost && ` · 理智: ${stage.apCost}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {total > 50 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.ceil(total / 50) }, (_, i) => (
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
