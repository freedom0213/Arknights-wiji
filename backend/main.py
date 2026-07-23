"""
Arknights Wiji - FastAPI 应用入口
启动命令: uvicorn main:app --reload
API 文档: http://localhost:8000/docs (Swagger UI)
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import reflect_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理
    FastAPI 的 lifespan（生命周期）：在应用启动时执行初始化，关闭时执行清理。
    类似 Java Spring 的 @PostConstruct / @PreDestroy。
    """
    # 启动时：反射数据库表结构
    print("[启动] 反射数据库表结构...")
    tables = reflect_tables()
    print(f"[启动] 发现 {len(tables)} 个表: {', '.join(tables.keys())}")
    yield
    # 关闭时：无特殊清理
    print("[关闭] 应用停止")


app = FastAPI(
    title="Arknights Wiji API",
    description="明日方舟 Wiki 数据查询 API - 干员、关卡、敌人、材料",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS 配置：允许前端跨域请求
# 开发时前端在 localhost:5173，部署后前端在 Vercel 域名
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境可限制为具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """健康检查端点：确认后端正常运行"""
    tables = reflect_tables()
    has_char_skins = "char_skins" in tables
    return {
        "status": "ok",
        "version": "0.1.0",
        "tables": list(tables.keys()),
        "has_char_skins": has_char_skins,
    }


# 注册路由
from routers import operators, enemies, stages, materials, skills, search, skins, activities
app.include_router(operators.router, prefix="/api", tags=["干员"])
app.include_router(enemies.router, prefix="/api", tags=["敌人"])
app.include_router(stages.router, prefix="/api", tags=["关卡"])
app.include_router(materials.router, prefix="/api", tags=["材料"])
app.include_router(skills.router, prefix="/api", tags=["技能"])
app.include_router(search.router, prefix="/api", tags=["搜索"])
app.include_router(skins.router, prefix="/api", tags=["时装"])
app.include_router(activities.router, prefix="/api", tags=["活动"])
