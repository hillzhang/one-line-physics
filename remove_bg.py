from PIL import Image
import collections

def make_bg_transparent(image_path, output_path, tolerance=15):
    img = Image.open(image_path).convert("RGBA")
    data = img.load()
    width, height = img.size
    
    visited = set()
    queue = collections.deque()
    
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(1, height - 1):
        queue.append((0, y))
        queue.append((width - 1, y))
        
    def is_white_ish(pixel):
        r, g, b, a = pixel
        return r > 255 - tolerance and g > 255 - tolerance and b > 255 - tolerance

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
        
        pixel = data[x, y]
        if is_white_ish(pixel):
            data[x, y] = (255, 255, 255, 0)
            visited.add((x, y))
            for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                    queue.append((nx, ny))
        else:
            visited.add((x, y))

    img.save(output_path)
    print("Background removed successfully")

make_bg_transparent('assets/loading_art.png', 'assets/loading_art.png', 15)
