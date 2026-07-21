"""全站搜索 API 路由"""
from fastapi import APIRouter, Query

from services.search_service import search_all

router = APIRouter()


@router.get("/search")
async def api_search_all(
    q: str = Query(..., min_length=1, description="搜索关键词"),
    limit: int = Query(5, ge=1, le=20, description="每类返回上限"),
):
    """全站搜索：干员名、敌人名、关卡编号/名称"""
    return search_all(query=q, limit=limit)
