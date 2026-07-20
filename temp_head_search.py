import urllib.request
import re

urls = [
    'https://fwaya.net/track/i-am-a-winner-22',
    'https://fwaya.net/track/come-back-home-13'
]
regex = re.compile(r'(<title[^>]*>.*?</title>|<meta[^>]+(?:og:|twitter:|canonical)[^>]*>)', re.I | re.S)
for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read().decode('utf-8', errors='ignore')
        head = body.split('</head>', 1)[0]
        matches = regex.findall(head)
        print('URL:', url)
        print('Status:', r.status)
        print('Head length:', len(head))
        print('Matches:', len(matches))
        for m in matches:
            print(m)
        print('-' * 80)
    except Exception as e:
        print('URL:', url)
        print('ERROR:', repr(e))
        print('-' * 80)
