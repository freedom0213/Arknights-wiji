"""
干员查询服务 - 处理 operators 表的业务逻辑
使用 SQLAlchemy Core 执行查询（不是 ORM Session），
每次操作都会注明对应的 SQL 语句。
"""
from typing import Any

from sqlalchemy import select, text
from sqlalchemy.engine import Engine

from database import engine, get_table


def list_operators(
    page: int = 1,
    page_size: int = 20,
    rarity: int | None = None,
    profession: str | None = None,
    sub_profession: str | None = None,
    position: str | None = None,
) -> dict[str, Any]:
    """
    分页查询干员列表，支持按稀有度/职业/分支/位置筛选。

    SQL 等价:
        SELECT * FROM operators
        WHERE rarity >= ?
          AND (profession = ? OR ? IS NULL)
        ORDER BY rarity DESC, id
        LIMIT ? OFFSET ?
    """
    table = get_table("operators")
    cols = table.columns

    # 构建查询条件
    conditions = []
    if rarity is not None:
        # rarity 存储为 TEXT 格式: "TIER_1" ~ "TIER_6"
        # 精确匹配指定稀有度
        rarity_col = _find_col(cols, "rarity")
        if rarity_col is not None:
            conditions.append(rarity_col == f"TIER_{rarity}")
    if profession:
        prof_col = _find_col(cols, "profession")
        if prof_col is not None:
            conditions.append(prof_col == profession.upper())
    if sub_profession:
        sub_col = _find_col(cols, "subProfessionId")
        if sub_col is not None:
            conditions.append(sub_col == sub_profession)
    if position:
        pos_col = _find_col(cols, "position")
        if pos_col is not None:
            conditions.append(pos_col == position.upper())

    # 计数
    count_stmt = select(text("COUNT(*)")).select_from(table)
    if conditions:
        count_stmt = count_stmt.where(*conditions)
    with engine.connect() as conn:
        total = conn.execute(count_stmt).scalar() or 0

    # 查询数据
    stmt = select(table).order_by(text("rarity DESC, id"))
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


def get_operator_by_id(operator_id: str) -> dict[str, Any] | None:
    """
    按 ID 查询单个干员详情。

    SQL 等价:
        SELECT * FROM operators WHERE id = ?
    """
    table = get_table("operators")
    stmt = select(table).where(table.c.id == operator_id)
    with engine.connect() as conn:
        row = conn.execute(stmt).mappings().first()
    return _row_to_dict(row) if row else None


def search_operators(query: str, limit: int = 20) -> list[dict[str, Any]]:
    """
    按名称模糊搜索干员。

    SQL 等价:
        SELECT * FROM operators WHERE name LIKE '%query%' LIMIT ?
    """
    table = get_table("operators")
    # 找到 name 列
    name_col = _find_col(table.columns, "name")
    if name_col is None:
        return []
    stmt = select(table).where(name_col.like(f"%{query}%")).limit(limit)
    with engine.connect() as conn:
        rows = conn.execute(stmt).mappings().all()
    return [_row_to_dict(r) for r in rows]


def get_operator_materials(operator_id: str) -> dict[str, Any]:
    """
    获取干员所需的所有材料汇总：精英化材料 + 技能升级材料 + 模组材料。
    从 operators 表的 JSON 字段中解析。
    """
    op = get_operator_by_id(operator_id)
    if not op:
        return {"error": "干员不存在"}

    import json
    result: dict[str, Any] = {"operator_id": operator_id}

    # 精英化材料（phases 字段，存储为 JSON 字符串）
    phases_raw = op.get("phases")
    if phases_raw and isinstance(phases_raw, str):
        result["phases"] = json.loads(phases_raw)

    # 技能相关数据
    skills_raw = op.get("skills")
    if skills_raw and isinstance(skills_raw, str):
        result["skills"] = json.loads(skills_raw)

    # 技能升级材料
    skill_lvl_raw = op.get("allSkillLvlup")
    if skill_lvl_raw and isinstance(skill_lvl_raw, str):
        result["skill_level_up"] = json.loads(skill_lvl_raw)

    # 模组数据
    equip_raw = op.get("equip")
    if equip_raw and isinstance(equip_raw, str):
        result["equip"] = json.loads(equip_raw)

    return result


# ============================================================
# 内部工具函数
# ============================================================

def _find_col(columns, field_name: str):
    """
    在动态列中按名称查找列对象。
    因为 sync 脚本可能给列名加后缀（如 class_），
    需要模糊匹配。
    """
    for col in columns:
        col_name = str(col.name).lower().replace("_", "")
        if col_name == field_name.lower():
            return col
    return None


def _row_to_dict(row) -> dict[str, Any]:
    """将查询结果行转为普通 dict"""
    return dict(row)
