import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Material } from '../api/client'
import { fetchAllMaterials } from '../api/client'
import { SkeletonCardGrid } from '../components/Skeleton'
import { ErrorState, EmptyState } from '../components/StateView'

// 材料图片网格页 — 全量展示所有物品图标，悬停显示名称，点击进入详情
export default function MaterialsPage() {
  const [items, setItems] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchAllMaterials()
      .then(data => setItems(data))
      .catch(err => setError(err?.message || '请求失败'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <SkeletonCardGrid count={36} columns="repeat(auto-fill, minmax(72px, 1fr))" />
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />
  if (items.length === 0) return <EmptyState message="暂无材料数据" />

  return (
    <div>
      <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>
        ◫ 道具材料
      </h1>
      {/* 图片网格：自适应列数，最小72px */}
      <div className="grid gap-2" style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
      }}>
        {items.map(item => (
          <Link
            key={item.id}
            to={`/materials/${item.id}`}
            title={item.name}
            className="card-hover"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '8px', padding: '6px', aspectRatio: '1/1',
              textDecoration: 'none',
            }}
          >
            {item.iconUrl ? (
              <img src={item.iconUrl} alt={item.name} loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <span style={{
                color: 'var(--text-secondary)', fontSize: '10px',
                textAlign: 'center', wordBreak: 'break-all',
              }}>
                {item.name?.slice(0, 4)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
