import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchEnemy, fetchEnemyStageStats } from '../api/client'
import { SkeletonDetail } from '../components/Skeleton'
import { ErrorState } from '../components/StateView'

// 敌人属性 key 中文映射
const ATTR_LABELS: Record<string, string> = {
  maxHp: '生命上限', atk: '攻击力', def: '防御力',
  magicResistance: '法术抗性', moveSpeed: '移动速度',
  baseAttackTime: '攻击间隔', attackSpeed: '攻击速度',
  massLevel: '重量等级', hpRecoveryPerSec: '每秒回血',
  cost: '费用', blockCnt: '阻挡数', respawnTime: '再部署时间',
  rangeRadius: '攻击范围', epDamageResistance: '元素抗性',
}

// 属性显示顺序
const ATTR_ORDER = [
  'maxHp', 'atk', 'def', 'magicResistance',
  'baseAttackTime', 'moveSpeed', 'massLevel',
  'hpRecoveryPerSec', 'blockCnt', 'attackSpeed', 'epDamageResistance',
]

// 属性值格式化
function formatAttrValue(key: string, value: any): string {
  if (value == null) return '-'
  const num = Number(value)
  if (isNaN(num)) return String(value)
  if (key === 'baseAttackTime' || key === 'moveSpeed') return num.toFixed(1)
  if (key === 'magicResistance' || key === 'epDamageResistance') return `${num}%`
  if (Number.isInteger(num)) return String(Math.floor(num))
  return String(num)
}

