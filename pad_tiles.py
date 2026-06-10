from PIL import Image

def process(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    bbox = img.getbbox()
    if not bbox: return
    
    # Crop to exact visual content
    cropped = img.crop(bbox)
    
    # Scale to 163x170 (the visual size of the default tile)
    scaled = cropped.resize((163, 170), Image.Resampling.LANCZOS)
    
    # Create new 168x190 image
    new_img = Image.new("RGBA", (168, 190), (0, 0, 0, 0))
    
    # Paste at (2, 20)
    new_img.paste(scaled, (2, 20))
    
    new_img.save(output_path)

process("assets/tile_metal_v7.png", "assets/tile_metal_v7.png")
process("assets/tile_biscuit_v7.png", "assets/tile_biscuit_v7.png")
print("Done padding tiles.")
