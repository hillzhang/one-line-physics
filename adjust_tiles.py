from PIL import Image, ImageEnhance
import os

def process(input_path, output_path, new_w):
    img = Image.open(input_path).convert("RGBA")
    bbox = img.getbbox()
    if not bbox: return
    
    # Crop to exact visual content
    cropped = img.crop(bbox)
    
    orig_w = cropped.width
    orig_h = cropped.height
    
    new_h = int(new_w * (orig_h / orig_w))
    
    # Resize the main face
    face = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Create the bottom 3D edge by darkening the face
    enhancer = ImageEnhance.Brightness(face)
    bottom_edge = enhancer.enhance(0.4)
    
    # Create new 168x190 canvas
    new_img = Image.new("RGBA", (168, 190), (0, 0, 0, 0))
    
    paste_x = (168 - new_w) // 2
    
    # The bottom edge should go down to Y=170
    # But if face is at Y=20, and face is new_h tall, 
    # the shift is 170 - 20 - new_h.
    # But we want the top face to be aligned properly. Let's make it Y=15
    # to give a bit more room since the tile is bigger.
    paste_y = 15
    shift_y = 170 - new_h - paste_y
    
    if shift_y > 0:
        # To make it a solid block (no gap), draw intermediate ones
        for i in range(shift_y + 1):
            new_img.paste(bottom_edge, (paste_x, paste_y + i), bottom_edge)
            
    # Finally, paste the bright face on top
    new_img.paste(face, (paste_x, paste_y), face)
    
    new_img.save(output_path)

metal_src = "/Users/hillzhang/.gemini/antigravity-ide/brain/58b1b55d-6677-45ae-9897-07957138f73c/tile_metal_v7_new_1780968053199.png"
biscuit_src = "/Users/hillzhang/.gemini/antigravity-ide/brain/58b1b55d-6677-45ae-9897-07957138f73c/tile_biscuit_v7_new_1780968080445.png"

# rembg should be cached, but let's run it just in case temp files are missing
if not os.path.exists("temp_metal.png"):
    os.system(f"rembg i {metal_src} temp_metal.png")
if not os.path.exists("temp_biscuit.png"):
    os.system(f"rembg i {biscuit_src} temp_biscuit.png")

process("temp_metal.png", "assets/tile_metal_v7.png", 146)
process("temp_biscuit.png", "assets/tile_biscuit_v7.png", 142)

print("Done adjusting tiles.")
