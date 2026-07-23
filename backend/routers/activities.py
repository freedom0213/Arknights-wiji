"""活动一览 API 路由"""
from fastapi import APIRouter, HTTPException, Query

from services.activity_service import get_activity_by_id, list_activities

router = APIRouter()


@router.get("/activities")
async def api_list_activities(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    display_type: str | None = Query(None, description="活动类型筛选: SIDESTORY / MINISTORY / BRANCHLINE"),
):
    """活动列表，按开始时间从新到旧排列"""
    return list_activities(page=page, page_size=page_size, display_type=display_type)


@router.get("/activities/{activity_id}")
async def api_get_activity(activity_id: str):
    """获取单个活动详情"""
    result = get_activity_by_id(activity_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"活动 '{activity_id}' 不存在")
    return result
