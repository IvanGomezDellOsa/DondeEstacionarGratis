import type { TileProvider } from '../types/TileProvider';

/**
 * Estilos vectoriales disponibles en MapTiler.
 * Lista no exhaustiva; ver https://docs.maptiler.com/cloud/maps/ para todos.
 */
export type MapTilerStyle =
  | 'streets-v2'
  | 'streets-v2-light'
  | 'streets-v2-dark'
  | 'basic-v2'
  | 'bright-v2'
  | 'hybrid'
  | 'satellite';

/**
 * Implementación de TileProvider que apunta a tiles vectoriales de MapTiler.
 *
 * NOTA DE SEGURIDAD: la API key viaja al cliente porque MapLibre se renderiza
 * en el browser. Para evitar abuso del free tier:
 *   1. Configurar "Allowed origins" en el dashboard de MapTiler con el dominio
 *      de producción (https://dondeestacionargratis.com.ar) y los de preview.
 *   2. Nunca commitear la key. Vive en `.env` localmente y en variables de
 *      entorno de Cloudflare Pages en producción.
 *   3. Doc oficial:
 *      https://docs.maptiler.com/guides/maps-apis/maps-platform/how-to-protect-your-map-key/
 */
export class MapTilerProvider implements TileProvider {
  public readonly attribution: string =
    '© <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener">MapTiler</a> ' +
    '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>';

  constructor(
    private readonly apiKey: string,
    private readonly styleId: MapTilerStyle = 'streets-v2',
  ) {
    if (!apiKey) {
      throw new Error(
        'MapTilerProvider: apiKey vacía. Configurá PUBLIC_MAPTILER_KEY en .env',
      );
    }
  }

  public getStyleURL(): string {
    return `https://api.maptiler.com/maps/${this.styleId}/style.json?key=${this.apiKey}`;
  }
}

/**
 * Factory que arma un MapTilerProvider leyendo la key desde las env vars de Astro.
 *
 * Usar en lugar de instanciar directamente:
 *
 *   import { createMapTilerProvider } from '@/lib/MapTilerProvider';
 *   const provider = createMapTilerProvider();
 *   const styleUrl = provider.getStyleURL();
 *
 * @throws Error si PUBLIC_MAPTILER_KEY no está definida.
 */
export function createMapTilerProvider(
  styleId: MapTilerStyle = 'streets-v2',
): MapTilerProvider {
  const key = import.meta.env.PUBLIC_MAPTILER_KEY;
  if (!key) {
    throw new Error(
      'PUBLIC_MAPTILER_KEY no definida. Copiá .env.example a .env y completá la key.',
    );
  }
  return new MapTilerProvider(key, styleId);
}
