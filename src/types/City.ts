/**
 * Schema de una ciudad con estacionamiento medido (ADR-004).
 *
 * Diseñado para extensibilidad internacional desde día 1: ISO 3166-1/2 codes,
 * sin campos específicos de Argentina, schema_version para migraciones.
 *
 * El JSON vive en `data/cities/{country}.json` (ej. `data/cities/ar.json`).
 * El frontend carga sólo el país que se está mostrando.
 */

// ---------------------------------------------------------------------------
// GeoJSON Polygon tipado inline para no agregar dependencia @types/geojson.
// Si en el futuro se incorpora @types/geojson, reemplazar por
// `import type { Polygon } from 'geojson'`.
// ---------------------------------------------------------------------------

/** Posición [longitud, latitud] (opcionalmente con altitud). */
export type GeoPosition = [number, number] | [number, number, number];

/**
 * Polígono GeoJSON conforme a RFC 7946.
 * Primer ring = boundary exterior; rings siguientes = huecos.
 * Cada ring debe cerrarse: primer punto == último punto.
 */
export interface GeoPolygon {
  type: 'Polygon';
  coordinates: GeoPosition[][];
}

// ---------------------------------------------------------------------------
// Tipos de horario
// ---------------------------------------------------------------------------

/**
 * Reglas de horario semanal.
 * Cada campo: string `"HH:MM-HH:MM"` (ej. `"08:00-20:00"`) o `null` si no se
 * cobra ese día.
 */
export interface ScheduleRules {
  /** Lunes a viernes. */
  mon_fri: string | null;
  /** Sábados. */
  sat: string | null;
  /** Domingos y feriados (agrupados — la mayoría de municipios AR los trata igual). */
  sun_holidays: string | null;
}

/**
 * Régimen estacional que sobreescribe el horario default durante un período.
 *
 * Casos reales en AR (mayo 2026, no exhaustivo):
 *   - Costa: Mar del Plata, Pinamar, Cariló, Villa Gesell, Mar de Ajó,
 *     San Bernardo, Las Toninas, Santa Teresita, Necochea, Monte Hermoso.
 *   - Patagonia: Las Grutas, Puerto Madryn.
 *   - Serrano/turismo: Villa Carlos Paz, La Cumbre, La Falda,
 *     San Martín de los Andes, sectores de Bariloche.
 *
 * Wrap-around: si `ends < starts` (ej. starts="12-15", ends="03-15"),
 * el override cruza el cambio de año. La lógica del frontend debe
 * contemplarlo.
 */
export interface SeasonalOverride {
  /** Nombre legible, ej. "Temporada de verano". */
  name: string;
  /** Fecha de inicio en formato `"MM-DD"`, recurrente anualmente. */
  starts: string;
  /** Fecha de fin en formato `"MM-DD"`. Si ends < starts, el período cruza fin de año. */
  ends: string;
  /** Horarios vigentes durante este período (reemplazan al default). */
  rules: ScheduleRules;
  /**
   * Si el área medida también cambia durante esta temporada, definir el
   * polígono alternativo aquí. `null` = el área no cambia, sólo los horarios.
   */
  area_override_geojson: GeoPolygon | null;
}

/** Horario completo de una ciudad: default + overrides estacionales + tz. */
export interface CitySchedule {
  /** Régimen que aplica todo el año, salvo que un override esté vigente. */
  default: ScheduleRules;
  /** Lista (posiblemente vacía) de regímenes estacionales. */
  seasonal_overrides: SeasonalOverride[];
  /** IANA timezone, ej. `"America/Argentina/Buenos_Aires"`. */
  timezone: string;
}

// ---------------------------------------------------------------------------
// Tipos de fuente y verificación
// ---------------------------------------------------------------------------

/**
 * Nivel de fidelidad según la matriz A-F (ver PLAN.md / classify.ts).
 *   A — ordenanza oficial vigente, citada literal.
 *   B — portal municipal con datos estructurados y actualizados.
 *   C — comunicado de prensa oficial.
 *   D — diario local creíble.
 *   E — fuente secundaria sin confirmación.
 *   F — rumor / descartada.
 *
 * Sólo A y B se publican directo. C/D/E van a `cities-to-verify.csv`.
 */
export type FidelityLevel = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/** Tipos de fuente conocidos. Abierto a extensión vía `string`. */
export type SourceType =
  | 'ordenanza_oficial'
  | 'portal_municipal'
  | 'comunicado_prensa'
  | 'diario_local'
  | 'otro'
  | (string & {}); // permite extensión sin perder autocomplete de los conocidos

/** Procedencia auditable del dato. */
export interface CitySource {
  /** URL canónica al documento fuente (acceso público idealmente). */
  url: string;
  /** Tipo de fuente. */
  type: SourceType;
  /** Referencia humana, ej. `"Ordenanza 17.435/2023"`. `null` si no aplica. */
  reference: string | null;
  /** Nivel de fidelidad asignado por la matriz A-F. */
  fidelity_level: FidelityLevel;
}

/** Verificación humana del dato. */
export interface CityVerification {
  /** Fecha ISO `"YYYY-MM-DD"` de la última verificación. */
  verified_at: string;
  /** Quién verificó. Abierto pero conocidos: owner, community. */
  verified_by: 'owner' | 'community' | (string & {});
  /** Cómo se verificó: manual, automated, etc. */
  method: 'manual' | 'automated' | (string & {});
}

// ---------------------------------------------------------------------------
// Área medida
// ---------------------------------------------------------------------------

export interface CityArea {
  /**
   * Descripción textual del perímetro, legible por humanos.
   * Ej. "Cuadrante delimitado por Av. España, Av. Santamarina, 14 de Julio y Maipú".
   */
  description: string;
  /** Polígono GeoJSON del área medida. */
  polygon_geojson: GeoPolygon;
  /** Centro del mapa para esta ciudad: `[longitud, latitud]`. */
  map_center: [number, number];
  /** Zoom inicial del mapa al entrar a la vista de detalle (típico: 13-15). */
  map_zoom: number;
}

// ---------------------------------------------------------------------------
// Tipo principal
// ---------------------------------------------------------------------------

/**
 * Una ciudad publicable. Una entrada en `data/cities/{country}.json` cumple
 * exactamente este contrato.
 */
export interface City {
  /**
   * Identificador globalmente único: `"{country}-{city_slug}"`.
   * Ej. `"ar-tandil"`, `"us-san-francisco"`.
   */
  id: string;
  /** ISO 3166-1 alpha-2, ej. `"AR"`, `"US"`, `"FR"`. */
  country: string;
  /** ISO 3166-2, ej. `"AR-B"` (Bs. As.), `"US-CA"`, `"FR-75"`. */
  region_iso: string;
  /** Nombre de display, ej. `"Tandil"`. */
  city_name: string;
  /** Slug URL sin prefijo de país, ej. `"tandil"` (para `/ar/tandil`). */
  city_slug: string;
  area: CityArea;
  schedule: CitySchedule;
  source: CitySource;
  verification: CityVerification;
  /** Notas libres del owner (excepciones, comentarios). `null` por defecto. */
  notes: string | null;
  /**
   * Versión del schema. Incrementar en cambios incompatibles para permitir
   * migraciones (Open/Closed aplicado a datos).
   */
  schema_version: 1;
}

/**
 * Helper type-guard runtime (mínimo). Para validación estricta usar un schema
 * de Zod o JSON Schema; este chequeo es defensivo para imports dinámicos.
 */
export function isCity(value: unknown): value is City {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.country === 'string' &&
    typeof v.city_slug === 'string' &&
    v.schema_version === 1
  );
}
