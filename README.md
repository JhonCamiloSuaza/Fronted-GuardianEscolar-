# GPS Guardian Escolar - Frontend

Cliente Expo/React Native para administradores, acudientes y estudiantes de GPS Guardian Escolar.

## Requisitos

- Node.js 20 o posterior.
- Una API compatible en ejecucion.

## Inicio local

```powershell
npm ci
Copy-Item .env.example .env
npm run start:lan
```

## Configuracion

El archivo `.env` no se versiona. Parte de `.env.example` y ajusta estas variables:

- `EXPO_PUBLIC_API_URL`: URL base REST o `/api` cuando se use el proxy Nginx.
- `EXPO_PUBLIC_WS_URL`: URL del WebSocket o `/ws` cuando se use el proxy Nginx.
- `EXPO_PUBLIC_STUDENT_LINK_BASE_URL`: base para enlaces de estudiantes.
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`: clave de Google Maps para mapas web.

## Docker

```powershell
docker build -t gps-guardian-frontend .
docker run --rm -p 8081:80 gps-guardian-frontend
```

El `nginx.conf` reenvia `/api` y `/ws` al host Docker `backend:8080`. Para usar ese proxy, ejecuta el contenedor en una red donde la API se llame `backend`; de lo contrario, configura `EXPO_PUBLIC_API_URL` y `EXPO_PUBLIC_WS_URL` con URLs absolutas antes de compilar.

## Validacion

```powershell
npm run lint
```
