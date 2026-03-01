from pathlib import Path
from bs4 import BeautifulSoup
import textwrap

ids = [2012, 1949, 1821, 1799, 1769, 1731, 1738]
for article_id in ids:
    path = Path(f'tmp/news-{article_id}.html')
    html = path.read_text(encoding='utf-8')
    soup = BeautifulSoup(html, 'html.parser')
    title = soup.select_one('h1.news-title')
    date = soup.select_one('div.news-meta time')
    category = soup.select_one('.news-category a')
    print('---', article_id, '---')
    print('title:', title.get_text(strip=True) if title else None)
    print('date:', date.get('datetime') if date else None)
    print('category:', category.get_text(strip=True) if category else None)
    hero = soup.select_one('.news-head img')
    print('hero:', hero['src'] if hero and hero.has_attr('src') else None)
    body = soup.select_one('.news-body')
    if body:
        paras = [p.get_text(strip=True) for p in body.find_all('p') if p.get_text(strip=True)]
        print('body sample:', textwrap.shorten(' '.join(paras), 200, placeholder='...'))
    print()
