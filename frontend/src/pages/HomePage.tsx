import { Link } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { fetchOperators, fetchEnemies, fetchStages } from '../api/client'

export default function HomePage() {
  // 并行获取三个模块的数据总量（只取第1页1条，用 total 即可）
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
    <div style={{ textAlign: 'center' }}>
      {/* 欢迎区域 */}
      <div style={{ padding: '60px 0 48px' }}>
        <h1 style={{
          fontSize: '40px', fontWeight: 700, color: 'var(--text-primary)',
          marginBottom: '12px',
        }}>
          欢迎使用 <span style={{ color: 'var(--accent)' }}>ArkWiji</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
          明日方舟数据查询 · 干员 / 关卡 / 敌人
        </p>
      </div>

      {/* 功能入口卡片 */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '20px',
        flexWrap: 'wrap', maxWidth: '720px', margin: '0 auto',
      }}>
        <FeatureCard
          to="/operators"
          icon="◆"
          title="干员图鉴"
          desc="查询全部干员属性、技能、晋升材料"
          count={opTotal}
          countLabel="名干员"
        />
        <FeatureCard
          to="/stages"
          icon="◈"
          title="关卡日程"
          desc="资源收集副本每日轮换查询"
          count={stTotal}
          countLabel="个关卡"
        />
        <FeatureCard
          to="/enemies"
          icon="⬖"
          title="敌人图鉴"
          desc="小怪、精英怪、Boss 数据查询"
          count={enTotal}
          countLabel="个敌人"
        />
      </div>
    </div>
  )
}

// 功能入口卡片 - 带数据统计
function FeatureCard({ to, icon, title, desc, count, countLabel }: {
  to: string; icon: string; title: string; desc: string
  count: number | null; countLabel: string
}) {
  return (
    <Link
      to={to}
      className="no-underline card-hover"
      style={{
        width: '200px', padding: '28px 20px 20px',
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: '10px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center',
      }}
    >
      <span style={{ fontSize: '36px', color: 'var(--accent)', marginBottom: '14px' }}>{icon}</span>
      <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
        {desc}
      </p>
      <span style={{
        color: 'var(--accent)', fontSize: '13px', fontWeight: 500,
        background: 'rgba(78, 201, 240, 0.1)',
        padding: '4px 14px', borderRadius: '12px',
      }}>
        {count !== null ? `共 ${count} ${countLabel}` : '载入中…'}
      </span>
    </Link>
  )
}
