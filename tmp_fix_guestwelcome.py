from pathlib import Path
p = Path(r"apps/frontend/app/components/GuestWelcome.tsx")
txt = p.read_text(encoding='utf-8')
old = 'className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500"'
new = "className={`aspect-square ${item.artCoverUrl ? 'bg-black' : 'bg-gradient-to-br from-purple-500 to-pink-500'}` }"
print(txt.count(old))
txt = txt.replace(old, new)
p.write_text(txt, encoding='utf-8')
print('done', txt.count(new))
