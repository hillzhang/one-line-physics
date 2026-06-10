import sys
from PIL import Image, ImageDraw

def remove_background(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        
        # We create a temporary image for floodfill
        temp = img.copy()
        
        # floodfill from the top-left corner of each of the 3x3 cells
        cell_w = width // 3
        cell_h = height // 3
        
        for r in range(3):
            for c in range(3):
                # pick a point slightly inside the cell corner
                x = c * cell_w + 5
                y = r * cell_h + 5
                ImageDraw.floodfill(temp, (x, y), (255, 0, 255, 0), thresh=30)
                # also flood fill from top right
                x2 = c * cell_w + cell_w - 5
                y2 = r * cell_h + 5
                ImageDraw.floodfill(temp, (x2, y2), (255, 0, 255, 0), thresh=30)
                # also from bottom left
                x3 = c * cell_w + 5
                y3 = r * cell_h + cell_h - 5
                ImageDraw.floodfill(temp, (x3, y3), (255, 0, 255, 0), thresh=30)
                # also from bottom right
                x4 = c * cell_w + cell_w - 5
                y4 = r * cell_h + cell_h - 5
                ImageDraw.floodfill(temp, (x4, y4), (255, 0, 255, 0), thresh=30)

        # temp now has (255, 0, 255, 0) where the background was.
        # we can use this to update the original image's alpha
        data = list(img.getdata())
        temp_data = list(temp.getdata())
        
        new_data = []
        for d, t in zip(data, temp_data):
            if t == (255, 0, 255, 0):
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
        remove_background(arg, arg)
