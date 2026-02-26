from typing import Generic, TypeVar, List
from pydantic import BaseModel

T = TypeVar("T")

class Page(BaseModel, Generic[T]):
    data: List[T]
    total: int
    success: bool = True
    current: int
    pageSize: int

    class Config:
        from_attributes = True
