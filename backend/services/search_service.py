"""
全站搜索服务 - 跨表搜索干员、敌人、关卡数据
"""
from sqlalchemy import select, or_

from database import engine, get_table


def search_all(query: str, limit: int = 5) -> dict:
    """
    全站搜索：在 operators、enemies、stages 三张表中模糊搜索。

    SQL 等价:
        SELECT id, name, rarity FROM operators WHERE name LIKE '%q%' LIMIT 5
        SELECT id, name, enemyLevel FROM enemies WHERE name LIKE '%q%' LIMIT 5
        SELECT id, code, name, apCost FROM stages WHERE code LIKE '%q%' OR name LIKE '%q%' LIMIT 5
    """
    result: dict = {"operators": [], "enemies": [], "stages": []}

    # 搜索干员
    try:
        op_table = get_table("operators")
        op_cols = op_table.columns
        op_name_col = _find_col(op_cols, "name")
        op_id_col = _find_col(op_cols, "id")
        op_rarity_col = _find_col(op_cols, "rarity")
        if op_name_col is not None and op_id_col is not None:
            stmt = (
                select(op_id_col, op_name_col, op_rarity_col)
                .where(op_name_col.ilike(f"%{query}%"))
                .limit(limit)
            )
            with engine.connect() as conn:
                rows = conn.execute(stmt).fetchall()
                result["operators"] = [
                    {"id": r[0], "name": r[1], "rarity": r[2] if op_rarity_col is not None else None}
                    for r in rows
                ]
    except Exception:
        pass  # 表不存在则跳过

    # 搜索敌人
    try:
        en_table = get_table("enemies")
        en_cols = en_table.columns
        en_name_col = _find_col(en_cols, "name")
        en_id_col = _find_col(en_cols, "id")
        en_level_col = _find_col(en_cols, "enemyLevel")
        if en_name_col is not None and en_id_col is not None:
            stmt = (
                select(en_id_col, en_name_col, en_level_col)
                .where(en_name_col.ilike(f"%{query}%"))
                .limit(limit)
            )
            with engine.connect() as conn:
                rows = conn.execute(stmt).fetchall()
                result["enemies"] = [
                    {"id": r[0], "name": r[1], "enemyLevel": r[2] if en_level_col is not None else None}
                    for r in rows
                ]
    except Exception:
        pass

    # 搜索关卡（按 code 或 name）
    try:
        st_table = get_table("stages")
        st_cols = st_table.columns
        st_code_col = _find_col(st_cols, "code")
        st_name_col = _find_col(st_cols, "name")
        st_id_col = _find_col(st_cols, "id")
        st_ap_col = _find_col(st_cols, "apCost")
        if st_id_col is not None:
            conditions = []
            if st_code_col is not None:
                conditions.append(st_code_col.ilike(f"%{query}%"))
            if st_name_col is not None:
                conditions.append(st_name_col.ilike(f"%{query}%"))
            if conditions:
                stmt = (
                    select(st_id_col, st_code_col, st_name_col, st_ap_col)
                    .where(or_(*conditions))
                    .limit(limit)
                )
                with engine.connect() as conn:
                    rows = conn.execute(stmt).fetchall()
                    result["stages"] = [
                        {
                            "id": r[0],
                            "code": r[1] if st_code_col is not None else None,
                            "name": r[2] if st_name_col is not None else None,
                            "apCost": r[3] if st_ap_col is not None else None,
                        }
                        for r in rows
                    ]
    except Exception:
        pass

    return result


def _find_col(cols, *names):
    """在列集合中按多个候选名查找列，返回第一个匹配的"""
    for name in names:
        for col in cols:
            if col.name == name:
                return col
    return None
