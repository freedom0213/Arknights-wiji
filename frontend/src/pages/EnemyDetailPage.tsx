import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchEnemy } from '../api/client'

export default function EnemyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: enemy, isLoading } = useQuery({
    queryKey: ['enemy', id],
    queryFn: () => fetchEnemy(id!),
    enabled: !!id,
  })

  if (isLoading) return <p style={{ color: 'var(--text-secondary)' }}>加载中...</p>
  if (!enemy) return <p style={{ color: 'var(--danger)' }}>敌人不存在</p>

  const abilityList = tryParse(enemy.abilityList)

  return (
    <div>
      <Link to="/enemies" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>← 返回敌人列表</Link>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: '8px', padding: '24px', marginTop: '16px',
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {enemy.name}
        </h1>
        <div className="flex flex-wrap gap-2 mt-3">
          <Tag label={enemy.enemyLevel === 'BOSS' ? 'Boss' : enemy.enemyLevel === 'ELITE' ? '精英' : '普通'}
            color={enemy.enemyLevel === 'BOSS' ? 'var(--danger)' :
                   enemy.enemyLevel === 'ELITE' ? 'var(--accent-gold)' : 'var(--text-secondary)'} />
          {enemy.attackType && <Tag label={enemy.attackType} color="var(--accent)" />}
          {enemy.damageType && <Tag label={`伤害: ${enemy.damageType}`} color="var(--accent)" />}
          {enemy.enemyTags && enemy.enemyTags.split(',').map((t: string) =>
            <Tag key={t} label={t.trim()} color="var(--text-secondary)" />)}
        </div>

        {/* 描述 */}
        {enemy.description && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '16px', lineHeight: 1.6 }}>
            {enemy.description}
          </p>
        )}

        {/* 能力 */}
        {enemy.ability && (
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              特殊能力
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
              {enemy.ability}
            </p>
          </div>
        )}

        {/* 详细能力列表 */}
        {abilityList && Array.isArray(abilityList) && abilityList.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              能力详情
            </h3>
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

        {/* 关联敌人 */}
        {enemy.linkEnemies && (() => {
          const links = tryParse(enemy.linkEnemies)
          if (links && Array.isArray(links) && links.length > 0) {
            return (
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
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
      </div>
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
