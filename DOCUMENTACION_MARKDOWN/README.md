# Documentacion Tecnica - GPS Guardian Escolar Frontend

> Version: 1.0.0 | Stack: React Native + Expo Router | Plataformas: Android, iOS y Web

Esta carpeta documenta el frontend listo para repositorio. El codigo fuente oficial queda en `frontend-repo`; las dependencias generadas, builds locales y variables reales de entorno no se suben al repositorio.

## Estado Actual Del Repo

- Carpeta oficial para subir: `frontend-repo`.
- No debe incluir: `node_modules`, `.expo`, `dist`, `web-build`, `android`, `ios`, `.env`, logs ni archivos temporales.
- Si se necesita ejecutar localmente, instalar dependencias con `npm install` o `npm ci`.
- Para levantar todo el sistema junto con backend y base de datos, usar la carpeta externa `docker-infra`.
- El archivo `.env.example` queda como plantilla; los valores reales van en `.env` local o en `docker-infra/.env`.

## Indice Principal

| # | Documento | Descripcion |
|---|---|---|
| 01 | [Estructura General](./01_ESTRUCTURA_GENERAL.md) | Arbol real de carpetas y convenciones del repo |
| 02 | [Carpeta app](./02_CARPETA_APP.md) | Pantallas principales y rutas de Expo Router |
| 03 | [Carpeta components](./03_CARPETA_COMPONENTS.md) | Componentes reutilizables de interfaz |
| 04 | [Carpetas del Sistema](./04_CARPETAS_DEL_SISTEMA.md) | Contexts, hooks, services, utils, translations y assets |
| 05 | [Colores y Funcionalidades](./05_COLORES_Y_FUNCIONALIDADES.md) | Paleta visual y funciones del frontend |
| 06 | [Explicacion General](./06_EXPLICACION_GENERAL_DEL_PROYECTO.md) | Vision general del proyecto |
| 07 | [Internacionalizacion i18n](./07_INTERNACIONALIZACION_I18N.md) | Sistema de traducciones ES/EN |
| 08 | [Estilos](./08_ESTILOS_POR_QUE_NO_CSS_NI_HTML.md) | Por que React Native no usa HTML/CSS tradicional |
| 09 | [Dependencias](./09_DEPENDENCIAS.md) | Librerias principales y motivo de uso |
| 10 | [Flujo de Datos](./10_FLUJO_DE_DATOS_Y_ESTADO.md) | Estado local, sesion y consumo de API |
| 11 | [Navegacion Expo Router](./11_NAVEGACION_EXPO_ROUTER.md) | Rutas por archivos, layouts y tabs |
| 12 | [Autenticacion y Seguridad](./12_AUTENTICACION_Y_SEGURIDAD.md) | Login, registro, verificacion, 2FA y guards |
| 13 | [Configuracion y Despliegue](./13_CONFIGURACION_Y_DESPLIEGUE.md) | Como instalar, configurar y ejecutar |
| 14 | [GPS y Tiempo Real](./14_GPS_Y_TIEMPO_REAL.md) | Mapas, ubicacion y WebSocket |
| 15 | [Patrones de Diseno](./15_PATRONES_DE_DISENO.md) | Patrones aplicados y antipatrones evitados |
| 16 | [ADR](./16_DECISIONES_DE_ARQUITECTURA_ADR.md) | Decisiones de arquitectura |
| 17 | [Glosario Tecnico](./17_GLOSARIO_TECNICO.md) | Terminos tecnicos del proyecto |
| 18 | [Flujo Git](./18_FLUJO_DE_TRABAJO_GIT.md) | Ramas, commits y manejo de cambios |

## Preguntas Rapidas

| Pregunta | Documento |
|---|---|
| Como ejecuto el frontend? | [13](./13_CONFIGURACION_Y_DESPLIEGUE.md) |
| Como se conecta al backend? | [13](./13_CONFIGURACION_Y_DESPLIEGUE.md), [09](./09_DEPENDENCIAS.md) |
| Donde esta el login/registro? | [02](./02_CARPETA_APP.md), [12](./12_AUTENTICACION_Y_SEGURIDAD.md) |
| Como funciona el mapa? | [14](./14_GPS_Y_TIEMPO_REAL.md) |
| Que se debe subir al repo? | [01](./01_ESTRUCTURA_GENERAL.md), [13](./13_CONFIGURACION_Y_DESPLIEGUE.md) |

## Nota De Buenas Practicas

Este repositorio debe quedar liviano y reproducible: se sube codigo fuente, configuracion, assets y documentacion; cada desarrollador regenera dependencias con npm y configura sus variables en archivos locales no versionados.
