from pathlib import Path
from bs4 import BeautifulSoup
html = Path('tmp/news-category.html').read_text(encoding='utf-8')
soup = BeautifulSoup(html, 'html.parser')
for a in soup.select('a.news-item'):
    title = a.select_one('p.news-item__ttl')
    date = a.select_one('span.news-item__date')
    body = a.select_one('p.news-item__txt')
    img = a.select_one('img')
    print({
        'url': a['href'],
        'title': title.get_text(strip=True) if title else None,
        'date': date.get_text(strip=True) if date else None,
        'excerpt': body.get_text(strip=True) if body else None,
        'image': img['src'] if img and img.has_attr('src') else None,
    })
