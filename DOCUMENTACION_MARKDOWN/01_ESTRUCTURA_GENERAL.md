# Estructura General Del Proyecto
## GPS Guardian Escolar - Frontend

> Aplicacion movil y web construida con React Native + Expo Router para seguimiento GPS escolar, autenticacion, notificaciones y paneles por rol.

## Carpeta Oficial

```text
frontend-repo/
```

Esta es la carpeta preparada para subir al repositorio del frontend. Debe mantenerse limpia, sin dependencias instaladas ni archivos privados.

## Arbol Real De Carpetas

```text
frontend-repo/
├── .vscode/                    # Ajustes locales recomendados para VS Code
├── app/                        # Pantallas y rutas de Expo Router
│   ├── (auth)/                 # Login, registro, recuperacion, verificacion y 2FA
│   ├── (tabs)/                 # Vistas principales luego del inicio de sesion
│   ├── _layout.js              # Layout raiz
│   └── student-dashboard.js    # Vista del estudiante
├── assets/                     # Imagenes, iconos y recursos estaticos
│   ├── expo.icon/
│   └── images/
├── components/                 # Componentes reutilizables
│   ├── common/                 # UI comun
│   └── layout/                 # Contenedores/layouts
├── config/                     # Configuracion de API y entorno
├── constants/                  # Constantes del proyecto
├── contexts/                   # Estado global con React Context
├── hooks/                      # Hooks personalizados usados por la app
├── scripts/                    # Scripts de mantenimiento
├── services/                   # Comunicacion con backend y WebSocket
├── theme/                      # Tema visual
├── translations/               # Textos ES/EN
├── utils/                      # Funciones auxiliares
├── .dockerignore               # Exclusiones para imagen Docker
├── .env.example                # Plantilla de variables, sin secretos
├── .gitignore                  # Exclusiones Git
├── app.json                    # Configuracion Expo
├── Dockerfile                  # Imagen del frontend web
├── eslint.config.js            # Configuracion de lint
├── nginx.conf                  # Servidor web para build exportado
├── package-lock.json           # Versiones bloqueadas de dependencias
├── package.json                # Scripts y dependencias npm
├── README.md                   # Resumen del repo
└── tsconfig.json               # Configuracion TypeScript/Expo
```

## Elementos Que No Deben Subirse

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

Estos elementos son generados, locales o sensibles. Se recrean con `npm install`, `npx expo export` o el flujo de Docker.

## Flujo De La Aplicacion

```text
Usuario abre la app
        ↓
app/_layout.js
        ↓
Autenticacion / Tabs protegidas
        ↓
Dashboard, estudiantes, rutas, historial, notificaciones, perfil
```

## Capas Principales

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| Rutas y pantallas | `app/` | Navegacion y vistas de usuario |
| Componentes | `components/` | UI reutilizable |
| Estado | `contexts/`, `hooks/` | Sesion, idioma, eventos y datos locales |
| API | `services/`, `config/` | Axios, WebSocket y consumo del backend |
| Estilo | `theme/`, `constants/` | Paleta, tema y constantes visuales |
| Utilidades | `utils/` | Validaciones, storage y helpers |
| Recursos | `assets/` | Logos, iconos e imagenes |

## Tecnologias

| Tecnologia | Uso |
|---|---|
| React Native | Base de UI multiplataforma |
| Expo | Tooling, ejecucion y export web |
| Expo Router | Navegacion por archivos |
| Axios | Consumo REST |
| AsyncStorage / SecureStore | Persistencia local y credenciales |
| React Native Paper | Componentes visuales |
| React Native Web | Compatibilidad web |
| WebSocket/STOMP | Comunicacion en tiempo real |

## Regla De Mantenimiento

Antes de subir cambios, validar que el repo siga limpio:

```bash
npm install
npm run lint
npx expo export --platform web
```

Luego eliminar nuevamente carpetas generadas si se preparara el paquete para subir manualmente.

## Actualizacion HU-12

La estructura actual del frontend incluye las pantallas de autenticacion y navegacion por Expo Router, los modulos de hijos, perfil, seguimiento, zonas, historial y notificaciones, ademas de componentes reutilizables como `CalendarDatePicker`. La historia tambien incorpora utilidades para normalizar grados, validar formularios y mantener el estado de los hijos.
