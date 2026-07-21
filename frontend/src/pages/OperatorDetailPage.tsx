import { useState, Component } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueries } from '@tanstack/react-query'
import { fetchOperator, fetchSkill, type SkillData } from '../api/client'
import { SkeletonDetail, SkeletonSection } from '../components/Skeleton'
import { ErrorState } from '../components/StateView'

// React Error Boundary：捕获子组件渲染错误，防止整个页面黑屏
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <p style={{ color: 'var(--danger)', fontSize: '18px', marginBottom: '12px' }}>页面渲染出错</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
            {this.state.error?.message || '未知错误'}
          </p>
          <Link to="/operators" style={{ color: 'var(--accent)', fontSize: '14px' }}>返回干员列表</Link>
        </div>
      )
    }
    return this.props.children
  }
}

// 职业 & 稀有度映射
const PROF_MAP: Record<string, string> = {
  WARRIOR: '近卫', SNIPER: '狙击', MEDIC: '医疗', TANK: '重装',
  SUPPORT: '辅助', CASTER: '术师', SPECIAL: '特种', PIONEER: '先锋',
}
const RARITY_STARS: Record<string, number> = {
  TIER_6: 6, TIER_5: 5, TIER_4: 4, TIER_3: 3, TIER_2: 2, TIER_1: 1,
}
const NATION_MAP: Record<string, string> = {
  rhodes: '罗德岛', yan: '炎', kjerag: '谢拉格', ursus: '乌萨斯',
  victoria: '维多利亚', siracusa: '叙拉古', laterano: '拉特兰',
  kazimierz: '卡西米尔', leithanien: '莱塔尼亚', sargon: '萨尔贡',
  bolivar: '玻利瓦尔', columbia: '哥伦比亚',
  rim: '雷姆必拓', minos: '米诺斯', higashi: '东', sami: '萨米',
  ib: '伊比利亚', egir: '阿戈尔', lungmen: '龙门',
  kazdel: '卡兹戴尔', dublinn: '深池', rhine: '莱茵生命',
  penguin: '企鹅物流', blacksteel: '黑钢', abyssal: '深海猎人',
}
const SKILL_TYPE: Record<string, string> = {
  MANUAL: '手动触发', AUTO: '自动触发', PASSIVE: '被动',
}
const SP_TYPE: Record<string, string> = {
  INCREASE_WITH_TIME: '自动回复', INCREASE_WHEN_ATTACK: '攻击回复',
  INCREASE_WHEN_TAKEN_DAMAGE: '受击回复',
}
const STAT_LABELS: Record<string, string> = {
  maxHp: '生命上限', atk: '攻击', def: '防御', magicResistance: '法术抗性',
  cost: '部署费用', blockCnt: '阻挡数', baseAttackTime: '攻击间隔',
  respawnTime: '再部署时间',
}

// 安全工具：确保值为数组
function ensureArray(x: any): any[] {
  if (Array.isArray(x)) return x
  return []
}

// 安全工具：把材料数组渲染为字符串
function materialsStr(cost: any): string {
  const arr = ensureArray(cost)
  if (arr.length === 0) return '无'
  return arr.map((m: any) => `[${m?.id ?? '?'}] x${m?.count ?? 0}`).join(' + ')
}

