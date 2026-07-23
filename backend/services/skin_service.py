"""
干员皮肤图片服务 - 从 char_skins 表查询皮肤数据并拼接 CDN URL
使用社区免费 CDN，无需自建图片存储。
"""
import json
from collections import OrderedDict
from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote

from sqlalchemy import select, text
from database import engine, get_table

# 社区免费 CDN 基础地址（jsDelivr：国内可访问的 GitHub 镜像加速）
CDN_PORTRAIT = "https://cdn.jsdelivr.net/gh/yuanyan3060/ArknightsGameResource"
CDN_ILLUST = "https://cdn.jsdelivr.net/gh/Aceship/Arknight-Images"


def _encode_cdn_id(raw: str | None) -> str | None:
    """URL 编码 ID 中的特殊字符（# 号等），确保浏览器正确解析 CDN 路径"""
    if not raw:
        return None
    # 对 # 号进行百分号编码，避免浏览器将 # 之后的内容当作 URL fragment
    return quote(raw, safe="")


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


def _parse_display_skin(row: dict) -> dict[str, Any]:
    """解析 char_skins 行中的 displaySkin JSON 字段"""
    ds_raw = row.get("displaySkin")
    if isinstance(ds_raw, str):
        try:
            return json.loads(ds_raw)
        except json.JSONDecodeError:
            return {}
    elif isinstance(ds_raw, dict):
        return ds_raw
    return {}


def list_brand_skins(
    page: int = 1,
    page_size: int = 50,
) -> dict[str, Any]:
    """
    品牌皮肤列表（排除默认立绘 ILLUST_0/1/2），按 getTime DESC 排序。

    SQL 等价:
        SELECT * FROM char_skins
        WHERE displaySkin 包含非默认 skinGroupId
        ORDER BY getTime DESC LIMIT ? OFFSET ?
    """
    table = get_table("char_skins")
    # 查全部 char_skins，在 Python 中过滤和解析 JSON
    with engine.connect() as conn:
        rows = conn.execute(select(table)).mappings().all()

    # 过滤品牌皮肤：排除 ILLUST_0/1/2 和空 skinGroupId
    brand_skins = []
    for r in rows:
        d = dict(r)
        ds = _parse_display_skin(d)
        sgid = ds.get("skinGroupId", "")
        if sgid in ("ILLUST_0", "ILLUST_1", "ILLUST_2", ""):
            continue
        # 组装返回字段
        brand_skins.append(_build_skin_item(d, ds))

    # 按 getTime DESC 排序（未知时间排最后）
    brand_skins.sort(key=lambda s: s.get("getTime", 0) or 0, reverse=True)

    total = len(brand_skins)
    offset = (page - 1) * page_size
    items = brand_skins[offset:offset + page_size]

    return {"total": total, "page": page, "page_size": page_size, "items": items}


def get_brand_skins_grouped() -> dict[str, Any]:
    """
    返回全部品牌皮肤，按上线日期（YYYY-MM-DD）分组，最新日期在前。

    返回结构:
        {
            "total_skins": 585,
            "total_groups": 73,
            "groups": [
                {"date": "2026-07-10", "skins": [skin1, skin2]},
                ...
            ]
        }
    """
    table = get_table("char_skins")
    with engine.connect() as conn:
        rows = conn.execute(select(table)).mappings().all()

    # 过滤品牌皮肤 + 组装数据
    brand_skins = []
    for r in rows:
        d = dict(r)
        ds = _parse_display_skin(d)
        sgid = ds.get("skinGroupId", "")
        if sgid in ("ILLUST_0", "ILLUST_1", "ILLUST_2", ""):
            continue
        brand_skins.append(_build_skin_item(d, ds))

    # 按 getTime DESC 排序
    brand_skins.sort(key=lambda s: s.get("getTime", 0) or 0, reverse=True)

    # 按日期字符串分组（OrderedDict 保证插入顺序）
    groups_map: OrderedDict[str, list] = OrderedDict()
    for skin in brand_skins:
        ts = skin.get("getTime", 0) or 0
        if ts > 0:
            dt = datetime.fromtimestamp(ts, tz=timezone.utc)
            date_str = dt.strftime("%Y-%m-%d")
        else:
            date_str = "未知"
        groups_map.setdefault(date_str, []).append(skin)

    groups = [{"date": d, "skins": s} for d, s in groups_map.items()]

    return {
        "total_skins": len(brand_skins),
        "total_groups": len(groups),
        "groups": groups,
    }


