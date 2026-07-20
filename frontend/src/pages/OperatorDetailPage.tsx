import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchOperator, fetchOperatorMaterials } from '../api/client'

const PROF_MAP: Record<string, string> = {
  WARRIOR: '近卫', SNIPER: '狙击', MEDIC: '医疗', TANK: '重装',
  SUPPORT: '辅助', CASTER: '术师', SPECIAL: '特种', PIONEER: '先锋',
}
const RARITY_STARS: Record<string, number> = {
  TIER_6: 6, TIER_5: 5, TIER_4: 4, TIER_3: 3, TIER_2: 2, TIER_1: 1,
}

export default function OperatorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: op, isLoading } = useQuery({
    queryKey: ['operator', id],
    queryFn: () => fetchOperator(id!),
    enabled: !!id,
  })
  const { data: materials } = useQuery({
    queryKey: ['operator-materials', id],
    queryFn: () => fetchOperatorMaterials(id!),
    enabled: !!id,
  })

  if (isLoading) return <p style={{ color: 'var(--text-secondary)' }}>加载中...</p>
  if (!op) return <p style={{ color: 'var(--danger)' }}>干员不存在</p>

  const stars = RARITY_STARS[op.rarity] || 1
  const phases = tryParse(op.phases)
  const talents = tryParse(op.talents)
  const skills = tryParse(op.skills)
  const trait = tryParseTrait(op.trait)

  return (
    <div>
      <Link to="/operators" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>← 返回干员列表</Link>

      {/* 基本信息卡片 */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: '8px', padding: '24px', marginTop: '16px',
      }}>
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div>
            <div style={{ color: '#f0c060', fontSize: '14px', marginBottom: '4px' }}>
              {'★'.repeat(stars)}
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {op.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              {op.appellation} · {op.displayNumber}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Tag label={PROF_MAP[op.profession] || op.profession} />
              <Tag label={op.subProfessionId} />
              <Tag label={op.position === 'MELEE' ? '近战位' : '远程位'} />
            </div>
          </div>
        </div>

        {/* 特性 */}
        {trait && (
          <div className="mt-4">
            <SectionTitle title="特性" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{trait}</p>
          </div>
        )}

        {/* 描述 */}
        {op.itemUsage && (
          <div className="mt-3">
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{op.itemUsage}</p>
          </div>
        )}
      </div>

      {/* 属性面板（取最高精英化阶段数据） */}
      {phases && phases.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: '8px', padding: '24px', marginTop: '16px',
        }}>
          <SectionTitle title="基础属性" />
          {(() => {
            const lastPhase = phases[phases.length - 1]
            const attrs = lastPhase?.attributesKeyFrames
            if (!attrs || attrs.length === 0) return <p style={{ color: 'var(--text-secondary)' }}>无属性数据</p>
            const maxAttrs = attrs[attrs.length - 1]?.data || attrs[0]?.data
            if (!maxAttrs) return <p style={{ color: 'var(--text-secondary)' }}>无属性数据</p>
            return (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                <StatBox label="生命上限" value={maxAttrs.maxHp} />
                <StatBox label="攻击" value={maxAttrs.atk} />
                <StatBox label="防御" value={maxAttrs.def} />
                <StatBox label="法术抗性" value={maxAttrs.magicResistance} />
                <StatBox label="部署费用" value={maxAttrs.cost} />
                <StatBox label="阻挡数" value={maxAttrs.blockCnt} />
                <StatBox label="攻击速度" value={maxAttrs.baseAttackTime} suffix="s" />
                <StatBox label="再部署" value={maxAttrs.respawnTime} suffix="s" />
              </div>
            )
          })()}
        </div>
      )}

      {/* 天赋 */}
      {talents && talents.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: '8px', padding: '24px', marginTop: '16px',
        }}>
          <SectionTitle title="天赋" />
          {talents.map((t: any, i: number) => {
            const candidate = t?.candidates?.[0] || t
            return (
              <div key={i} className="mb-2">
                <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '14px' }}>
                  {candidate?.name || `天赋 ${i + 1}`}
                </span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {candidate?.description || '无描述'}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* 技能 */}
      {skills && skills.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: '8px', padding: '24px', marginTop: '16px',
        }}>
          <SectionTitle title={`技能 (${skills.length})`} />
          {skills.map((s: any, i: number) => (
            <div key={i} className="mb-3" style={{ paddingBottom: '12px', borderBottom: i < skills.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px' }}>
                技能 {i + 1}: {s?.skillId || '未知'}
              </span>
              {s?.unlockCond && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  解锁: 精英化 {s.unlockCond.phase} Lv.{s.unlockCond.level}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 小工具组件
function SectionTitle({ title }: { title: string }) {
  return (
    <div className="divider-diamond" style={{ marginBottom: '12px' }}>
      <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, whiteSpace: 'nowrap' }}>{title}</h3>
    </div>
  )
}

function Tag({ label }: { label: string }) {
  if (!label) return null
  return (
    <span style={{
      background: 'rgba(78, 201, 240, 0.1)', color: 'var(--accent)',
      border: '1px solid rgba(78, 201, 240, 0.3)', borderRadius: '4px',
      padding: '2px 10px', fontSize: '12px',
    }}>{label}</span>
  )
}

function StatBox({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{label}</div>
      <div style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700 }}>
        {value ?? '-'}{suffix || ''}
      </div>
    </div>
  )
}

// JSON 解析辅助
function tryParse(raw: any): any {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

function tryParseTrait(raw: any): string | null {
  const data = tryParse(raw)
  if (!data) return null
  const candidates = data?.candidates
  if (candidates && candidates.length > 0) {
    return candidates[candidates.length - 1]?.blackboard?.[0]?.valueStr ||
           candidates[candidates.length - 1]?.additionalDescription ||
           null
  }
  return null
}
