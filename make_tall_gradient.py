from PIL import Image, ImageDraw
import os

def extend_with_gradient(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    
    # We want to output 1024x2048
    new_h = 2048
    new_img = Image.new("RGBA", (w, new_h))
    
    offset_y = (new_h - h) // 2
    new_img.paste(img, (0, offset_y))
    
    # Get average color of top 5 rows
    top_crop = img.crop((0, 0, w, 5))
    top_color = top_crop.resize((1, 1)).getpixel((0, 0))
    
    # Get average color of bottom 5 rows
    bottom_crop = img.crop((0, h-5, w, h))
    bottom_color = bottom_crop.resize((1, 1)).getpixel((0, 0))
    
    # Draw top gradient (from a slightly darker/bluer version of top_color down to top_color)
    draw = ImageDraw.Draw(new_img)
    start_r = max(0, top_color[0] - 20)
    start_g = max(0, top_color[1] - 20)
    start_b = min(255, top_color[2] + 20)
    
    for y in range(offset_y):
        ratio = y / offset_y
        r = int(start_r * (1 - ratio) + top_color[0] * ratio)
        g = int(start_g * (1 - ratio) + top_color[1] * ratio)
        b = int(start_b * (1 - ratio) + top_color[2] * ratio)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
        
    # Draw bottom gradient (from bottom_color down to a darker version)
    end_r = max(0, bottom_color[0] - 30)
    end_g = max(0, bottom_color[1] - 30)
    end_b = max(0, bottom_color[2] - 30)
    
    for y in range(offset_y + h, new_h):
        ratio = (y - (offset_y + h)) / (new_h - (offset_y + h))
        r = int(bottom_color[0] * (1 - ratio) + end_r * ratio)
        g = int(bottom_color[1] * (1 - ratio) + end_g * ratio)
        b = int(bottom_color[2] * (1 - ratio) + end_b * ratio)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
        
    # Add a slight blur transition at the seams
    # (Optional: doing a small gradient blend at the exact seams)
    
    new_img.save(output_path)

# Use the original 1024x1024 images!
import glob
original_dir = "/Users/hillzhang/.gemini/antigravity-ide/brain/58b1b55d-6677-45ae-9897-07957138f73c/"
extend_with_gradient(original_dir + "bg_1780993951872.png", "assets/bg.png")
extend_with_gradient(original_dir + "grassland_1780994305602.png", "assets/game_board_bg.png")
extend_with_gradient(original_dir + "beach_1780993514523.png", "assets/game_board_bg_beach.png")
extend_with_gradient(original_dir + "autumn_1780993699263.png", "assets/game_board_bg_autumn.png")
extend_with_gradient(original_dir + "night_1780993815364.png", "assets/game_board_bg_night.png")
extend_with_gradient(original_dir + "snow_1780993918999.png", "assets/game_board_bg_snow.png")

print("Done making gradient backgrounds!")
