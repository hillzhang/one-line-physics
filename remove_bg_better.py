import sys
from PIL import Image, ImageDraw

def remove_background(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        
        temp = img.copy()
        
        cell_w = width // 3
        cell_h = height // 3
        
        # We will use a more aggressive threshold for the floodfill
        THRESH = 80 
        
        # Flood fill from many border points to kill grid lines and background.
        for i in range(0, width, 20):
            ImageDraw.floodfill(temp, (i, 5), (255, 0, 255, 0), thresh=THRESH)
            ImageDraw.floodfill(temp, (i, height-5), (255, 0, 255, 0), thresh=THRESH)
            ImageDraw.floodfill(temp, (5, i), (255, 0, 255, 0), thresh=THRESH)
            ImageDraw.floodfill(temp, (width-5, i), (255, 0, 255, 0), thresh=THRESH)
        
        for r in range(3):
            for c in range(3):
                # Pick safe points inside the background (20 pixels from corners)
                points = [
                    (c * cell_w + 20, r * cell_h + 20), 
                    (c * cell_w + cell_w - 20, r * cell_h + 20), 
                    (c * cell_w + 20, r * cell_h + cell_h - 20), 
                    (c * cell_w + cell_w - 20, r * cell_h + cell_h - 20), 
                    (c * cell_w + cell_w//2, r * cell_h + 20)
                ]
                for x, y in points:
                    ImageDraw.floodfill(temp, (x, y), (255, 0, 255, 0), thresh=THRESH)

        # For getdata deprecation, we can still use getdata or get_flattened_data
        # Actually it's just a warning. Let's use load() which is faster and doesn't warn.
        pixels = img.load()
        temp_pixels = temp.load()
        
        for y in range(height):
            for x in range(width):
                # Calculate distance from cell center
                cell_c = x // cell_w
                cell_r = y // cell_h
                cx = cell_c * cell_w + cell_w / 2
                cy = cell_r * cell_h + cell_h / 2
                dist_sq = (x - cx)**2 + (y - cy)**2
                max_radius_sq = (cell_w / 2 - 10)**2
                
                # If pixel is touched by floodfill, make it transparent
                if temp_pixels[x, y] == (255, 0, 255, 0):
                    pixels[x, y] = (0, 0, 0, 0)
                # Hard crop: make pixels outside the inner circle transparent just in case there are stray grid lines
                elif dist_sq > max_radius_sq:
                    pixels[x, y] = (0, 0, 0, 0)
                
        img.save(output_path)
        print(f"Processed {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        remove_background(arg, arg)
