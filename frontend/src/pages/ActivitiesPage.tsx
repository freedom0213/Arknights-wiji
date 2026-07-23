import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Activity } from '../api/client'
import { fetchActivities } from '../api/client'
import { SkeletonCardGrid } from '../components/Skeleton'
import { ErrorState, EmptyState } from '../components/StateView'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 20

// 活动类型中文映射
const DISPLAY_TYPE_LABEL: Record<string, string> = {
  SIDESTORY: 'SideStory', MINISTORY: '故事集',
  BRANCHLINE: '支线', MAINLINE: '主线',
  NONE: '其他',
}

// Unix时间戳转日期字符串
function formatDate(ts: number): string {
  if (!ts) return '?'
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 活动一览 — 时间线排列
export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayTypeFilter, setDisplayTypeFilter] = useState('')

  const loadData = useCallback(() => {
    setLoading(true)
    setError(null)
    const params: Record<string, string | number> = { page, page_size: PAGE_SIZE }
    if (displayTypeFilter) params.display_type = displayTypeFilter
    fetchActivities(params)
      .then(data => {
        setActivities(data.items)
        setTotal(data.total)
      })
      .catch(err => setError(err?.message || '请求失败'))
      .finally(() => setLoading(false))
  }, [page, displayTypeFilter])

  useEffect(() => { loadData() }, [loadData])

  if (loading && activities.length === 0) return (
    <div>
      <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>✦ 活动一览</h1>
      <SkeletonCardGrid count={6} columns="1fr" />
    </div>
  )
  if (error) return (
    <div>
      <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>✦ 活动一览</h1>
      <ErrorState message={error} onRetry={loadData} />
    </div>
  )
  if (activities.length === 0) return (
    <div>
      <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>✦ 活动一览</h1>
      <EmptyState message="暂无活动数据" />
    </div>
  )

  return (
    <div>
      <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '8px' }}>✦ 活动一览</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
        共 {total} 个活动，按开始时间从新到旧排列
      </p>

      {/* 类型筛选 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[['', '全部'], ['SIDESTORY', 'SideStory'], ['MINISTORY', '故事集'], ['BRANCHLINE', '支线']].map(([val, label]) => (
          <button key={val} onClick={() => { setDisplayTypeFilter(val); setPage(1) }}
            style={{
              padding: '4px 12px', borderRadius: '4px', fontSize: '12px',
              border: displayTypeFilter === val ? '1px solid var(--accent)' : '1px solid var(--border-color)',
              background: displayTypeFilter === val ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: displayTypeFilter === val ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* 活动卡片时间线 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activities.map(activity => (
          <Link key={activity.id} to={`/activities/${activity.id}`}
            className="card-hover no-underline"
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '8px', padding: '16px',
              display: 'flex', gap: '16px', alignItems: 'center',
            }}>
            {/* 活动海报 / 封面 */}
            <div style={{
              width: '160px', height: '90px', flexShrink: 0,
              borderRadius: '6px', overflow: 'hidden',
              background: 'rgba(20,22,40,0.5)',
            }}>
              {activity.posterUrls && activity.posterUrls.length > 0 ? (
                <img
                  src={activity.posterUrls[0]}
                  alt={activity.name}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => {
                    const img = e.target as HTMLImageElement
                    if (img.dataset.fallbackTried !== 'true' && activity.posterUrls.length > 1) {
                      img.dataset.fallbackTried = 'true'
                      img.src = activity.posterUrls[1]
                    } else {
                      img.style.display = 'none'
                    }
                  }}
                />
              ) : null}
              {/* 无海报时的纯文字占位 */}
              {(!activity.posterUrls || activity.posterUrls.length === 0) && (
                <div style={{
                  width: '100%', height: '100%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent)', fontSize: '16px', fontWeight: 700,
                }}>
                  {DISPLAY_TYPE_LABEL[activity.displayType] || activity.displayType || '活动'}
                </div>
              )}
            </div>

            {/* 活动信息 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{
                  color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px',
                }}>
                  {activity.name}
                </span>
                <span style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: '3px',
                  background: 'var(--accent)', color: '#000', fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}>
                  {DISPLAY_TYPE_LABEL[activity.displayType] || activity.displayType}
                </span>
                {activity.isReplicate ? (
                  <span style={{
                    fontSize: '10px', padding: '1px 6px',
                    border: '1px solid var(--accent)', borderRadius: '3px',
                    color: 'var(--accent)',
                  }}>
                    记录修复
                  </span>
                ) : null}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                {formatDate(activity.startTime)} ~ {formatDate(activity.endTime)}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 分页 */}
      {total > PAGE_SIZE && (
        <Pagination current={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
      )}
    </div>
  )
}
