import re
with open('app/videos/[id]/page.tsx', 'r') as f:
    code = f.read()

# Simple bracket counting (doesn't handle strings perfectly but good enough)
open_counts = {'(': 0, '[': 0, '{': 0, '<': 0}
close_chars = {')': '(', ']': '[', '}': '{', '>': '<'}

line = 1
col = 1
in_string = False
string_char = ''
skip_next = False

for i, char in enumerate(code):
    if skip_next:
        skip_next = False
        continue
    
    if char == '\n':
        line += 1
        col = 1
        continue
    
    if char == '\r':
        col += 1
        continue
    
    # Handle strings
    if not in_string and char in ('"', "'", '`'):
        in_string = True
        string_char = char
        col += 1
        continue
    
    if in_string and char == string_char:
        if i > 0 and code[i-1] == '\\':  # skip escaped quotes
            col += 1
            continue
        in_string = False
        col += 1
        continue
    
    if in_string:
        col += 1
        continue
    
    # Count brackets
    if char in open_counts:
        open_counts[char] += 1
    elif char in close_chars:
        open_char = close_chars[char]
        open_counts[open_char] -= 1
        if open_counts[open_char] < 0:
            print(f'Imbalance at line {line} col {col}: closing {char} with no opening {open_char}')
            print(f'Context: {code[max(0,i-40):i+40]}')
            break
    
    col += 1

print(f'Final counts: {open_counts}')
for char, count in open_counts.items():
    if count != 0:
        print(f'Mismatch: {count} extra opening {char} characters')
