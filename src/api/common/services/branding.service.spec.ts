import { BrandingService } from './branding.service';
import { Vibrant } from 'node-vibrant';

// Mock node-vibrant
jest.mock('node-vibrant', () => ({
  Vibrant: {
    from: jest.fn().mockReturnThis(),
    getPalette: jest.fn(),
  },
}));

describe('BrandingService', () => {
  let service: BrandingService;

  beforeEach(() => {
    service = new BrandingService();
    jest.clearAllMocks();
  });

  it('should extract a palette from a logo URL', async () => {
    const mockPalette = {
      Vibrant: { hex: '#ff0000' },
      LightVibrant: { hex: '#ffaaaa' },
      DarkMuted: { hex: '#330000' },
    };

    (Vibrant.from as jest.Mock).mockReturnThis();
    (Vibrant.from('url').getPalette as jest.Mock).mockResolvedValue(mockPalette);

    const result = await service.extractPaletteFromLogo('https://example.com/logo.png');

    expect(result).toEqual({
      primary: '#ff0000',
      accent: '#ffaaaa',
      muted: '#330000',
    });
  });

  it('should fallback to defaults if extraction fails', async () => {
    (Vibrant.from as jest.Mock).mockReturnThis();
    (Vibrant.from('url').getPalette as jest.Mock).mockRejectedValue(new Error('Failed'));

    const result = await service.extractPaletteFromLogo('https://example.com/bad-logo.png');

    expect(result).toEqual({
      primary: '#f37c22',
      accent: '#fbbf24',
      muted: '#1e293b',
    });
  });
});
