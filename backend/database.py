"""
Arknights Wiji - 数据库配置
使用 SQLAlchemy Core + 反射（reflection）模式，
在运行时自动发现 sync_data.py 创建的动态表结构。

SQLAlchemy 是什么？
- Python ORM（对象关系映射）框架
- 让你用 Python 代码而不是 SQL 语句操作数据库
- 自动处理连接池、参数化查询（防 SQL 注入）
"""
import os
from pathlib import Path

from sqlalchemy import create_engine, MetaData, Table
from sqlalchemy.engine import Engine

# 数据库路径：优先环境变量，其次默认路径
DB_PATH = os.environ.get(
    "ARKNIGHTS_DB_PATH",
    str(Path(__file__).resolve().parent.parent / "data" / "arknights.db"),
)
DATABASE_URL = f"sqlite:///{DB_PATH}"

# 创建 SQLAlchemy 引擎
# echo=False: 不打印 SQL 日志（调试时可设为 True）
# connect_args: SQLite 特有参数
engine: Engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},  # FastAPI 多线程访问 SQLite 需要
    pool_pre_ping=True,  # 连接前检测是否有效
)

# MetaData: SQLAlchemy 的"数据库目录"，自动反射已存在的表
metadata = MetaData()


def reflect_tables() -> dict[str, Table]:
    """
    反射（自动读取）数据库中已存在的所有表结构。
    反射 = SQLAlchemy 读取 SQLite 的系统表，自动生成 Table 对象，
           无需在 Python 中手动定义每个表的列。

    SQL 等价操作:
        SELECT name FROM sqlite_master WHERE type='table';
        PRAGMA table_info(operators);  -- 对每个表执行

    返回: {"表名": Table对象}
    """
    metadata.reflect(bind=engine)
    return {name: metadata.tables[name] for name in metadata.tables}


def get_table(table_name: str) -> Table:
    """按名称获取反射后的表对象，不存在则抛异常"""
    reflect_tables()  # 确保最新
    if table_name not in metadata.tables:
        raise ValueError(f"表 '{table_name}' 不存在。请先运行 scripts/sync_data.py 同步数据。")
    return metadata.tables[table_name]
