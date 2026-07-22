import { useState, Component } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueries } from '@tanstack/react-query'
import { fetchOperator, fetchSkill, fetchItemsBatch, type SkillData } from '../api/client'
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

// 天赋 blackboard 常用 key 中文映射
const BB_KEY_LABELS: Record<string, string> = {
  ...STAT_LABELS,
  prob: '触发概率', interval: '间隔', sp: '技力', cnt: '次数',
  times: '次数', duration: '持续时间', range: '范围',
  mv_spd: '移动速度', move_speed: '移动速度',
  atk_scale: '攻击倍率', def_scale: '防御倍率',
  damage: '伤害', heal: '治疗量', hp_ratio: '生命比例',
  talent_scale: '天赋倍率', base_attack_time: '攻击间隔',
}

// 格式化 blackboard 数值：优先用 valueStr，小数值当百分比处理
function formatBlackboardValue(b: any): string {
  if (typeof b?.valueStr === 'string' && b.valueStr !== '') return b.valueStr
  const value = Number(b?.value ?? 0)
  if (isNaN(value)) return String(b?.value ?? '')
  // 绝对值在 0~1 之间的小数大概率是百分比，乘以 100 显示
  if (Math.abs(value) > 0 && Math.abs(value) < 1 && value !== 0) {
    return `${(value * 100).toFixed(0)}%`
  }
  // 整数值直接显示
  return String(Math.round(value))
}

// 安全工具：确保值为数组
function ensureArray(x: any): any[] {
  if (Array.isArray(x)) return x
  return []
}

// 解析技能描述中的模板变量 {key:format}，用 blackboard 数据替换
// 明日方舟的技能描述使用 {atk:0%} / {attack@def:0.0} 等占位符
// blackboard 数组中存储了实际的数值
function resolveSkillDescription(description: string, blackboard: any[]): string {
  if (!description) return ''
  const bb = ensureArray(blackboard)
  // 构建 key → entry 的映射
  const map: Record<string, any> = {}
  bb.forEach((b: any) => { if (b?.key) map[b.key] = b })

  return description
    .replace(/<[^>]+>/g, '')  // 去除 HTML 标签 <@ba.vup> 等
    .replace(/\{([^}:]+)(?::([^}]*))?\}/g, (_match, key: string, format: string) => {
      const entry = map[key]
      if (!entry) return `{${key}}`  // 找不到则保留原文
      // 如果有 valueStr 字段且非 null，直接使用
      if (entry.valueStr != null && entry.valueStr !== '') return String(entry.valueStr)
      const value = Number(entry.value ?? 0)
      if (isNaN(value)) return `{${key}}`
      // 根据格式后缀渲染数值
      if (format === '0%') return `${(value * 100).toFixed(0)}%`
      if (format === '0.0') return value.toFixed(1)
      if (format === '0.0%') return `${(value * 100).toFixed(1)}%`
      if (format === '0') return String(Math.round(value))
      if (format) return `${value}${format}`  // 保留未识别的格式后缀
      return String(value)
    })
}

// 收集操作员数据中所有材料 ID
function collectMaterialIds(phases: any[], skills: any[], allSkillLvlup: any[]): string[] {
  const ids = new Set<string>()
  phases.forEach((p: any) => {
    ensureArray(p?.evolveCost).forEach((m: any) => { if (m?.id) ids.add(String(m.id)) })
    ensureArray(p?.levelUpCost).forEach((m: any) => { if (m?.id) ids.add(String(m.id)) })
  })
  skills.forEach((s: any) => {
    ensureArray(s?.levelUpCostCond).forEach((entry: any) => {
      ensureArray(entry?.levelUpCost).forEach((m: any) => { if (m?.id) ids.add(String(m.id)) })
    })
  })
  allSkillLvlup.forEach((entry: any) => {
    ensureArray(entry?.lvlUpCost).forEach((m: any) => { if (m?.id) ids.add(String(m.id)) })
  })
  return Array.from(ids)
}

