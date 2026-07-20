"""
Arknights Wiji - 数据同步脚本 v2
从 ArknightsGameData 本地 git 仓库解析 JSON 并写入 SQLite 数据库。

数据来源: Kengxxiao/ArknightsGameData (GitHub, GPL-3.0)

使用方法:
  首次: git clone --depth 1 https://github.com/Kengxxiao/ArknightsGameData.git data/GameData
  每次更新: python scripts/sync_data.py
"""

import json
import sqlite3
import subprocess
import sys
from pathlib import Path
from typing import Any

# ============================================================
# 配置
# ============================================================
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
GAMEDATA_DIR = DATA_DIR / "GameData"
GAMEDATA_REPO = "https://github.com/Kengxxiao/ArknightsGameData.git"
DB_PATH = DATA_DIR / "arknights.db"

# 文件处理定义: (仓库内路径, 表名, 数据所在子键, 处理器类型)
# 处理器: "flat" = {id: data}, "sub" = data[subkey] 是 {id: data}, "list" = data[subkey] 是 [{...}]
FILE_DEFS = [
    # 干员: 标准 {charId: {fields}} 结构
    ("zh_CN/gamedata/excel/character_table.json", "operators", None, "flat"),
    # 技能: {skillId: {fields}}
    ("zh_CN/gamedata/excel/skill_table.json", "skills", None, "flat"),
    # 物品: 嵌套在 data["items"] 下
    ("zh_CN/gamedata/excel/item_table.json", "items", "items", "sub"),
    # 关卡: 嵌套在 data["stages"] 下
    ("zh_CN/gamedata/excel/stage_table.json", "stages", "stages", "sub"),
    # 章节: 嵌套在 data["zones"] 下
    ("zh_CN/gamedata/excel/zone_table.json", "zones", "zones", "sub"),
    # 战役/轮换: 嵌套在 data["campaigns"] 下
    ("zh_CN/gamedata/excel/campaign_table.json", "campaigns", "campaigns", "sub"),
    # 敌人图鉴: 嵌套在 data["enemyData"] 下
    ("zh_CN/gamedata/excel/enemy_handbook_table.json", "enemy_handbook", "enemyData", "sub"),
    # 敌人战斗属性: data["enemies"] 是 [{...}] 列表
    ("zh_CN/gamedata/levels/enemydata/enemy_database.json", "enemy_database", "enemies", "list"),
    # 基建数据: 全局配置，单行存储
    ("zh_CN/gamedata/excel/building_data.json", "building_config", None, "config"),
]


def ensure_gamedata() -> bool:
    """确保 GameData 仓库存在"""
    if GAMEDATA_DIR.exists() and (GAMEDATA_DIR / ".git").exists():
        return True
    print(f"[INFO] 首次运行，正在克隆 GameData 仓库...")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        ["git", "clone", "--depth", "1", GAMEDATA_REPO, str(GAMEDATA_DIR)],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"[ERROR] git clone 失败:\n{result.stderr}")
        return False
    return True


def update_gamedata():
    """更新仓库"""
    print("[INFO] 更新 GameData 仓库...")
    subprocess.run(
        ["git", "-C", str(GAMEDATA_DIR), "pull", "--ff-only"],
        capture_output=True, text=True,
    )
    print("[OK] 仓库已是最新")


