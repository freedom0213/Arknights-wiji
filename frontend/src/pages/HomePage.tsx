import { Link } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { fetchOperators, fetchEnemies, fetchStages } from '../api/client'

export default function HomePage() {
  const [opQuery, enQuery, stQuery] = useQueries({
    queries: [
      { queryKey: ['operators-total'], queryFn: () => fetchOperators({ page: 1, page_size: 1 }) },
      { queryKey: ['enemies-total'], queryFn: () => fetchEnemies({ page: 1, page_size: 1 }) },
      { queryKey: ['stages-total'], queryFn: () => fetchStages({ page: 1, page_size: 1 }) },
    ],
  })

  const opTotal = opQuery.data?.total ?? null
  const enTotal = enQuery.data?.total ?? null
  const stTotal = stQuery.data?.total ?? null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '56px', flexWrap: 'wrap', padding: '60px 0',
      minHeight: '60vh',
    }}>
      {/* 左侧：欢迎文字 */}
      <div style={{ textAlign: 'left' }}>
        <h1 style={{
          fontSize: '44px', fontWeight: 700, color: 'var(--text-primary)',
          marginBottom: '10px', lineHeight: 1.2,
        }}>
          欢迎使用<br /><span style={{ color: 'var(--accent)' }}>ArkWiji</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
          明日方舟数据查询 · 干员 / 关卡 / 敌人
        </p>
      </div>

      {/* 右侧：功能卡片（竖排） */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FeatureCard
          to="/operators" icon="◆" accent="var(--accent)"
          title="干员图鉴" desc="属性、技能、晋升材料查询"
          count={opTotal} countLabel="名干员"
        />
        <FeatureCard
          to="/stages" icon="◈" accent="var(--accent-gold)"
          title="关卡日程" desc="资源收集每日轮换"
          count={stTotal} countLabel="个关卡"
        />
        <FeatureCard
          to="/enemies" icon="⬖" accent="#ff6b8a"
          title="敌人图鉴" desc="小怪、精英、Boss 数据一览"
          count={enTotal} countLabel="个敌人"
        />
      </div>
    </div>
  )
}

// 半透明功能卡片 — hover 时发光上浮
const cardStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '16px',
  width: '280px', padding: '18px 22px',
  background: 'rgba(35, 39, 70, 0.28)',
  backdropFilter: 'blur(10px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(10px) saturate(1.2)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '14px',
  cursor: 'pointer',
  transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
}

function FeatureCard({ to, icon, accent, title, desc, count, countLabel }: {
  to: string; icon: string; accent: string; title: string; desc: string
  count: number | null; countLabel: string
}) {
  return (
    <Link
      to={to}
      className="no-underline"
      style={cardStyle}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.transform = 'translateY(-6px) translateX(4px)'
        el.style.background = 'rgba(35, 39, 70, 0.55)'
        el.style.borderColor = accent
        el.style.boxShadow = `0 12px 36px rgba(0,0,0,0.3), 0 0 24px ${accent}22`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.transform = 'translateY(0) translateX(0)'
        el.style.background = 'rgba(35, 39, 70, 0.28)'
        el.style.borderColor = 'rgba(255,255,255,0.06)'
        el.style.boxShadow = 'none'
      }}
    >
      <span style={{
        fontSize: '34px', flexShrink: 0,
        filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.15))',
      }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, margin: 0 }}>
          {title}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '3px 0 8px', lineHeight: 1.3 }}>
          {desc}
        </p>
        <span style={{
          color: accent, fontSize: '12px', fontWeight: 500,
          background: `${accent}18`, padding: '3px 10px', borderRadius: '10px',
        }}>
          {count !== null ? `共 ${count} ${countLabel}` : '载入中…'}
        </span>
      </div>
    </Link>
  )
}
