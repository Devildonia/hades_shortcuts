# -*- coding: utf-8 -*-
import os, zipfile

dist_dir = 'dist'
os.makedirs(dist_dir, exist_ok=True)
zip_path = os.path.join(dist_dir, 'hades-shortcuts-chrome-v6.0.0.zip')

include_files = ['index.html', 'style.css', 'manifest.json', 'site.webmanifest', 'sw.js', 'og-preview.png', 'LICENSE', 'favicon.ico']
include_dirs = ['js', 'iconos', 'locales', '_locales', 'sounds']

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for f in include_files:
        if os.path.exists(f):
            zipf.write(f, f)
            print(f"Added file: {f}")
    
    for d in include_dirs:
        if os.path.exists(d):
            for root, _, files in os.walk(d):
                for f in files:
                    full_path = os.path.join(root, f)
                    rel_path = os.path.relpath(full_path, '.')
                    zipf.write(full_path, rel_path)
                    print(f"Added asset: {rel_path}")

print(f"\nSUCCESS: Chrome Extension ZIP Package built at: {zip_path} (Size: {os.path.getsize(zip_path) // 1024} KB)")