export default function OperatorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [statPhase, setStatPhase] = useState(0)

  const { data: op, isLoading, isError } = useQuery({
    queryKey: ['operator', id],
    queryFn: () => fetchOperator(id!),
    enabled: !!id,
  })

  // 安全解析 JSON 字段
  const phases = ensureArray(tryParse(op?.phases))
  const talents = ensureArray(tryParse(op?.talents))
  const parsedSkills = ensureArray(tryParse(op?.skills))
  const potentialRanks = ensureArray(tryParse(op?.potentialRanks))
  const favorFrames = ensureArray(tryParse(op?.favorKeyFrames))
  const allSkillLvlup = ensureArray(tryParse(op?.allSkillLvlup))
  const tagList: string[] = ensureArray(tryParse(op?.tagList))
  const trait = tryParseTrait(op?.trait)

  const skillQueries = useQueries({
    queries: parsedSkills.map((s: any) => ({
      queryKey: ['skill', s?.skillId],
      queryFn: () => fetchSkill(s?.skillId),
      enabled: !!id && !!s?.skillId,
    })),
  })

  if (isLoading) {
    return (
      <div>
        <Link to="/operators" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>← 返回干员列表</Link>
        <div style={{ marginTop: '16px' }}>
          <SkeletonDetail />
          <div style={{ marginTop: '16px' }}><SkeletonSection rows={2} /></div>
          <div style={{ marginTop: '16px' }}><SkeletonSection rows={2} /></div>
        </div>
      </div>
    )
  }
  if (isError || !op) {
    return (
      <div>
        <Link to="/operators" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>← 返回干员列表</Link>
        <ErrorState message="加载干员数据失败" onRetry={() => window.location.reload()} />
      </div>
    )
  }

  const stars = RARITY_STARS[op.rarity] || 1
  const nationName = NATION_MAP[op.nationId?.toLowerCase()] || op.nationId

  return (
    <ErrorBoundary>
    <div>
      <Link to="/operators" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
        返回干员列表
      </Link>

      {/* 基本信息卡片 */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', marginTop: '16px' }}>
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div>
            <div style={{ color: '#f0c060', fontSize: '14px', marginBottom: '4px' }}>
              {'★'.repeat(stars)}
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{op.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              {op.appellation} {op.displayNumber ? `· ${op.displayNumber}` : ''}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Tag label={PROF_MAP[op.profession] || op.profession} color="var(--accent)" />
              <Tag label={op.subProfessionId || '-'} color="var(--text-secondary)" />
              <Tag label={op.position === 'MELEE' ? '近战位' : '远程位'} color="#a0d080" />
              {nationName && <Tag label={String(nationName)} color="#d0a0f0" />}
              {tagList.map((t: string) => (
                <Tag key={String(t)} label={String(t)} color="#f0c060" />
              ))}
            </div>
          </div>
        </div>

        {trait && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '13px' }}>特性：</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{trait}</span>
          </div>
        )}

        {op.itemUsage && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '12px', lineHeight: 1.6 }}>{op.itemUsage}</p>
        )}
      </div>

      {/* 属性面板（按精英阶段切换） */}
      {phases.length > 0 && (
        <Section title="基础属性">
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
          {(() => {
            const phase = phases[statPhase]
            if (!phase) return <p style={{ color: 'var(--text-secondary)' }}>无属性数据</p>
            const attrs = ensureArray(phase?.attributesKeyFrames)
            if (attrs.length === 0) return <p style={{ color: 'var(--text-secondary)' }}>无属性数据</p>
            const maxAttrs = attrs[attrs.length - 1]?.data || attrs[0]?.data
            if (!maxAttrs || typeof maxAttrs !== 'object') return <p style={{ color: 'var(--text-secondary)' }}>无属性数据</p>
            return (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
                {Object.entries(STAT_LABELS).map(([key, label]) => {
                  const val = (maxAttrs as any)[key]
                  if (val == null) return null
                  const numVal = typeof val === 'number' ? val : Number(val)
                  if (isNaN(numVal)) {
                    if (typeof val === 'string') return <StatBox key={key} label={label} valueStr={val} />
                    return null
                  }
                  return <StatBox key={key} label={label} value={numVal}
                    suffix={key === 'baseAttackTime' || key === 'respawnTime' ? 's' : ''} />
                })}
              </div>
            )
          })()}
        </Section>
      )}

      {/* 信赖加成 */}
      {favorFrames.length > 1 && (
        <Section title="信赖加成">
          <FavorTable frames={favorFrames} />
        </Section>
      )}

      {/* 天赋 */}
      {talents.length > 0 && (
        <Section title={`天赋 (${talents.length})`}>
          {talents.map((t: any, i: number) => (
            <TalentCard key={i} talent={t} index={i} />
          ))}
        </Section>
      )}

      {/* 潜能 */}
      {potentialRanks.length > 0 && (
        <Section title={`潜能 (${potentialRanks.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {potentialRanks.map((pr: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '14px', minWidth: '48px' }}>潜 {i + 1}</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{pr?.description || '无描述'}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px', marginLeft: 'auto' }}>
                  {pr?.type === 'BUFF' ? '增益' : String(pr?.type || '')}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 技能 */}
      {parsedSkills.length > 0 && (
        <Section title={`技能 (${parsedSkills.length})`}>
          {parsedSkills.map((s: any, i: number) => {
            const skillData = skillQueries[i]?.data as SkillData | undefined
            const maxLevel = skillData?.levels?.[skillData.levels.length - 1]
            return (
              <SkillCard key={i} index={i} skillRef={s} maxLevel={maxLevel}
                isLoading={skillQueries[i]?.isLoading ?? false} />
            )
          })}
        </Section>
      )}

      {/* 技能升级材料 */}
      {allSkillLvlup.length > 0 && (
        <Section title={`技能升级 (Lv.1 → Lv.${allSkillLvlup.length + 1})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {allSkillLvlup.map((entry: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '13px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600, minWidth: '60px' }}>Lv.{i + 1}→{i + 2}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{materialsStr(entry?.lvlUpCost)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 精英化材料 */}
      {phases.length > 1 && (
        <Section title="精英化条件">
          {phases.slice(1).map((p: any, i: number) => (
            <div key={i} style={{ marginBottom: i < phases.length - 2 ? '12px' : 0 }}>
              <h4 style={{ color: 'var(--accent-gold)', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                精英 {i + 1}
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {ensureArray(p?.evolveCost).map((m: any, j: number) => (
                  <MaterialChip key={`evo-${j}`} label={`[${m?.id ?? '?'}]`} count={m?.count ?? 0} />
                ))}
                {ensureArray(p?.levelUpCost).map((m: any, j: number) => (
                  <MaterialChip key={`lvl-${j}`} label={`[${m?.id ?? '?'}]`} count={m?.count ?? 0} />
                ))}
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
    </ErrorBoundary>
  )
}

// ============================================================
// 子组件
// ============================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', marginTop: '16px' }}>
      <div className="divider-diamond" style={{ marginBottom: '16px' }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>{title}</h3>
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

function StatBox({ label, value, valueStr, suffix }: { label: string; value?: number; valueStr?: string; suffix?: string }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{label}</div>
      <div style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700 }}>
        {valueStr ?? (value ?? '-')}{suffix || ''}
      </div>
    </div>
  )
}

function MaterialChip({ label, count }: { label: string; count: number }) {
  return (
    <span style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', color: 'var(--text-primary)' }}>
      {label} <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>x{count}</span>
    </span>
  )
}

function TalentCard({ talent, index }: { talent: any; index: number }) {
  const candidates = ensureArray(talent?.candidates)
  if (candidates.length === 0) return null

  return (
    <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '14px' }}>
          {candidates[candidates.length - 1]?.name || `天赋 ${index + 1}`}
        </span>
        {candidates.length > 1 && (
          <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>({candidates.length} 阶段)</span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {candidates.map((c: any, j: number) => {
          const phase = String(c?.unlockCondition?.phase || '').replace('PHASE_', '') || '0'
          const pot = c?.requiredPotentialRank ? ` 潜能${c.requiredPotentialRank}` : ''
          const bb = ensureArray(c?.blackboard)
            .filter((b: any) => b?.valueStr || b?.value != null)
            .map((b: any) => typeof b?.valueStr === 'string' ? `${b.key}: ${b.valueStr}` : `${b.key}: ${((b?.value ?? 0) * 100).toFixed(0)}%`)
            .join(', ')
          return (
            <div key={j} style={{ fontSize: '13px', padding: '6px 12px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 500, marginRight: '8px' }}>精英{phase}{pot}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{c?.description || '无描述'}</span>
              {bb ? <div style={{ color: '#80d0a0', fontSize: '11px', marginTop: '2px' }}>{bb}</div> : null}
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
  const levelUpCosts = ensureArray(skillRef?.levelUpCostCond)

  return (
    <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
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

      {unlockCond && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
          解锁: 精英 {String(unlockCond.phase || '').replace('PHASE_', '') || '0'} Lv.{unlockCond.level}
        </p>
      )}

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
          {maxLevel.duration > 0 && (
            <span style={{ color: 'var(--text-secondary)' }}>
              持续: <span style={{ color: 'var(--text-primary)' }}>{maxLevel.duration}s</span>
            </span>
          )}
        </div>
      )}

      {maxLevel?.description && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5, marginBottom: '8px' }}>
          {String(maxLevel.description).replace(/<[^>]+>/g, '')}
        </p>
      )}

      {levelUpCosts.length > 0 && (
        <details style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--accent)', marginBottom: '4px' }}>
            专精材料 ({levelUpCosts.length} 级)
          </summary>
          {levelUpCosts.map((entry: any, j: number) => (
            <div key={j} style={{ padding: '4px 0', fontSize: '12px' }}>
              <span style={{ color: 'var(--accent-gold)' }}>专精 {j + 1}</span>
              {' — '}{materialsStr(entry?.levelUpCost)}
            </div>
          ))}
        </details>
      )}
    </div>
  )
}

function FavorTable({ frames }: { frames: any[] }) {
  const maxFrame = frames[frames.length - 1]
  if (!maxFrame?.data || typeof maxFrame.data !== 'object') return null
  const relevantKeys = ['maxHp', 'atk', 'def']
  const bonus = relevantKeys.filter((k) => {
    const v = (maxFrame.data as any)[k]
    return typeof v === 'number' && v > 0
  })
  if (bonus.length === 0) return <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>该干员无信赖属性加成</p>

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
      {bonus.map((key) => (
        <StatBox key={key} label={STAT_LABELS[key] || key} value={(maxFrame.data as any)[key]} />
      ))}
    </div>
  )
}

// ============================================================
// JSON 解析辅助
// ============================================================
function tryParse(raw: any): any {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

function tryParseTrait(raw: any): string | null {
  const data = tryParse(raw)
  if (!data) return null
  const candidates = ensureArray(data?.candidates)
  if (candidates.length > 0) {
    const last = candidates[candidates.length - 1]
    return last?.blackboard?.[0]?.valueStr || last?.additionalDescription || null
  }
  return null
}
