from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os
from dotenv import load_dotenv

# 加载.env文件 - 使用python-dotenv确保可靠加载
env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
load_dotenv(env_path)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        case_sensitive=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "ERP System"
    API_V1_STR: str = "/api/v1"
    
    # Database
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "123456"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "orgmind"
    
    # Security
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # RAG / AI
    # 以下配置为示例数据，实际使用请在 .env 文件中配置
    # 支持多种模型提供商：Baizhi Cloud、OpenAI、阿里云等
    DEFAULT_BASE_URL: Optional[str] = None
    
    # Chat Model 配置
    # 对话模型配置，支持 deepseek、gpt 等系列模型
    CHAT_API_KEY: Optional[str] = None  # 示例密钥，生产环境请使用 .env 配置
    CHAT_BASE_URL: Optional[str] = None
    CHAT_MODEL: str = "deepseek-v3"

    # Embedding Model 配置  
    # 文本向量化模型，用于文档索引和语义检索
    EMBEDDING_API_KEY: Optional[str] = None  # 如果为 None，则使用 CHAT_API_KEY
    EMBEDDING_BASE_URL: Optional[str] = None  # 如果为 None，则使用 CHAT_BASE_URL
    EMBEDDING_MODEL: str = "bge-m3" 
    EMBEDDING_DIM: int = 1024  # bge-m3 模型维度
    
    # Rerank Model 配置
    # 重排序模型，用于优化检索结果的相关性
    RERANK_API_KEY: Optional[str] = None  # 如果为 None，则使用 CHAT_API_KEY
    RERANK_BASE_URL: Optional[str] = None  # 如果为 None，则使用 CHAT_BASE_URL
    RERANK_MODEL: str = "bge-reranker-v2-m3"
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    def get_chat_base_url(self) -> str:
        """获取聊天模型基础URL，如果未配置则使用默认值"""
        return self.CHAT_BASE_URL or self.DEFAULT_BASE_URL or "https://api.openai.com/v1"
    
    def get_embedding_base_url(self) -> str:
        """获取嵌入模型基础URL，如果未配置则使用聊天模型URL"""
        return self.EMBEDDING_BASE_URL or self.get_chat_base_url()
    
    def get_rerank_base_url(self) -> str:
        """获取重排序模型基础URL，如果未配置则使用聊天模型URL"""
        return self.RERANK_BASE_URL or self.get_chat_base_url()

settings = Settings()
