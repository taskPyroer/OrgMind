import ipaddress
import requests
import socket

def get_ip_location(ip: str) -> str:
    """
    解析 IP 地址获取地理位置
    优先识别内网 IP，公网 IP 尝试使用在线服务解析
    """
    if not ip:
        return "未知"
    
    # 清理空白字符
    ip = str(ip).strip()
        
    # 处理本地回环 (IPv4 & IPv6)
    if ip == "127.0.0.1" or ip == "localhost" or ip == "::1":
        return "本地回环"
    
    try:
        # 尝试解析 IP 对象
        ip_obj = ipaddress.ip_address(ip)
        
        if ip_obj.is_loopback:
            return "本地回环"
            
        if ip_obj.is_private:
            return "内部网络"
            
        # 预留: 如果是 link-local 等其他特殊地址
        if ip_obj.is_link_local:
            return "链路本地地址"
            
    except ValueError:
        # 可能是无效IP，但继续尝试在线解析作为兜底（虽然概率很低）
        pass

    # 尝试使用 ip-api.com (免费，有速率限制)
    # 注意：生产环境建议替换为本地 IP 库 (如 ip2region 或 GeoIP2) 以保证性能和隐私
    try:
        # 设置短超时，避免阻塞主流程
        response = requests.get(
            f"http://ip-api.com/json/{ip}?lang=zh-CN", 
            timeout=1.5
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                country = data.get("country", "")
                region = data.get("regionName", "")
                city = data.get("city", "")
                
                # 拼接地址，去除重复部分 (如 北京 北京市 -> 北京市)
                parts = []
                if country and country != "中国":
                    parts.append(country)
                
                if region:
                    parts.append(region)
                
                if city and city != region:
                    parts.append(city)
                    
                return " ".join(parts).strip() or "未知位置"
    except Exception:
        # 网络错误或解析失败，降级处理
        pass
    
    return "未知位置"