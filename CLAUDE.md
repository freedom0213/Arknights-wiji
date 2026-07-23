# Arknights Wiji - 明日方舟 Wiki 数据查询

## 项目概述

基于 ArknightsGameData 的明日方舟干员/关卡/敌人数据查询网站。非官方应用，数据版权归鹰角网络所有。

- **线上地址**: 前端 Vercel + 后端 Railway
- **数据源**: [Kengxxiao/ArknightsGameData](https://github.com/Kengxxiao/ArknightsGameData) (GitHub)

## 技术栈

| 层 | 技术 |
|---|------|
| 后端 | Python 3.x + FastAPI + SQLAlchemy Core + SQLite |
| 前端 | React 19 + TypeScript 6 + Tailwind CSS 4 + Vite 8 |
| 数据查询 | @tanstack/react-query |
| 路由 | react-router-dom v7 |
| 图片 CDN | jsDelivr（社区免费 CDN，国内可访问） |
| 部署 | Railway（后端）+ Vercel（前端） |

## 目录结构

```
Arknights-wiji/
├── Procfile              # Railway 启动命令（从 git 根运行）
├── data/
│   └── arknights.db      # 本地开发用数据库（~38MB，含 char_skins 表）
├── scripts/
│   └── sync_data.py      # 数据同步脚本：解析 GameData JSON → SQLite
├── backend/
│   ├── main.py           # FastAPI 应用入口，路由注册，CORS 配置
│   ├── database.py       # 数据库连接、反射、路径查找
│   ├── requirements.txt  # fastapi, uvicorn, sqlalchemy
│   ├── runtime.txt       # Python 版本声明（Railway 使用）
│   ├── data/
│   │   └── arknights.db  # Railway 实际使用的数据库（与 git 根 data/ 是两份！）
│   ├── routers/          # API 路由层（薄层，只做参数校验和 HTTP 状态码）
│   │   ├── operators.py  # /api/operators/*
│   │   ├── enemies.py    # /api/enemies/*
│   │   ├── stages.py     # /api/stages/*
│   │   ├── skills.py     # /api/skills/*
│   │   ├── materials.py  # /api/materials/*
│   │   └── search.py     # /api/search
│   ├── services/         # 业务逻辑层（SQLAlchemy Core 查询 + 数据组装）
│   │   ├── operator_service.py
│   │   ├── enemy_service.py
│   │   ├── stage_service.py
│   │   ├── skill_service.py
│   │   ├── material_service.py
│   │   ├── search_service.py
│   │   └── skin_service.py    # 干员/敌人图片 CDN URL 拼接
│   └── models/            # 预留目录（当前使用 SQLAlchemy 反射，无 model 文件）
├── frontend/
│   ├── vercel.json        # Vercel 配置：/api/* 代理到 Railway 后端
│   ├── vite.config.ts
│   └── src/
│       ├── api/client.ts  # 所有 API 请求函数 + TypeScript 类型定义
│       ├── components/    # 通用组件（Layout, Pagination, SearchDropdown, Skeleton, etc.）
│       ├── pages/         # 页面组件（HomePage, OperatorsPage, OperatorDetailPage, etc.）
│       └── hooks/         # 自定义 hooks（useDebounce）
└── jpgs/                  # 本地素材（不受 git 管理，.gitignore 排除）
```

## 数据库

### 表结构（由 sync_data.py 动态创建，SQLAlchemy 运行时反射读取）

| 表名 | 数据来源 | 记录数 |
|------|---------|--------|
| operators | character_table.json | ~1317 |
| skills | skill_table.json | - |
| items | item_table.json | - |
| stages | stage_table.json | ~3452 |
| zones | zone_table.json | - |
| campaigns | campaign_table.json | - |
| enemy_handbook | enemy_handbook_table.json | ~1709 |
| enemy_database | enemy_database.json | - |
| building_config | building_data.json | - |
| char_skins | skin_table.json | ~2306 |

### 关键：双数据库文件

**这是一个已知坑位，不要踩：**

| 文件路径 | 用途 | 谁在用 |
|----------|------|--------|
| `data/arknights.db` | git 根目录，本地开发用 | 本地 `uvicorn` |
| `backend/data/arknights.db` | backend 子目录 | **Railway 生产环境** |

- Railway 的 Nixpacks 构建系统以项目根为 app root，但只打包 `backend/` 下的文件
- 所以 Railway 实际使用的是 `backend/data/arknights.db`，不是 `data/arknights.db`
- **运行 `sync_data.py` 后，必须把数据库同步到 `backend/data/` 目录**
- 两个文件都需要提交到 git（.gitignore 只排除了 WAL/SHM 日志文件，不排除 .db 本身）

### 数据同步流程

```bash
# 1. 克隆/更新 GameData 仓库
git clone --depth 1 https://github.com/Kengxxiao/ArknightsGameData.git data/GameData

# 2. 运行同步脚本（解析 JSON → 写入 SQLite）
python scripts/sync_data.py

# 3. 同步到 Railway 使用的路径
cp data/arknights.db backend/data/arknights.db
```

`sync_data.py` 的处理方式：
- `flat`: 标准 `{id: {fields}}` 结构（operators, skills）
- `sub`: `data[sub_key]` 下是 `{id: {fields}}`（stages, items, enemy_handbook, char_skins）
- `list`: `data[sub_key]` 是 `[{...}]` 列表（enemy_database）
- `config`: 全局配置对象，存为 key-value 表（building_config）
- JSON 中的 dict/list 字段自动序列化为 TEXT 存储
- 列名中的特殊字符（如 `#`）替换为 `_`，SQLite 保留字（class, type, range）加 `_` 后缀

## 图片 CDN 机制

不使用自建图片存储，全部依赖社区免费 CDN：

| 图片类型 | CDN 基地址 | 路径格式 |
|---------|-----------|---------|
| 干员头像/半身像 | `cdn.jsdelivr.net/gh/yuanyan3060/ArknightsGameResource` | `/avatar/{avatarId}.png`, `/portrait/{portraitId}.png` |
| 敌人图片 | 同上 | `/enemy/{enemyId}.png` |
| 干员完整立绘 | `cdn.jsdelivr.net/gh/Aceship/Arknight-Images` | `/characters/{charId}_1.png` (E0), `_2.png` (E2) |

`skin_service.py` 的逻辑：
1. 从 `char_skins` 表查询干员的所有皮肤记录
2. 解析 `displaySkin` JSON 字段获取 `skinGroupId`
3. `ILLUST_0` → 默认立绘（头像 + E0 半身像）
4. `ILLUST_2` → 精英二立绘（E2 半身像）
5. Aceship CDN 拼接完整立绘 `{charId}_1.png` / `{charId}_2.png`

## 部署架构

```
用户浏览器
    │
    ▼
Vercel (前端静态资源) ─── /api/* 代理 ───► Railway (FastAPI 后端)
                                                 │
                                                 ▼
                                          SQLite (backend/data/arknights.db)
```

- **Vercel**: `frontend/vercel.json` 中的 rewrites 规则把 `/api/:path*` 代理到 Railway
- **Railway**: `Procfile`（项目根）执行 `uvicorn backend.main:app`，从 git 根目录运行
- **CORS**: 后端 `allow_origins=["*"]`

### Railway 部署细节

- **构建系统**: Nixpacks 自动检测 FastAPI
- **启动**: 项目根 `Procfile` → `web: uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **数据库路径查找优先级**（`database.py:_find_db_path()`）:
  1. 环境变量 `ARKNIGHTS_DB_PATH`（显式覆盖）
  2. `{git根}/data/arknights.db`
  3. `{backend}/data/arknights.db`
- **健康检查**: `GET /api/health` 返回 `{status, version, tables, has_char_skins}`

## 后端架构模式

采用 **Router → Service → Database** 三层结构：

- **routers/**: 薄层，只做参数校验（Query/Path 参数）和 HTTP 异常处理，不写业务逻辑
- **services/**: 业务逻辑层，使用 SQLAlchemy Core（不是 ORM Session）执行查询
  - 每个 `list_*` 函数返回 `{total, page, page_size, items}`
  - 每个 `get_*_by_id` 函数返回单个 dict 或 None
  - 使用 `_row_to_dict()` 将查询结果转为普通 dict
  - 使用 `_find_col()` 模糊匹配列名（因为 sync_data 可能修改列名）
- **database.py**: `reflect_tables()` 反射读取 SQLite 中所有表，`get_table()` 按名获取

## 关键注意事项 / 已知坑位

1. **双数据库文件**: 修改数据库时必须同时更新 `data/arknights.db` 和 `backend/data/arknights.db`，否则 Railway 上不生效
2. **Silent Exception**: `operator_service.py` 中图片 URL 获取包裹在 `try/except Exception: pass` 中，图片相关问题不会报错，调试时需要手动检查返回值
3. **SQLAlchemy 反射**: 表结构在运行时从 SQLite 自动发现，不需要手动定义 model 类
4. **列名清理**: `sync_data.py` 的 `clean_col()` 会修改列名（如 `class` → `class_`），查询时使用 `_find_col()` 模糊匹配
5. **Rarity 格式**: operators 表的 rarity 存储为 TEXT `"TIER_1"` ~ `"TIER_6"`，不是数字
6. **char_skins 表**: 不存在的干员（ID 不匹配）不会报错，只是不返回图片 URL

## 本地开发

```bash
# 后端
cd backend
pip install -r requirements.txt
uvicorn main:app --reload        # http://localhost:8000/docs

# 前端
cd frontend
npm install
npm run dev                      # http://localhost:5173

# 类型检查
cd frontend && npx tsc --noEmit
```

## 提交规范

- 提交前先本地验证 `npx tsc --noEmit` 通过
- 写完代码先自审再 commit（见 memory: code-review-before-commit）
- commit message 格式: `type: description`（如 `feat:`, `fix:`, `debug:`, `chore:`）