export default function EnemyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeLevel, setActiveLevel] = useState(0)
  const [lightbox, setLightbox] = useState(false)  // 立绘放大查看

  const { data: enemy, isLoading, isError, refetch } = useQuery({
    queryKey: ['enemy', id],
    queryFn: () => fetchEnemy(id!),
    enabled: !!id,
  })

  const { data: stats } = useQuery({
    queryKey: ['enemy-stats', id],
    queryFn: () => fetchEnemyStageStats(id!),
    enabled: !!id,
  })

  // 骨架屏
  if (isLoading) return (
    <div>
      <Link to="/enemies" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>← 返回敌人列表</Link>
      <div style={{ marginTop: '16px' }}><SkeletonDetail /></div>
    </div>
  )

  // 错误状态
  if (isError) return (
    <div>
      <Link to="/enemies" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>← 返回敌人列表</Link>
      <ErrorState message="加载敌人数据失败" onRetry={() => refetch()} />
    </div>
  )

  if (!enemy) return <p style={{ color: 'var(--danger)' }}>敌人不存在</p>

  const abilityList = tryParse(enemy.abilityList)
  const levels = stats?.levels || []
  const currentStats = levels[activeLevel]

  return (
    <div>
      <Link to="/enemies" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>← 返回敌人列表</Link>

      {/* 基本信息 + 图片 合并卡片 */}
      <div style={{
        background: 'rgba(35, 39, 70, 0.38)',
        backdropFilter: 'blur(14px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.3)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px', padding: '16px', marginTop: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        display: 'flex', gap: '20px', alignItems: 'flex-start',
      }}>
        {/* 左侧：基本信息 */}
        <div style={{ flex: 1, minWidth: 0, overflowWrap: 'break-word' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {enemy.name}
          </h1>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <Tag label={enemy.enemyLevel === 'BOSS' ? 'Boss' : enemy.enemyLevel === 'ELITE' ? '精英' : '普通'}
              color={enemy.enemyLevel === 'BOSS' ? 'var(--danger)' :
                     enemy.enemyLevel === 'ELITE' ? 'var(--accent-gold)' : 'var(--text-secondary)'} />
            {enemy.attackType && <Tag label={`攻击方式: ${enemy.attackType}`} color="var(--accent)" />}
            {enemy.damageType && <Tag label={`伤害类型: ${enemy.damageType}`} color="var(--accent)" />}
            {enemy.enemyTags && enemy.enemyTags.split(',').map((t: string) =>
              <Tag key={t} label={t.trim()} color="var(--text-secondary)" />)}
          </div>

          {enemy.description && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
              {enemy.description}
            </p>
          )}
        </div>

        {/* 右侧：敌人图片（正方形，hover放大） */}
        <div style={{
          width: '220px', aspectRatio: '1/1', flexShrink: 0,
          borderRadius: '6px', overflow: 'hidden',
          background: 'rgba(20, 22, 40, 0.5)',
          border: '1px solid rgba(255,255,255,0.06)',
          position: 'relative',
          cursor: enemy.imageUrl ? 'pointer' : 'default',
        }} onClick={() => { if (enemy.imageUrl) setLightbox(true) }}>
          {enemy.imageUrl ? (
            <img src={enemy.imageUrl} alt={enemy.name}
              className="enemy-img"
              style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', fontSize: '12px' }}>
              暂无图片
            </div>
          )}
          {/* hover 放大图标提示 */}
          {enemy.imageUrl && (
            <div className="illust-hover-zone" style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'all 0.2s',
            }}>
              <span style={{
                color: '#fff', fontSize: '28px',
                textShadow: '0 0 12px rgba(0,0,0,0.6)',
                opacity: 0, transform: 'scale(0.8)', transition: 'all 0.2s',
              }}>⊕</span>
            </div>
          )}
        </div>
      </div>

      {/* 属性面板 */}
      {levels.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: '8px', padding: '24px', marginTop: '16px',
        }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            基础属性 {currentStats?.name ? `— ${currentStats.name}` : ''}
          </h3>

          {/* 等级切换 */}
          {levels.length > 1 && (
            <div className="flex gap-2" style={{ marginBottom: '16px' }}>
              {levels.map((lvl: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveLevel(i)}
                  style={{
                    padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border-color)',
                    background: activeLevel === i ? 'var(--accent)' : 'transparent',
                    color: activeLevel === i ? '#000' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '13px', fontWeight: activeLevel === i ? 600 : 400,
                  }}
                >
                  {lvl.name || `Lv.${lvl.level ?? i}`}
                </button>
              ))}
            </div>
          )}

          {/* 属性网格 */}
          {currentStats?.attributes && (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
              {ATTR_ORDER.filter(k => currentStats.attributes[k] != null).map(key => (
                <div key={key} style={{
                  background: 'var(--bg-secondary)', borderRadius: '6px', padding: '12px', textAlign: 'center',
                }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                    {ATTR_LABELS[key] || key}
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700 }}>
                    {formatAttrValue(key, currentStats.attributes[key])}
                  </div>
                </div>
              ))}
              {/* 其他未在顺序列表中的属性 */}
              {Object.entries(currentStats.attributes as Record<string, any>)
                .filter(([k, v]) => !ATTR_ORDER.includes(k) && v != null)
                .map(([key, value]) => (
                  <div key={key} style={{
                    background: 'var(--bg-secondary)', borderRadius: '6px', padding: '12px', textAlign: 'center',
                  }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                      {ATTR_LABELS[key] || key}
                    </div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700 }}>
                      {formatAttrValue(key, value)}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 特殊能力 */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: '8px', padding: '24px', marginTop: '16px',
      }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
          特殊能力
        </h3>
        {enemy.ability ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
            {enemy.ability}
          </p>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>无特殊能力</p>
        )}

        {abilityList && Array.isArray(abilityList) && abilityList.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              能力详情
            </h4>
            {abilityList.map((a: any, i: number) => (
              <div key={i} style={{
                background: 'var(--bg-secondary)', borderRadius: '4px',
                padding: '8px 12px', marginBottom: '4px',
              }}>
                <span style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: 600 }}>
                  {a.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 关联敌人 */}
      {enemy.linkEnemies && (() => {
        const links = tryParse(enemy.linkEnemies)
        if (links && Array.isArray(links) && links.length > 0) {
          return (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '8px', padding: '24px', marginTop: '16px',
            }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                关联敌人
              </h3>
              <div className="flex flex-wrap gap-2">
                {links.map((l: string) => <Tag key={l} label={l} color="var(--text-secondary)" />)}
              </div>
            </div>
          )
        }
        return null
      })()}

      {/* 图片放大 lightbox */}
      {lightbox && enemy.imageUrl && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'zoom-out',
        }} onClick={() => setLightbox(false)}>
          <img src={enemy.imageUrl} alt={enemy.name}
            className="enemy-img"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
          <button onClick={() => setLightbox(false)} style={{
            position: 'absolute', top: '16px', right: '24px',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', fontSize: '22px', width: '36px', height: '36px',
            borderRadius: '50%', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
      )}
    </div>
  )
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      color, border: `1px solid ${color}33`,
      background: `${color}11`, borderRadius: '4px',
      padding: '2px 10px', fontSize: '12px',
    }}>{label}</span>
  )
}

function tryParse(raw: any): any {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}
