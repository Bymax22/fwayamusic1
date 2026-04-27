from pathlib import Path
path = Path('c:/Users/BYMAX SERVICES/Documents/fwaya-music/apps/frontend/app/components/GuestWelcome.tsx')
lines = path.read_text(encoding='utf-8').splitlines()
for n in range(360, 393):
    print(f'{n}: {lines[n-1]}')
