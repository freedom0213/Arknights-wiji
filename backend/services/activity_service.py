"""
活动查询服务 - 处理 activities 表的业务逻辑
"""
import json
from typing import Any

from sqlalchemy import select

from database import engine, get_table


def list_activities(
    page: int = 1,
    page_size: int = 20,
    display_type: str | None = None,
) -> dict[str, Any]:
    """
    分页查询活动列表，按 startTime DESC（最新在前）。

    SQL 等价:
        SELECT * FROM activities
        WHERE displayType = ?
        ORDER BY startTime DESC
        LIMIT ? OFFSET ?
    """
    table = get_table("activities")
    conditions = []

    # displayType 列（sync_data 可能未改名）
    dt_col = _find_col(table.columns, "displayType")
    if display_type and dt_col is not None:
        conditions.append(dt_col == display_type)

    # 时间列
    st_col = _find_col(table.columns, "startTime")

    # 计数
    count_stmt = select(table)
    with engine.connect() as conn:
        if conditions:
            from sqlalchemy import and_
            count_stmt = count_stmt.where(and_(*conditions))
        total = len(conn.execute(count_stmt).fetchall())

    # 数据
    stmt = select(table)
    if conditions:
        from sqlalchemy import and_
        stmt = stmt.where(and_(*conditions))
    if st_col is not None:
        stmt = stmt.order_by(st_col.desc())
    offset = (page - 1) * page_size
    stmt = stmt.limit(page_size).offset(offset)

    with engine.connect() as conn:
        rows = conn.execute(stmt).mappings().all()

    items = []
    for r in rows:
        d = _row_to_dict(r)
        _enrich_activity(d)
        items.append(d)

    return {"total": total, "page": page, "page_size": page_size, "items": items}


def get_activity_by_id(activity_id: str) -> dict[str, Any] | None:
    """
    按 ID 查询单个活动详情。

    SQL:
        SELECT * FROM activities WHERE row_id = ? OR id = ?
    """
    table = get_table("activities")
    pk_col = _find_col(table.columns, "row_id") or _find_col(table.columns, "id")
    if pk_col is None:
        return None

    stmt = select(table).where(pk_col == activity_id)
    with engine.connect() as conn:
        row = conn.execute(stmt).mappings().first()
    if not row:
        return None
    d = _row_to_dict(row)
    _enrich_activity(d)
    return d


def _enrich_activity(d: dict) -> None:
    """为活动 dict 添加海报 URL 等增强字段"""
    pic_group_raw = d.get("picGroup")
    poster_urls = []
    if isinstance(pic_group_raw, str):
        try:
            pic_group = json.loads(pic_group_raw)
            for pg in pic_group:
                pic_id = pg.get("picId") if isinstance(pg, dict) else None
                if pic_id:
                    # 尝试 Aceship CDN 路径（activity 目录）
                    poster_urls.append(
                        f"https://cdn.jsdelivr.net/gh/Aceship/Arknight-Images/activity/{pic_id}.png"
                    )
        except json.JSONDecodeError:
            pass
    d["posterUrls"] = poster_urls


def _find_col(columns, field_name: str):
    for col in columns:
        col_name = str(col.name).lower().replace("_", "")
        if col_name == field_name.lower():
            return col
    return None


def _row_to_dict(row) -> dict[str, Any]:
    return dict(row)
