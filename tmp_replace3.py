from pathlib import Path
p = Path('apps/frontend/app/components/GuestWelcome.tsx')
text = p.read_text(encoding='utf-8')
text = text.replace('className="bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors"', 'className="bg-[#080a13] p-3 rounded-lg hover:bg-[#11131c] transition-colors"')
p.write_text(text, encoding='utf-8')
print('done')
