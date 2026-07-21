"""
关卡查询服务 - 处理 stages / zones 表的业务逻辑
"""
from datetime import datetime
from typing import Any

from sqlalchemy import select, text, or_

from database import engine, get_table


# ============================================================
# 每日轮换日程表
# 数据来源：明日方舟游戏内关卡开放规则
# weekday: 0=周一 ... 6=周日, value=list[zone_id]
# ============================================================
_DAILY_SCHEDULE: dict[int, list[str]] = {
    0: ["weekly_5"],           # 周一: 采购凭证
    1: ["weekly_6"],           # 周二: 碳素组
    2: ["weekly_7"],           # 周三: 作战记录
    3: ["weekly_8"],           # 周四: 技巧概要
    4: ["weekly_5", "weekly_6"],  # 周五: 采购凭证 + 碳素组
    5: ["weekly_7", "weekly_8"],  # 周六: 作战记录 + 技巧概要
    6: ["weekly_5", "weekly_6", "weekly_7", "weekly_8"],  # 周日: 全部物资筹备
}

# 芯片搜索轮换 (PR-A/B/C/D)
_CHIP_SCHEDULE: dict[int, list[str]] = {
    0: ["weekly_1"],           # 周一: 术师/狙击芯片
    1: ["weekly_2"],           # 周二: 近卫/特种芯片
    2: ["weekly_3"],           # 周三: 医疗/辅助芯片
    3: ["weekly_4"],           # 周四: 先锋/重装芯片
    4: [],                     # 周五: 无芯片本
    5: ["weekly_1", "weekly_2", "weekly_3", "weekly_4"],  # 周六: 全芯片
    6: ["weekly_1", "weekly_2", "weekly_3", "weekly_4"],  # 周日: 全芯片
}

# 龙门币本每天开放
_EVERYDAY_ZONES = ["weekly_9"]

# 中文星期名
_WEEKDAY_NAMES = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]

# 各 zone 的类别名称（从 zone 表中 zoneNameSecond 映射）
# 数据同步时会从 zones 表读取，这里提供后备
_ZONE_CATEGORY_FALLBACK: dict[str, str] = {
    "weekly_1": "术师/狙击芯片",
    "weekly_2": "近卫/特种芯片",
    "weekly_3": "医疗/辅助芯片",
    "weekly_4": "先锋/重装芯片",
    "weekly_5": "采购凭证",
    "weekly_6": "碳素组",
    "weekly_7": "作战记录",
    "weekly_8": "技巧概要",
    "weekly_9": "龙门币",
}


def list_stages(
    page: int = 1,
    page_size: int = 20,
    zone_id: str | None = None,
    stage_type: str | None = None,
) -> dict[str, Any]:
    """
    分页查询关卡列表。

    SQL 等价:
        SELECT * FROM stages
        WHERE zoneId = ? OR ? IS NULL
        ORDER BY id LIMIT ? OFFSET ?
    """
    table = get_table("stages")
    conditions = []

    if zone_id:
        zone_col = _find_col(table.columns, "zoneId")
        if zone_col is not None:
            conditions.append(zone_col == zone_id)

    if stage_type:
        type_col = _find_col(table.columns, "stageType")
        if type_col is not None:
            conditions.append(type_col == stage_type)

    # 计数
    count_stmt = select(text("COUNT(*)")).select_from(table)
    if conditions:
        count_stmt = count_stmt.where(*conditions)
    with engine.connect() as conn:
        total = conn.execute(count_stmt).scalar() or 0

    stmt = select(table)
    if conditions:
        stmt = stmt.where(*conditions)
    stmt = stmt.limit(page_size).offset((page - 1) * page_size)

    with engine.connect() as conn:
        rows = conn.execute(stmt).mappings().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [_row_to_dict(r) for r in rows],
    }


def get_stage_by_id(stage_id: str) -> dict[str, Any] | None:
    """
    按 ID 查询单个关卡详情。

    SQL 等价:
        SELECT * FROM stages WHERE id = ?
    """
    table = get_table("stages")
    stmt = select(table).where(table.c.id == str(stage_id))
    with engine.connect() as conn:
        row = conn.execute(stmt).mappings().first()
    return _row_to_dict(row) if row else None


