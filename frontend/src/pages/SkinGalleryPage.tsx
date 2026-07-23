import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Skin, SkinGroupedResponse } from '../api/client'
import { fetchSkinsGrouped } from '../api/client'
import { SkeletonLine } from '../components/Skeleton'
import { ErrorState, EmptyState } from '../components/StateView'

// 皮肤展示页 — Wiki 时间线布局，按上线日期分组，展示完整立绘
export default function SkinGalleryPage() {
  const [data, setData] = useState<SkinGroupedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchSkinsGrouped()
      .then(d => setData(d))
      .catch(err => setError(err?.message || '请求失败'))
      .finally(() => setLoading(false))
  }, [])

  // 图片加载失败时逐级回退：Aceship 立绘 → 半身像 → 头像
  const handleImageError = (skin: Skin) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement
    if (skin.illustUrlAceship && img.src === skin.illustUrlAceship) {
      if (skin.portraitUrl) { img.src = skin.portraitUrl; return }
    }
    if (skin.portraitUrl && img.src === skin.portraitUrl) {
      if (skin.avatarUrl) { img.src = skin.avatarUrl; return }
    }
    img.style.display = 'none'
  }

  // ===== 加载态 =====
  if (loading) return (
    <div>
      <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '8px' }}>◇ 时装回廊</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
        正在加载...
      </p>
      {Array.from({ length: 4 }, (_, gi) => (
        <div key={gi}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '16px', marginTop: gi > 0 ? '32px' : 0,
          }}>
            <SkeletonLine width="110px" height="18px" />
            <SkeletonLine width="60px" height="12px" />
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {Array.from({ length: 5 }, (_, ci) => (
              <div key={ci} style={{
                width: '160px', background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px', overflow: 'hidden',
              }}>
                <div style={{ aspectRatio: '9/16', background: 'rgba(20,22,40,0.5)' }} />
                <div style={{ padding: '8px 10px' }}>
                  <SkeletonLine width="80%" height="12px" />
                  <div style={{ height: '4px' }} />
                  <SkeletonLine width="60%" height="10px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  // ===== 错误态 =====
  if (error) return (
    <div>
      <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>◇ 时装回廊</h1>
      <ErrorState message={error} onRetry={() => window.location.reload()} />
    </div>
  )

  // ===== 空态 =====
  if (!data || data.groups.length === 0) return (
    <div>
      <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>◇ 时装回廊</h1>
      <EmptyState message="暂无皮肤数据" />
    </div>
  )

  // ===== 正常渲染：日期分组时间线 =====
  return (
    <div>
      <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '8px' }}>◇ 时装回廊</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px' }}>
        共 {data.total_skins} 款品牌皮肤 · {data.total_groups} 个日期
      </p>

      {data.groups.map((group, gi) => (
        <div key={group.date}>
          {/* 分组标题 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '16px', marginTop: gi === 0 ? '20px' : '32px',
          }}>
            <span style={{ color: 'var(--accent)', fontSize: '17px', fontWeight: 700, whiteSpace: 'nowrap' }}>
              ◇ {group.date}
            </span>
            <span style={{
              flex: 1, height: '1px',
              background: 'linear-gradient(to right, var(--border-color), transparent)',
            }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
              共 {group.skins.length} 款
            </span>
          </div>

          {/* 皮肤卡片列表（flexbox wrap） */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '12px',
            justifyContent: 'flex-start',
          }}>
            {group.skins.map(skin => (
              <Link
                key={skin.id}
                to={`/skins/${encodeURIComponent(skin.id)}`}
                className="card-hover no-underline"
                style={{
                  display: 'flex', flexDirection: 'column',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px', overflow: 'hidden',
                  width: '160px', flexShrink: 0,
                }}
              >
                {/* 立绘图片（完整展示，不裁剪） */}
                <div style={{
                  aspectRatio: '9/16', overflow: 'hidden',
                  background: 'rgba(20,22,40,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {(skin.illustUrlAceship || skin.portraitUrl || skin.avatarUrl) ? (
                    <img
                      src={skin.illustUrlAceship || skin.portraitUrl || skin.avatarUrl || ''}
                      alt={skin.skinName || '皮肤'}
                      loading="lazy"
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'center center',
                      }}
                      onError={handleImageError(skin)}
                    />
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                      暂无图片
                    </span>
                  )}
                </div>
                {/* 文字信息 */}
                <div style={{ padding: '8px 10px' }}>
                  <div style={{
                    color: 'var(--text-primary)', fontSize: '13px',
                    fontWeight: 600, marginBottom: '2px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {skin.skinName || '未知皮肤'}
                  </div>
                  <div style={{
                    color: 'var(--text-secondary)', fontSize: '11px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {skin.skinGroupName || skin.modelName || ''}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* 底部结束提示 */}
      <div style={{
        padding: '32px 0', textAlign: 'center',
        color: 'var(--text-secondary)', fontSize: '13px',
      }}>
        — 已展示全部 {data.total_skins} 款皮肤 —
      </div>
    </div>
  )
}
