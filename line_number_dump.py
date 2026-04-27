from pathlib import Path
p = Path('c:/Users/BYMAX SERVICES/Documents/fwaya-music/apps/frontend/app/components/GuestWelcome.tsx')
lines = p.read_text(encoding='utf-8').splitlines()
for n in [162,388,389,390,488,489,491,615,643,685,718,747,796,827,860,1303,1305]:
    print('---', n, '---')
    print(lines[n-1])
