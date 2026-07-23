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
  // 图片 URL（由后端 skin_service 拼接免费 CDN）
  avatarUrl?: string
  defaultPortraitUrl?: string
  e2PortraitUrl?: string
  e0IllustUrl?: string
  e2IllustUrl?: string
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
  // 敌人图片 URL（免费 CDN）
  imageUrl?: string
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

export interface EnemyLevelStats {
  level: number; name: string; attributes: Record<string, any>
}
export interface EnemyStageStatsResponse {
  enemy_key: string; levels: EnemyLevelStats[]
}
export function fetchEnemyStageStats(id: string) {
  return request<EnemyStageStatsResponse>(`/enemies/${encodeURIComponent(id)}/stages`)
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

// ========== 全站搜索 ==========
export interface SearchResultOperator {
  id: string; name: string; rarity: string
}
export interface SearchResultEnemy {
  id: string; name: string; enemyLevel: string
}
export interface SearchResultStage {
  id: string; code: string; name: string; apCost: number | null
}
export interface SearchAllResponse {
  operators: SearchResultOperator[]
  enemies: SearchResultEnemy[]
  stages: SearchResultStage[]
}

export function searchAll(q: string, limit = 5) {
  return request<SearchAllResponse>(`/search?q=${encodeURIComponent(q)}&limit=${limit}`)
}

// ========== 材料 ==========
export interface Material {
  id: string; itemId: string; name: string; description: string
  rarity: string; iconId: string; iconUrl: string | null
  usage: string; obtainApproach: string
  classifyType: string; itemType: string
  stageDropList?: string; buildingProductList?: string
}

export interface MaterialListResponse {
  total: number; page: number; page_size: number; items: Material[]
}

export function fetchMaterials(params: Record<string, string | number>) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
  return request<MaterialListResponse>(`/materials?${qs}`)
}

export function fetchAllMaterials(classifyType?: string) {
  const qs = classifyType ? `?classify_type=${encodeURIComponent(classifyType)}` : ''
  return request<Material[]>(`/materials/all${qs}`)
}

export function fetchMaterial(id: string) {
  return request<Material>(`/materials/${encodeURIComponent(id)}`)
}

export function fetchItemsBatch(ids: string[]) {
  if (ids.length === 0) return Promise.resolve({})
  return request<Record<string, { id: string; name: string; iconId: string }>>(
    `/materials/batch?ids=${ids.join(',')}`
  )
}

// ========== 皮肤（时装回廊）==========
export interface Skin {
  id: string; skinId: string; charId: string
  skinName: string | null; skinGroupId: string; skinGroupName: string | null
  skinGroupSortIndex: number | null; content: string | null
  dialog: string | null; usage: string | null; description: string | null
  drawerList: string[]; designerList: string[]; colorList: string[]
  titleList: string[]; displayTagId: string | null
  obtainApproach: string | null; sortId: number | null
  getTime: number; onYear: number; onPeriod: number
  modelName: string | null; isBuySkin: number | null
  buildingId: string | null; voiceType: string | null
  battleSkin: string | null
  // 图片 CDN URL
  portraitUrl: string | null; avatarUrl: string | null
  illustUrl: string | null; illustUrlAceship: string | null
  spIllustUrl: string | null; spPortraitUrl: string | null
  dynIllustUrl: string | null; dynEntranceUrl: string | null
}

export interface SkinListResponse {
  total: number; page: number; page_size: number; items: Skin[]
}

export function fetchSkins(params: Record<string, string | number>) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
  return request<SkinListResponse>(`/skins?${qs}`)
}

export function fetchSkin(id: string) {
  return request<Skin>(`/skins/${encodeURIComponent(id)}`)
}

// 皮肤按日期分组
export interface SkinGroup { date: string; skins: Skin[] }
export interface SkinGroupedResponse {
  total_skins: number; total_groups: number; groups: SkinGroup[]
}
export function fetchSkinsGrouped() {
  return request<SkinGroupedResponse>('/skins/grouped')
}

// ========== 活动 ==========
export interface Activity {
  id: string; name: string
  type_: string; displayType: string
  startTime: number; endTime: number; rewardEndTime: number
  displayOnHome: number; hasStage: number; isReplicate: number
  templateShopId: string | null; medalGroupId: string | null
  picGroup: string | null; posterUrls: string[]
}

export interface ActivityListResponse {
  total: number; page: number; page_size: number; items: Activity[]
}

export function fetchActivities(params: Record<string, string | number>) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
  return request<ActivityListResponse>(`/activities?${qs}`)
}

export function fetchActivity(id: string) {
  return request<Activity>(`/activities/${encodeURIComponent(id)}`)
}
