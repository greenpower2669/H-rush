"""Remove opaque navy illustration backgrounds connected to sprite crop edges.
Rebuild once from the source atlas (old version preserved in Git history).
Requires Pillow; runtime Android does NOT require Pillow.
"""
from collections import deque
import json
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
source=root/'assets/sprites/atlas.png'
im=Image.open(source).convert('RGBA')
meta=json.loads((root/'assets/sprites/atlas.json').read_text())
all_removed=0
for family,frames in meta.items():
    for f in frames:
        x0,y0,w,h=(f[k] for k in ('x','y','w','h'))
        crop=im.crop((x0,y0,x0+w,y0+h))
        px=crop.load()
        visited=bytearray(w*h)
        q=deque()
        def maybe(x,y):
            k=y*w+x
            if visited[k]: return
            r,g,b,a=px[x,y]
            # Match only the very dark illustrated background or already transparent pixels.
            # Flood from borders so dark enclosed ship panel details remain intact.
            if a <= 48 or (r<25 and g<54 and b<82):
                visited[k]=1;q.append((x,y))
        for x in range(w):maybe(x,0);maybe(x,h-1)
        for y in range(h):maybe(0,y);maybe(w-1,y)
        removed=0
        while q:
            x,y=q.popleft();r,g,b,a=px[x,y]
            if a>48:
                px[x,y]=(0,0,0,0);removed+=1
            if x>0:maybe(x-1,y)
            if x+1<w:maybe(x+1,y)
            if y>0:maybe(x,y-1)
            if y+1<h:maybe(x,y+1)
        all_removed+=removed
        im.paste(crop,(x0,y0))
        print(f'{family} frame ({x0},{y0}): removed {removed} dark pixels')
im.save(source,optimize=True)
print(f'Cleaned {all_removed} opaque navy pixels from sprite silhouettes.')