def search_stages(query: str, limit: int = 20) -> list[dict[str, Any]]:
    """
    按名称或关卡代码搜索关卡。

    SQL 等价:
        SELECT * FROM stages WHERE name LIKE '%query%' LIMIT ?
    """
    table = get_table("stages")
    name_col = _find_col(table.columns, "name")
    code_col = _find_col(table.columns, "code")

    conditions = []
    if name_col is not None:
        conditions.append(name_col.like(f"%{query}%"))
    if code_col is not None:
        conditions.append(code_col.like(f"%{query}%"))

    if not conditions:
        return []

    stmt = select(table).where(or_(*conditions)).limit(limit)
    with engine.connect() as conn:
        rows = conn.execute(stmt).mappings().all()
    return [_row_to_dict(r) for r in rows]


def get_weekly_schedule() -> dict[str, Any]:
    """
    获取本周完整的关卡轮换日程表。

    返回每个星期几开放哪些资源收集关卡（含关卡代码、名称、理智消耗等）。
    """
    today = datetime.now()
    weekday = today.weekday()
    stages_table = get_table("stages")

    # 一次性查询所有 DAILY 类型关卡
    daily_col = _find_col(stages_table.columns, "stageType")
    if daily_col is not None:
        stmt = select(stages_table).where(daily_col == "DAILY")
    else:
        stmt = select(stages_table)
    with engine.connect() as conn:
        all_daily_stages = [_row_to_dict(r) for r in conn.execute(stmt).mappings().all()]

    # 按 zoneId 分组
    by_zone: dict[str, list[dict]] = {}
    for s in all_daily_stages:
        zid = s.get("zoneId", "")
        by_zone.setdefault(zid, []).append(s)

    # 构建每日开放关卡列表
    daily_schedule = []
    for d in range(7):
        zone_ids = set(_DAILY_SCHEDULE.get(d, []) + _CHIP_SCHEDULE.get(d, []) + _EVERYDAY_ZONES)
        open_stages = []
        for zid in sorted(zone_ids):
            stages_in_zone = sorted(by_zone.get(zid, []), key=lambda s: s.get("code", ""))
            open_stages.extend(stages_in_zone)
        daily_schedule.append({
            "weekday": d,
            "weekday_name": _WEEKDAY_NAMES[d],
            "is_today": d == weekday,
            "zone_ids": sorted(zone_ids),
            "stage_count": len(open_stages),
            "stages": open_stages,
        })

    return {
        "today": {
            "date": today.strftime("%Y-%m-%d"),
            "weekday": weekday,
            "weekday_name": _WEEKDAY_NAMES[weekday],
        },
        "daily_schedule": daily_schedule,
    }


def get_open_stages_today() -> list[dict[str, Any]]:
    """
    查询今日开放的资源收集关卡。

    根据轮换规则，查询 stages 表中 zoneId 匹配今日开放 zone 的所有 DAILY 关卡。
    """
    weekday = datetime.now().weekday()
    zone_ids = set(_DAILY_SCHEDULE.get(weekday, []) + _CHIP_SCHEDULE.get(weekday, []) + _EVERYDAY_ZONES)

    if not zone_ids:
        return []

    table = get_table("stages")
    zone_col = _find_col(table.columns, "zoneId")
    if zone_col is None:
        return []

    stmt = select(table).where(zone_col.in_(list(zone_ids)))
    with engine.connect() as conn:
        rows = conn.execute(stmt).mappings().all()

    return [_row_to_dict(r) for r in rows]


def list_zones() -> list[dict[str, Any]]:
    """
    列出所有章节/区域。

    SQL 等价:
        SELECT * FROM zones ORDER BY id
    """
    table = get_table("zones")
    stmt = select(table).order_by(text("id"))
    with engine.connect() as conn:
        rows = conn.execute(stmt).mappings().all()
    return [_row_to_dict(r) for r in rows]


def _find_col(columns, field_name: str):
    for col in columns:
        col_name = str(col.name).lower().replace("_", "")
        if col_name == field_name.lower():
            return col
    return None


def _row_to_dict(row) -> dict[str, Any]:
    return dict(row)
