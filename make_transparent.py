from PIL import Image
import os

input_path = '/Users/tanmay/.gemini/antigravity-ide/brain/cfb478e8-441b-4e7d-b6a9-d3a83bc1a8b8/pointing_silhouette_1782765227754.png'
if not os.path.exists('public'):
    os.makedirs('public')
    
img = Image.open(input_path).convert("RGBA")
datas = img.getdata()
newData = []
for item in datas:
    if item[0] > 200 and item[1] > 200 and item[2] > 200:
        newData.append((255, 255, 255, 0))
    else:
        newData.append(item)
img.putdata(newData)
img.save("public/saul.png", "PNG")
print("Converted to transparent!")
