import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Activity } from '../api/client'
import { fetchActivity } from '../api/client'
import { SkeletonDetail } from '../components/Skeleton'
import { ErrorState } from '../components/StateView'

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

// 活动详情页
export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetchActivity(id)
      .then(data => setActivity(data))
      .catch(err => setError(err?.message || '请求失败'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div>
      <Link to="/activities" style={{ color: 'var(--accent)' }}>← 返回活动一览</Link>
      <SkeletonDetail />
    </div>
  )
  if (error) return (
    <div>
      <Link to="/activities" style={{ color: 'var(--accent)' }}>← 返回活动一览</Link>
      <ErrorState message={error} onRetry={() => window.location.reload()} />
    </div>
  )
  if (!activity) return (
    <div>
      <Link to="/activities" style={{ color: 'var(--accent)' }}>← 返回活动一览</Link>
      <ErrorState message="活动不存在" onRetry={() => window.location.reload()} />
    </div>
  )

  const posterUrl = activity.posterUrls?.length > 0 ? activity.posterUrls[0] : null

  return (
    <div>
      <Link to="/activities" className="no-underline"
        style={{ color: 'var(--accent)', fontSize: '14px', marginBottom: '16px', display: 'inline-block' }}>
        ← 返回活动一览
      </Link>

      <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>
        {activity.name}
      </h1>

      <div style={{
        background: 'rgba(35,39,70,0.38)', backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
        padding: '24px', display: 'flex', gap: '24px', alignItems: 'flex-start',
      }}>
        {/* 活动海报 */}
        <div style={{
          width: '280px', height: '160px', flexShrink: 0,
          background: 'rgba(20,22,40,0.5)', borderRadius: '8px',
          overflow: 'hidden', cursor: posterUrl ? 'pointer' : 'default',
          border: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => posterUrl && setLightbox(true)}>
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={activity.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <span style={{
              color: 'var(--accent)', fontSize: '20px', fontWeight: 700,
            }}>
              {DISPLAY_TYPE_LABEL[activity.displayType] || activity.displayType || '活动'}
            </span>
          )}
        </div>

        {/* 信息卡片 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 活动类型 */}
          <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '3px',
              background: 'var(--accent)', color: '#000', fontWeight: 500,
            }}>
              {DISPLAY_TYPE_LABEL[activity.displayType] || activity.displayType}
            </span>
            {activity.isReplicate ? (
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '3px',
                border: '1px solid var(--accent)', color: 'var(--accent)',
              }}>
                记录修复
              </span>
            ) : null}
          </div>

          {/* 活动时间 */}
          <div style={{ marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>活动时间</span>
            <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0' }}>
              {formatDate(activity.startTime)} ~ {formatDate(activity.endTime)}
            </p>
          </div>

          {/* 兑换结束时间 */}
          {activity.rewardEndTime > 0 && activity.rewardEndTime !== activity.endTime && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>兑换结束</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0' }}>
                {formatDate(activity.rewardEndTime)}
              </p>
            </div>
          )}

          {/* 关联信息 */}
          {activity.hasStage ? (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>关联关卡</span>
              <p style={{ color: 'var(--accent)', fontSize: '13px', margin: '4px 0 0' }}>
                该活动包含作战关卡
              </p>
            </div>
          ) : null}

          {activity.templateShopId && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>兑换商店</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0' }}>
                {activity.templateShopId}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && posterUrl && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.85)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'zoom-out',
        }} onClick={() => setLightbox(false)}>
          <button style={{
            position: 'absolute', top: '20px', right: '20px',
            color: '#fff', background: 'none', border: 'none',
            fontSize: '28px', cursor: 'pointer',
          }}>✕</button>
          <img src={posterUrl} alt={activity.name}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  )
}
