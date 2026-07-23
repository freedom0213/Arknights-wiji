import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Skin } from '../api/client'
import { fetchSkin } from '../api/client'
import { SkeletonDetail } from '../components/Skeleton'
import { ErrorState } from '../components/StateView'

// Unix时间戳转日期字符串
function formatDate(ts: number): string {
  if (!ts) return '未知'
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 皮肤详情页
export default function SkinDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [skin, setSkin] = useState<Skin | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetchSkin(id)
      .then(data => setSkin(data))
      .catch(err => setError(err?.message || '请求失败'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div>
      <Link to="/skins" style={{ color: 'var(--accent)' }}>← 返回时装回廊</Link>
      <SkeletonDetail />
    </div>
  )
  if (error) return (
    <div>
      <Link to="/skins" style={{ color: 'var(--accent)' }}>← 返回时装回廊</Link>
      <ErrorState message={error} onRetry={() => window.location.reload()} />
    </div>
  )
  if (!skin) return (
    <div>
      <Link to="/skins" style={{ color: 'var(--accent)' }}>← 返回时装回廊</Link>
      <ErrorState message="皮肤不存在" onRetry={() => window.location.reload()} />
    </div>
  )

  // 图片 URL（优先 Aceship 完整立绘 > 半身像 > 头像）
  const displayImage = skin.illustUrlAceship || skin.portraitUrl || skin.avatarUrl

  return (
    <div>
      <Link to="/skins" className="no-underline"
        style={{ color: 'var(--accent)', fontSize: '14px', marginBottom: '16px', display: 'inline-block' }}>
        ← 返回时装回廊
      </Link>

      <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>
        {skin.skinName || '未知皮肤'}
      </h1>

      <div style={{
        background: 'rgba(35,39,70,0.38)', backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
        padding: '24px', display: 'flex', gap: '24px', alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>
        {/* 皮肤大图 — Aceship 完整立绘优先 */}
        <div style={{
          width: '260px', minHeight: '340px', flexShrink: 0,
          background: 'rgba(20,22,40,0.5)', borderRadius: '8px',
          overflow: 'hidden', cursor: displayImage ? 'pointer' : 'default',
          border: '1px solid var(--border-color)',
        }} onClick={() => displayImage && setLightbox(true)}>
          {displayImage ? (
            <img
              src={displayImage}
              alt={skin.skinName || '皮肤'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
              onError={e => {
                const img = e.target as HTMLImageElement
                // 逐级回退：Aceship → portrait → avatar
                if (skin.illustUrlAceship && img.src === skin.illustUrlAceship && skin.portraitUrl) {
                  img.src = skin.portraitUrl; return
                }
                if (skin.portraitUrl && img.src === skin.portraitUrl && skin.avatarUrl) {
                  img.src = skin.avatarUrl; return
                }
                img.style.display = 'none'
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', minHeight: '340px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}>
              暂无图片
            </div>
          )}
        </div>

        {/* 信息卡片 */}
        <div style={{ flex: 1, minWidth: '280px' }}>
          {/* 品牌/系列 */}
          {skin.skinGroupName && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>品牌系列</span>
              <p style={{ color: 'var(--accent)', fontSize: '15px', margin: '4px 0 0', fontWeight: 600 }}>
                {skin.skinGroupName}
                {skin.skinGroupSortIndex != null ? ` (序号 #${skin.skinGroupSortIndex})` : ''}
              </p>
            </div>
          )}

          {/* 所属干员 */}
          <div style={{ marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>所属干员</span>
            <p style={{ margin: '4px 0 0' }}>
              <Link to={`/operators/${encodeURIComponent(skin.charId)}`} style={{ color: 'var(--accent)', fontSize: '14px' }}>
                {skin.modelName || skin.charId}
              </Link>
            </p>
          </div>

          {/* 画师 */}
          {skin.drawerList.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>画师</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0' }}>
                {skin.drawerList.join(' / ')}
              </p>
            </div>
          )}

          {/* 设计师 */}
          {skin.designerList.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>设计师</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0' }}>
                {skin.designerList.join(' / ')}
              </p>
            </div>
          )}

          {/* 标题列表 */}
          {skin.titleList && skin.titleList.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>标题</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0' }}>
                {skin.titleList.map((t: any) => t.title || t).join(' / ')}
              </p>
            </div>
          )}

          {/* 颜色主题 */}
          {skin.colorList && skin.colorList.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>主题色</span>
              <div style={{ display: 'flex', gap: '6px', margin: '4px 0 0' }}>
                {skin.colorList.filter(Boolean).map((c: string, i: number) => (
                  <span key={i} style={{
                    width: '20px', height: '20px', borderRadius: '4px',
                    background: c, border: '1px solid rgba(255,255,255,0.2)',
                  }} title={c} />
                ))}
              </div>
            </div>
          )}

          {/* 皮肤描述（content） */}
          {skin.content && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>皮肤描述</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0', opacity: 0.85, lineHeight: 1.6 }}>
                {skin.content}
              </p>
            </div>
          )}

          {/* 详细描述 */}
          {skin.description && skin.description !== skin.content && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>描述</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0', opacity: 0.75, lineHeight: 1.6 }}>
                {skin.description}
              </p>
            </div>
          )}

          {/* 对话 */}
          {skin.dialog && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>台词</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0', opacity: 0.85, lineHeight: 1.6, fontStyle: 'italic' }}>
                "{skin.dialog}"
              </p>
            </div>
          )}

          {/* 用途 */}
          {skin.usage && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>用途</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0' }}>
                {skin.usage}
              </p>
            </div>
          )}

          {/* 获取方式 */}
          {skin.obtainApproach && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>获取方式</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0' }}>
                {skin.obtainApproach}
              </p>
            </div>
          )}

          {/* 上线时间 */}
          <div style={{ marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>上线信息</span>
            <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0' }}>
              上线时间：{skin.getTime > 0 ? formatDate(skin.getTime) : '未知'}
              {skin.onYear > 0 && ` | ${skin.onYear}年 第${skin.onPeriod}期`}
            </p>
          </div>

          {/* 标签 */}
          {skin.displayTagId && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>标签</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0' }}>
                {skin.displayTagId}
              </p>
            </div>
          )}

          {/* 售卖类型 */}
          {skin.isBuySkin != null && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>获取类型</span>
              <p style={{ margin: '4px 0 0' }}>
                <span style={{
                  fontSize: '11px', padding: '2px 8px', borderRadius: '3px',
                  background: skin.isBuySkin ? 'var(--accent)' : 'transparent',
                  color: skin.isBuySkin ? '#000' : 'var(--text-secondary)',
                  border: skin.isBuySkin ? 'none' : '1px solid var(--border-color)',
                }}>
                  {skin.isBuySkin ? '付费' : '免费/活动'}
                </span>
              </p>
            </div>
          )}

          {/* 配音类型 */}
          {skin.voiceType && skin.voiceType !== 'NONE' && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>配音</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0' }}>
                {skin.voiceType}
              </p>
            </div>
          )}

          {/* 基建建模 */}
          {skin.buildingId && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>基建建模</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0' }}>
                {skin.buildingId}
              </p>
            </div>
          )}

          {/* 战斗皮肤 */}
          {skin.battleSkin && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>战斗皮肤</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '13px', margin: '4px 0 0', opacity: 0.7 }}>
                {typeof skin.battleSkin === 'string' ? skin.battleSkin : JSON.stringify(skin.battleSkin)}
              </p>
            </div>
          )}

          {/* 排序ID */}
          {skin.sortId != null && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>排序ID</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0', opacity: 0.6 }}>
                {skin.sortId}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 额外图片：SP/动态皮肤立绘 */}
      {(skin.spIllustUrl || skin.spPortraitUrl || skin.dynIllustUrl || skin.dynEntranceUrl) && (
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', marginBottom: '12px' }}>
            ◇ 附加资源
          </h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {skin.spIllustUrl && (
              <div style={{
                background: 'rgba(35,39,70,0.38)', backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                padding: '12px', textAlign: 'center',
              }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 8px' }}>SP立绘</p>
                <img src={skin.spIllustUrl} alt="SP立绘" loading="lazy"
                  style={{ maxWidth: '200px', maxHeight: '280px', objectFit: 'contain', borderRadius: '6px' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            )}
            {skin.dynIllustUrl && (
              <div style={{
                background: 'rgba(35,39,70,0.38)', backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                padding: '12px', textAlign: 'center',
              }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 8px' }}>动态立绘</p>
                <img src={skin.dynIllustUrl} alt="动态立绘" loading="lazy"
                  style={{ maxWidth: '200px', maxHeight: '280px', objectFit: 'contain', borderRadius: '6px' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox 大图 */}
      {lightbox && displayImage && (
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
          <img
            src={displayImage}
            alt={skin.skinName || '皮肤'}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  )
}
