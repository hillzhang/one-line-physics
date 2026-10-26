import os
from stretch_tiles import process

images = {
    "pink": "/Users/hillzhang/.gemini/antigravity-ide/brain/58b1b55d-6677-45ae-9897-07957138f73c/tile_pink_1786063618604.png",
    "mint": "/Users/hillzhang/.gemini/antigravity-ide/brain/58b1b55d-6677-45ae-9897-07957138f73c/tile_mint_1786063627004.png",
    "gold": "/Users/hillzhang/.gemini/antigravity-ide/brain/58b1b55d-6677-45ae-9897-07957138f73c/tile_gold_1786063636519.png",
    "night": "/Users/hillzhang/.gemini/antigravity-ide/brain/58b1b55d-6677-45ae-9897-07957138f73c/tile_night_1786063645011.png"
}

for name, src in images.items():
    temp_path = f"temp_{name}.png"
    out_path = f"assets/tile_{name}_v7.png"
    print(f"Processing {name}...")
    if not os.path.exists(temp_path):
        os.system(f"rembg i {src} {temp_path}")
    process(temp_path, out_path, 144)

print("Done processing new tiles.")
