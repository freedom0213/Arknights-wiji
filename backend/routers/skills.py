"""
技能 API 路由 - /api/skills
"""
from fastapi import APIRouter, HTTPException

from services.skill_service import get_skill_by_id

router = APIRouter()


@router.get("/skills/{skill_id}")
async def skill_detail(skill_id: str):
    """获取单个技能的详情（含各等级名称、描述、SP消耗等）"""
    skill = get_skill_by_id(skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="技能不存在")
    return skill
