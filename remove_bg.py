import sys
from PIL import Image, ImageDraw

def remove_background(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        
        # Create a mask using floodfill from corners
        # We create a temporary image for floodfill
        temp = img.copy()
        ImageDraw.floodfill(temp, (0, 0), (255, 0, 255, 0), thresh=20)
        
        # temp now has (255, 0, 255, 0) where the background was.
        # we can use this to update the original image's alpha
        data = img.getdata()
        temp_data = temp.getdata()
        
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
