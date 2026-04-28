import os
import glob
import re
import subprocess

# Get dimensions using sips
def get_dimensions(filepath):
    try:
        result = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', filepath], capture_output=True, text=True)
        width, height = None, None
        for line in result.stdout.split('\n'):
            if 'pixelWidth:' in line:
                width = line.split(': ')[1].strip()
            if 'pixelHeight:' in line:
                height = line.split(': ')[1].strip()
        if width and height:
            return width, height
    except:
        pass
    return None, None

dims = {}
for webp in glob.glob("public/*.webp"):
    basename = os.path.basename(webp)
    w, h = get_dimensions(webp)
    if w and h:
        dims[basename] = (w, h)

def process_html(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # regex to find img tags
    def replace_img(match):
        img_tag = match.group(0)
        src_match = re.search(r'src=["\']/([^"\']+\.webp)["\']', img_tag)
        if not src_match:
            return img_tag
        
        src_file = src_match.group(1)
        if src_file in dims:
            w, h = dims[src_file]
            # only add if width/height not already present
            if 'width=' not in img_tag and 'height=' not in img_tag:
                # insert width and height before closing >
                img_tag = img_tag.replace('>', f' width="{w}" height="{h}">')
        return img_tag

    new_content = re.sub(r'<img[^>]+>', replace_img, content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Processed {filepath}")

for html in glob.glob("*.html"):
    process_html(html)

