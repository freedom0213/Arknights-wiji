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
        type_col = _find_col(table.columns, "enemyTags")
        if type_col is not None:
            conditions.append(type_col.like(f"%{enemy_type}%"))

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


def get_enemy_stage_stats(enemy_key: str) -> list[dict[str, Any]]:
    """
    查询该敌人在各关卡中的具体属性（从 enemy_database 表）。

    SQL 等价:
        SELECT * FROM enemy_database WHERE key = ? OR enemyId = ?
    """
    tables = reflect_tables()
    if "enemy_database" not in tables:
        return []

    table = tables["enemy_database"]
    # enemy_database 中每条记录是一个展平行，查找 enemyId 或 key
    conditions = []
    for col_name_pattern in ["key", "enemyId", "enemyKey"]:
        col = _find_col(table.columns, col_name_pattern)
        if col is not None:
            conditions.append(col == str(enemy_key))

    if not conditions:
        return []

    stmt = select(table)
    # 用 OR 连接多个可能的列匹配
    from sqlalchemy import or_
    stmt = stmt.where(or_(*conditions)).limit(100)

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
