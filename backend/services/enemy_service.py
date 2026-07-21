"""
敌人查询服务 - 处理 enemy_handbook / enemy_database 表的业务逻辑
"""
from typing import Any

from sqlalchemy import select, text
from sqlalchemy.engine import Engine

from database import engine, get_table, reflect_tables


def list_enemies(
    page: int = 1,
    page_size: int = 20,
    enemy_type: str | None = None,
) -> dict[str, Any]:
    """
    分页查询敌人图鉴列表。

    SQL 等价:
        SELECT * FROM enemy_handbook ORDER BY id LIMIT ? OFFSET ?
    """
    table = get_table("enemy_handbook")
    conditions = []

    if enemy_type:
        # 前端传入中文（普通/精英/BOSS），数据库存储英文（NORMAL/ELITE/BOSS）
        LEVEL_MAP = {"普通": "NORMAL", "精英": "ELITE", "BOSS": "BOSS"}
        db_value = LEVEL_MAP.get(enemy_type, enemy_type)
        type_col = _find_col(table.columns, "enemyLevel")
        if type_col is not None:
            conditions.append(type_col == db_value)

    # 计数
    count_stmt = select(text("COUNT(*)")).select_from(table)
    if conditions:
        count_stmt = count_stmt.where(*conditions)
    with engine.connect() as conn:
        total = conn.execute(count_stmt).scalar() or 0

    # 查询
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


def get_enemy_by_id(enemy_id: str) -> dict[str, Any] | None:
    """
    按 ID 查询单个敌人详情。

    SQL 等价:
        SELECT * FROM enemy_handbook WHERE id = ?
    """
    table = get_table("enemy_handbook")
    stmt = select(table).where(table.c.id == str(enemy_id))
    with engine.connect() as conn:
        row = conn.execute(stmt).mappings().first()
    return _row_to_dict(row) if row else None


def search_enemies(query: str, limit: int = 20) -> list[dict[str, Any]]:
    """
    按名称模糊搜索敌人。

    SQL 等价:
        SELECT * FROM enemy_handbook WHERE name LIKE '%query%' LIMIT ?
    """
    table = get_table("enemy_handbook")
    name_col = _find_col(table.columns, "name")
    if name_col is None:
        # 尝试 enemyName
        name_col = _find_col(table.columns, "enemyName")
    if name_col is None:
        return []
    stmt = select(table).where(name_col.like(f"%{query}%")).limit(limit)
    with engine.connect() as conn:
        rows = conn.execute(stmt).mappings().all()
    return [_row_to_dict(r) for r in rows]


def get_enemy_stage_stats(enemy_key: str) -> dict[str, Any]:
    """
    查询敌人的详细属性（从 enemy_database 表的 JSON 中解析）。

    enemy_database 结构:
        Key = enemyId (如 enemy_1007_slime)
        Value = JSON 数组 [{level, enemyData: {name, attributes: {maxHp, atk, def, ...}}}]
    """
    tables = reflect_tables()
    if "enemy_database" not in tables:
        return {"levels": []}

    import json
    table = tables["enemy_database"]
    key_col = _find_col(table.columns, "Key")
    if key_col is None:
        return {"levels": []}

    stmt = select(table).where(key_col == str(enemy_key))
    with engine.connect() as conn:
        row = conn.execute(stmt).mappings().first()

    if not row:
        # 找不到精确匹配，尝试模糊匹配
        stmt = select(table).where(key_col.like(f"{enemy_key}%")).limit(5)
        with engine.connect() as conn:
            row = conn.execute(stmt).mappings().first()

    if not row:
        return {"levels": []}

    row_dict = _row_to_dict(row)
    raw_value = row_dict.get("Value", "[]")

    try:
        level_list = json.loads(raw_value) if isinstance(raw_value, str) else raw_value
    except (json.JSONDecodeError, TypeError):
        return {"levels": []}

    # 解析每个 level 的属性
    result_levels = []
    for entry in (level_list if isinstance(level_list, list) else []):
        enemy_data = entry.get("enemyData", {})
        attrs_raw = enemy_data.get("attributes", {})
        # 提取实际的 m_value，过滤 m_defined=false 的属性
        attrs: dict[str, Any] = {}
        for key, val in (attrs_raw.items() if isinstance(attrs_raw, dict) else {}):
            if isinstance(val, dict) and val.get("m_defined"):
                attrs[key] = val.get("m_value")
        # 提取其他有用字段
        name = ""
        name_obj = enemy_data.get("name", {})
        if isinstance(name_obj, dict) and name_obj.get("m_defined"):
            name = name_obj.get("m_value", "")

        result_levels.append({
            "level": entry.get("level"),
            "name": name,
            "attributes": attrs,
        })

    return {"enemy_key": enemy_key, "levels": result_levels}


def _find_col(columns, field_name: str):
    for col in columns:
        col_name = str(col.name).lower().replace("_", "")
        if col_name == field_name.lower():
            return col
    return None


def _row_to_dict(row) -> dict[str, Any]:
    return dict(row)
