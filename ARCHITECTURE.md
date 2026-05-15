# Arquitectura — DondeEstacionarGratis

> Web mobile-first que muestra dónde y cuándo rige el estacionamiento medido en ciudades de Argentina. Sin login, sin pagos.
>
> Este documento resume las decisiones de arquitectura del proyecto y el razonamiento detrás de cada una.

---

## Stack

| Capa           | Decisión                                       |
| -------------- | ---------------------------------------------- |
| Framework      | Astro 4 + TypeScript + Tailwind                |
| Mapa           | MapLibre GL + MapTiler tiles                   |
| Scripts        | Node + TypeScript                              |
| Datos          | JSON estático por país (`data/cities/ar.json`) |
| Hosting        | Cloudflare Pages                               |
| Automatización | GitHub Actions (cron mensual)                  |
| Reportes       | Formspree → mail directo                       |
| Analytics      | Ninguno en MVP                                 |

**Costo recurrente objetivo: $0 USD/mes.**

---

## Principios rectores

- **Sencillez como estándar.** Cada feature pasa el test: _"¿se puede sacar sin perder valor?"_.
- **El producto funciona con 0 usuarios.** Ninguna feature depende de input externo en tiempo real.
- **Costo marginal cero.** Toda decisión de infra prioriza free tier sostenible.
- **El mapa es el héroe.** Visual impecable, área pintada con claridad.
- **Diseñar para cambio futuro cuando es barato** (schemas extensibles, contratos abstractos), **no pre-implementar lo caro** (i18n library, DB real, tiles self-hosted) — solo cuando se gatille un trigger documentado.

---

## Decisiones clave

### Framework: Astro + TypeScript + Tailwind

Astro pre-renderiza cada ciudad como página estática individual. `/ar/tandil` existe como HTML servido directamente desde CDN, con LCP por debajo de 1s sin esfuerzo. El mapa se hidrata solo cuando entra al viewport (islands architecture). El i18n nativo de Astro permite extender a `/en/`, `/fr/` sin librería externa.

Se descartó Next.js + Vercel por overkill y vendor lock-in; SvelteKit por comunidad más chica y menos plugins de mapas; Vite vanilla por requerir SSR manual para SEO.

### Mapa: MapLibre GL + MapTiler

MapLibre GL es el fork open-source de Mapbox GL. Vector tiles, calidad visual top, free tier de MapTiler suficiente para el MVP y crecimiento inicial (100k loads/mes).

El componente expone una interfaz `TileProvider` con un único método `getStyleURL()`. La implementación inicial apunta a MapTiler; migrar a Protomaps PMTiles self-hosted es un cambio de implementación, no de contrato (Dependency Inversion aplicado).

**Trigger de migración a Protomaps:** 80% del free tier, segundo país sumado al dataset, o cambio desfavorable de pricing.

### Datos: JSON estático por país

`data/cities/ar.json` versionado en el repo. Cuando se sume otro país: `data/cities/us.json`, etc. El frontend carga solo el país que necesita.

Schema con códigos ISO 3166 (`country: "AR"`, `region_iso: "AR-B"`) — funciona para cualquier país sin lógica especial. Cada entrada incluye `source` con provenance, `verification.verified_at` para trazabilidad, y `schema_version` para evolución del schema sin romper datos existentes.

El schedule contempla `default` + `seasonal_overrides`, necesario para ciudades costeras y turísticas donde el régimen cambia en temporada (Mar del Plata, Pinamar, Bariloche, etc.). Sin este campo el dataset le mentiría al usuario en verano.

**Trigger de migración a base de datos:** total > 1000 ciudades, JSON por país > 2 MB, o aparición de queries dinámicas (bbox, filtros complejos). Destino previsto: Cloudflare D1.

### Scripts: Node + TypeScript

Una sola toolchain con el frontend, tipos compartidos con el schema, CI instantánea. Los scripts del MVP son simples (parseo, hash, request HTTP); no se justifica Python. Excepción autorizada: scraping pesado contra JS dinámico → Playwright en Python puntual.

### Soporte iOS Safari

El stack soporta Safari iOS 14+ nativamente. Tres requisitos en la Definition of Done: uso explícito de `env(safe-area-inset-*)` en elementos fijos, QA manual en iOS Safari real antes del deploy, y meta tags Apple (`apple-touch-icon`, `theme-color`, `apple-mobile-web-app-status-bar-style`) desde día 1.

**App Store deferred.** Wrappeo con Capacitor + build con EAS/Codemagic está abierto como camino, pero solo se ejecuta si la web supera 1000 visitas únicas mensuales sostenidas por 3+ meses. El stack actual no obstruye esa migración.

---

## Lo que NO se hace en MVP

Estos son **deferrals deliberados**, no omisiones. Cada uno tiene un trigger documentado.

| No se hace                            | Cuándo se haría                                 |
| ------------------------------------- | ----------------------------------------------- |
| Librería i18n (i18next)               | Al sumar el primer idioma adicional             |
| Base de datos real                    | Al superar 1000 ciudades o 2 MB por país        |
| Tiles self-hosted (Protomaps)         | Al 80% del free tier de MapTiler o segundo país |
| API REST propia                       | Cuando el frontend necesite queries dinámicas   |
| Service Worker / offline (PWA)        | Fase NEXT, no MVP                               |
| Capacitor / build iOS                 | Si se cumplen los triggers de tráfico sostenido |
| Sistema de cuentas, push, comentarios | Nunca (non-goals explícitos)                    |

---

## Métricas de éxito técnico

- Lighthouse mobile ≥ 90 en performance, accesibilidad, best practices y SEO.
- LCP < 2.5s en 3G simulado.
- Costo recurrente ≤ $0/mes durante los primeros 3 meses.
- 100% de ciudades AR con SEM identificadas: publicadas (verificadas) o descartadas con justificación.

---

## Aplicación pragmática de SOLID

| Principio             | Aplicación                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------- |
| Single Responsibility | Tres capas separadas: datos, rendering, pipeline de refresh                                   |
| Open/Closed           | Schema extensible vía `schema_version`; campos por país no rompen código existente            |
| Liskov Substitution   | Una "ciudad" AR y una "ciudad" US comparten interfaz; el renderer no distingue                |
| Interface Segregation | El frontend carga solo el país que el usuario mira, no el dataset global                      |
| Dependency Inversion  | Componentes dependen de interfaces (`TileProvider`, `CityRepository`), no de implementaciones |

---

## Estructura del repo

```
data/
  cities/ar.json         # dataset verificado por país
  raw/                   # output crudo de la investigación inicial
src/
  pages/                 # rutas Astro (incluye /ar/[city])
  components/            # componentes UI
  lib/                   # TileProvider, repositorios, utilidades
  types/                 # tipos compartidos (City, TileProvider)
scripts/
  classify.ts            # matriz de fidelidad A-F sobre output Gemini
  refresh-check.ts       # hash de URLs fuente para refresh mensual
.github/workflows/
  refresh.yml            # cron mensual
```

---

## Contacto

Para preguntas sobre el plan de ejecución, decisiones internas en curso o el dataset completo: `ivangomezdellosa@gmail.com`.
