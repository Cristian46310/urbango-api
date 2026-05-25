# Historias de Usuario - UCaldas Backend (2026-1)

## 📋 Índice por Vertiente

- [Boletos y Uso del Servicio](#boletos-y-uso-del-servicio)
- [Operación del Conductor](#operación-del-conductor)
- [Rutas y Programaciones](#rutas-y-programaciones)
- [Análisis y Reportes](#análisis-y-reportes)

---

## Boletos y Uso del Servicio

### HU-ENTR-2-003: Abordaje y generación de boleto

**Módulo:** `ms-business/src/boarding/`, `ms-business/src/ticket/`

**Actor:** Ciudadano

**Descripción:**
Quiero validar mi método de pago al abordar el bus para generar mi boleto de viaje y que se registre mi abordaje.

**Criterios de aceptación:**

- [ ] El sistema identifica la programación activa del bus donde estoy abordando
- [ ] Valida que mi método de pago tenga saldo suficiente (si es prepagado)
- [ ] Descuenta el monto de la tarifa de mi saldo
- [ ] Genera un boleto asociado a mí, a la programación actual y al método de pago usado
- [ ] Registra la validación en el paradero de abordaje con timestamp
- [ ] Muestra un mensaje de confirmación "Abordaje exitoso" con saldo restante
- [ ] Si el bus está lleno (capacidad máxima alcanzada), rechaza el abordaje

**Entidades relacionadas:**
- `Ticket`: boleto generado
- `Boarding`: registro del abordaje
- `PaymentMethod`: método de pago del ciudadano
- `Route/Turn`: programación activa
- `Stop`: paradero de abordaje

**Endpoints a implementar:**
- `POST /api/boarding/validate-payment` - Validar método de pago
- `POST /api/ticket/generate` - Generar boleto
- `GET /api/bus/:busId/capacity` - Verificar capacidad

---

## Operación del Conductor

### HU-ENTR-2-006: Inicio de turno de conductor

**Módulo:** `ms-business/src/turn/`, `ms-business/src/driver/`

**Actor:** Conductor

**Descripción:**
Quiero iniciar mi turno registrando el bus que operaré para que el sistema sepa que estoy activo y en qué vehículo.

**Criterios de aceptación:**

- [ ] El conductor debe tener un turno programado para la fecha/hora actual
- [ ] El sistema muestra el bus asignado en la programación
- [ ] El conductor confirma el estado del bus (operativo, con observaciones)
- [ ] Si hay observaciones, puede registrar una nota
- [ ] Al iniciar, el sistema activa el GPS del bus para tracking
- [ ] El estado del turno cambia a "en curso"
- [ ] Se registra la hora exacta de inicio

**Entidades relacionadas:**
- `Driver`: información del conductor
- `Turn`: turno programado
- `Bus`: vehículo asignado
- `BusStatus`: estado actual del bus

**Endpoints a implementar:**
- `POST /api/turn/:turnId/start` - Iniciar turno
- `PUT /api/turn/:turnId/confirm-bus-status` - Confirmar estado del bus
- `POST /api/bus/:busId/gps/activate` - Activar GPS

---

## Rutas y Programaciones

### HU-ENTR-2-009: Creación de nueva ruta

**Módulo:** `ms-business/src/route/`

**Actor:** Administrador del sistema

**Descripción:**
Quiero crear una nueva ruta en el sistema para ampliar la cobertura del servicio de transporte.

**Criterios de aceptación:**

- [ ] El sistema solicita: nombre de la ruta, descripción, tarifa
- [ ] Se debe seleccionar paraderos existentes en orden secuencial
- [ ] Para cada paradero se indica: orden de visita, distancia desde paradero anterior, tiempo estimado
- [ ] Se puede visualizar la ruta en un mapa con todos los paraderos conectados
- [ ] Se valida que no haya paraderos duplicados
- [ ] La ruta debe tener al menos 3 paraderos
- [ ] Al guardar, la ruta queda disponible para asignar programaciones
- [ ] Se genera un código único para la ruta

**Entidades relacionadas:**
- `Route`: ruta principal
- `Stop`: paraderos que componen la ruta
- `RouteStop`: relación ruta-parada con orden, distancia, tiempo

**Endpoints a implementar:**
- `POST /api/route` - Crear nueva ruta
- `PUT /api/route/:routeId` - Actualizar ruta
- `POST /api/route/:routeId/stops` - Agregar paraderos a ruta
- `GET /api/route/:routeId/map` - Visualizar en mapa

**Validaciones:**
- Mínimo 3 paraderos por ruta
- Sin paraderos duplicados
- Tarifa > 0
- Orden secuencial de paraderos

---

### HU-ENTR-2-011: Creación de programación de ruta

**Módulo:** `ms-business/src/turn/`, `ms-business/src/route/`

**Actor:** Administrador de empresa

**Descripción:**
Quiero crear una programación que asigne un bus a una ruta en fecha y hora específica para definir la operación del servicio.

**Criterios de aceptación:**

- [ ] El sistema solicita: ruta, bus, fecha, hora de salida
- [ ] Valida que el bus no tenga otra programación activa en el mismo horario
- [ ] Valida que el bus tenga un conductor asignado (turno) para ese horario
- [ ] Se puede marcar la programación como recurrente (lunes a viernes, fines de semana, diaria)
- [ ] Al guardar, la programación queda visible para los usuarios en consulta de horarios
- [ ] Se puede asociar un margen de tolerancia de salida (ej: +/- 5 minutos)
- [ ] El estado inicial es "programado"

**Entidades relacionadas:**
- `Turn`: programación/turno del bus
- `Route`: ruta asociada
- `Bus`: vehículo asignado
- `Driver`: conductor del turno
- `RecurrencePattern`: patrón de recurrencia

**Endpoints a implementar:**
- `POST /api/turn` - Crear programación
- `PUT /api/turn/:turnId` - Actualizar programación
- `GET /api/turn/search` - Consultar horarios disponibles

**Validaciones:**
- Bus sin conflictos de horario
- Conductor disponible en horario
- Margen de tolerancia entre -999 y +999 minutos
- Patrón de recurrencia válido

---

## Análisis y Reportes

### HU-ENTR-2-015: Distribución porcentual de pasajeros por rango etario

**Módulo:** `ms-business/src/analytics/`

**Actor:** Analista de marketing de la empresa de transporte

**Descripción:**
Quiero ver un gráfico de torta que muestre la distribución porcentual de pasajeros según rangos de edad para diseñar estrategias de comunicación y servicios diferenciados por segmento etario.

**Criterios de aceptación:**

- [ ] El sistema calcula la edad de cada ciudadano basándose en su fecha de nacimiento
- [ ] Rangos etarios: Menores (0-17), Jóvenes (18-25), Adultos jóvenes (26-40), Adultos (41-60), Adultos mayores (60+)
- [ ] Gráfico de torta con color diferenciado y porcentaje por segmento
- [ ] Filtro por ruta específica o consolidado del sistema
- [ ] Filtro por rango de fechas para análisis temporal
- [ ] Al hacer clic en segmento, muestra número absoluto de pasajeros
- [ ] Segmento predominante destacado con etiqueta especial
- [ ] Tabla debajo con: rango etario, cantidad, porcentaje, variación vs mes anterior
- [ ] Exportar como PNG o Excel
- [ ] Excluye usuarios sin fecha de nacimiento (categoría "Sin información" separada)

**Entidades relacionadas:**
- `Citizen`: información del pasajero
- `Ticket`: registro de viajes
- `Route`: ruta para filtrado
- `Analytics`: cache de resultados

**Endpoints a implementar:**
- `GET /api/analytics/passengers-by-age-range` - Obtener datos
- `GET /api/analytics/passengers-by-age-range/export` - Exportar (PNG/Excel)

**Lógica de negocio:**
```javascript
// Cálculo de rango etario
function getAgeRange(dateOfBirth) {
  const age = calculateAge(dateOfBirth);
  if (age < 0 || !age) return "Sin información";
  if (age <= 17) return "Menores (0-17)";
  if (age <= 25) return "Jóvenes (18-25)";
  if (age <= 40) return "Adultos jóvenes (26-40)";
  if (age <= 60) return "Adultos (41-60)";
  return "Adultos mayores (60+)";
}
```

**Parámetros de query:**
- `routeId?`: UUID de ruta (opcional, null = consolidado)
- `startDate?`: YYYY-MM-DD (opcional)
- `endDate?`: YYYY-MM-DD (opcional)
- `format?`: 'json' | 'png' | 'excel' (default: 'json')

---

## 📌 Convenciones y Referencias

### Mapeo de módulos a HU

| Módulo | HU Relacionadas |
|--------|-----------------|
| `ticket/` | HU-2-003 |
| `boarding/` | HU-2-003 |
| `turn/` | HU-2-006, HU-2-011 |
| `driver/` | HU-2-006 |
| `route/` | HU-2-009, HU-2-011 |
| `analytics/` | HU-2-015 |
| `bus/` | HU-2-006, HU-2-011 |
| `stop/` | HU-2-009 |

### Estado de implementación

Marcar el estado actual agregando al inicio de cada HU:
- ✅ **Implementada**: Endpoints lista, tests pasando
- 🔄 **En desarrollo**: Al menos un endpoint iniciado
- ⏳ **Planificada**: No iniciada aún
- ❌ **Bloqueada**: Esperando dependencia

### Validaciones globales

Todas las HU deben validar:
- Autenticación JWT (validado en ms-security)
- Autorización por rol
- Integridad de datos (constraints de BD)
- Timestamps UTC en registros

---

## 📚 Referencias relacionadas

- [ms-business/docs/ARCHITECTURE.md](../ms-business/docs/ARCHITECTURE.md) - Arquitectura
- [docs/ROLES.md](ROLES.md) - Roles y permisos
- [AGENTS.md](../AGENTS.md) - Guía para agentes IA

**Última actualización:** 22 de Mayo, 2026
