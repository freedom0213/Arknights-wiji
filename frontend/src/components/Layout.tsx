import { Link, Outlet, useLocation } from 'react-router-dom'

// 明日方舟风格导航栏
export default function Layout() {
  const location = useLocation()
  const navItems = [
    { path: '/', label: '首页', icon: '◇' },
    { path: '/operators', label: '干员', icon: '◆' },
    { path: '/stages', label: '关卡', icon: '◈' },
    { path: '/enemies', label: '敌人', icon: '⬖' },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* 顶部导航 */}
      <header style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline">
            <span style={{ color: 'var(--accent)', fontSize: '20px', fontWeight: 700 }}>
              ◈ ArkWiji
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              明日方舟 Wiki
            </span>
          </Link>
          {/* 导航链接 */}
          <nav className="flex gap-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path))
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="no-underline px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  }}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      {/* 页面内容：location.key 确保每次路由切换重新触发淡入动画 */}
      <main key={location.key} className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full" style={{ animation: 'page-fade-in 0.35s ease-out' }}>
        <Outlet />
      </main>
      {/* 底部免责声明 */}
      <footer style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        padding: '16px 0', marginTop: '40px',
      }}>
        <div className="max-w-6xl mx-auto px-4 text-center" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
          <p>数据来源: Kengxxiao/ArknightsGameData (GitHub)</p>
          <p>ArkWiji 为非官方应用，游戏数据版权归鹰角网络所有</p>
        </div>
      </footer>
    </div>
  )
}