def get_skin_by_id(skin_id: str) -> dict[str, Any] | None:
    """
    按 ID 查询单个皮肤详情。

    SQL 等价:
        SELECT * FROM char_skins WHERE id = ?
    """
    table = get_table("char_skins")
    stmt = select(table).where(table.c.id == skin_id)
    with engine.connect() as conn:
        row = conn.execute(stmt).mappings().first()
    if not row:
        return None
    d = dict(row)
    ds = _parse_display_skin(d)
    return _build_skin_item(d, ds)


def _build_skin_item(row: dict, ds: dict) -> dict[str, Any]:
    """组装单个皮肤返回数据，拼接 CDN 图片 URL"""
    char_id = row.get("charId", "")
    portrait_id = row.get("portraitId")
    avatar_id = row.get("avatarId")
    illust_id = row.get("illustId")
    sp_illust_id = row.get("spIllustId")
    sp_portrait_id = row.get("spPortraitId")
    dyn_illust_id = row.get("dynIllustId")
    dyn_entrance_id = row.get("dynEntranceId")

    # 编码特殊字符（# → %23），避免浏览器截断 URL
    enc_portrait = _encode_cdn_id(portrait_id)
    enc_avatar = _encode_cdn_id(avatar_id)
    enc_illust = _encode_cdn_id(illust_id)

    item = {
        "id": row.get("id"),
        "skinId": row.get("skinId"),
        "charId": char_id,
        "skinName": ds.get("skinName"),
        "skinGroupId": ds.get("skinGroupId"),
        "skinGroupName": ds.get("skinGroupName"),
        "skinGroupSortIndex": ds.get("skinGroupSortIndex"),
        "content": ds.get("content"),
        "dialog": ds.get("dialog"),
        "usage": ds.get("usage"),
        "description": ds.get("description"),
        "drawerList": ds.get("drawerList") or [],
        "designerList": ds.get("designerList") or [],
        "colorList": ds.get("colorList") or [],
        "titleList": ds.get("titleList") or [],
        "displayTagId": ds.get("displayTagId"),
        "obtainApproach": ds.get("obtainApproach"),
        "sortId": ds.get("sortId"),
        "getTime": ds.get("getTime", 0),
        "onYear": ds.get("onYear", 0),
        "onPeriod": ds.get("onPeriod", 0),
        "modelName": ds.get("modelName"),
        "isBuySkin": row.get("isBuySkin"),
        "buildingId": row.get("buildingId"),
        "voiceType": row.get("voiceType"),
        "battleSkin": row.get("battleSkin"),
    }

    # 图片 URL（yuanyan3060 CDN — 半身像 / 头像）
    if enc_portrait:
        item["portraitUrl"] = f"{CDN_PORTRAIT}/portrait/{enc_portrait}.png"
    else:
        item["portraitUrl"] = None
    if enc_avatar:
        item["avatarUrl"] = f"{CDN_PORTRAIT}/avatar/{enc_avatar}.png"
    else:
        item["avatarUrl"] = None

    # yuanyan3060 CDN — 缺省皮肤立绘（已验证不存在，置空）
    if enc_illust:
        item["illustUrl"] = f"{CDN_PORTRAIT}/illust/{enc_illust}.png"
    else:
        item["illustUrl"] = None

    # Aceship CDN — 皮肤完整立绘（已验证可用，使用 portraitId 作为文件名）
    if enc_portrait:
        item["illustUrlAceship"] = f"{CDN_ILLUST}/characters/{enc_portrait}.png"
    else:
        item["illustUrlAceship"] = None

    # 动态 / 特殊皮肤立绘 URL
    if sp_illust_id:
        item["spIllustUrl"] = f"{CDN_PORTRAIT}/illust/{_encode_cdn_id(sp_illust_id)}.png"
    else:
        item["spIllustUrl"] = None
    if sp_portrait_id:
        item["spPortraitUrl"] = f"{CDN_PORTRAIT}/portrait/{_encode_cdn_id(sp_portrait_id)}.png"
    else:
        item["spPortraitUrl"] = None
    if dyn_illust_id:
        item["dynIllustUrl"] = f"{CDN_PORTRAIT}/illust/{_encode_cdn_id(dyn_illust_id)}.png"
    else:
        item["dynIllustUrl"] = None
    if dyn_entrance_id:
        item["dynEntranceUrl"] = f"{CDN_PORTRAIT}/portrait/{_encode_cdn_id(dyn_entrance_id)}.png"
    else:
        item["dynEntranceUrl"] = None

    return item
