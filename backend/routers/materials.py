"""材料 API 路由"""
from fastapi import APIRouter, HTTPException, Query

from services.material_service import get_item_by_id, get_items_batch, search_items

router = APIRouter()


@router.get("/materials/search")
async def api_search_materials(
    q: str = Query(..., min_length=1, description="搜索关键词（材料名）"),
    limit: int = Query(20, ge=1, le=100, description="返回数量上限"),
):
    """按名称搜索材料/物品"""
    return search_items(query=q, limit=limit)


@router.get("/materials/batch")
async def api_get_materials_batch(
    ids: str = Query(..., min_length=1, description="逗号分隔的材料ID列表，如 3303,30054,31013"),
):
    """批量获取材料/物品信息，返回 {id: item} 映射"""
    id_list = [i.strip() for i in ids.split(",") if i.strip()]
    return get_items_batch(id_list)


@router.get("/materials/{item_id}")
async def api_get_material(item_id: str):
    """获取材料/物品详情"""
    result = get_item_by_id(item_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"材料 '{item_id}' 不存在")
    return result
