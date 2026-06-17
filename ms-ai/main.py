import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.infrastructure.jobs.app_lifespan import app_lifespan


app = FastAPI(
    title="MS AI - Scheduler, PQRS & Weather",
    description="Microservicio de agendamiento de citas, PQRS automatizado y alertas de clima",
    version="1.0.0",
    lifespan=app_lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": "MS AI - Scheduler, PQRS & Weather",
        "version": "1.0.0",
        "status": "running",
    }


def register_routes():
    from app.scheduler.presentation.routes.appointment_route import router as appointment_router
    from app.pqrs.presentation.routes.pqrs_route import router as pqrs_router
    from app.pqrs.presentation.routes.pqrs_updates_route import router as pqrs_updates_router
    from app.weather.presentation.routes.weather_route import router as weather_router
    from app.weather.presentation.routes.weather_forecast_route import router as weather_forecast_router

    app.include_router(appointment_router)
    app.include_router(pqrs_router)
    app.include_router(pqrs_updates_router)
    app.include_router(weather_router)
    app.include_router(weather_forecast_router)


register_routes()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
