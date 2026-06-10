from PIL import Image
img = Image.open('assets/sprite_fruits.png')
print("Mode:", img.mode)
if img.mode == 'RGBA':
    colors = img.getcolors(maxcolors=1000000)
    alpha_0 = sum(count for count, color in colors if color[3] == 0)
    print("Transparent pixels:", alpha_0)
