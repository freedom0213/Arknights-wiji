"""
材料查询服务 - 处理 items 表的业务逻辑
"""
from typing import Any

from sqlalchemy import select

from database import engine, get_table
from services.skin_service import CDN_PORTRAIT

# 物品图标 CDN 基地址
CDN_ITEM = f"{CDN_PORTRAIT}/item"


def list_items(
    page: int = 1,
    page_size: int = 200,
    item_type: str | None = None,
    classify_type: str | None = None,
) -> dict[str, Any]:
    """
    分页查询物品列表，支持筛选。

    SQL 等价:
        SELECT * FROM items
        WHERE itemType = ? AND classifyType = ?
        ORDER BY sortId, id
        LIMIT ? OFFSET ?
    """
    table = get_table("items")
    conditions = []

    item_type_col = _find_col(table.columns, "itemType")
    classify_type_col = _find_col(table.columns, "classifyType")

    if item_type and item_type_col is not None:
        conditions.append(item_type_col == item_type)
    if classify_type and classify_type_col is not None:
        conditions.append(classify_type_col == classify_type)

    with engine.connect() as conn:
        # 计数
        count_stmt = select(table)
        if conditions:
            from sqlalchemy import and_
            count_stmt = count_stmt.where(and_(*conditions))
        count_sql = count_stmt.with_only_columns(
            *[getattr(table.c, c.name) for c in table.c if c.name == "id"]
        ).limit(None).offset(None)
        total = conn.execute(
            select(table).where(and_(*conditions)) if conditions else select(table)
        ).fetchall()
        total = len(total)

    # 数据
    offset = (page - 1) * page_size
    stmt = select(table)
    if conditions:
        from sqlalchemy import and_
        stmt = stmt.where(and_(*conditions))
    stmt = stmt.limit(page_size).offset(offset)

    with engine.connect() as conn:
        rows = conn.execute(stmt).mappings().all()

    items = []
    for r in rows:
        d = _row_to_dict(r)
        icon_id = d.get("iconId")
        if icon_id:
            d["iconUrl"] = f"{CDN_ITEM}/{icon_id}.png"
        else:
            d["iconUrl"] = None
        items.append(d)

    return {"total": total, "page": page, "page_size": page_size, "items": items}


def get_all_items(classify_type: str | None = None) -> list[dict[str, Any]]:
    """
    全量返回物品列表（不分页），供前端"全部展示"模式。

    SQL 等价:
        SELECT * FROM items WHERE classifyType = ? ORDER BY sortId, id
    """
    table = get_table("items")
    stmt = select(table)

    if classify_type:
        classify_type_col = _find_col(table.columns, "classifyType")
        if classify_type_col is not None:
            stmt = stmt.where(classify_type_col == classify_type)

    with engine.connect() as conn:
        rows = conn.execute(stmt).mappings().all()

    items = []
    for r in rows:
        d = _row_to_dict(r)
        icon_id = d.get("iconId")
        if icon_id:
            d["iconUrl"] = f"{CDN_ITEM}/{icon_id}.png"
        else:
            d["iconUrl"] = None
        items.append(d)

    return items


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
    if not row:
        return None
    d = _row_to_dict(row)
    # 拼接图标 CDN URL
    icon_id = d.get("iconId")
    if icon_id:
        d["iconUrl"] = f"{CDN_ITEM}/{icon_id}.png"
    else:
        d["iconUrl"] = None
    return d


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
