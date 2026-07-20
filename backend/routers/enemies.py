"""敌人 API 路由"""
from fastapi import APIRouter, HTTPException, Query

from services.enemy_service import (
    get_enemy_by_id,
    get_enemy_stage_stats,
    list_enemies,
    search_enemies,
)

router = APIRouter()


@router.get("/enemies")
async def api_list_enemies(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    enemy_type: str | None = Query(None, description="敌人类型筛选: 普通/精英/Boss"),
):
    """获取敌人图鉴列表"""
    try:
        return list_enemies(page=page, page_size=page_size, enemy_type=enemy_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/enemies/search")
async def api_search_enemies(
    q: str = Query(..., min_length=1, description="搜索关键词（敌人名）"),
    limit: int = Query(20, ge=1, le=100, description="返回数量上限"),
):
    """按名称搜索敌人"""
    return search_enemies(query=q, limit=limit)


@router.get("/enemies/{enemy_id}")
async def api_get_enemy(enemy_id: str):
    """获取单个敌人详情"""
    result = get_enemy_by_id(enemy_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"敌人 '{enemy_id}' 不存在")
    return result


@router.get("/enemies/{enemy_id}/stages")
async def api_get_enemy_stages(enemy_id: str):
    """查询该敌人在各关卡中的具体属性"""
    return get_enemy_stage_stats(enemy_id)