def load_json(relative_path: str) -> dict:
    file_path = GAMEDATA_DIR / relative_path
    if not file_path.exists():
        raise FileNotFoundError(f"文件不存在: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def clean_col(name: str) -> str:
    """清理列名：移除非法字符，处理 SQLite 保留字"""
    import re
    # 移除 # 和特殊字符，替换为下划线
    name = re.sub(r'[^\w]', '_', str(name))
    reserved = {"class", "type", "range", "order", "group", "index"}
    if name.lower() in reserved:
        name = f"{name}_"
    return name


def type_to_sqlite(value: Any) -> str:
    if isinstance(value, bool):
        return "INTEGER"
    elif isinstance(value, int):
        return "INTEGER"
    elif isinstance(value, float):
        return "REAL"
    elif isinstance(value, (dict, list)):
        return "TEXT"
    return "TEXT"


def infer_schema(records: dict) -> dict[str, str]:
    """从 {id: {fields}} 合并所有字段名 → SQLite 类型"""
    schema: dict[str, str] = {}
    for item in records.values():
        if isinstance(item, dict):
            for k, v in item.items():
                if k not in schema:
                    schema[k] = type_to_sqlite(v)
    return schema


def create_and_insert(conn, table_name: str, records: dict, schema: dict) -> int:
    """建表 + 批量插入 {id: {fields}} 数据"""
    cols = ["id TEXT PRIMARY KEY"] + [f'"{clean_col(f)}" {t}' for f, t in schema.items()]
    ddl = f"CREATE TABLE IF NOT EXISTS {table_name} (\n  " + ",\n  ".join(cols) + "\n)"
    conn.execute(f"DROP TABLE IF EXISTS {table_name}")
    conn.execute(ddl)

    placeholders = ["?" for _ in range(len(schema) + 1)]
    col_names = ["id"] + [clean_col(f) for f in schema]
    sql = f"INSERT OR REPLACE INTO {table_name} ({', '.join(col_names)}) VALUES ({', '.join(placeholders)})"

    rows = []
    for obj_id, obj_val in records.items():
        if not isinstance(obj_val, dict):
            continue
        row = [str(obj_id)]
        for field_name, field_type in schema.items():
            raw = obj_val.get(field_name)
            if field_type == "TEXT" and isinstance(raw, (dict, list)):
                row.append(json.dumps(raw, ensure_ascii=False))
            elif isinstance(raw, bool):
                row.append(1 if raw else 0)
            elif raw is None:
                row.append(None)
            else:
                row.append(raw)
        rows.append(tuple(row))

    conn.executemany(sql, rows)
    conn.commit()
    return len(rows)


# ============================================================
# 处理器
# ============================================================

def process_flat(conn, json_path: str, table_name: str) -> int:
    """标准 {id: {fields}} 结构"""
    data = load_json(json_path)
    schema = infer_schema(data)
    print(f"    {len(data)} 条, {len(schema)} 字段")
    return create_and_insert(conn, table_name, data, schema)


def process_sub(conn, json_path: str, table_name: str, sub_key: str) -> int:
    """data[sub_key] 下是 {id: {fields}} 结构"""
    data = load_json(json_path)
    sub = data.get(sub_key, {})
    if not isinstance(sub, dict) or not sub:
        print(f"    子键 '{sub_key}' 为空")
        return 0
    schema = infer_schema(sub)
    print(f"    {len(sub)} 条, {len(schema)} 字段")
    return create_and_insert(conn, table_name, sub, schema)


def process_list(conn, json_path: str, table_name: str, sub_key: str) -> int:
    """data[sub_key] 是 [{...}] 列表结构，用序号做 id"""
    data = load_json(json_path)
    items = data.get(sub_key, [])
    if not isinstance(items, list) or not items:
        print(f"    子键 '{sub_key}' 为空列表")
        return 0
    # 转为 {index: item} 格式
    records = {str(i): item for i, item in enumerate(items) if isinstance(item, dict)}
    schema = infer_schema(records)
    print(f"    {len(records)} 条, {len(schema)} 字段")
    return create_and_insert(conn, table_name, records, schema)


def process_config(conn, json_path: str, table_name: str) -> int:
    """全局配置对象：每条顶层 key-value 作为一行（key-value 表）"""
    data = load_json(json_path)
    # 对于 building_data 这种扁平配置，存为 key-value 表
    schema = {"value": "TEXT"}
    conn.execute(f"DROP TABLE IF EXISTS {table_name}")
    conn.execute(f"CREATE TABLE {table_name} (key TEXT PRIMARY KEY, value TEXT)")

    rows = []
    for k, v in data.items():
        if isinstance(v, (dict, list)):
            rows.append((str(k), json.dumps(v, ensure_ascii=False)))
        else:
            rows.append((str(k), str(v) if v is not None else None))

    conn.executemany(f"INSERT OR REPLACE INTO {table_name} (key, value) VALUES (?, ?)", rows)
    conn.commit()
    print(f"    {len(rows)} 条配置项")
    return len(rows)


# ============================================================
# 主流程
# ============================================================

def sync_data():
    print("=" * 60)
    print("  Arknights Wiji - 数据同步 v2")
    print(f"  本地仓库: {GAMEDATA_DIR}")
    print("=" * 60)

    if not ensure_gamedata():
        sys.exit(1)
    update_gamedata()

    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode=WAL")

    total = 0
    for json_path, table_name, sub_key, proc_type in FILE_DEFS:
        fname = Path(json_path).name
        print(f"\n  [{proc_type}] {fname} → {table_name}")
        try:
            if proc_type == "flat":
                count = process_flat(conn, json_path, table_name)
            elif proc_type == "sub":
                count = process_sub(conn, json_path, table_name, sub_key)
            elif proc_type == "list":
                count = process_list(conn, json_path, table_name, sub_key)
            elif proc_type == "config":
                count = process_config(conn, json_path, table_name)
            else:
                continue
            total += count
            print(f"    → 写入 {count} 条")
        except Exception as e:
            print(f"    [ERROR] {e}")

    # 统计
    print(f"\n{'='*60}")
    print(f"  同步完成！共 {total} 条记录")
    for (tname,) in conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"):
        cnt = conn.execute(f"SELECT COUNT(*) FROM [{tname}]").fetchone()[0]
        print(f"    {tname}: {cnt} 条")
    conn.close()
    print(f"  数据库: {DB_PATH}")


if __name__ == "__main__":
    sync_data()
