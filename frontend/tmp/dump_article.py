from pathlib import Path
from bs4 import BeautifulSoup

article_id = int(__import__('sys').argv[1])
html = Path(f'tmp/news-{article_id}.html').read_text(encoding='utf-8')
soup = BeautifulSoup(html, 'html.parser')
body = soup.select_one('.news-body')
if not body:
    exit()
for elem in body.find_all(['h2','h3','p','li','strong','figure','div']):
    if elem.name == 'figure':
        img = elem.find('img')
        if img and img.has_attr('src'):
            print('IMAGE', img['src'])
        continue
    text = elem.get_text(' ', strip=True)
    if text:
        print(elem.name.upper(), text)
