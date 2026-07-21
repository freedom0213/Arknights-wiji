"""
技能查询服务 - 查询 skills 表的技能详情（名称、描述、SP消耗等）
"""
import json
from typing import Any

from sqlalchemy import select

from database import engine, get_table


def get_skill_by_id(skill_id: str) -> dict[str, Any] | None:
    """
    按 ID 查询技能详情，解析 JSON 字段。

    SQL 等价:
        SELECT * FROM skills WHERE id = ?
    """
    table = get_table("skills")
    stmt = select(table).where(table.c.id == skill_id)
    with engine.connect() as conn:
        row = conn.execute(stmt).mappings().first()
    if not row:
        return None
    result = dict(row)
    # levels 存储为 JSON 字符串，解析为列表
    if "levels" in result and isinstance(result["levels"], str):
        try:
            result["levels"] = json.loads(result["levels"])
        except json.JSONDecodeError:
            pass
    return result
