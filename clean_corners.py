import sys
from PIL import Image

def clean_corners(input_path, output_path):
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
            
            # Erase a 65x65 box in the bottom-left and bottom-right of each cell
            if (cx < 65 and cy > cell_h - 65) or (cx > cell_w - 65 and cy > cell_h - 65):
                new_data.append((d[0], d[1], d[2], 0))
            # Also erase top-left and top-right just in case there are artifacts there
            elif (cx < 50 and cy < 50) or (cx > cell_w - 50 and cy < 50):
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
        clean_corners(arg, arg)
