import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Material } from '../api/client'
import { fetchMaterial } from '../api/client'
import { SkeletonDetail } from '../components/Skeleton'
import { ErrorState } from '../components/StateView'

// 稀有度星级映射
const RARITY_STARS: Record<string, string> = {
  TIER_1: '★', TIER_2: '★★', TIER_3: '★★★',
  TIER_4: '★★★★', TIER_5: '★★★★★', TIER_6: '★★★★★★',
}

// 材料详情页
export default function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [material, setMaterial] = useState<Material | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetchMaterial(id)
      .then(data => setMaterial(data))
      .catch(err => setError(err?.message || '请求失败'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div>
      <Link to="/materials" style={{ color: 'var(--accent)' }}>← 返回材料列表</Link>
      <SkeletonDetail />
    </div>
  )
  if (error) return (
    <div>
      <Link to="/materials" style={{ color: 'var(--accent)' }}>← 返回材料列表</Link>
      <ErrorState message={error} onRetry={() => window.location.reload()} />
    </div>
  )
  if (!material) return (
    <div>
      <Link to="/materials" style={{ color: 'var(--accent)' }}>← 返回材料列表</Link>
      <ErrorState message="材料不存在" onRetry={() => window.location.reload()} />
    </div>
  )

  const stars = RARITY_STARS[material.rarity] || ''

  return (
    <div>
      <Link to="/materials" className="no-underline"
        style={{ color: 'var(--accent)', fontSize: '14px', marginBottom: '16px', display: 'inline-block' }}>
        ← 返回材料列表
      </Link>

      <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>
        {material.name}
      </h1>

      <div style={{
        background: 'rgba(35,39,70,0.38)', backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
        padding: '24px', display: 'flex', gap: '24px', alignItems: 'flex-start',
      }}>
        {/* 材料大图 */}
        <div style={{
          width: '160px', height: '160px', flexShrink: 0,
          background: 'rgba(20,22,40,0.5)', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border-color)',
        }}>
          {material.iconUrl ? (
            <img src={material.iconUrl} alt={material.name}
              style={{ width: '80%', height: '80%', objectFit: 'contain' }}
              onError={e => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>暂无图片</span>
          )}
        </div>

        {/* 信息卡片 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 稀有度 */}
          {stars && <p style={{
            color: 'var(--accent-gold, #ffb347)', fontSize: '18px', marginBottom: '12px',
          }}>{stars}</p>}

          {/* 用途 */}
          {material.usage && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>用途</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0' }}>
                {material.usage}
              </p>
            </div>
          )}

          {/* 描述 */}
          {material.description && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>描述</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0', opacity: 0.8 }}>
                {material.description}
              </p>
            </div>
          )}

          {/* 获取方式 */}
          {material.obtainApproach && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>获取方式</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0' }}>
                {material.obtainApproach}
              </p>
            </div>
          )}

          {/* 类型标签 */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            {material.classifyType && (
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '3px',
                background: 'var(--accent)', color: '#000', fontWeight: 500,
              }}>
                {material.classifyType}
              </span>
            )}
            {material.itemType && (
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '3px',
                background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
              }}>
                {material.itemType}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
