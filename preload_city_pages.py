import glob
import os

city_pages = [
    'modular-kitchen-delhi.html',
    'modular-kitchen-noida.html',
    'modular-kitchen-gurugram.html',
    'modular-kitchen-faridabad.html',
    'modular-kitchen-ghaziabad.html'
]

preload_tag = '  <link rel="preload" as="image" href="/modern_kitchen.webp" fetchpriority="high" />\n'

for city_page in city_pages:
    if os.path.exists(city_page):
        with open(city_page, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if already preloaded
        if 'rel="preload" as="image" href="/modern_kitchen.webp"' not in content:
            # Insert after <meta name="viewport" ... />
            viewport_str = '<meta name="viewport" content="width=device-width, initial-scale=1.0" />'
            if viewport_str in content:
                new_content = content.replace(viewport_str, viewport_str + '\n' + preload_tag)
                with open(city_page, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Added preload to {city_page}")

