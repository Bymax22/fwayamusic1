import { MediaType } from '@prisma/client';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

describe('MediaService type normalization', () => {
  it('maps EP uploads to ALBUM media type', () => {
    const service = new MediaService({} as any, {} as any, {} as any, {} as any);

    const normalizedType = (service as any).normalizeMediaType('EP');

    expect(normalizedType).toBe(MediaType.ALBUM);
  });

  it('rejects missing release dates rather than inventing one', () => {
    const service = new MediaService({} as any, {} as any, {} as any, {} as any);

    expect(() => (service as any).resolveReleaseDate(undefined)).toThrow('A valid release date is required');
  });

  it('keeps explicit audio and video types intact', () => {
    const service = new MediaService({} as any, {} as any, {} as any, {} as any);

    expect((service as any).normalizeMediaType('AUDIO')).toBe(MediaType.AUDIO);
    expect((service as any).normalizeMediaType('VIDEO')).toBe(MediaType.VIDEO);
  });
});

describe('MediaController JSON serialization', () => {
  it('serializes addedAt and createdAt dates as ISO strings', () => {
    const controller = new MediaController({} as any, {} as any, {} as any);
    const addedAt = new Date('2026-09-30T12:00:00.000Z');
    const createdAt = new Date('2026-09-29T12:00:00.000Z');

    const result = (controller as any).sanitizeForJson({ addedAt, createdAt });

    expect(result).toEqual({
      addedAt: '2026-09-30T12:00:00.000Z',
      createdAt: '2026-09-29T12:00:00.000Z',
    });
  });
});
