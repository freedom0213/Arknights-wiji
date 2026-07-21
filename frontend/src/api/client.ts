// API 请求基础配置
const API_BASE = '/api'

async function request<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`)
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  return res.json()
}

// ========== 干员 ==========
export interface Operator {
  id: string; name: string; appellation: string; rarity: string
  profession: string; subProfessionId: string; position: string
  tagList: string; trait: string; phases: string; skills: string
  talents: string; potentialRanks: string; favorKeyFrames: string
  allSkillLvlup: string; displayNumber: string; nationId: string
  description: string; itemUsage: string; itemDesc: string
}

export interface OperatorListResponse {
  total: number; page: number; page_size: number; items: Operator[]
}

export function fetchOperators(params: Record<string, string | number>) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
  return request<OperatorListResponse>(`/operators?${qs}`)
}

export function fetchOperator(id: string) {
  return request<Operator>(`/operators/${encodeURIComponent(id)}`)
}

export function searchOperators(q: string, limit = 20) {
  return request<Operator[]>(`/operators/search?q=${encodeURIComponent(q)}&limit=${limit}`)
}

export function fetchOperatorMaterials(id: string) {
  return request<any>(`/operators/${encodeURIComponent(id)}/materials`)
}

// ========== 敌人 ==========
export interface Enemy {
  id: string; name: string; enemyLevel: string; enemyTags: string
  attackType: string; ability: string; description: string
  abilityList: string; linkEnemies: string; damageType: string
}

export interface EnemyListResponse {
  total: number; page: number; page_size: number; items: Enemy[]
}

export function fetchEnemies(params: Record<string, string | number>) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
  return request<EnemyListResponse>(`/enemies?${qs}`)
}

export function fetchEnemy(id: string) {
  return request<Enemy>(`/enemies/${encodeURIComponent(id)}`)
}

export function searchEnemies(q: string, limit = 20) {
  return request<Enemy[]>(`/enemies/search?q=${encodeURIComponent(q)}&limit=${limit}`)
}

// ========== 技能 ==========
export interface SkillLevel {
  name: string; description: string; skillType: string
  durationType: string; spData: any; blackboard: any[]
}
export interface SkillData {
  id: string; skillId: string; iconId: string; hidden: number
  levels: SkillLevel[]
}

export function fetchSkill(id: string) {
  return request<SkillData>(`/skills/${encodeURIComponent(id)}`)
}

// ========== 关卡 ==========
export interface Stage {
  id: string; stageId: string; code: string; name: string
  stageType: string; zoneId: string; difficulty: string
  unlockCondition: string; apCost: number | null
}

export interface StageListResponse {
  total: number; page: number; page_size: number; items: Stage[]
}

export function fetchStages(params: Record<string, string | number>) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
  return request<StageListResponse>(`/stages?${qs}`)
}

// 今天开放的关卡
export interface TodayStagesResponse {
  today: { date: string; weekday: number; weekday_name: string }
  open_stages: Stage[]
}
export function fetchTodayStages() {
  return request<TodayStagesResponse>('/stages/today')
}

// 每周日程
export interface ScheduleDay {
  weekday: number; weekday_name: string; is_today: boolean
  zone_ids: string[]; stage_count: number; stages: Stage[]
}
export interface WeeklyScheduleResponse {
  today: { date: string; weekday: number; weekday_name: string }
  daily_schedule: ScheduleDay[]
}
export function fetchWeeklySchedule() {
  return request<WeeklyScheduleResponse>('/stages/weekly-schedule')
}

export function fetchZones() {
  return request<any[]>('/zones')
}
