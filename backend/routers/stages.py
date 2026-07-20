"""关卡 API 路由"""
from fastapi import APIRouter, HTTPException, Query

from services.stage_service import (
    get_open_stages_today,
    get_stage_by_id,
    get_weekly_schedule,
    list_stages,
    list_zones,
    search_stages,
)

router = APIRouter()


@router.get("/stages")
async def api_list_stages(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    zone_id: str | None = Query(None, description="按章节/区域筛选"),
    stage_type: str | None = Query(None, description="关卡类型筛选"),
):
    """获取关卡列表"""
    try:
        return list_stages(
            page=page, page_size=page_size, zone_id=zone_id, stage_type=stage_type
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stages/search")
async def api_search_stages(
    q: str = Query(..., min_length=1, description="搜索关键词"),
    limit: int = Query(20, ge=1, le=100, description="返回数量上限"),
):
    """按名称或关卡代码搜索关卡"""
    return search_stages(query=q, limit=limit)


@router.get("/stages/today")
async def api_stages_today():
    """获取今日开放的资源收集关卡"""
    stages = get_open_stages_today()
    schedule = get_weekly_schedule()
    return {"today": schedule["today"], "open_stages": stages}


@router.get("/stages/weekly-schedule")
async def api_weekly_schedule():
    """获取本周关卡轮换日程表"""
    return get_weekly_schedule()


@router.get("/stages/{stage_id}")
async def api_get_stage(stage_id: str):
    """获取单个关卡详情"""
    result = get_stage_by_id(stage_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"关卡 '{stage_id}' 不存在")
    return result


@router.get("/zones")
async def api_list_zones():
    """获取所有章节/区域列表"""
    return list_zones()
