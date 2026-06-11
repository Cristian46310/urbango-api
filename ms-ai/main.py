import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.pqrs.infrastructure.jobs.sla_checker import pqrs_lifespan


app = FastAPI(
    title="MS AI - Scheduler & PQRS",
    description="Microservicio de agendamiento de citas y sistema PQRS automatizado",
    version="1.0.0",
    lifespan=pqrs_lifespan,
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
        "service": "MS AI - Scheduler & PQRS",
        "version": "1.0.0",
        "status": "running",
    }


def register_routes():
    from app.scheduler.presentation.routes.appointment_route import router as appointment_router
    from app.pqrs.presentation.routes.pqrs_route import router as pqrs_router
    from app.pqrs.presentation.routes.pqrs_updates_route import router as pqrs_updates_router

    app.include_router(appointment_router)
    app.include_router(pqrs_router)
    app.include_router(pqrs_updates_router)


register_routes()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
