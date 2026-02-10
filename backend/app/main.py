"""
Главный модуль FastAPI приложения
Калькулятор распространения лесных пожаров
Департамент по чрезвычайным ситуациям города Павлодар
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from .models import FireSpreadInput, FireSpreadResult
from .fire_index import calculate_fire_spread


app = FastAPI(
    title="Калькулятор распространения лесных пожаров",
    description="API для расчета скорости распространения огня по фронту, флангу и тылу",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.post("/api/calculate", response_model=FireSpreadResult)
async def calculate(data: FireSpreadInput):
    """
    Расчет параметров распространения лесного пожара

    Формулы:
    - v1 = 26*E*(1+2.7*v)*(2+W) / (rho*(16+W)) — скорость по фронту
    - v2 = 0.35*v1 + 0.17 — скорость по флангу
    - v3 = 0.10*v1 + 0.20 — скорость по тылу
    - P = 2*pi*sqrt(((v1+v3)^2 + v2^2)/8) * t — периметр
    - S = 4*10^-6 * P^2 — площадь
    """
    try:
        result = calculate_fire_spread(
            E=data.E,
            v=data.wind_speed,
            rho=data.rho,
            W=data.W,
            t=data.t
        )

        return FireSpreadResult(
            timestamp=datetime.now(),
            input_data=data,
            **result
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка расчета: {str(e)}")


@app.get("/api/forests")
async def get_forests():
    """Список лесов для мониторинга"""
    return {
        "forests": [
            {
                "name": "Баянаульский лес",
                "latitude": 50.7933,
                "longitude": 75.7003,
                "description": "Баянаульский национальный парк"
            },
            {
                "name": "Щербактинский лес",
                "latitude": 52.3800,
                "longitude": 78.0100,
                "description": "Щербактинский лесной массив"
            }
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
