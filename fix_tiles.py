from PIL import Image
import os

def process(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    bbox = img.getbbox()
    if not bbox: return
    
    # Crop to exact visual content (which is the solid object because rembg removed the shadow)
    cropped = img.crop(bbox)
    
    # We want the width of the solid object to be 128 to match the "face" size of the original.
    orig_w = cropped.width
    orig_h = cropped.height
    
    new_w = 128
    new_h = int(128 * (orig_h / orig_w))
    
    scaled = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Create new 168x190 image
    new_img = Image.new("RGBA", (168, 190), (0, 0, 0, 0))
    
    # Paste centered horizontally, and aligned near the top (e.g. Y=20) 
    # to match the original top-down perspective where the bottom edge extends downwards
    paste_x = (168 - new_w) // 2
    paste_y = 20
    
    new_img.paste(scaled, (paste_x, paste_y))
    
    new_img.save(output_path)

# Use the original images from brain to start fresh, because assets/ ones are already padded and cropped!
metal_src = "/Users/hillzhang/.gemini/antigravity-ide/brain/58b1b55d-6677-45ae-9897-07957138f73c/tile_metal_v7_new_1780968053199.png"
biscuit_src = "/Users/hillzhang/.gemini/antigravity-ide/brain/58b1b55d-6677-45ae-9897-07957138f73c/tile_biscuit_v7_new_1780968080445.png"

# First, we need to run rembg on them again to get the clean solid object
os.system(f"rembg i {metal_src} temp_metal.png")
os.system(f"rembg i {biscuit_src} temp_biscuit.png")

process("temp_metal.png", "assets/tile_metal_v7.png")
process("temp_biscuit.png", "assets/tile_biscuit_v7.png")

print("Done fixing tiles.")
