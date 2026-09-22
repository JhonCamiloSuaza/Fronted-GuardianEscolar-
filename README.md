# Fronted-GuardianEscolar-

Este repositorio/carpeta contiene la aplicacion cliente de GPS Guardian Escolar.

## Funcion

El frontend permite que administradores, acudientes y estudiantes interactuen con el sistema. Consume la API del backend, muestra rutas, seguimiento, historial, notificaciones, perfil, autenticacion, verificacion de correo y recuperacion de cuenta.

## Componentes

- `app/(auth)`: login, registro, verificacion y recuperacion.
- `app/(tabs)`: pantallas principales del usuario autenticado.
- `components`: componentes visuales reutilizables.
- `services`: clientes HTTP y servicios de comunicacion.
- `contexts`: estado global de autenticacion y sesion.
- `config/endpoints.js`: URLs del backend, WebSocket y enlaces publicos.
- `translations`: textos de interfaz.
- `Dockerfile`: construye la version web con Expo.
- `nginx.conf`: sirve la aplicacion web en contenedor.

## Ejecucion Con Expo Go

```powershell
npm install
npm run start:lan
```

La app usa las variables del archivo `.env` local de esta carpeta.

## Ejecucion En Docker

Para ejecutar todo el sistema, usar la infraestructura oficial:

```powershell
docker compose --env-file ..\docker-infra\.env -f ..\docker-infra\docker-compose.yaml up --build
```

El contenedor del frontend publica la app web en:

```text
http://localhost:8081
```

## Configuracion

No se debe subir un `.env` real a Git. Para desarrollo local se puede tener un `.env` ignorado por Git.

Variables principales:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_WS_URL`
- `EXPO_PUBLIC_STUDENT_LINK_BASE_URL`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

## Validacion

```powershell
npm run lint
```
