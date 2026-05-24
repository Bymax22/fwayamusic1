from pathlib import Path
import re

files = [
    Path('apps/frontend/app/auth/artist/signup/page.tsx'),
    Path('apps/frontend/app/auth/artist/forgot-password/page.tsx'),
    Path('apps/frontend/app/auth/producer/signup/page.tsx'),
    Path('apps/frontend/app/auth/reseller/signup/page.tsx'),
    Path('apps/frontend/app/auth/reseller/forgot-password/page.tsx'),
]

replacements = [
    (r'bg-white/5 border border-white/10 rounded-3xl', 'bg-[#0f1112] rounded-3xl'),
    (r'bg-white/5 border border-white/10 rounded-xl', 'bg-[#0f1112] rounded-xl'),
    (r'bg-white/5 border border-white/10', 'bg-[#0f1112] border-transparent'),
    (r'bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4', 'bg-[#0f1112] rounded-full flex items-center justify-center mx-auto mb-4'),
    (r'bg-white/10 text-white', 'bg-[#121517] text-white'),
    (r'bg-white/10 text-gray-400', 'bg-[#121517] text-gray-400'),
    (r'w-full bg-white/10 rounded-full h-2', 'w-full bg-[#121517] rounded-full h-2'),
    (r'hover:bg-white/10', 'hover:bg-[#121517]'),
    (r'focus:ring-2 focus:ring-\[#e51f48\] focus:border-transparent', 'focus:ring-2 focus:ring-purple-500 focus:border-transparent'),
    (r'bg-\[#e51f48\]', 'bg-purple-600'),
    (r'bg-gradient-to-br from-\[#1a2e3d\] to-\[#051420\] rounded-2xl p-8 w-full max-w-2xl border border-green-500/30 shadow-2xl', 'bg-[#0f1112] rounded-3xl p-8 w-full max-w-2xl shadow-2xl'),
    (r'bg-gradient-to-br from-\[#0a1f29\]/40 rounded-2xl p-8 w-full max-w-md border border-purple-500/30 shadow-2xl', 'bg-[#0f1112] rounded-3xl p-8 w-full max-w-md shadow-2xl'),
    (r'bg-gradient-to-br from-\[#0a1f29\]/40 rounded-2xl p-8 w-full max-w-md border border-green-500/30 shadow-2xl', 'bg-[#0f1112] rounded-3xl p-8 w-full max-w-md shadow-2xl'),
    (r'bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4', 'bg-[#0f1112] rounded-full flex items-center justify-center mx-auto mb-4'),
    (r'bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4', 'bg-[#0f1112] rounded-full flex items-center justify-center mx-auto mb-4'),
    (r'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-semibold text-center', 'w-full block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors font-semibold text-center'),
    (r'bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-semibold text-center', 'w-full block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors font-semibold text-center'),
    (r'bg-\[#0a3747\] border border-purple-500/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent', 'bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'),
    (r'bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4', 'bg-black flex items-center justify-center p-4'),
    (r'bg-gradient-to-br from-\[#0f2e3d\] to-\[#051420\] flex items-center justify-center p-4', 'bg-black flex items-center justify-center p-4'),
    (r'className="mt-4 px-5 py-2 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"', 'className="mt-4 px-5 py-2 bg-[#121517] rounded-xl text-white hover:bg-[#1f1f1f] transition-colors disabled:opacity-50"'),
    (r'className="flex items-center gap-2 px-6 py-3 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"', 'className="flex items-center gap-2 px-6 py-3 bg-[#0f1112] text-white rounded-xl hover:bg-[#121517] transition-colors"'),
    (r'className="px-6 py-3 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"', 'className="px-6 py-3 bg-[#0f1112] text-white rounded-xl hover:bg-[#121517] transition-colors"'),
    (r'className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-\[#e51f48\] focus:border-transparent"', 'className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"'),
    (r'className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"', 'className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"'),
    (r'className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-\[#e51f48\] focus:border-transparent pr-12"', 'className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"'),
    (r'className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"', 'className="w-full px-4 py-3 bg-[#0f1112] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"'),
    (r'className="border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"', 'className="bg-[#0f1112] text-white rounded-xl hover:bg-[#121517] transition-colors"'),
    (r'className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"', 'className="bg-purple-600 text-white rounded-xl hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"'),
    (r'className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-semibold text-center"', 'className="w-full block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors font-semibold text-center"'),
]

for path in files:
    text = path.read_text(encoding='utf-8')
    original = text
    for old, new in replacements:
        text = re.sub(old, new, text)
    if text != original:
        path.write_text(text, encoding='utf-8')
        print(f'Updated {path}')
    else:
        print(f'No changes for {path}')
