# SIEM-PYMES

Prototipo ligero de SIEM para pequeñas y medianas empresas. Incluye backend en FastAPI, frontend sencillo con Vue 3 y base de datos PostgreSQL.

## Instalación rápida

```bash
docker-compose up --build -d
python seed.py  # crea usuario inicial y carga eventos de prueba
```

El panel estará disponible en `http://localhost:8080` y la API en `http://localhost:8000`.

Usuario inicial: `admin` / `admin` + TOTP mostrado al ejecutar `seed.py`.

## Características

- Autenticación con 2FA y roles básicos.
- Ingesta de eventos por HTTP y Syslog (TCP/TLS).
- Motor de reglas simple con tres detecciones predeterminadas.
- Dashboard con métricas básicas y consejos de seguridad.
