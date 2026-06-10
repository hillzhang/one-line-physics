from PIL import Image
import os

def make_tall(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    
    # Target size: 1024x2048
    new_h = 2048
    new_img = Image.new("RGBA", (w, new_h))
    
    # Paste original in the middle
    offset_y = (new_h - h) // 2
    new_img.paste(img, (0, offset_y))
    
    # Extend top (copy the top row of the original image)
    top_row = img.crop((0, 0, w, 1))
    top_extended = top_row.resize((w, offset_y))
    new_img.paste(top_extended, (0, 0))
    
    # Extend bottom (copy the bottom row of the original image)
    bottom_row = img.crop((0, h-1, w, h))
    bottom_extended = bottom_row.resize((w, new_h - (offset_y + h)))
    new_img.paste(bottom_extended, (0, offset_y + h))
    
    new_img.save(output_path)

make_tall('assets/bg.png', 'assets/bg.png')
make_tall('assets/game_board_bg.png', 'assets/game_board_bg.png')
make_tall('assets/game_board_bg_beach.png', 'assets/game_board_bg_beach.png')
make_tall('assets/game_board_bg_autumn.png', 'assets/game_board_bg_autumn.png')
make_tall('assets/game_board_bg_night.png', 'assets/game_board_bg_night.png')
make_tall('assets/game_board_bg_snow.png', 'assets/game_board_bg_snow.png')
print("Done making backgrounds tall!")
