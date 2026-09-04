# Supabase Storage — bucket PQRS (ms-ai)

ms-ai sube imágenes a:

`{SUPABASE_URL}/storage/v1/object/{SUPABASE_PQRS_BUCKET}/pqrs/...`

y construye URL pública:

`.../storage/v1/object/public/pqrs-images/pqrs/...`

## Qué crear en el panel (una sola vez)

1. Abre el proyecto Supabase (el mismo de ms-business):  
   https://supabase.com/dashboard/project/uulwbcmpyglmtpntzmch
2. Ve a **Storage**.
3. **New bucket**:
   - Name: `pqrs-images` (debe coincidir con `SUPABASE_PQRS_BUCKET`)
   - **Public bucket**: ON (las URLs públicas del código lo requieren)
4. Guarda. No hace falta crear carpetas; ms-ai crea rutas `pqrs/YYYY-MM-DD/...` al subir.
5. (Opcional) Policies: con **service role** desde el backend suele bastar para upload. Si el bucket es público, cualquiera puede **leer** por URL; no expongas la service role en el front.

## Qué NO hace falta

- No crear tablas nuevas en Supabase para PQRS (las tablas están en Postgres `ms_ai` / scripts `sql/`).
- No pegar la service role en el frontend.

## Verificación

Tras crear el bucket, crear un PQRS con imagen desde Swagger ms-ai (`POST /api/pqrs`) y comprobar que la `image_url` abre en el navegador.
