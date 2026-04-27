import glob
import os

new_logo_block = """      <a href="/" class="logo">
        <img src="/custom-logo.webp" alt="Gharwaala logo - kitchen design service in Delhi NCR" class="logo-mark" decoding="async">
        <div class="logo-text-wrapper">
          <span class="logo-title"><span style="color: #c59b0f; font-weight: 800; letter-spacing: -1px;">Ghar</span><span style="font-weight: 400; opacity: 0.85;">waala</span><span style="color: var(--color-primary); font-weight: 900;">.</span></span>
          <span class="logo-tagline">PLAN. DESIGN. BUILD.</span>
        </div>
      </a>"""

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to replace the old logo block.
    # We can try to find the start and end of the old block.
    start_tag = '<a href="/" class="logo">'
    
    # Check if the file already has the new block
    if '<div class="logo-text-wrapper">' in content and 'PLAN. DESIGN. BUILD.' in content:
        print(f"Skipping {filepath} - already updated")
        return
        
    start_idx = content.find(start_tag)
    if start_idx == -1:
        print(f"Warning: {filepath} does not contain the logo block.")
        return
        
    end_tag = '</a>'
    end_idx = content.find(end_tag, start_idx)
    
    if end_idx == -1:
        print(f"Warning: Could not find closing tag in {filepath}.")
        return
        
    old_block = content[start_idx:end_idx + len(end_tag)]
    
    # Verify it's actually the navbar logo by checking if it contains the img tag
    if '<img src="/custom-logo.webp"' not in old_block:
        print(f"Warning: {filepath} logo block does not match expected structure.")
        return

    new_content = content[:start_idx] + new_logo_block + content[end_idx + len(end_tag):]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Updated {filepath}")

html_files = glob.glob('*.html')
for file in html_files:
    update_file(file)

