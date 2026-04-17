import { Injectable } from '@nestjs/common';
import { Vibrant } from 'node-vibrant';
import { logger } from '@/lib/logger';

@Injectable()
export class BrandingService {
  /**
   * High-Level UI Intelligence: Dynamic Color Extraction.
   * Extracts a sophisticated color palette from a company logo.
   * Leverages 'node-vibrant' for industry-standard color quantification.
   */
  async extractPaletteFromLogo(logoUrl: string): Promise<{ primary: string; accent: string; muted: string }> {
    try {
      logger.info(`🎨 Analyzing logo palette: ${logoUrl}`);
      
      const palette = await Vibrant.from(logoUrl).getPalette();
      
      // Select the most vibrant and professional combination
      const primary = palette.Vibrant?.hex || '#f37c22'; // Default Orange fallback
      const accent = palette.LightVibrant?.hex || palette.Vibrant?.hex || '#fbbf24';
      const muted = palette.DarkMuted?.hex || '#1e293b';

      return {
        primary,
        accent,
        muted
      };
    } catch (err) {
      logger.warn(`⚠️ Palette extraction failed for ${logoUrl}. Falling back to system defaults.`);
      return {
        primary: '#f37c22',
        accent: '#fbbf24',
        muted: '#1e293b'
      };
    }
  }
}