// 安全工具：把材料数组渲染为字符串（带名称解析）
function materialsStr(cost: any, materialMap: Record<string, any>): string {
  const arr = ensureArray(cost)
  if (arr.length === 0) return '无'
  return arr.map((m: any) => {
    const id = String(m?.id ?? '?')
    const name = materialMap[id]?.name || id
    return `${name} x${m?.count ?? 0}`
  }).join(' + ')
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

  // 批量获取所有材料名称
  const materialIds = collectMaterialIds(phases, parsedSkills, allSkillLvlup)
  const { data: materialMap = {} as Record<string, any> } = useQuery({
    queryKey: ['materials-batch', materialIds.join(',')],
    queryFn: () => fetchItemsBatch(materialIds),
    enabled: materialIds.length > 0,
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
      <div style={{
        background: 'rgba(35, 39, 70, 0.38)',
        backdropFilter: 'blur(14px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.3)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px', padding: '16px', marginTop: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      }}>
        <div className="flex flex-wrap items-start gap-3 justify-between">
          <div>
            <div style={{ color: '#f0c060', fontSize: '12px', marginBottom: '2px' }}>
              {'★'.repeat(stars)}
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{op.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
              {op.appellation} {op.displayNumber ? `· ${op.displayNumber}` : ''}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
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
          <div style={{ marginTop: '10px', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '12px' }}>特性：</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{trait}</span>
          </div>
        )}

        {op.itemUsage && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '8px', lineHeight: 1.5 }}>{op.itemUsage}</p>
        )}
      </div>

      {/* 属性面板（按精英阶段切换） */}
      {phases.length > 0 && (
        <Section title="基础属性">
          <div className="flex gap-1.5" style={{ marginBottom: '10px' }}>
            {phases.map((p: any, i: number) => (
              <button
                key={i}
                onClick={() => setStatPhase(i)}
                style={{
                  padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--border-color)',
                  background: statPhase === i ? 'var(--accent)' : 'transparent',
                  color: statPhase === i ? '#000' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '12px', fontWeight: statPhase === i ? 600 : 400,
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
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {potentialRanks.map((pr: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '12px', minWidth: '40px' }}>潜 {i + 1}</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '12px' }}>{pr?.description || '无描述'}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '10px', marginLeft: 'auto' }}>
                  {pr?.type === 'BUFF' ? '增益' : String(pr?.type || '')}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 精英化材料 — 放在技能上方 */}
      {phases.length > 1 && (
        <Section title="精英化条件">
          {phases.slice(1).map((p: any, i: number) => (
            <div key={i} style={{ marginBottom: i < phases.length - 2 ? '8px' : 0 }}>
              <h4 style={{ color: 'var(--accent-gold)', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                精英 {i + 1}
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {ensureArray(p?.evolveCost).map((m: any, j: number) => {
                  const matName = (materialMap as Record<string, any>)[m?.id]?.name
                  return <MaterialChip key={`evo-${j}`} label={matName || `[${m?.id ?? '?'}]`} count={m?.count ?? 0} />
                })}
                {ensureArray(p?.levelUpCost).map((m: any, j: number) => {
                  const matName = (materialMap as Record<string, any>)[m?.id]?.name
                  return <MaterialChip key={`lvl-${j}`} label={matName || `[${m?.id ?? '?'}]`} count={m?.count ?? 0} />
                })}
              </div>
            </div>
          ))}
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
                isLoading={skillQueries[i]?.isLoading ?? false} materialMap={materialMap} />
            )
          })}
        </Section>
      )}

      {/* 技能升级材料 */}
      {allSkillLvlup.length > 0 && (
        <Section title={`技能升级 (Lv.1 → Lv.${allSkillLvlup.length + 1})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {allSkillLvlup.map((entry: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '12px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600, minWidth: '50px' }}>Lv.{i + 1}→{i + 2}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{materialsStr(entry?.lvlUpCost, materialMap)}</span>
              </div>
            ))}
          </div>
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
    <div style={{
      background: 'rgba(35, 39, 70, 0.38)',
      backdropFilter: 'blur(14px) saturate(1.3)',
      WebkitBackdropFilter: 'blur(14px) saturate(1.3)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px', padding: '16px', marginTop: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    }}>
      <h3 style={{
        color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600,
        marginBottom: '12px', paddingBottom: '8px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>{title}</h3>
      {children}
    </div>
  )
}

function Tag({ label, color }: { label: string; color: string }) {
  if (!label) return null
  return (
    <span style={{ background: `${color}18`, color, border: `1px solid ${color}40`, borderRadius: '3px', padding: '1px 8px', fontSize: '11px' }}>
      {label}
    </span>
  )
}

function StatBox({ label, value, valueStr, suffix }: { label: string; value?: number; valueStr?: string; suffix?: string }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: '4px', padding: '8px 10px', textAlign: 'center' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>{label}</div>
      <div style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700 }}>
        {valueStr ?? (value ?? '-')}{suffix || ''}
      </div>
    </div>
  )
}

function MaterialChip({ label, count }: { label: string; count: number }) {
  return (
    <span style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', color: 'var(--text-primary)' }}>
      {label} <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>x{count}</span>
    </span>
  )
}

function TalentCard({ talent, index }: { talent: any; index: number }) {
  const candidates = ensureArray(talent?.candidates)
  if (candidates.length === 0) return null

  return (
    <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '13px' }}>
          {candidates[candidates.length - 1]?.name || `天赋 ${index + 1}`}
        </span>
        {candidates.length > 1 && (
          <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>({candidates.length} 阶段)</span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {candidates.map((c: any, j: number) => {
          const phase = String(c?.unlockCondition?.phase || '').replace('PHASE_', '') || '0'
          const pot = c?.requiredPotentialRank ? ` 潜能${c.requiredPotentialRank}` : ''
          const desc = String(c?.description || '无描述').replace(/<[^>]+>/g, '')
          const bb = ensureArray(c?.blackboard)
            .filter((b: any) => b?.valueStr || b?.value != null)
            .map((b: any) => {
              const label = BB_KEY_LABELS[b.key] || b.key
              return `${label}: ${formatBlackboardValue(b)}`
            })
            .join(', ')
          return (
            <div key={j} style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 500, marginRight: '6px' }}>精英{phase}{pot}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{desc}</span>
              {bb ? <div style={{ color: '#80d0a0', fontSize: '10px', marginTop: '1px' }}>{bb}</div> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SkillCard({ index, skillRef, maxLevel, isLoading, materialMap }: {
  index: number; skillRef: any; maxLevel?: any; isLoading: boolean; materialMap: Record<string, any>
}) {
  const unlockCond = skillRef?.unlockCond
  const levelUpCosts = ensureArray(skillRef?.levelUpCostCond)
  const blackboard = ensureArray(maxLevel?.blackboard)

  return (
    <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px' }}>
          技能 {index + 1}: {isLoading ? '加载中...' : (maxLevel?.name || skillRef?.skillId || '未知')}
        </span>
        {maxLevel?.skillType && (
          <span style={{ color: 'var(--accent)', fontSize: '11px', padding: '1px 6px', background: 'var(--bg-secondary)', borderRadius: '3px' }}>
            {SKILL_TYPE[maxLevel.skillType] || maxLevel.skillType}
          </span>
        )}
      </div>

      {unlockCond && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '2px' }}>
          解锁: 精英 {String(unlockCond.phase || '').replace('PHASE_', '') || '0'} Lv.{unlockCond.level}
        </p>
      )}

      {maxLevel?.spData && (
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
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
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.5, marginBottom: '4px' }}>
          {resolveSkillDescription(maxLevel.description, blackboard)}
        </p>
      )}

      {levelUpCosts.length > 0 && (
        <details style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--accent)', marginBottom: '2px' }}>
            专精材料 ({levelUpCosts.length} 级)
          </summary>
          {levelUpCosts.map((entry: any, j: number) => (
            <div key={j} style={{ padding: '2px 0', fontSize: '11px' }}>
              <span style={{ color: 'var(--accent-gold)' }}>专精 {j + 1}</span>
              {' — '}{materialsStr(entry?.levelUpCost, materialMap)}
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
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
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
