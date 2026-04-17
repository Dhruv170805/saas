
import { DbTenantTheme } from './db/schema';
import { Vibrant } from 'node-vibrant/node';

/**
 * Converts a theme configuration into a CSS variable block.
 */
export function generateThemeCss(theme: DbTenantTheme): string {
  const primary = theme.primary || '#f37c22';
  const accent = theme.accent || '#ffffff';
  const muted = theme.muted || '#1e293b';
  
  const primaryGlow = `${primary}4d`; 
  
  return `
    :root {
      --primary: ${primary};
      --primary-glow: ${primaryGlow};
      --primary-gradient: linear-gradient(135deg, ${primary} 0%, ${muted} 100%);
      --accent: ${accent};
      --font-family: '${theme.font || 'Inter'}', sans-serif;
    }
  `.replace(/\s+/g, ' ').trim();
}

/**
 * Extracts a color palette from an image using node-vibrant.
 */
export async function extractPaletteFromLogo(logoUrl: string): Promise<Partial<DbTenantTheme>> {
  try {
    if (!logoUrl) return {};
    
    const palette = await Vibrant.from(logoUrl).getPalette();
    
    return {
      primary: palette.Vibrant?.hex || '#f37c22',
      accent: palette.LightVibrant?.hex || '#ffffff',
      muted: palette.DarkMuted?.hex || '#1e293b',
    };
  } catch (error) {
    console.error('🎨 Palette Extraction Failed:', error);
    return {
      primary: '#f37c22',
      accent: '#ffffff',
    };
  }
}
