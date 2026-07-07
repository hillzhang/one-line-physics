import sys
from PIL import Image, ImageDraw

bg_path = "/Users/hillzhang/.gemini/antigravity-ide/brain/58b1b55d-6677-45ae-9897-07957138f73c/juejin_cover_bg_v4_1783325158708.png"
qr_path = "/Users/hillzhang/github/one-line-physics/gh_f9d2a519a585_258.jpg"
out_path = "/Users/hillzhang/github/one-line-physics/juejin_cover_final.png"

try:
    bg = Image.open(bg_path).convert("RGBA")
    qr = Image.open(qr_path).convert("RGBA")

    # Resize QR code
    qr_size = 220
    qr = qr.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
    
    # Create circular mask
    mask = Image.new('L', (qr_size, qr_size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, qr_size, qr_size), fill=255)
    
    bg_w, bg_h = bg.size
    
    # Place on top right corner
    x = bg_w - qr_size - 30
    y = 30
    
    bg.paste(qr, (x, y), mask)
    bg.save(out_path)
    print("Successfully created rounded juejin_cover_final.png")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
