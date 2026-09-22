# Guia De Configuracion Y Despliegue

## GPS Guardian Escolar - Frontend

> Guia practica para instalar, ejecutar y desplegar el frontend de `frontend-repo`.

## Requisitos Previos

| Herramienta      | Uso                              |
| ---------------- | -------------------------------- |
| Node.js 18+      | Instalar y ejecutar dependencias |
| npm 9+           | Gestion de paquetes              |
| Expo CLI por npx | Ejecucion local                  |
| Docker           | Ejecucion containerizada         |
| Git              | Control de versiones             |

No se sube `node_modules`; cada entorno instala sus dependencias.

## Instalacion Local

```bash
git clone <URL_DEL_REPOSITORIO>
cd frontend-repo
npm install
```

Crear un `.env` local solo si vas a ejecutar el frontend fuera de `docker-infra`:

```bash
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_WS_URL=ws://localhost:8080/ws
EXPO_PUBLIC_STUDENT_LINK_BASE_URL=http://localhost:8081
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<TU_API_KEY>
```

El archivo real `.env` no debe subirse. Para compartir estructura usa `.env.example`.

## Ejecucion Local Con Expo

```bash
npm run start
npm run web
npm run lint
```

Comandos utiles directos:

```bash
npx expo start -c
npx expo start --web
npx expo export --platform web
```

## Ejecucion Con Docker Infra

La forma oficial de levantar frontend, backend y base de datos juntos es desde la carpeta externa `docker-infra`:

```bash
cd ../docker-infra
docker compose --env-file .env -f docker-compose.yaml up -d --build
```

Servicios esperados:

| Servicio     | Puerto local              |
| ------------ | ------------------------- |
| Frontend web | `http://localhost:8081` |
| Backend API  | `http://localhost:8080` |
| PostgreSQL   | `localhost:5432`        |

## Variables De Entorno

| Variable                              | Descripcion                                               |
| ------------------------------------- | --------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`               | URL REST del backend                                      |
| `EXPO_PUBLIC_WS_URL`                | URL WebSocket del backend                                 |
| `EXPO_PUBLIC_STUDENT_LINK_BASE_URL` | URL publica del frontend para enlaces enviados por correo |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`   | API Key de Google Maps                                    |

Cuando se use tunnel externo, actualizar estas URLs con el dominio publico correspondiente. Si el tunnel es privado, otros equipos pueden recibir error 403; debe configurarse como publico o compartir acceso desde la herramienta del tunnel.

## Build Web

```bash
npx expo export --platform web
```

El resultado generado no debe quedar versionado si el repositorio solo almacenara codigo fuente.

## Limpieza Antes De Subir

Verificar que no existan estos elementos:

```text
node_modules/
.expo/
dist/
web-build/
android/
ios/
.gradle/
build/
.env
expo-env.d.ts
*.log
```

## Problemas Comunes

| Problema                    | Causa comun                             | Solucion                                                         |
| --------------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| `Network Error` en tunnel | API apunta a localhost o tunnel privado | Usar URL publica del backend en`.env`                          |
| No abre en otro portatil    | Dev tunnel sin permiso publico          | Cambiar acceso del tunnel o usar despliegue publico              |
| Cambios no aparecen         | Cache de Expo                           | `npx expo start -c`                                            |
| Errores Gradle en VS Code   | Extension escanea`node_modules`       | Mantener exclusiones en`.vscode/settings.json`                 |
| Vulnerabilidades npm        | Dependencias transitivas Expo           | Revisar con cuidado; evitar`npm audit fix --force` sin validar |

## Buenas Practicas

- Mantener secretos fuera del repositorio.
- No subir dependencias generadas.
- Usar `.env.example` como contrato de configuracion.
- Validar con `npm run lint` antes de publicar cambios.
- Usar `docker-infra` para pruebas integradas con backend y base de datos.

## Ejecucion completa con backend por tunnel

Para probar la aplicacion en un telefono, mantén tres terminales abiertas.0

1. Desde `Docker-Infra-Guardian-Escolar`, levanta los servicios:

```powershell
docker compose up -d --build
Invoke-WebRequest http://localhost:8080/api/health
```

2. En otra terminal, publica la API:

```powershell
& "..\Fronted-GuardianEscolar-\node_modules\.bin\ngrok.cmd" http 8080
```

3. Desde esta carpeta, configura la URL HTTPS de ngrok y arranca Expo:

```powershell
$env:EXPO_PUBLIC_API_URL="https://tu-dominio.ngrok-free.dev"
$env:EXPO_UNSTABLE_TUNNEL_V2="1"
npx expo start --dev-client --tunnel --clear --port 8082
```

Escanea el QR con el development build. La URL de `EXPO_PUBLIC_API_URL` corresponde al backend; la URL del tunel de Expo solo sirve para descargar el bundle del frontend.

## Actualizacion HU-12

El frontend conserva `eas.json` para development builds y `nginx.conf` para servir la version web con Docker. El tunel de Expo usa `EXPO_UNSTABLE_TUNNEL_V2=1` mediante `npm run start:tunnel`, con el puerto Metro 8082.
