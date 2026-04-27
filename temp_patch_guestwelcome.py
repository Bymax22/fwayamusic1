from pathlib import Path
path = Path('c:/Users/BYMAX SERVICES/Documents/fwaya-music/apps/frontend/app/components/GuestWelcome.tsx')
lines = path.read_text(encoding='utf-8').splitlines()
start = None
end = None
for i, line in enumerate(lines):
    if line.strip() == '/* Top Charts (mobile styled) */':
        start = i
        break
if start is None:
    raise SystemExit('start not found')
for i in range(start+1, len(lines)):
    if lines[i].strip() == '/* Suggested Playlists (mobile) */':
        end = i
        break
if end is None:
    raise SystemExit('end not found')

replacement = [
"            {/* Top Charts (mobile styled) */}",
"            <div className=\"mt-3\">",
"              <h3 className=\"font-semibold mb-3\">Top Charts</h3>",
"              <div className=\"space-y-3\">",
"                {topCharts.slice(0, 6).map((track: any, i: number) => (",
"                  <div key={track.id || i} className=\"bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors\">",
"                    <div className=\"flex items-center gap-3 mb-2\">",
"                      <span className=\"text-gray-400 w-5 text-sm\">{i + 1}</span>",
"                      <div className=\"w-10 h-10 rounded-md overflow-hidden bg-black flex-shrink-0 relative\">",
"                        {track.artCoverUrl ? (",
"                          <Image",
"                            src={track.artCoverUrl}",
"                            alt={track.title || 'Track art'}",
"                            fill",
"                            className=\"object-cover\"",
"                          />",
"                        ) : null}",
"                      </div>",
"                      <div className=\"flex-1\">",
"                        <p className=\"text-sm font-medium\">{track.title}</p>",
"                        <div className=\"flex items-center justify-between\">",
"                          <p className=\"text-xs text-gray-400\">{track.user?.displayName || track.user?.username || 'Unknown'} — {track.genre || 'Track'}</p>",
"                          <span className=\"text-xs text-gray-400 ml-2 flex-shrink-0\">",
"                            {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '0:00'}",
"                          </span>",
"                        </div>",
"                      </div>",
"                      <button ",
"                        onClick={() => playTrack({",
"                          id: track.id,",
"                          title: track.title,",
"                          artist: track.user?.displayName || track.user?.username || 'Unknown',",
"                          imageUrl: track.artCoverUrl,",
"                          audioUrl: track.audioUrl,",
"                          duration: track.duration",
"                        })}",
"                        className=\"w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-colors flex-shrink-0\">",
"                        <FaPlay className=\"text-white text-xs ml-0.5\" />",
"                      </button>",
"                    </div>",
"                  </div>",
"                ))}",
"              </div>",
"            </div>",
"", 
"            {/* Suggested Playlists (mobile) */}",
"            <div className=\"mt-3 mb-4\">",
"              <div className=\"flex justify-between items-center mb-3\">",
"                <h3 className=\"font-semibold\">Suggested Playlists</h3>",
"                <span className=\"text-xs text-gray-400\">See All {'>'}</span>",
"              </div>",
"              <div className=\"flex gap-3 overflow-x-auto pb-2 scrollbar-hide\">",
"                {playlists.slice(0, 6).map((item: any, i: number) => (",
"                  <div key={i} className=\"min-w-[120px] bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-colors flex-shrink-0\">",
"                    <div className=\"w-full aspect-square relative overflow-hidden rounded-lg mb-2 bg-black/10\">",
"                      {item.coverUrl ? (",
"                        <Image",
"                          src={item.coverUrl}",
"                          alt={item.name || item.title || 'Playlist cover'}",
"                          fill",
"                          className=\"object-cover\"",
"                        />",
"                      ) : (",
"                        <div className=\"w-full h-full bg-gradient-to-br from-purple-500 to-pink-500\" />",
"                      )}",
"                    </div>",
"                    <p className=\"text-xs font-semibold truncate\">{item.name || item.title}</p>",
"                    <p className=\"text-xs text-gray-400\">{item.mediasCount || 0} tracks</p>",
"                  </div>",
"                ))}",
"              </div>",
"            </div>",
"          </>",
"        )}",
]
new_lines = replacement

# Ensure we only replace the exact slice once
lines = lines[:start] + new_lines + lines[end:]
path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('patched lines', start+1, 'to', end)
