"""
Time:     2026/02/01 16:22
Author:   HuJiaPeng
Version:  V 0.1
File:     main
Describe: FastAPI 主程序入口
"""


# 运行 FastAPI 服务
if __name__ == "__main__":
    import os
    import uvicorn
    
    # 从环境变量获取配置，如果没有则使用默认值
    port = int(os.getenv('PORT', 8000))
    workers = int(os.getenv('WORKERS', 1))  # 建议默认使用1个worker，除非有特殊需求
    
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=port, 
        workers=workers
    )


