import { Link, Outlet, useLocation } from 'react-router-dom'
import SearchDropdown from './SearchDropdown'

// 明日方舟风格导航栏 - 导航在左，Logo+搜索在右
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
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
          {/* 左侧：导航链接 */}
          <nav className="flex gap-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path))
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="no-underline px-4 py-2 text-sm font-medium"
                  style={{
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'color 0.2s, border-color 0.2s',
                  }}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* 右侧：Logo + 全局搜索 */}
          <div className="flex flex-col items-end gap-1.5">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <span style={{ color: 'var(--accent)', fontSize: '18px', fontWeight: 700 }}>
                ◈ ArkWiji
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                Wiki
              </span>
            </Link>
            <SearchDropdown />
          </div>
        </div>
      </header>

      {/* 页面内容：location.key 确保每次路由切换重新触发淡入动画 */}
      <main key={location.key} style={{
        flex: 1,
        width: '100%',
        maxWidth: '1024px',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '24px 16px',
        animation: 'page-fade-in 0.35s ease-out',
      }}>
        <Outlet />
      </main>

      {/* 底部免责声明 */}
      <footer style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        padding: '16px 0', marginTop: '40px',
      }}>
        <div className="max-w-5xl mx-auto px-4 text-center" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
          <p>数据来源: Kengxxiao/ArknightsGameData (GitHub)</p>
          <p>ArkWiji 为非官方应用，游戏数据版权归鹰角网络所有</p>
        </div>
      </footer>
    </div>
  )
}
