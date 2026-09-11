from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

out = Path('/root/plan/public')
out.mkdir(parents=True, exist_ok=True)
S = 1024
im = Image.new('RGB', (S, S))
p = im.load()
assert p is not None
a = (124, 92, 255)
b = (54, 209, 183)
for y in range(S):
    for x in range(S):
        t = (x + y) / (2 * (S - 1))
        p[x, y] = tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(3))
im = im.convert('RGBA')

# Soft depth matching the app's dark UI.
shade = Image.new('RGBA', (S, S), (0, 0, 0, 0))
sd = ImageDraw.Draw(shade)
sd.ellipse((50, 540, 950, 1300), fill=(7, 12, 28, 65))
shade = shade.filter(ImageFilter.GaussianBlur(75))
im.alpha_composite(shade)

# The existing pnvPlan logo is 🎵. Render the same double-note mark as clean vector art.
d = ImageDraw.Draw(im)
shadow = (32, 35, 70, 75)
gold = (255, 215, 62, 255)
gold2 = (255, 178, 35, 255)

# Shadow
for dx, dy in [(22, 28)]:
    d.ellipse((195+dx, 635+dy, 465+dx, 865+dy), fill=shadow)
    d.ellipse((575+dx, 550+dy, 845+dx, 780+dy), fill=shadow)
    d.rounded_rectangle((380+dx, 270+dy, 475+dx, 735+dy), radius=45, fill=shadow)
    d.rounded_rectangle((760+dx, 205+dy, 855+dx, 650+dy), radius=45, fill=shadow)
    d.polygon([(420+dx,285+dy),(810+dx,215+dy),(810+dx,360+dy),(420+dx,430+dy)], fill=shadow)

# Double eighth-note body
d.ellipse((195, 635, 465, 865), fill=gold2)
d.ellipse((575, 550, 845, 780), fill=gold2)
d.rounded_rectangle((380, 270, 475, 735), radius=45, fill=gold)
d.rounded_rectangle((760, 205, 855, 650), radius=45, fill=gold)
d.polygon([(420,285),(810,215),(810,360),(420,430)], fill=gold)

# Small highlights
d.arc((220,660,440,840), 190, 300, fill=(255,239,145,220), width=18)
d.arc((600,575,820,755), 190, 300, fill=(255,239,145,220), width=18)

for size, name in [(180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')]:
    icon = im.convert('RGB').resize((size, size), Image.Resampling.LANCZOS)
    icon.save(out / name, 'PNG', optimize=True)

print('generated', ', '.join(p.name for p in out.glob('*.png')))
