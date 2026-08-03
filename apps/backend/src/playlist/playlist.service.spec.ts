import { PlaylistService } from './playlist.service';

describe('PlaylistService privacy rules', () => {
  let prisma: any;
  let eventsGateway: any;
  let service: PlaylistService;

  beforeEach(() => {
    prisma = {
      playlist: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    eventsGateway = {
      emitPlaylistUpdated: jest.fn(),
    };

    service = new PlaylistService(prisma, eventsGateway);
  });

  it('returns only public playlists for anonymous listing', async () => {
    prisma.playlist.findMany.mockResolvedValue([{ id: 1, isPublic: true }]);

    await service.findAll();

    expect(prisma.playlist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isPublic: true },
      }),
    );
  });

  it('allows the owner to fetch a private playlist and blocks others', async () => {
    prisma.playlist.findFirst
      .mockResolvedValueOnce({ id: 7, userId: 42, isPublic: false })
      .mockResolvedValueOnce(null);

    await expect(service.findOne(7, 42)).resolves.toMatchObject({ id: 7, userId: 42 });
    await expect(service.findOne(7, 99)).rejects.toThrow('Playlist not found or access denied');
  });
});
