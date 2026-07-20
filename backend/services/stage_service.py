"""
关卡查询服务 - 处理 stages / zones 表的业务逻辑
"""
from datetime import datetime
from typing import Any

from sqlalchemy import select, text

from database import engine, get_table


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

    from sqlalchemy import or_

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
    获取本周关卡轮换日程表。

    关卡开放时间数据来源于 stage_table.json 和 zone_table.json。
    资源收集关卡（如芯片搜索、物资筹备）按周循环开放。
    这里先返回关卡的每日开放信息，后续 sync 脚本会解析具体的轮换规则。

    注意：具体每周几开放什么关卡的轮换规则，在 ArknightsGameData
    中可能存储在 campaign_table.json 或 zone_record 相关表中。
    如果没有找到，则返回空结构，后续版本补充。
    """
    today = datetime.now()
    weekday = today.weekday()  # 0=周一, 6=周日
    weekday_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]

    return {
        "today": {
            "date": today.strftime("%Y-%m-%d"),
            "weekday": weekday,
            "weekday_name": weekday_names[weekday],
        },
        "weekly_schedule": {
            "note": "关卡轮换日程表正在解析中，请等待数据同步脚本更新支持 campaign_table.json 解析"
        },
    }


def get_open_stages_today() -> list[dict[str, Any]]:
    """
    查询今日开放的关卡。

    实现逻辑：
    1. 从 zone_table 读取资源收集类别的 zone
    2. 根据今天星期几匹配对应的关卡
    3. 返回开放关卡列表

    目前返回所有关卡（轮换规则解析待完善）。
    """
    # TODO: 解析 campaign_table.json 中的轮换时间规则
    return []


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
