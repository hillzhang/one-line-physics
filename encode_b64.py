import base64
with open('assets/loading_art.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')
with open('src/loadingArtBase64.ts', 'w') as f:
    f.write(f"export const loadingArtBase64 = 'data:image/png;base64,{b64}';")
