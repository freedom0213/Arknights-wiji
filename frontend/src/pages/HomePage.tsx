import { Link } from 'react-router-dom'

// 首页：搜索入口 + 快捷导航卡片
export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-8 py-12">
      {/* 标题 */}
      <div className="text-center">
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--accent)' }}>ArkWiji</span> 明日方舟 Wiki
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          干员数据 · 关卡日程 · 敌人图鉴
        </p>
      </div>

      {/* 快捷导航卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
        <NavCard
          to="/operators"
          icon="◆"
          title="干员图鉴"
          desc="查询全部干员属性、技能、晋升材料"
        />
        <NavCard
          to="/stages"
          icon="◈"
          title="关卡日程"
          desc="查看资源收集关卡每日轮换"
        />
        <NavCard
          to="/enemies"
          icon="⬖"
          title="敌人图鉴"
          desc="查询小怪、精英怪、Boss数据"
        />
      </div>
    </div>
  )
}

function NavCard({ to, icon, title, desc }: { to: string; icon: string; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="no-underline p-6 transition-all hover:scale-[1.02]"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
      }}
    >
      <div style={{ fontSize: '28px', color: 'var(--accent)', marginBottom: '12px' }}>{icon}</div>
      <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{desc}</p>
    </Link>
  )
}
