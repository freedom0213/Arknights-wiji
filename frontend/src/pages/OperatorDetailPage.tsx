import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueries } from '@tanstack/react-query'
import { fetchOperator, fetchSkill, type SkillData } from '../api/client'

// 职业 & 稀有度映射
const PROF_MAP: Record<string, string> = {
  WARRIOR: '近卫', SNIPER: '狙击', MEDIC: '医疗', TANK: '重装',
  SUPPORT: '辅助', CASTER: '术师', SPECIAL: '特种', PIONEER: '先锋',
}
const RARITY_STARS: Record<string, number> = {
  TIER_6: 6, TIER_5: 5, TIER_4: 4, TIER_3: 3, TIER_2: 2, TIER_1: 1,
}
// 阵营中文名
const NATION_MAP: Record<string, string> = {
  rhodes: '罗德岛', yan: '炎', kjerag: '谢拉格', ursus: '乌萨斯',
  victoria: '维多利亚', siracusa: '叙拉古', laterano: '拉特兰',
  kazimierz: '卡西米尔', leithanien: '莱塔尼亚', sargon: '萨尔贡',
  bolivar: '玻利瓦尔', columbia: '哥伦比亚', siesta: '汐斯塔',
  rim: '雷姆必拓', minos: '米诺斯', higashi: '东', sami: '萨米',
  ib: '伊比利亚', egir: '阿戈尔', lungmen: '龙门',
  kazdel: '卡兹戴尔', dublinn: '深池', rhine: '莱茵生命',
  penguin: '企鹅物流', blacksteel: '黑钢', abyssal: '深海猎人',
}
// 技能类型
const SKILL_TYPE: Record<string, string> = {
  MANUAL: '手动触发', AUTO: '自动触发', PASSIVE: '被动',
}
const SP_TYPE: Record<string, string> = {
  INCREASE_WITH_TIME: '自动回复', INCREASE_WHEN_ATTACK: '攻击回复',
  INCREASE_WHEN_TAKEN_DAMAGE: '受击回复',
}
// 属性名中文
const STAT_LABELS: Record<string, string> = {
  maxHp: '生命上限', atk: '攻击', def: '防御', magicResistance: '法术抗性',
  cost: '部署费用', blockCnt: '阻挡数', baseAttackTime: '攻击间隔',
  respawnTime: '再部署时间',
}

