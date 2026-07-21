"""
材料查询服务 - 处理 items 表的业务逻辑
"""
from typing import Any

from sqlalchemy import select

from database import engine, get_table


def get_item_by_id(item_id: str) -> dict[str, Any] | None:
    """
    按 ID 查询材料/物品详情。

    SQL 等价:
        SELECT * FROM items WHERE id = ?
    """
    table = get_table("items")
    stmt = select(table).where(table.c.id == str(item_id))
    with engine.connect() as conn:
        row = conn.execute(stmt).mappings().first()
    return _row_to_dict(row) if row else None


def search_items(query: str, limit: int = 20) -> list[dict[str, Any]]:
    """
    按名称搜索材料。

    SQL 等价:
        SELECT * FROM items WHERE name LIKE '%query%' LIMIT ?
    """
    table = get_table("items")
    name_col = _find_col(table.columns, "name")
    if name_col is None:
        return []
    stmt = select(table).where(name_col.like(f"%{query}%")).limit(limit)
    with engine.connect() as conn:
        rows = conn.execute(stmt).mappings().all()
    return [_row_to_dict(r) for r in rows]


def get_items_batch(item_ids: list[str]) -> dict[str, dict[str, Any]]:
    """
    批量查询材料/物品，返回 {id: item_dict} 映射。

    SQL 等价:
        SELECT * FROM items WHERE id IN (?, ?, ...)
    """
    if not item_ids:
        return {}
    table = get_table("items")
    stmt = select(table).where(table.c.id.in_([str(i) for i in item_ids]))
    with engine.connect() as conn:
        rows = conn.execute(stmt).mappings().all()
    return {str(_row_to_dict(r).get("id")): _row_to_dict(r) for r in rows}


def _find_col(columns, field_name: str):
    for col in columns:
        col_name = str(col.name).lower().replace("_", "")
        if col_name == field_name.lower():
            return col
    return None


def _row_to_dict(row) -> dict[str, Any]:
    return dict(row)
