# DondeEstacionarGratis

> Mapa del estacionamiento medido por ciudad, horarios y áreas vigentes.

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow)

---

## Qué es

Web mobile-first que responde en 2 segundos a la pregunta del conductor — sobre todo del turista —:

> **¿Esta cuadra tiene estacionamiento medido? ¿Dónde está el estacionamiento medido? ¿Hasta qué hora?**

Para cualquier ciudad argentina con sistema vigente. Sin login, sin pagos, sin distracciones.

## Por qué existe

Las apps municipales asumen que ya sabés cómo funciona el sistema y se enfocan en cobrar. El turista que llega por primera vez a una ciudad no tiene de dónde sacar el dato confiable, rápido y visual. Resultado: multas evitables y tiempo perdido.

Este proyecto cubre ese hueco con un mapa nacional, datos verificados contra ordenanzas oficiales, y cero fricción.

## Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | Astro 4 + TypeScript + Tailwind | Pre-render por ciudad para SEO, islands architecture, free hosting |
| Mapa | MapLibre GL + MapTiler | Vector tiles, free tier suficiente, sin lock-in (abstracción `TileProvider`) |
| Datos | JSON por país en repo | Cero infra, versionado por git, schema con códigos ISO 3166 |
| Hosting | Cloudflare Pages | Edge global, requests ilimitados en free tier |
| Scripts | Node + TypeScript | Toolchain unificada con el frontend |
| Automatización | GitHub Actions | Cron mensual de refresh, free tier |

**Costo mensual esperado: $0.** Único costo: dominio (~$10/año).

## Cómo está pensado

El proyecto está documentado antes que codeado. Dos archivos cuentan toda la historia:

- [`PLAN.md`](PLAN.md) — visión, principios rectores, pasos de ejecución, definición de "done", riesgos, especificación de producto.
- [`ADR.md`](ADR.md) — 6 Architecture Decision Records con contexto, alternativas evaluadas, decisión, rationale y consecuencias. Frontend, mapas, scripts, datos, soporte Apple, naming.

> Principio rector: *"No hay nada más sofisticado que la sencillez."*

## Autor

**Iván Gómez Dell'Osa**

- Email: [ivangomezdellosa@gmail.com](mailto:ivangomezdellosa@gmail.com)
- LinkedIn: [linkedin.com/in/ivangomezdellosa](https://www.linkedin.com/in/ivangomezdellosa/)
- GitHub: [IvanGomezDellOsa](https://github.com/IvanGomezDellOsa)

