import { MediaType } from '@prisma/client';
import { MediaService } from './media.service';

describe('MediaService type normalization', () => {
  it('maps EP uploads to ALBUM media type', () => {
    const service = new MediaService({} as any, {} as any);

    const normalizedType = (service as any).normalizeMediaType('EP');

    expect(normalizedType).toBe(MediaType.ALBUM);
  });

  it('keeps explicit audio and video types intact', () => {
    const service = new MediaService({} as any, {} as any);

    expect((service as any).normalizeMediaType('AUDIO')).toBe(MediaType.AUDIO);
    expect((service as any).normalizeMediaType('VIDEO')).toBe(MediaType.VIDEO);
  });
});
