"""
干员皮肤图片服务 - 从 char_skins 表查询皮肤数据并拼接 CDN URL
使用社区免费 CDN，无需自建图片存储。
"""
import json
from typing import Any

from sqlalchemy import select, text
from database import engine, get_table

# 社区免费 CDN 基础地址（jsDelivr：国内可访问的 GitHub 镜像加速）
CDN_PORTRAIT = "https://cdn.jsdelivr.net/gh/yuanyan3060/ArknightsGameResource"
CDN_ILLUST = "https://cdn.jsdelivr.net/gh/Aceship/Arknight-Images"


def _get_skins_by_char(char_id: str) -> list[dict[str, Any]]:
    """
    查询某干员的所有皮肤记录，解析 displaySkin JSON。
    SQL: SELECT * FROM char_skins WHERE charId = ?
    """
    table = get_table("char_skins")
    stmt = select(table).where(table.c.charId == char_id)
    with engine.connect() as conn:
        rows = conn.execute(stmt).mappings().all()
    results = []
    for r in rows:
        d = dict(r)
        # 解析 displaySkin JSON 获取 skinGroupId
        ds_raw = d.get("displaySkin")
        if isinstance(ds_raw, str):
            try:
                d["_displaySkin"] = json.loads(ds_raw)
            except json.JSONDecodeError:
                d["_displaySkin"] = {}
        elif isinstance(ds_raw, dict):
            d["_displaySkin"] = ds_raw
        else:
            d["_displaySkin"] = {}
        results.append(d)
    return results


def get_operator_images(char_id: str) -> dict[str, Any]:
    """
    返回干员所有图片 URL，含 E0/E2 立绘。

    返回结构:
    {
        "avatarUrl": str | None,
        "defaultPortraitUrl": str | None,   # E0 半身像
        "e2PortraitUrl": str | None,        # E2 半身像
        "e0IllustUrl": str | None,          # E0 完整立绘 (Aceship CDN)
        "e2IllustUrl": str | None,          # E2 完整立绘 (Aceship CDN)
    }
    """
    skins = _get_skins_by_char(char_id)
    result: dict[str, Any] = {}

    for s in skins:
        sgid = s["_displaySkin"].get("skinGroupId", "")
        avatar_id = s.get("avatarId")
        portrait_id = s.get("portraitId")

        if sgid == "ILLUST_0":
            if avatar_id and "avatarUrl" not in result:
                result["avatarUrl"] = f"{CDN_PORTRAIT}/avatar/{avatar_id}.png"
            if portrait_id:
                result["defaultPortraitUrl"] = f"{CDN_PORTRAIT}/portrait/{portrait_id}.png"

        elif sgid == "ILLUST_2":
            if portrait_id:
                result["e2PortraitUrl"] = f"{CDN_PORTRAIT}/portrait/{portrait_id}.png"

    # E0/E2 完整立绘（Aceship CDN：{charId}_{n}.png）
    result["e0IllustUrl"] = f"{CDN_ILLUST}/characters/{char_id}_1.png"
    result["e2IllustUrl"] = f"{CDN_ILLUST}/characters/{char_id}_2.png"

    return result


def get_enemy_image_url(enemy_id: str) -> str:
    """拼接敌人图片 CDN URL"""
    return f"{CDN_PORTRAIT}/enemy/{enemy_id}.png"
