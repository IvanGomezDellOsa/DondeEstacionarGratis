/**
 * TileProvider — contrato para proveedores de map tiles (ADR-002).
 *
 * El componente de mapa depende de esta interfaz, no de una implementación
 * concreta. Migrar de MapTiler a Protomaps (u otro proveedor) es un cambio
 * de implementación, no de contrato.
 *
 * Triggers de migración documentados en ADR-002:
 *   1. >= 80k loads/mes (80% del free tier de MapTiler).
 *   2. Se agrega un segundo país al dataset.
 *   3. MapTiler cambia su pricing de forma desfavorable.
 */
export interface TileProvider {
  /**
   * Devuelve la URL del archivo `style.json` que MapLibre GL consume.
   * Esta URL puede ser remota (MapTiler) o estática local (Protomaps PMTiles).
   */
  getStyleURL(): string;

  /**
   * String HTML de atribución legal a mostrar en el mapa.
   * Requerido por las licencias de OpenStreetMap y de los proveedores
   * comerciales (MapTiler, etc.).
   */
  readonly attribution: string;
}
