// 通用分页组件 - 省略号 + 跳页
import { useState } from 'react'

interface PaginationProps {
  current: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}

export default function Pagination({ current, total, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  const [jumpInput, setJumpInput] = useState('')

  if (totalPages <= 1) return null

  // 生成页码数组：首两页 + 省略号 + 末两页
  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1, 2)
    if (current > 4) pages.push('...')
    // 当前页附近的页码
    const start = Math.max(3, current - 1)
    const end = Math.min(totalPages - 2, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < totalPages - 3) pages.push('...')
    pages.push(totalPages - 1, totalPages)
    // 去重
    const seen = new Set<number>()
    const deduped: (number | '...')[] = []
    for (const p of pages) {
      if (p === '...') {
        if (deduped.length > 0 && deduped[deduped.length - 1] !== '...') deduped.push('...')
      } else if (!seen.has(p)) {
        seen.add(p)
        deduped.push(p)
      }
    }
    pages.length = 0
    pages.push(...deduped)
  }

  const handleJump = () => {
    const p = parseInt(jumpInput, 10)
    if (p >= 1 && p <= totalPages) {
      onChange(p)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setJumpInput('')
    }
  }

  const btnBase: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'background 0.15s',
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
      {/* 上一页 */}
      <button
        onClick={() => { onChange(current - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        disabled={current <= 1}
        style={{ ...btnBase, opacity: current <= 1 ? 0.4 : 1 }}
      >
        ‹
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} style={{ color: 'var(--text-secondary)', padding: '6px 4px', fontSize: '13px' }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => { onChange(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            style={{
              ...btnBase,
              background: p === current ? 'var(--accent)' : 'var(--bg-card)',
              color: p === current ? '#000' : 'var(--text-secondary)',
              fontWeight: p === current ? 600 : 400,
            }}
          >
            {p}
          </button>
        )
      )}

      {/* 下一页 */}
      <button
        onClick={() => { onChange(current + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        disabled={current >= totalPages}
        style={{ ...btnBase, opacity: current >= totalPages ? 0.4 : 1 }}
      >
        ›
      </button>

      {/* 跳页 */}
      <span style={{ color: 'var(--text-secondary)', fontSize: '12px', marginLeft: '8px' }}>跳至</span>
      <input
        type="text"
        value={jumpInput}
        onChange={e => setJumpInput(e.target.value.replace(/\D/g, ''))}
        onKeyDown={e => { if (e.key === 'Enter') handleJump() }}
        placeholder={`${totalPages}`}
        style={{
          width: '44px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          padding: '5px 8px',
          borderRadius: '4px',
          fontSize: '13px',
          textAlign: 'center',
          outline: 'none',
        }}
      />
      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>页</span>
      <button onClick={handleJump} style={btnBase}>GO</button>
    </div>
  )
}
