from typing import List, Any, Dict

def create_page_response(data: List[Any], total: int, current: int, pageSize: int) -> Dict[str, Any]:
    """
    统一分页响应格式
    """
    return {
        "data": data,
        "total": total,
        "current": current,
        "pageSize": pageSize,
        "success": True
    }
