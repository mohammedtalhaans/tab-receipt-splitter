"""Generate deterministic, non-personal receipt fixtures. Dev-only: Pillow + numpy.
Usage: python scripts/generate-fixtures.py [path/to/a/monospace.ttf]
No font file is copied into this repository.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter
import numpy as np
import json, sys, html
ROOT = Path(__file__).resolve().parents[1]
FONT = sys.argv[1] if len(sys.argv) > 1 else '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
font = ImageFont.truetype(FONT, 28)
rows = [
'NORTH & EMBER','A VERY GOOD DINNER','--------------------------------',
'Burrata                    18.00','Sourdough                   9.00',
'Ribeye                     46.00','Rigatoni                   28.00',
'Market fish                34.00','Truffle fries              12.00',
'Green salad                10.00','2 x House red              24.00',
'Sparkling water             8.00','Tiramisu                   16.00',
'--------------------------------','SUBTOTAL                  205.00',
'Service charge 10%         20.50','GST included               20.50',
'TOTAL AUD                 225.50','--------------------------------',
'GOOD FOOD. GOOD COMPANY.','Synthetic receipt / sample only']

def draw(lines, height=None):
    image = Image.new('RGB', (700, height or max(650, 175 + len(lines)*45)), '#f5f0e6')
    d = ImageDraw.Draw(image)
    for i, text in enumerate(lines): d.text((65, 80 + 45*i), text, font=font, fill='#151515', anchor='lt')
    return image

out = ROOT/'tests/fixtures'; out.mkdir(exist_ok=True)
base = draw(rows,1120)
manifest = []
def save(name, image, lines=rows, count=10, total=22550):
    image.save(out/f'{name}.png', optimize=True)
    (out/f'{name}.txt').write_text('\n'.join(lines)+'\n')
    manifest.append({'name':name,'file':f'{name}.png','groundTruth':f'{name}.txt','itemCount':count,'totalMinor':total,'currency':'AUD','synthetic':True})
save('clean',base)
save('angled',base.rotate(4,resample=Image.Resampling.BICUBIC,expand=True,fillcolor='#242423'))
arr = np.asarray(base).astype(float)
y,x = np.mgrid[0:1120,0:700]
light = 0.44+0.32*(x/700)+0.13*(y/1120)
noise = np.random.default_rng(481).normal(0,2.8,arr.shape)
save('dim',Image.fromarray(np.uint8(np.clip(arr*light[:,:,None]+noise,0,255))))
crumple = arr.copy()
for row in range(1120):
    shift = int(3*np.sin(row/62)+2*np.sin(row/19))
    crumple[row] = np.roll(crumple[row],shift,axis=0)
fold = 0.91+0.09*np.cos(x/28)+0.025*np.sin(y/22)
save('crumpled',Image.fromarray(np.uint8(np.clip(crumple*fold[:,:,None],0,255))).filter(ImageFilter.GaussianBlur(.25)))
save('small-font',base.resize((385,616),Image.Resampling.LANCZOS))
save('service-charge',base)
discount=['THE LUNCH COUNTER','--------------------------------','Burger                     18.00','Fries                       9.00','Soda                        5.00','SUBTOTAL                   32.00','Discount                   -4.00','TOTAL AUD                  28.00','THANK YOU']
save('discount',draw(discount),discount,3,2800)
quantity=['CORNER CAFE','--------------------------------','2 x Latte @ 4.50            9.00','3 Croissant                15.00','Toast                      12.00','SUBTOTAL                   36.00','TOTAL AUD                  36.00','THANK YOU']
save('quantities',draw(quantity),quantity,3,3600)
long=['THE LONG TABLE','--------------------------------']+[f'Coffee {i+1:02d}                   3.00' for i in range(24)]+['SUBTOTAL                   72.00','Service charge              7.20','TOTAL AUD                  79.20','THANK YOU']
save('long',draw(long),long,24,7920)
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(ROOT/'public/demo/receipt.png').write_bytes((out/'clean.png').read_bytes())
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="700" height="1120" viewBox="0 0 700 1120">','<rect width="700" height="1120" fill="#f5f0e6"/>','<g font-family="monospace" font-size="28" fill="#151515">']
for i,text in enumerate(rows): svg.append(f'<text x="65" y="{105+i*45}" xml:space="preserve">{html.escape(text)}</text>')
svg += ['</g></svg>']
(ROOT/'public/demo/receipt.svg').write_text('\n'.join(svg))
print(f'Generated {len(manifest)} synthetic fixtures plus local demo assets.')
