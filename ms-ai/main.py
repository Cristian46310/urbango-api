import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings

app = FastAPI(
    title="MS AI - Scheduler",
    description="Microservicio de agendamiento de citas con Google Calendar",
    version="1.0.0",
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
    return {"service": "MS AI - Scheduler", "version": "1.0.0", "status": "running"}


def register_routes():
    from app.scheduler.presentation.routes.appointment_route import router as appointment_router
    app.include_router(appointment_router)


register_routes()

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=settings.PORT, reload=True)
