import sys
from PIL import Image

def erase_text(input_path, output_path):
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
            
            cx = x % cell_w
            cy = y % cell_h
            
            # Erase the bottom 45 pixels of each cell (to remove text)
            if cy > cell_h - 45:
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
        erase_text(arg, arg)
