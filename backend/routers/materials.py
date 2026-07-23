"""材料 API 路由"""
from fastapi import APIRouter, HTTPException, Query

from services.material_service import get_all_items, get_item_by_id, get_items_batch, list_items, search_items

router = APIRouter()


@router.get("/materials")
async def api_list_materials(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(200, ge=1, le=2000, description="每页数量"),
    item_type: str | None = Query(None, description="物品类型筛选"),
    classify_type: str | None = Query(None, description="分类筛选"),
):
    """分页查询材料/物品列表，支持类型筛选"""
    return list_items(page=page, page_size=page_size, item_type=item_type, classify_type=classify_type)


@router.get("/materials/all")
async def api_get_all_materials(
    classify_type: str | None = Query(None, description="分类筛选"),
):
    """全量返回材料列表（不分页），供图片网格展示"""
    return get_all_items(classify_type=classify_type)


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
