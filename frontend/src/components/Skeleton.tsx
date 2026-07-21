// 骨架屏组件 - 使用全局 CSS 中的 skeleton-pulse 动画

const skel: React.CSSProperties = {
  background: 'var(--border-color)',
  borderRadius: '4px',
  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
}

// 单行骨架条
export function SkeletonLine({ width = '100%', height = '14px' }: { width?: string; height?: string }) {
  return <div style={{ ...skel, width, height }} />
}

// 多行文本骨架
export function SkeletonText({ lines = 3, gap = '8px' }: { lines?: number; gap?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  )
}

// 卡片网格骨架（干员/敌人/关卡列表）
export function SkeletonCardGrid({ count = 12, columns = 'repeat(auto-fill, minmax(200px, 1fr))' }: {
  count?: number; columns?: string
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: columns }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: '6px', padding: '12px',
        }}>
          <div style={{ ...skel, width: '60px', height: '10px' }} />
          <div style={{ ...skel, width: '80%', height: '16px', marginTop: '10px' }} />
          <div style={{ ...skel, width: '50%', height: '12px', marginTop: '6px' }} />
        </div>
      ))}
    </div>
  )
}

// 详情页骨架
export function SkeletonDetail() {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      borderRadius: '8px', padding: '24px',
    }}>
      <div style={{ ...skel, width: '40px', height: '10px' }} />
      <div style={{ ...skel, width: '200px', height: '28px', marginTop: '10px' }} />
      <div style={{ ...skel, width: '150px', height: '14px', marginTop: '8px' }} />
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ ...skel, width: '60px', height: '24px' }} />
        ))}
      </div>
      <div style={{ ...skel, width: '100%', height: '1px', marginTop: '20px', opacity: 0.2, animation: 'none' }} />
      <SkeletonText lines={5} />
    </div>
  )
}

// 区块骨架（带标题）
export function SkeletonSection({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      borderRadius: '8px', padding: '24px',
    }}>
      <div style={{ ...skel, width: '120px', height: '18px' }} />
      <div style={{ marginTop: '16px' }}>
        <SkeletonText lines={rows} />
      </div>
    </div>
  )
}

// 周日程骨架
export function SkeletonWeekGrid() {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} style={{
          padding: '12px', borderRadius: '6px',
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        }}>
          <div style={{ ...skel, width: '40px', height: '14px' }} />
          <div style={{ ...skel, width: '100%', height: '10px', marginTop: '8px' }} />
          <div style={{ ...skel, width: '70%', height: '10px', marginTop: '4px' }} />
        </div>
      ))}
    </div>
  )
}
