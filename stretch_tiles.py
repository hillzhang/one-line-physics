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
    
    # We want a thick bottom edge to make it look rectangular.
    # The original was 128 wide, 150 tall (ratio 128/150 = 0.853)
    # If our width is new_w, our total target height should be new_w / 0.853
    target_total_height = int(new_w / 0.853)
    
    # Place the face so that the whole thing is centered vertically in the 190 canvas
    paste_y = (190 - target_total_height) // 2
    
    # The bottom edge thickness is target_total_height - new_h
    thickness = target_total_height - new_h
    
    if thickness > 0:
        # Draw intermediate ones to create a solid 3D block
        for i in range(thickness + 1):
            new_img.paste(bottom_edge, (paste_x, paste_y + i), bottom_edge)
            
    # Finally, paste the bright face on top
    new_img.paste(face, (paste_x, paste_y), face)
    
    new_img.save(output_path)

metal_src = "/Users/hillzhang/.gemini/antigravity-ide/brain/58b1b55d-6677-45ae-9897-07957138f73c/tile_metal_v7_new_1780968053199.png"
biscuit_src = "/Users/hillzhang/.gemini/antigravity-ide/brain/58b1b55d-6677-45ae-9897-07957138f73c/tile_biscuit_v7_new_1780968080445.png"

# rembg
if not os.path.exists("temp_metal.png"):
    os.system(f"rembg i {metal_src} temp_metal.png")
if not os.path.exists("temp_biscuit.png"):
    os.system(f"rembg i {biscuit_src} temp_biscuit.png")

process("temp_metal.png", "assets/tile_metal_v7.png", 146)
process("temp_biscuit.png", "assets/tile_biscuit_v7.png", 142)

print("Done stretching tiles.")
