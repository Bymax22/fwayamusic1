import urllib.request
import json

urls = [
    'https://fwaya.net/track/i-am-a-winner-22',
    'https://fwaya.net/track/come-back-home-13',
    'https://fwaya.net/api/media/22',
    'https://fwaya.net/api/media/13',
    'https://fwaya.net/api/v1/media/22',
    'https://fwaya.net/api/v1/media/13',
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
            text = data.decode('utf-8', errors='ignore')
            print('URL:', url)
            print('Status:', r.status)
            print('Content-Type:', r.headers.get('Content-Type'))
            print('Body preview:')
            print(text[:1000])
            print('-' * 80)
    except Exception as e:
        print('URL:', url)
        print('ERROR:', repr(e))
        print('-' * 80)
