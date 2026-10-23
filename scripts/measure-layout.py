"""Record comparable layout observations; these are measurements, not quality scores."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:4400')
parser.add_argument('--name', required=True)
args = parser.parse_args()
if not args.name.replace('-', '').isalnum():
    raise SystemExit('Use a simple letters/digits/hyphens snapshot name.')
out = Path(__file__).resolve().parent.parent / 'qc' / 'audit' / args.name
out.mkdir(parents=True, exist_ok=True)
results = {'url': args.url, 'viewports': {}}
with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(reduced_motion='reduce')
    for width in [320, 390, 768, 1440]:
        page.set_viewport_size({'width': width, 'height': 900})
        page.goto(args.url, wait_until='networkidle')
        page.evaluate('document.fonts.ready')
        results['viewports'][width] = page.evaluate('''() => {
          const box = el => ({top: Math.round(el.getBoundingClientRect().top + scrollY), height: Math.round(el.getBoundingClientRect().height), width: Math.round(el.getBoundingClientRect().width)});
          const styles = selector => [...document.querySelectorAll(selector)].filter(el => el.checkVisibility()).map(el => ({text:el.textContent.trim().slice(0,85), fontSize:parseFloat(getComputedStyle(el).fontSize), lineHeight:getComputedStyle(el).lineHeight, ...box(el)}));
          return {width:innerWidth, documentWidth:document.documentElement.scrollWidth, documentHeight:document.documentElement.scrollHeight,
            sections:Object.fromEntries([...document.querySelectorAll('main > section')].map(el => [el.id, box(el)])),
            navigation:styles('.cv-nav a'), bio:styles('.bio-copy p'), meta:styles('.career-date, .paper-actions > a, .author-key, .disclosure-count'),
            interestHeights:styles('.interest-list li'),
            publications:document.querySelectorAll('.paper').length,
            visiblePublications:[...document.querySelectorAll('.paper')].filter(el=>el.checkVisibility()).length};
        }''')
        if width in [390, 1440]:
            page.screenshot(path=str(out / f'{width}-top.png'))
            page.screenshot(path=str(out / f'{width}-full.png'), full_page=True)
            page.get_by_role('button', name='Use light theme', exact=True).click()
            page.evaluate('window.scrollTo(0, 0)')
            page.screenshot(path=str(out / f'{width}-light.png'))
            page.get_by_role('button', name='Use dark theme', exact=True).click()
    browser.close()
(out / 'layout.json').write_text(json.dumps(results, indent=2) + '\n')
print(json.dumps({width: {'height': row['documentHeight'], 'workTop': row['sections']['work']['top'], 'fundingTop': row['sections']['funding']['top'], 'navFont': row['navigation'][0]['fontSize']} for width,row in results['viewports'].items()}, indent=2))
