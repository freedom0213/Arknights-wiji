// 全局搜索下拉组件 - 位于 header 右上角
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchAll } from '../api/client'
import type { SearchAllResponse, SearchResultOperator, SearchResultEnemy, SearchResultStage } from '../api/client'
import { useDebounce } from '../hooks/useDebounce'

const RARITY_STARS: Record<string, number> = {
  TIER_6: 6, TIER_5: 5, TIER_4: 4, TIER_3: 3, TIER_2: 2, TIER_1: 1,
}

export default function SearchDropdown() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchAllResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)        // 键盘导航索引
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const debouncedQuery = useDebounce(query, 300)

  // 搜索请求
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null)
      setOpen(false)
      return
    }
    setLoading(true)
    searchAll(debouncedQuery.trim())
      .then(data => {
        const hasResults = data.operators.length > 0 || data.enemies.length > 0 || data.stages.length > 0
        setResults(data)
        setOpen(hasResults)
        setActiveIdx(-1)
        setLoading(false)
      })
      .catch(() => {
        setResults(null)
        setOpen(false)
        setLoading(false)
      })
  }, [debouncedQuery])

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // 构建扁平化导航列表
  const buildNavList = useCallback(() => {
    if (!results) return []
    const list: { type: string; id: string; label: string; sub?: string }[] = []
    results.operators.forEach(o => list.push({ type: 'operator', id: o.id, label: o.name, sub: `${RARITY_STARS[o.rarity] || '?'}★` }))
    results.enemies.forEach(e => list.push({ type: 'enemy', id: e.id, label: e.name, sub: e.enemyLevel }))
    results.stages.forEach(s => list.push({ type: 'stage', id: s.id, label: s.code ? `${s.code} ${s.name}` : s.name }))
    return list.slice(0, 15)
  }, [results])

  const navList = buildNavList()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || navList.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(prev => (prev < navList.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(prev => (prev > 0 ? prev - 1 : navList.length - 1))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      const item = navList[activeIdx]
      navigateTo(item.type, item.id)
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const navigateTo = (type: string, id: string) => {
    setOpen(false)
    setQuery('')
    if (type === 'operator') navigate(`/operators/${encodeURIComponent(id)}`)
    else if (type === 'enemy') navigate(`/enemies/${encodeURIComponent(id)}`)
    else if (type === 'stage') {
      // 关卡没有详情页，跳转到关卡日程页
      navigate('/stages')
    }
  }

  // 分组统计
  const opCount = results?.operators.length || 0
  const enCount = results?.enemies.length || 0
  const stCount = results?.stages.length || 0

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '240px' }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(false) }}
        onFocus={() => { if (results) setOpen(true) }}
        onKeyDown={handleKeyDown}
        placeholder="搜索全站…"
        style={{
          width: '100%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          outline: 'none',
        }}
      />

      {/* 下拉结果 */}
      {open && results && (
        <div style={{
          position: 'absolute', top: '100%', right: 0,
          marginTop: '4px', width: '360px', maxHeight: '420px',
          overflow: 'auto',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 100,
        }}>
          {/* 干员 */}
          {opCount > 0 && (
            <div>
              <div style={{ padding: '8px 14px 4px', fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>
                干员 ({opCount})
              </div>
              {results.operators.map((o, i) => renderOperator(o, i, activeIdx, navigateTo))}
            </div>
          )}
          {/* 敌人 */}
          {enCount > 0 && (
            <div>
              <div style={{ padding: '8px 14px 4px', fontSize: '11px', color: 'var(--danger)', fontWeight: 600 }}>
                敌人 ({enCount})
              </div>
              {results.enemies.map((e, i) => renderEnemy(e, i + opCount, activeIdx, navigateTo))}
            </div>
          )}
          {/* 关卡 */}
          {stCount > 0 && (
            <div>
              <div style={{ padding: '8px 14px 4px', fontSize: '11px', color: 'var(--accent-gold)', fontWeight: 600 }}>
                关卡 ({stCount})
              </div>
              {results.stages.map((s, i) => renderStage(s, i + opCount + enCount, activeIdx, navigateTo))}
            </div>
          )}
          {/* 无结果 */}
          {opCount === 0 && enCount === 0 && stCount === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              未找到匹配 "{debouncedQuery}" 的结果
            </div>
          )}
        </div>
      )}

      {/* 加载指示器 */}
      {loading && (
        <div style={{
          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
          width: '14px', height: '14px',
          border: '2px solid var(--border-color)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'skeleton-pulse 0.8s linear infinite',
        }} />
      )}
    </div>
  )
}

// 下拉项通用样式
function itemStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '6px 14px', cursor: 'pointer', fontSize: '13px',
    background: active ? 'var(--bg-secondary)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-primary)',
    transition: 'background 0.1s',
  }
}

function renderOperator(op: SearchResultOperator, idx: number, activeIdx: number, nav: Function) {
  return (
    <div key={`op-${op.id}`} style={itemStyle(activeIdx === idx)}
      onClick={() => nav('operator', op.id)}
      onMouseEnter={() => { /* handled by CSS :hover */ }}>
      <span>{op.name}</span>
      <span style={{ color: '#f0c060', fontSize: '11px' }}>{'★'.repeat(RARITY_STARS[op.rarity] || 1)}</span>
    </div>
  )
}

function renderEnemy(en: SearchResultEnemy, idx: number, activeIdx: number, nav: Function) {
  const levelColor = en.enemyLevel === 'BOSS' ? 'var(--danger)' :
    en.enemyLevel === 'ELITE' ? 'var(--accent-gold)' : 'var(--text-secondary)'
  return (
    <div key={`en-${en.id}`} style={itemStyle(activeIdx === idx)}
      onClick={() => nav('enemy', en.id)}>
      <span>{en.name}</span>
      <span style={{ color: levelColor, fontSize: '11px' }}>
        {en.enemyLevel === 'BOSS' ? 'Boss' : en.enemyLevel === 'ELITE' ? '精英' : '普通'}
      </span>
    </div>
  )
}

function renderStage(st: SearchResultStage, idx: number, activeIdx: number, nav: Function) {
  return (
    <div key={`st-${st.id}`} style={itemStyle(activeIdx === idx)}
      onClick={() => nav('stage', st.id)}>
      <span>{st.code ? `${st.code} ${st.name}` : st.name}</span>
      {st.apCost != null && (
        <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>理智 {st.apCost}</span>
      )}
    </div>
  )
}
