import { Link, Outlet, useLocation } from 'react-router-dom'
import SearchDropdown from './SearchDropdown'

// Glassmorphism 毛玻璃风格布局
// 动态光晕背景透过半透明层可见，卡片/导航栏有 backdrop-blur 效果
export default function Layout() {
  const location = useLocation()
  const navItems = [
    { path: '/', label: '首页', icon: '◇' },
    { path: '/operators', label: '干员', icon: '◆' },
    { path: '/stages', label: '关卡', icon: '◈' },
    { path: '/enemies', label: '敌人', icon: '⬖' },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'transparent' }}>
      {/* 毛玻璃导航栏 */}
      <header className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '8px 16px', position: 'relative',
        }}>
          {/* 导航链接 */}
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
                    borderRadius: '6px 6px 0 0',
                  }}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* 搜索 + Logo：固定在页面右上角，同一行 */}
        <div style={{
          position: 'absolute', top: '8px', right: '24px',
          display: 'flex', flexDirection: 'row', alignItems: 'center',
          gap: '12px', zIndex: 51,
        }}>
          <SearchDropdown />
          <Link to="/" className="flex items-center gap-2 no-underline">
            <span style={{ color: 'var(--accent)', fontSize: '18px', fontWeight: 700 }}>
              ◈ ArkWiji
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
              Wiki
            </span>
          </Link>
        </div>
      </header>

      {/* 页面内容 */}
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

      {/* 底部 */}
      <footer style={{
        padding: '16px', marginTop: '40px',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: '12px',
      }}>
        <p>Made by freedom · <a href="https://github.com/freedom0213" target="_blank" rel="noopener"
          style={{ color: 'var(--accent)', opacity: 0.7 }}>GitHub</a>
          · <a href="mailto:926049197@qq.com"
          style={{ color: 'var(--accent)', opacity: 0.7 }}>926049197@qq.com</a></p>
        <p style={{ marginTop: '4px' }}>数据来源: Kengxxiao/ArknightsGameData (GitHub)</p>
        <p>ArkWiji 为非官方应用，游戏数据版权归鹰角网络所有</p>
      </footer>
    </div>
  )
}
