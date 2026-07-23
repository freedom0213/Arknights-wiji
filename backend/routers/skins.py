"""皮肤（时装回廊）API 路由"""
from fastapi import APIRouter, HTTPException, Query

from services.skin_service import get_brand_skins_grouped, get_skin_by_id, list_brand_skins

router = APIRouter()


@router.get("/skins")
async def api_list_skins(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(50, ge=1, le=200, description="每页数量"),
):
    """品牌皮肤列表（排除默认立绘），按上线时间从新到旧"""
    return list_brand_skins(page=page, page_size=page_size)


@router.get("/skins/grouped")
async def api_list_skins_grouped():
    """品牌皮肤按上线日期分组（全部返回，不分页）"""
    return get_brand_skins_grouped()


@router.get("/skins/{skin_id}")
async def api_get_skin(skin_id: str):
    """获取单个皮肤详情"""
    result = get_skin_by_id(skin_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"皮肤 '{skin_id}' 不存在")
    return result
