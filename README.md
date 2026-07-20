# ArkWiji - 明日方舟 Wiki 数据查询

基于 ArknightsGameData 的明日方舟干员/关卡/敌人数据查询网站。

> **免责声明**：非官方应用。数据来源于 [Kengxxiao/ArknightsGameData](https://github.com/Kengxxiao/ArknightsGameData)，版权归鹰角网络所有。

## 功能

- ◆ **干员图鉴**：1317 名干员属性、技能、天赋、晋升材料
- ◈ **关卡列表**：3452 个关卡数据、章节筛选
- ⬖ **敌人图鉴**：1709 个敌人信息、等级分类

## 技术栈

- **后端**: Python + FastAPI + SQLite + SQLAlchemy
- **前端**: React 18 + TypeScript + Tailwind CSS + Vite
- **数据源**: Kengxxiao/ArknightsGameData (GitHub)

## 本地运行

### 1. 克隆数据
```bash
git clone --depth 1 https://github.com/Kengxxiao/ArknightsGameData.git data/GameData
```

### 2. 同步数据
```bash
pip install requests
python scripts/sync_data.py
```

### 3. 启动后端
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# API 文档: http://localhost:8000/docs
```

### 4. 启动前端
```bash
cd frontend
npm install
npm run dev
# 访问: http://localhost:5173
```

## 部署

- **后端**: Railway.app（免费）
- **前端**: Vercel.com（免费）
