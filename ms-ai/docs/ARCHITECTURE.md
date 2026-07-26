# ms-ai — Arquitectura

Microservicio de **capacidades inteligentes y automatizaciones** (FastAPI, puerto 8001).

## Principios

- **Single Source of Truth:** rutas/horarios/buses viven en ms-business; ms-ai no los replica.
- **Ports & Adapters:** dominio → ports; HTTP/Calendar/LLM/DB → adapters.
- **Read-only toward business:** solo GET a `/internal/v1/...` con `X-Internal-Key`.
- **No shared DTOs across MS:** JSON + mapper en el consumidor; nunca package npm/pip de DTOs.
- **LLM as Interpreter:** solo NL; risk/SLA/categorías validadas en código (whitelist enum).
- **Swappable adapters:** OpenWeather/Calendar/LLM sustituibles sin cambiar use cases.
- **Observability:** `X-Correlation-Id` en requests y clientes HTTP.

## Bounded contexts

| BC | Responsabilidad |
|----|-----------------|
| `scheduler` (appointments) | Citas de oficina + Google Calendar |
| `pqrs` | PQRS + soporte técnico (`technical_support`) |
| `weather` | `POST /api/weather/assess` + alertas programadas |
| `route_automation` | Recordatorios de salida (tabla puente + Calendar) |

## Integraciones compartidas

`app/infrastructure/integrations/` — clients HTTP, errores tipados, Correlation-ID.

## Auth M2M

ms-ai → ms-business: `X-Internal-Key` (`MS_BUSINESS_INTERNAL_KEY` = `MS_INTERNAL_API_KEY` en business).

Rotación: cada ~90 días; dual-key `MS_INTERNAL_API_KEY_PREVIOUS` durante 7 días.

## Decisiones rechazadas

Ver `inter-service-contracts.md` sección ms-ai y el plan de evolución. Resumen:

- No guardar rutas en AI
- No package de DTOs compartido
- No JWT propagado para jobs
- No calcular `risk_level` con LLM
