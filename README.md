# GPS Guardian Escolar — Frontend

Frontend móvil/web desarrollado con React Native, Expo y Expo Router.

## Estado actual

Este repositorio contiene un avance del frontend. Algunas integraciones (backend, rastreo real, WebSocket y notificaciones push) continúan en desarrollo y se incorporarán en HU posteriores.

## Ejecución local

```bash
npm install
npx expo start
```

## Variables de entorno

Usa `.env.example` como referencia y crea tu `.env` local. El archivo `.env` no debe subirse al repositorio.

## Flujo Git del proyecto

Cada Historia de Usuario se promueve de forma controlada por las ramas del ambiente:

```text
HU-XX-dev  -> Pull Request -> develop
HU-XX-qa   -> Pull Request -> qa
HU-XX-main -> Pull Request -> main
```

Las ramas permanentes son `develop`, `qa` y `main`.
