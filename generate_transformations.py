import re

pairs = [
    ("/before_kitchen.jpg", "/after_kitchen.jpg", "Old Modular", "Delhi NCR"),
    ("/before_kitchen_2.jpg", "/modern_kitchen.webp", "Cluttered L-Shape", "Gurugram"),
    ("/before_kitchen_3.jpg", "/minimal_kitchen.webp", "Outdated Wood", "Noida"),
    ("/before_kitchen_4.jpg", "/l_shape_kitchen.webp", "Cramped Kitchen", "Faridabad"),
    ("/before_kitchen.jpg", "/modular_kitchen.webp", "Fading Laminates", "Ghaziabad"),
    ("/before_kitchen_2.jpg", "/open_kitchen.webp", "Closed Layout", "Delhi NCR"),
    ("/before_kitchen_3.jpg", "/u_shape_kitchen.webp", "Damaged Counters", "Gurugram"),
    ("/before_kitchen_4.jpg", "/premium_modular_kitchen_v4.webp", "Worn Out Cabinets", "Noida"),
    ("/before_kitchen.jpg", "/indian_mother_daughter_kitchen.webp", "Poor Lighting", "Delhi NCR"),
    ("/before_kitchen_2.jpg", "/modern_island.webp", "Inefficient Storage", "Gurugram")
]

slides_html = ""
for before, after, title, loc in pairs:
    slides_html += f"""
        <div class="carousel-slide">
          <div class="transform-frame">
            <div class="transform-half"><img src="{before}" alt="Before" loading="lazy"><span class="transform-label">Before</span></div>
            <div class="transform-half"><img src="{after}" alt="After" loading="lazy"><span class="transform-label">After Gharwaala</span></div>
          </div>
          <div class="transform-caption"><p>{title} transformation</p><p>{loc} · Design + execution</p></div>
        </div>"""

with open('/Users/mohdkhalid/Desktop/Gharwaala/index.html', 'r') as f:
    content = f.read()

# Replace the single transform-frame with the carousel
pattern = r'<div class="transform-frame">.*?</div>\s*<div class="transform-caption">.*?</div>'
replacement = f'''<div class="transform-carousel">
      <div class="carousel-track">
{slides_html}
      </div>
      <div class="carousel-controls">
        <button class="carousel-btn prev-btn" aria-label="Previous transformation">←</button>
        <button class="carousel-btn next-btn" aria-label="Next transformation">→</button>
      </div>
    </div>'''

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('/Users/mohdkhalid/Desktop/Gharwaala/index.html', 'w') as f:
    f.write(new_content)

print("Updated index.html with carousel HTML")
