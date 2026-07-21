// 通用标签页切换组件
interface Tab {
  key: string
  label: string
}

interface TabBarProps {
  tabs: Tab[]
  activeKey: string
  onChange: (key: string) => void
}

export default function TabBar({ tabs, activeKey, onChange }: TabBarProps) {
  return (
    <div className="flex gap-1 mb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeKey === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeKey === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'color 0.2s, border-color 0.2s',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