export default function OperatorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [statPhase, setStatPhase] = useState(0) // 属性面板当前选中的精英阶段

  // 干员数据
  const { data: op, isLoading, isError } = useQuery({
    queryKey: ['operator', id],
    queryFn: () => fetchOperator(id!),
    enabled: !!id,
  })

  // 解析 JSON 字段
  const phases = tryParse(op?.phases)
  const talents = tryParse(op?.talents)
  const parsedSkills = tryParse(op?.skills)
  const potentialRanks = tryParse(op?.potentialRanks)
  const favorFrames = tryParse(op?.favorKeyFrames)
  const allSkillLvlup = tryParse(op?.allSkillLvlup)
  const tagList: string[] = tryParse(op?.tagList) || []
  const trait = tryParseTrait(op?.trait)

  // 并行获取所有技能详情（名称、SP消耗、描述等）
  const skillQueries = useQueries({
    queries: (parsedSkills || []).map((s: any) => ({
      queryKey: ['skill', s.skillId],
      queryFn: () => fetchSkill(s.skillId),
      enabled: !!id && !!s?.skillId,
    })),
  })

  // 加载 / 错误状态
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div className="loading-spinner" />
        <span style={{ color: 'var(--text-secondary)', marginLeft: '12px' }}>加载干员数据...</span>
      </div>
    )
  }
  if (isError || !op) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--danger)', fontSize: '18px' }}>加载失败</p>
        <Link to="/operators" style={{ color: 'var(--accent)', fontSize: '14px' }}>← 返回干员列表</Link>
      </div>
    )
  }

  const stars = RARITY_STARS[op.rarity] || 1
  const nationName = NATION_MAP[op.nationId?.toLowerCase()] || op.nationId

  return (
    <div>
      <Link to="/operators" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
        ← 返回干员列表
      </Link>

      {/* ========== 基本信息卡片 ========== */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', marginTop: '16px' }}>
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div>
            <div style={{ color: '#f0c060', fontSize: '14px', marginBottom: '4px' }}>
              {'★'.repeat(stars)}
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {op.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              {op.appellation} {op.displayNumber ? `· ${op.displayNumber}` : ''}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Tag label={PROF_MAP[op.profession] || op.profession} color="var(--accent)" />
              <Tag label={op.subProfessionId || '-'} color="var(--text-secondary)" />
              <Tag label={op.position === 'MELEE' ? '近战位' : '远程位'} color="#a0d080" />
              {nationName && <Tag label={nationName} color="#d0a0f0" />}
              {tagList.map((t: string) => (
                <Tag key={t} label={t} color="#f0c060" />
              ))}
            </div>
          </div>
        </div>

        {/* 特性 */}
        {trait && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '13px' }}>特性：</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{trait}</span>
          </div>
        )}

        {/* 描述 */}
        {op.itemUsage && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '12px', lineHeight: 1.6 }}>
            {op.itemUsage}
          </p>
        )}
      </div>

      {/* ========== 属性面板（按精英阶段切换） ========== */}
      {phases && phases.length > 0 && (
        <Section title="基础属性">
          {/* 阶段切换标签 */}
          <div className="flex gap-2" style={{ marginBottom: '16px' }}>
            {phases.map((p: any, i: number) => (
              <button
                key={i}
                onClick={() => setStatPhase(i)}
                style={{
                  padding: '6px 16px', borderRadius: '6px', border: '1px solid var(--border-color)',
                  background: statPhase === i ? 'var(--accent)' : 'transparent',
                  color: statPhase === i ? '#000' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '13px', fontWeight: statPhase === i ? 600 : 400,
                }}
              >
                {i === 0 ? '精英0' : `精英${i}`} Lv.{p?.maxLevel || '?'}
              </button>
            ))}
          </div>

          {/* 当前阶段属性 */}
          {(() => {
            const phase = phases[statPhase]
            const attrs = phase?.attributesKeyFrames
            if (!attrs || attrs.length === 0) return <p style={{ color: 'var(--text-secondary)' }}>无属性数据</p>
            const maxAttrs = attrs[attrs.length - 1]?.data || attrs[0]?.data
            if (!maxAttrs) return <p style={{ color: 'var(--text-secondary)' }}>无属性数据</p>
            return (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
                {Object.entries(STAT_LABELS).map(([key, label]) => {
                  const val = (maxAttrs as any)[key]
                  if (val === undefined || val === null) return null
                  return <StatBox key={key} label={label} value={val} suffix={key === 'baseAttackTime' || key === 'respawnTime' ? 's' : ''} />
                })}
              </div>
            )
          })()}
        </Section>
      )}

      {/* ========== 信赖加成 ========== */}
      {favorFrames && favorFrames.length > 1 && (
        <Section title="信赖加成">
          <FavorTable frames={favorFrames} />
        </Section>
      )}

      {/* ========== 天赋 ========== */}
      {talents && talents.length > 0 && (
        <Section title={`天赋 (${talents.length})`}>
          {talents.map((t: any, i: number) => (
            <TalentCard key={i} talent={t} index={i} />
          ))}
        </Section>
      )}

      {/* ========== 潜能 ========== */}
      {potentialRanks && potentialRanks.length > 0 && (
        <Section title={`潜能 (${potentialRanks.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {potentialRanks.map((pr: any, i: number) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                background: 'var(--bg-secondary)', borderRadius: '6px',
              }}>
                <span style={{
                  color: 'var(--accent)', fontWeight: 700, fontSize: '14px', minWidth: '48px',
                }}>
                  潜 {i + 1}
                </span>
                <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                  {pr?.description || '无描述'}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px', marginLeft: 'auto' }}>
                  {pr?.type === 'BUFF' ? '增益' : pr?.type || ''}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ========== 技能 ========== */}
      {parsedSkills && parsedSkills.length > 0 && (
        <Section title={`技能 (${parsedSkills.length})`}>
          {parsedSkills.map((s: any, i: number) => {
            const skillData = skillQueries[i]?.data as SkillData | undefined
            const maxLevel = skillData?.levels?.[skillData.levels.length - 1]
            return (
              <SkillCard
                key={i}
                index={i}
                skillRef={s}
                maxLevel={maxLevel}
                isLoading={skillQueries[i]?.isLoading}
              />
            )
          })}
        </Section>
      )}

      {/* ========== 技能升级材料 ========== */}
      {allSkillLvlup && allSkillLvlup.length > 0 && (
        <Section title={`技能升级 (Lv.1 → Lv.${allSkillLvlup.length + 1})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {allSkillLvlup.map((entry: any, i: number) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px',
                background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '13px',
              }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600, minWidth: '60px' }}>
                  Lv.{i + 1}→{i + 2}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {entry?.lvlUpCost?.map((m: any) => `[${m.id}] x${m.count}`).join(' + ') || '无材料'}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ========== 精英化材料 ========== */}
      {phases && phases.length > 1 && (
        <Section title="精英化条件">
          {phases.slice(1).map((p: any, i: number) => (
            <div key={i} style={{ marginBottom: i < phases.length - 2 ? '12px' : 0 }}>
              <h4 style={{ color: 'var(--accent-gold)', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                精英 {i + 1}
                {p?.evolveCost ? ` — 龙门币 x${p.evolveCost}` : ''}
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {p?.evolveCost && <MaterialChip id="4001" label="龙门币" count={p.evolveCost} />}
                {p?.levelUpCost?.map((m: any, j: number) => (
                  <MaterialChip key={j} id={m.id} label={`[${m.id}]`} count={m.count} />
                ))}
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  )
}

// ============================================================
// 子组件
// ============================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', marginTop: '16px' }}>
      <div className="divider-diamond" style={{ marginBottom: '16px' }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, whiteSpace: 'nowrap' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Tag({ label, color }: { label: string; color: string }) {
  if (!label) return null
  return (
    <span style={{ background: `${color}18`, color, border: `1px solid ${color}40`, borderRadius: '4px', padding: '2px 10px', fontSize: '12px' }}>
      {label}
    </span>
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

function MaterialChip({ label, count }: { id?: string; label: string; count: number }) {
  return (
    <span style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', color: 'var(--text-primary)' }}>
      {label} <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>x{count}</span>
    </span>
  )
}

function TalentCard({ talent, index }: { talent: any; index: number }) {
  const candidates = talent?.candidates || []
  if (candidates.length === 0) return null
  const main = candidates[candidates.length - 1] || candidates[0]

  return (
    <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '14px' }}>
          {main?.name || `天赋 ${index + 1}`}
        </span>
        {candidates.length > 1 && (
          <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
            ({candidates.length} 阶段)
          </span>
        )}
      </div>
      {/* 各阶段数值变化 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {candidates.map((c: any, j: number) => {
          const phase = c?.unlockCondition?.phase?.replace('PHASE_', '') || '0'
          const pot = c?.requiredPotentialRank ? ` 潜能${c.requiredPotentialRank}` : ''
          const blackboard = c?.blackboard
            ?.filter((b: any) => b.valueStr || b.value)
            ?.map((b: any) => `${b.key}: ${b.valueStr || (b.value * 100).toFixed(0) + '%'}`)
            ?.join(', ')
          return (
            <div key={j} style={{ fontSize: '13px', padding: '6px 12px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 500, marginRight: '8px' }}>
                精英{phase}{pot}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {c?.description || '无描述'}
              </span>
              {blackboard && (
                <div style={{ color: '#80d0a0', fontSize: '11px', marginTop: '2px' }}>
                  {blackboard}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SkillCard({ index, skillRef, maxLevel, isLoading }: {
  index: number; skillRef: any; maxLevel?: any; isLoading: boolean
}) {
  const unlockCond = skillRef?.unlockCond
  const levelUpCosts = skillRef?.levelUpCostCond || []

  return (
    <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
      {/* 技能标题 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '16px' }}>
          技能 {index + 1}: {isLoading ? '加载中...' : (maxLevel?.name || skillRef?.skillId || '未知')}
        </span>
        {maxLevel?.skillType && (
          <span style={{ color: 'var(--accent)', fontSize: '12px', padding: '2px 8px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
            {SKILL_TYPE[maxLevel.skillType] || maxLevel.skillType}
          </span>
        )}
      </div>

      {/* 解锁条件 */}
      {unlockCond && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
          解锁: 精英 {unlockCond.phase?.replace?.('PHASE_', '') || '0'} Lv.{unlockCond.level}
        </p>
      )}

      {/* SP 数据 */}
      {maxLevel?.spData && (
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            SP类型: <span style={{ color: 'var(--text-primary)' }}>{SP_TYPE[maxLevel.spData.spType] || maxLevel.spData.spType}</span>
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>
            消耗: <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{maxLevel.spData.spCost}</span>
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>
            初始: <span style={{ color: 'var(--accent-gold)' }}>{maxLevel.spData.initSp}</span>
          </span>
          {maxLevel.durationType !== 'NONE' && maxLevel.duration > 0 && (
            <span style={{ color: 'var(--text-secondary)' }}>
              持续: <span style={{ color: 'var(--text-primary)' }}>{maxLevel.duration}s</span>
            </span>
          )}
        </div>
      )}

      {/* 技能描述 */}
      {maxLevel?.description && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5, marginBottom: '8px' }}>
          {maxLevel.description.replace(/<[^>]+>/g, '')}
        </p>
      )}

      {/* 专精材料 */}
      {levelUpCosts.length > 0 && (
        <details style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--accent)', marginBottom: '4px' }}>
            专精材料 ({levelUpCosts.length} 级)
          </summary>
          {levelUpCosts.map((entry: any, j: number) => (
            <div key={j} style={{ padding: '4px 0', fontSize: '12px' }}>
              <span style={{ color: 'var(--accent-gold)' }}>专精 {j + 1}</span>
              {' — '}
              {entry?.levelUpCost?.map((m: any) => `[${m.id}] x${m.count}`).join(' + ') || '无'}
            </div>
          ))}
        </details>
      )}
    </div>
  )
}

function FavorTable({ frames }: { frames: any[] }) {
  // 取最高信赖的数据与0信赖对比
  const maxFrame = frames[frames.length - 1]
  if (!maxFrame?.data) return null
  const relevantKeys = ['maxHp', 'atk', 'def']
  const bonus = relevantKeys.filter((k) => (maxFrame.data as any)[k] > 0)
  if (bonus.length === 0) return <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>无信赖加成</p>

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
      {bonus.map((key) => (
        <StatBox key={key} label={STAT_LABELS[key] || key} value={(maxFrame.data as any)[key]} />
      ))}
    </div>
  )
}

// ============================================================
// JSON 解析辅助（数据来自后端，可能是字符串或已解析的对象）
// ============================================================
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
