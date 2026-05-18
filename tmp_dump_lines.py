from pathlib import Path
p = Path('apps/frontend/app/components/GuestWelcome.tsx')
text = p.read_text(encoding='utf-8').splitlines()
for i in range(1220, 1270):
    print(f"{i+1}: {text[i]}")
