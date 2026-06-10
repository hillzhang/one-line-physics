from PIL import Image

img = Image.open("assets/tile_default_v7.png").convert("RGBA")
w, h = img.size

# Let's find the bounding box where alpha > 128 (ignoring soft drop shadow)
bbox_solid = img.point(lambda p: 255 if p > 128 else 0).getbbox()
print("Solid body bbox (alpha>128):", bbox_solid)
