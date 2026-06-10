from PIL import Image, ImageEnhance
import os

def process(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    bbox = img.getbbox()
    if not bbox: return
    
    # Crop to exact visual content (rembg removed shadow)
    cropped = img.crop(bbox)
    
    # We want the width to be 128
    orig_w = cropped.width
    orig_h = cropped.height
    
    new_w = 128
    new_h = int(128 * (orig_h / orig_w))
    
    # Resize the main face
    face = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Create the bottom 3D edge by darkening the face
    # We will just use the same face, darkened, and shifted down
    enhancer = ImageEnhance.Brightness(face)
    bottom_edge = enhancer.enhance(0.4) # Make it 60% darker
    
    # Create new 168x190 canvas
    new_img = Image.new("RGBA", (168, 190), (0, 0, 0, 0))
    
    # The original solid body is at (20, 20, 148, 170)
    # The face should be at X=20, Y=20.
    # The bottom edge should be drawn first, shifted down.
    # The total height we want is 150. Since face is around 128, 
    # we need to shift the bottom edge down by about 22 pixels.
    # But let's just make it span exactly to Y=170.
    shift_y = 170 - new_h - 20
    
    if shift_y > 0:
        # Paste the darkened image lower
        new_img.paste(bottom_edge, (20, 20 + shift_y), bottom_edge)
        
        # To make it a solid block (no gap), we can draw a few intermediate ones
        for i in range(shift_y):
            new_img.paste(bottom_edge, (20, 20 + i), bottom_edge)
            
    # Finally, paste the bright face on top
    new_img.paste(face, (20, 20), face)
    
    new_img.save(output_path)

# Use the original images from brain to start fresh
metal_src = "/Users/hillzhang/.gemini/antigravity-ide/brain/58b1b55d-6677-45ae-9897-07957138f73c/tile_metal_v7_new_1780968053199.png"
biscuit_src = "/Users/hillzhang/.gemini/antigravity-ide/brain/58b1b55d-6677-45ae-9897-07957138f73c/tile_biscuit_v7_new_1780968080445.png"

# First, rembg to get the clean solid object
os.system(f"rembg i {metal_src} temp_metal.png")
os.system(f"rembg i {biscuit_src} temp_biscuit.png")

process("temp_metal.png", "assets/tile_metal_v7.png")
process("temp_biscuit.png", "assets/tile_biscuit_v7.png")

print("Done generating 3D edges.")
