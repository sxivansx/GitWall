import urllib.request
fallback = 'https://i.pinimg.com/originals/8e/31/7b/8e317b6209e7c53e877ab6d4c7a52233.png'
req = urllib.request.Request(fallback, headers={'User-Agent': 'Mozilla/5.0'})
with open('public/saul.png', 'wb') as f:
    f.write(urllib.request.urlopen(req).read())
print('Downloaded fallback')
