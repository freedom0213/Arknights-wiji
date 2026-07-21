// 通用 UI 状态组件：错误重试 + 空结果

interface RetryProps {
  message?: string
  onRetry?: () => void
}

// 错误状态：显示错误信息 + 重试按钮
export function ErrorState({ message = '加载失败，请稍后重试', onRetry }: RetryProps) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>⚠</div>
      <p style={{ color: 'var(--danger)', fontSize: '15px', marginBottom: '6px' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '12px', padding: '8px 24px',
            background: 'var(--accent)', color: '#000',
            border: 'none', borderRadius: '6px', cursor: 'pointer',
            fontSize: '14px', fontWeight: 500,
          }}
        >
          重新加载
        </button>
      )}
    </div>
  )
}

// 空状态：无数据
export function EmptyState({ message = '暂无数据' }: { message?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.3 }}>◈</div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{message}</p>
    </div>
  )
}
