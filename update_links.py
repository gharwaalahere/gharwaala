import glob
import os

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to replace the old link
    old_link = '<a href="/#contact">Contact Us</a>'
    new_link = '<a href="/contact.html">Contact Us</a>'
    
    old_link2 = '<a href="#contact">Contact Us</a>'
    
    if old_link in content or old_link2 in content:
        new_content = content.replace(old_link, new_link).replace(old_link2, new_link)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
    else:
        print(f"Skipping {filepath} - link not found")

html_files = glob.glob('*.html')
for file in html_files:
    update_file(file)

