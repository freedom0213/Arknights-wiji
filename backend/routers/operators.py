"""
干员 API 路由 - 提供干员相关的 REST API 端点

FastAPI Router 是什么？
- 类似于 Java Spring 的 @RestController
- 把一组相关的 API 端点组织在一起
- 可以挂载到主应用上，带统一前缀
"""
from fastapi import APIRouter, HTTPException, Query

from services.operator_service import (
    get_operator_by_id,
    get_operator_materials,
    list_operators,
    search_operators,
)

router = APIRouter()


@router.get("/operators")
async def api_list_operators(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    rarity: int | None = Query(None, ge=1, le=6, description="最低稀有度筛选"),
    profession: str | None = Query(None, description="职业筛选: WARRIOR/SNIPER/MEDIC/..."),
    sub_profession: str | None = Query(None, description="分支筛选"),
    position: str | None = Query(None, description="位置筛选: MELEE/RANGED"),
):
    """
    获取干员列表，支持分页和多条件筛选。

    类似 Java 的:
        @GetMapping("/operators")
        public Page<Operator> listOperators(...)
    """
    try:
        return list_operators(
            page=page,
            page_size=page_size,
            rarity=rarity,
            profession=profession,
            sub_profession=sub_profession,
            position=position,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/operators/search")
async def api_search_operators(
    q: str = Query(..., min_length=1, description="搜索关键词（干员名）"),
    limit: int = Query(20, ge=1, le=100, description="返回数量上限"),
):
    """按名称搜索干员"""
    return search_operators(query=q, limit=limit)


@router.get("/operators/{operator_id}")
async def api_get_operator(operator_id: str):
    """获取单个干员详情"""
    result = get_operator_by_id(operator_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"干员 '{operator_id}' 不存在")
    return result


@router.get("/operators/{operator_id}/materials")
async def api_get_operator_materials(operator_id: str):
    """
    获取干员所需材料汇总：
    - 精英化材料
    - 技能升级材料
    - 模组升级材料
    """
    result = get_operator_materials(operator_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
