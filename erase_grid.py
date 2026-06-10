import sys
from PIL import Image

def remove_grid(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        
        cell_w = width / 3.0
        cell_h = height / 3.0
        
        data = list(img.getdata())
        new_data = []
        
        for i, d in enumerate(data):
            x = i % width
            y = i // width
            
            # cell coordinates
            cx = x % cell_w
            cy = y % cell_h
            
            # If within 20 pixels of any cell border, make it transparent
            # Also if it's black/dark, make it transparent
            if cx < 25 or cx > cell_w - 25 or cy < 25 or cy > cell_h - 25:
                new_data.append((d[0], d[1], d[2], 0))
            else:
                new_data.append(d)
                
        img.putdata(new_data)
        img.save(output_path)
        print(f"Processed {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        remove_grid(arg, arg)
