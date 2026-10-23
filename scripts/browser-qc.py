"""Browser checks against an already-running preview; only writes ignored qc/ files.

Run with a Python environment that has playwright installed:
  python scripts/browser-qc.py --url http://127.0.0.1:4400
Uses installed Chrome in a separate headless session, without the user's profile.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:4400')
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
cv = json.loads((root / 'src/data/cv.generated.json').read_text())
out = root / 'qc'
out.mkdir(exist_ok=True)
results = {'url': args.url, 'checks': [], 'screenshots': [], 'errors': []}

def check(name, value, detail=None):
    results['checks'].append({'name': name, 'passed': bool(value), 'detail': detail})
    (out / 'browser-results.json').write_text(json.dumps(results, indent=2, ensure_ascii=False) + '\n')
    if not value:
        print(f'FAIL: {name}: {detail}', flush=True)

def record_console_error(message):
    if message.type != 'error':
        return
    location = message.location
    results['errors'].append({'text': message.text, 'location': location})

def record_http_error(response):
    if response.status < 400:
        return
    results['errors'].append({'text': f'HTTP {response.status}', 'url': response.url})

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    results['browser'] = browser.version
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce', color_scheme='dark')
    page = context.new_page()
    page.on('pageerror', lambda error: results['errors'].append(str(error)))
    page.on('console', record_console_error)
    page.on('response', record_http_error)
    response = page.goto(args.url, wait_until='networkidle')
    page.evaluate('document.fonts.ready')
    check('HTTP response', response.status == 200)
    check('Name is the only h1', page.locator('h1').count() == 1 and page.locator('h1').text_content() == 'YongKyung Oh')
    check('CV body font loaded', page.evaluate("document.fonts.check('16px \"Source Serif 4\"')"))
    check('All 28 public CV papers appear exactly once', page.locator('article.paper').count() == len(cv['publications']) == 28 and len(set(page.locator('article.paper').evaluate_all('items => items.map(item => item.id)'))) == 28)
    owner_names = page.locator('.paper .authors strong').all_text_contents()
    check('Consistent full owner names in all bylines', owner_names == ['YongKyung Oh'] * 28, owner_names)
    check('Coauthor names follow BibTeX verbatim (owner name normalized)', page.locator('.authors').filter(has_text='Dong-Young Lim').count() == 4 and page.locator('.authors').filter(has_text='Dongyoung Lim').count() == 3 and page.locator('.authors').filter(has_text='Henry W Zheng').count() == 1 and not any('Yongkyung' in text for text in page.locator('.authors').all_inner_texts()))
    check('ICML omits internal workflow status', page.locator('#sota-evidence .publication-note').count() == 0 and 'proceedings pending' not in page.locator('#sota-evidence').inner_text().lower() and page.locator('.publication-note').filter(has_text='Accepted · in press').count() == 0)
    icml = page.locator('#sota-evidence')
    check('ICML uses verified PMLR proceedings and APA citation', icml.locator('.paper-actions > a').first.inner_text() == 'Paper' and icml.locator('.paper-actions > a').first.get_attribute('href') == 'https://proceedings.mlr.press/v306/oh26d.html' and re.search(r'pp\. 171583[-–]171601', icml.locator('.citation-content').text_content()) is not None and '[Preprint]. arXiv.' not in icml.locator('.citation-content').text_content())
    check('Publication count sentence removed', 'publications, including accepted papers.' not in page.locator('#work').inner_text())
    for paper_id, publisher, pages in [('pub-c15', 'https://doi.org/10.1145/3770855.3818661', r'13199[-–]13206'), ('pub-c13', 'https://proceedings.mlr.press/v333/oh26a.html', r'198[-–]220')]:
        article = page.locator('#' + paper_id)
        check(f'{paper_id} shows published reference and primary publisher link', article.locator('.paper-title a').count() == 0 and article.locator('.paper-actions > a').first.get_attribute('href') == publisher and article.locator('.paper-actions > a').first.inner_text() == 'Paper' and re.search(pages, article.locator('.citation-content').text_content()) is not None and 'accepted' not in article.text_content().lower())
    check('Latest six papers visible; Earlier publications starts collapsed', page.locator('#publications-2026 .paper:visible').count() == 6 and page.locator('#earlier-publications').get_attribute('open') is None)
    page.locator('.publication-overview > a').click()
    check('Earlier publications link expands the disclosure', page.locator('#earlier-publications').get_attribute('open') is not None and page.locator('.year-index').is_visible())
    page.evaluate("document.getElementById('earlier-publications').open = false")
    check('All three degrees are visible', page.locator('#education .career-row').count() == 3 and all(page.locator('#' + entry['id']).is_visible() for entry in cv['education']))
    check('Both undergraduate minors are included', 'Mechanical Engineering and Advanced Materials Science' in page.locator('#unist-bs').inner_text())
    check('Eight professional roles included', page.locator('#experience .career-row').count() == 8)
    check('All four grants and fellowships included', page.locator('#funding .career-row').count() == 4)
    funding_text = page.locator('#funding').inner_text()
    check('Funding keeps own roles without amounts or project-level specifications', all(text in page.locator('#nvidia').inner_text() for text in ['Lead Scientist', 'In-kind']) and 'Principal Investigator' in page.locator('#nrf').inner_text() and not re.search(r'\b(?:KRW|USD|EUR|H100)\b|8×|PI:|Selective|Competitive|fully funded', funding_text))
    recent = lambda entries: [entry['id'] for _, entry in sorted(enumerate(entries), key=lambda pair: (-int(re.search(r'\d{4}', pair[1]['date']).group()), pair[0]))[:3]]
    recent_recognition = recent(cv['recognitions'])
    recent_patents = recent(cv['patents'])
    remaining_recognition = [entry for entry in cv['recognitions'] if entry['id'] not in recent_recognition]
    remaining_patents = [entry for entry in cv['patents'] if entry['id'] not in recent_patents]
    summary = lambda entries, noun: f"{len(entries)} {noun} · {min(int(re.search(r'\d{4}', entry['date']).group()) for entry in entries)}–{max(int(re.search(r'\d{4}', entry['date']).group()) for entry in entries)}"
    check('Three latest recognitions and patents are visible, with the rest collapsed', page.locator('#recognition .cv-disclosure').get_attribute('open') is None and page.locator('#patents .cv-disclosure').get_attribute('open') is None and page.locator('#recognition .career-row:visible').count() == 3 and page.locator('#patents .career-row:visible').count() == 3 and page.locator('#recognition > .section-content > .career-list .career-row').evaluate_all('items => items.map(item => item.id)') == recent_recognition and page.locator('#patents > .section-content > .career-list .career-row').evaluate_all('items => items.map(item => item.id)') == recent_patents and page.locator('#patents .author-key').is_visible())
    check('Disclosure summaries count only hidden items', page.locator('#recognition .disclosure-count').inner_text() == summary(remaining_recognition, 'distinctions') and page.locator('#patents .disclosure-count').inner_text() == summary(remaining_patents, 'patents'))
    page.locator('#recognition .cv-disclosure > summary').click()
    page.locator('#patents .cv-disclosure > summary').click()
    check('UCLA recognition is a nomination', 'Nominee' in page.locator('#ucla-nomination h3').inner_text())
    rec_groups = page.locator('#recognition .recognition-group')
    check('Remaining recognition keeps CV subsection order without duplicating entries', page.locator('#recognition .recognition-disclosure > .recognition-groups h3.year-heading').all_inner_texts() == ['Honors', 'Research Awards'] and page.locator('#recognition .recognition-disclosure .career-row').count() == 10 and page.locator('#recognition .career-row').count() == 13 and len(set(page.locator('#recognition .career-row').evaluate_all('items => items.map(item => item.id)'))) == 13)
    recognition_text = page.locator('#recognition').inner_text()
    check('Recognition lists all 13 honors and research awards, with CHIL Best Paper, Encouragement and Excellence awards and no Distinguished Paper Award', page.locator('#recognition .career-row').count() == 13 and 'Best Paper Award' in recognition_text and 'Multi-View Contrastive Learning' in recognition_text and 'Encouragement Award' in recognition_text and 'Excellence Award' in recognition_text and 'Startup Ecosystem' in recognition_text and 'Suggestion for Smart Port' in recognition_text and all(text not in recognition_text for text in ['Distinguished Paper Award', 'Scholarship']) and 'Distinguished Paper Award' not in page.content())
    teaching_text = page.locator('#teaching').inner_text()
    check('Teaching lists the two PNU Instructor entries, visible, and no TA lines', page.locator('#teaching h2').inner_text() == 'Teaching' and page.locator('#teaching .career-row').count() == 2 and page.locator('#teaching .career-row').first.is_visible() and 'Machine Learning' in teaching_text and 'Data Structure' in teaching_text and teaching_text.count('Instructor') == 2 and not re.search(r'\b(?:BX|DS|AB)\d{7}\b', teaching_text) and teaching_text.count('Fall 2026') == 2 and teaching_text.count('Pusan National University') == 2 and all(text not in teaching_text for text in ['TA', 'UNIST', 'Catalyst']) and page.locator('#teaching a').count() == 0)
    patents_text = page.locator('#patents').inner_text()
    check('Patents section lists all 7 valid filings once and nothing excluded', page.locator('#patents .cv-disclosure .career-row').count() == 4 and page.locator('#patents .career-row').count() == 7 and len(set(page.locator('#patents .career-row').evaluate_all('items => items.map(item => item.id)'))) == 7 and page.locator('#patents h2').inner_text() == 'Patents' and 'Co-inventor across all listed filings.' in patents_text and all(text in patents_text for text in ['KR 10-2608343 (granted 2023)', 'JP 7453296 (granted 2024)', 'KR 10-2024-0033382 (application pending)']) and patents_text.count('Joint applicants: Naver Corp. and UNIST.') == 2 and all(text not in page.content() for text in ['18/395,620', '18/012,626', 'PCT/KR', 'prosecution discontinued', 'Notice of Allowance']))
    page.evaluate('document.querySelectorAll("#recognition .cv-disclosure, #patents .cv-disclosure").forEach(d => d.open = false)')
    check('Patents nav anchor follows Recognition and resolves', page.locator('.cv-nav a').all_inner_texts()[-4:] == ['Recognition', 'Teaching', 'Patents', 'Contact'] and page.locator('.cv-nav a[href="#patents"]').count() == 1)
    material_labels = page.locator('.paper-actions > a').evaluate_all('links => links.map(link => [link.textContent.trim(), link.href])')
    slides = [href for label, href in material_labels if label == 'Slides']
    posters = [href for label, href in material_labels if label == 'Poster']
    allowed_drive = {cv_link['url'] for paper in cv['publications'] for cv_link in paper['links'] if cv_link['label'] in ('Slides', 'Poster')}
    check('Seven Slides and five Poster links come from the bundle and are the only paper-row Drive URLs', len(slides) == 7 and len(posters) == 5 and set(slides + posters) == allowed_drive and all(href.startswith('https://drive.google.com/file/d/') for href in slides + posters), {'slides': len(slides), 'posters': len(posters)})
    check('Slides and Poster links are 44px tall touch targets', page.evaluate('''() => { const d = document.getElementById('earlier-publications'); const was = d.open; d.open = true;
      const ok = [...document.querySelectorAll('.paper-actions > a[aria-label^="Slides:"], .paper-actions > a[aria-label^="Poster:"]')].every(link => link.getBoundingClientRect().height >= 43.5); d.open = was; return ok; }'''))
    check('Existing portrait loads with descriptive alt text', page.locator('.portrait').evaluate('img => img.complete && img.naturalWidth > 0 && img.alt.includes("YongKyung Oh")'))
    check('Bio preserves CV third-person wording, career, degrees and qualifications', page.locator('.bio-copy p').count() == 1 and all(text in page.locator('#bio').inner_text() for text in ['Dr. YongKyung Oh is', 'AI for Science', 'scientific discovery and informed decisions', 'B.Sc. in Physics', 'Master in Technology and Innovation Management', 'Ph.D. in Industrial Engineering', 'sole-authored', 'nomination', 'Lead Scientist']))
    fill = {}
    for fill_width in [1440, 1024, 768]:
        page.set_viewport_size({'width': fill_width, 'height': 1000})
        fill[fill_width] = {name: round(page.locator(selector).bounding_box()['width'], 1) for name, selector in [('column', '#bio .section-content'), ('bio', '.bio-copy p'), ('research', '.interest-list')]}
    page.set_viewport_size({'width': 1440, 'height': 1000})
    check('Bio and Research interests both fill the section column', all(abs(v['bio'] - v['column']) <= 1 and abs(v['research'] - v['column']) <= 1 for v in fill.values()) and fill[1440]['column'] == 848, fill)
    check('Appointment and affiliation follow the Bio wording', page.locator('.appointment').inner_text() == 'Assistant Professor' and page.locator('.affiliation').inner_text() == 'Data Science Major, School of BioMedical Convergence Engineering\nPusan National University')
    profile_links = page.locator('.profile-links > a')
    cv_url = 'https://drive.google.com/file/d/12kr_OViGjSfBox5_kUnpnpop87liNlyV/view?usp=sharing'
    check('Profile links are one text row from lab to CV', profile_links.all_inner_texts() == ['Scientific Inference Lab', 'ORCID', 'Google Scholar', 'GitHub', 'LinkedIn', 'CV PDF'] and profile_links.first.get_attribute('href') == 'https://scientific-inference-lab.github.io/' and profile_links.nth(4).get_attribute('href') == 'https://www.linkedin.com/in/yongkyung-oh' and profile_links.nth(5).get_attribute('href') == cv_url)
    profile_tops = profile_links.evaluate_all('links => links.map(link => link.getBoundingClientRect().top)')
    check('Profile links occupy one line at desktop width', max(profile_tops) - min(profile_tops) < 1, profile_tops)
    affiliation_box = page.locator('.affiliation').bounding_box()
    email_box = page.locator('.header-email').bounding_box()
    profile_box = page.locator('.profile-links').bounding_box()
    check('Header reads affiliation, email, then profile row', email_box['y'] >= affiliation_box['y'] + affiliation_box['height'] - 1 and profile_box['y'] >= email_box['y'] + email_box['height'] - 1)
    section_positions = [page.locator('#' + section_id).evaluate('element => [...element.parentElement.children].indexOf(element)') for section_id in ['bio', 'research', 'experience', 'education', 'work', 'funding', 'recognition', 'teaching', 'patents', 'contact']]
    check('Page sections follow the source CV order', section_positions == sorted(section_positions) and len(set(section_positions)) == len(section_positions), section_positions)
    check('No manual theme control or stored override', page.locator('#theme-toggle').count() == 0 and page.locator('html').get_attribute('data-theme') is None and page.evaluate("!document.documentElement.outerHTML.includes('localStorage')"))
    check('Reduced-motion scroll behavior', page.evaluate("getComputedStyle(document.documentElement).scrollBehavior") == 'auto')
    favicons = {}
    for icon in ['/favicon.ico', '/favicon.png']:
        reply = context.request.get(args.url.rstrip('/') + icon)
        favicons[icon] = {'status': reply.status, 'bytes': len(reply.body())}
    favicons['alpha_max'] = page.evaluate('''async () => { const img = new Image(); img.src = '/favicon.png'; await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data; let m = 0; for (let i = 3; i < d.length; i += 4) m = Math.max(m, d[i]); return m; }''')
    check('Favicon is a served, fully transparent image', favicons['/favicon.ico']['status'] == 200 and favicons['/favicon.png']['status'] == 200 and favicons['alpha_max'] == 0 and page.locator('link[rel="icon"]').count() == 2, favicons)
    # search-console ownership, crawler files and the 404 page, as the preview serves them.
    base = args.url.rstrip('/')
    verification = json.loads((root / 'src/data/site-verification.json').read_text())
    tokens = {}
    for file, sha256 in verification['files'].items():
        token = page.request.get(f'{base}/{file}')
        tokens[file] = {'status': token.status, 'identical': hashlib.sha256(token.body()).hexdigest() == sha256}
    check('Search-console token files are served byte-identical to the legacy site', all(item['status'] == 200 and item['identical'] for item in tokens.values()), tokens)
    metas = {item['name']: page.locator(f'meta[name="{item["name"]}"]').evaluate_all('items => items.map(item => item.content)') for item in verification['meta']}
    check('Search-console meta tags appear once with the legacy values', all(metas[item['name']] == [item['content']] for item in verification['meta']), metas)
    robots, sitemap = page.request.get(f'{base}/robots.txt'), page.request.get(f'{base}/sitemap.xml')
    canonical_url = page.locator('link[rel="canonical"]').get_attribute('href')
    check('robots.txt and sitemap.xml are served and point at the canonical page', robots.status == 200 and f'Sitemap: {canonical_url}sitemap.xml' in robots.text() and sitemap.status == 200 and f'<loc>{canonical_url}</loc>' in sitemap.text(), {'robots': robots.status, 'sitemap': sitemap.status, 'canonical': canonical_url})
    missing = context.new_page()
    missing.set_viewport_size({'width': 320, 'height': 800})
    missing_url = f'{base}/portfolio-mgt/Class101/'
    missing_errors = []
    # The document's own 404 is the expected result; any other failed subresource (CSS, font) is an error.
    missing.on('response', lambda response: response.status >= 400 and response.url != missing_url and missing_errors.append(f'HTTP {response.status} {response.url}'))
    missing.on('pageerror', lambda error: missing_errors.append(str(error)))
    missing_response = missing.goto(missing_url, wait_until='networkidle')
    not_found = {'status': missing_response.status, 'h1': missing.locator('h1').all_text_contents(), 'noindex': missing.locator('meta[name="robots"]').get_attribute('content'), 'home': missing.locator('a[href="/"]').count(), 'overflow': missing.evaluate('document.documentElement.scrollWidth - innerWidth'), 'font': missing.evaluate("getComputedStyle(document.body).fontFamily"), 'errors': missing_errors}
    check('Legacy path gets the styled noindex 404 page', not_found['status'] == 404 and not_found['h1'] == ['Page not found'] and not_found['noindex'] == 'noindex' and not_found['home'] == 1 and not_found['overflow'] <= 0 and 'Source Serif 4' in not_found['font'] and not missing_errors, not_found)
    missing.close()
    resources = page.evaluate('performance.getEntriesByType("resource").map(r => r.name)')
    check('No third-party page-load requests', all(url.startswith(args.url) for url in resources), resources)

    for width in [320, 390, 768, 1024, 1440, 1920]:
        page.set_viewport_size({'width': width, 'height': 900})
        dimensions = page.evaluate('({viewport:innerWidth,document:document.documentElement.scrollWidth})')
        check(f'No horizontal overflow at {width}px', dimensions['document'] <= dimensions['viewport'], dimensions)
        if width in [390, 1440]:
            interests = page.locator('.interest-list li').evaluate_all('''items => items.map(item => {
              const copy = item.cloneNode(true); copy.querySelector('strong').remove();
              return { words: copy.textContent.trim().split(/\\s+/).length, height: item.getBoundingClientRect().height, lineHeight: parseFloat(getComputedStyle(item).lineHeight) };
            })''')
            check(f'Four research interests have balanced density at {width}px', len(interests) == 4 and max(item['words'] for item in interests) - min(item['words'] for item in interests) <= 2 and max(item['height'] for item in interests) - min(item['height'] for item in interests) <= interests[0]['lineHeight'] + 1, interests)
            page.locator('#research').screenshot(path=str(out / f'research-{width}.png'))

    # Every CV entry shares this heading layout. Open collapsed sections so long older
    # patents and earlier experience are measured as well as the default-visible rows.
    page.locator('.cv-disclosure').evaluate_all('items => items.forEach(item => item.open = true)')
    for width in [1440, 768, 390, 320]:
        page.set_viewport_size({'width': width, 'height': 900})
        headings = page.locator('.career-row').evaluate_all('''items => items.map(item => {
          const title = item.querySelector('.career-heading h3').getBoundingClientRect();
          const date = item.querySelector('.career-date').getBoundingClientRect();
          return {id: item.id, titleX: title.x, titleRight: title.right, titleY: title.y,
            titleBottom: title.bottom, dateX: date.x, dateRight: date.right, dateY: date.y};
        })''')
        if width >= 768:
            misplaced = [item for item in headings if abs(item['dateY'] - item['titleY']) > 2 or item['dateX'] < item['titleRight'] + 15]
            check(f'All CV dates align at the upper right of headings at {width}px', len(headings) == 37 and not misplaced, misplaced)
        else:
            misplaced = [item for item in headings if abs(item['dateX'] - item['titleX']) > 2 or item['dateY'] < item['titleBottom']]
            check(f'All CV dates follow headings consistently at {width}px', len(headings) == 37 and not misplaced, misplaced)
        if width in [1440, 390]:
            page.locator('#patents').screenshot(path=str(out / f'patents-{width}.png'))
            results['screenshots'].append(f'patents-{width}.png')
    page.locator('.cv-disclosure').evaluate_all('items => items.forEach(item => item.open = false)')

    page.set_viewport_size({'width': 1440, 'height': 1000})
    page.evaluate('window.scrollTo(0, 0)')
    page.screenshot(path=str(out / 'desktop.png'), full_page=True)
    page.screenshot(path=str(out / 'desktop-top.png'), full_page=False)
    results['screenshots'] += ['desktop.png', 'desktop-top.png']
    page.set_viewport_size({'width': 390, 'height': 844})
    page.evaluate('window.scrollTo(0, 0)')
    page.screenshot(path=str(out / 'mobile.png'), full_page=True)
    page.screenshot(path=str(out / 'mobile-top.png'), full_page=False)
    results['screenshots'] += ['mobile.png', 'mobile-top.png']
    page.set_viewport_size({'width': 1440, 'height': 1000})
    page.locator('#funding').screenshot(path=str(out / 'funding.png'))
    page.locator('#recognition').screenshot(path=str(out / 'recognition.png'))
    results['screenshots'] += ['funding.png', 'recognition.png']
    page.set_viewport_size({'width': 390, 'height': 844})

    # User task: reach older papers in one disclosure, then navigate by year.
    earlier_papers = page.locator('#earlier-publications')
    earlier_papers.locator(':scope > summary').focus()
    page.keyboard.press('Enter')
    check('Earlier publications opens with Enter', earlier_papers.get_attribute('open') is not None)
    check('All 28 publications can be read after expanding Earlier', all(paper.is_visible() for paper in page.locator('article.paper').all()))
    page.locator('.year-index').get_by_role('link', name='2024', exact=True).click()
    check('Earlier year index reaches 2024 directly', page.url.endswith('#publications-2024') and 0 <= page.locator('#publications-2024').bounding_box()['y'] < page.viewport_size['height'])
    for index in range(28):
        details = page.locator('.paper .citation').nth(index)
        summary = details.locator('summary')
        summary.focus()
        page.keyboard.press('Enter')
        check(f'Citation {index + 1} opens with Enter', details.get_attribute('open') is not None and details.locator('.citation-content').is_visible())
        summary_box = summary.bounding_box()
        citation_box = details.locator('.citation-content').bounding_box()
        check(f'Citation {index + 1} renders below its control', citation_box['y'] >= summary_box['y'] + summary_box['height'] - 1, {'summary': summary_box, 'citation': citation_box})
        page.keyboard.press('Space')
        check(f'Citation {index + 1} closes with Space', details.get_attribute('open') is None)
    # The APA toggle shares the action row with the publication links.
    page.set_viewport_size({'width': 1440, 'height': 1000})
    toggle_rows = page.evaluate('''() => [...document.querySelectorAll('.paper')].map(paper => {
      const top = el => Math.round(el.getBoundingClientRect().top);
      const link = paper.querySelector('.paper-actions > a');
      return { id: paper.id, sameRow: link ? top(paper.querySelector('.citation summary')) === top(link) : true };
    }).filter(item => !item.sameRow)''')
    check('APA citation toggle shares the action row at 1440px for all 28 publications', toggle_rows == [], toggle_rows)

    earlier = page.locator('.earlier-experience')
    earlier.locator(':scope > summary').focus()
    page.keyboard.press('Enter')
    check('Earlier experience expands by keyboard', earlier.get_attribute('open') is not None and page.locator('#kiel').is_visible())
    page.set_viewport_size({'width': 390, 'height': 844})
    dimensions = page.evaluate('({viewport:innerWidth,document:document.documentElement.scrollWidth})')
    check('Expanded publications and career fit mobile', dimensions['document'] <= dimensions['viewport'], dimensions)
    page.locator('#publications-2025').screenshot(path=str(out / 'publications-expanded-mobile.png'))
    results['screenshots'].append('publications-expanded-mobile.png')

    page.goto(args.url, wait_until='networkidle')
    page.keyboard.press('Tab')
    check('Skip link is first keyboard target', page.evaluate('document.activeElement.classList.contains("skip-link")'))
    page.keyboard.press('Enter')
    check('Skip link moves focus to main', page.evaluate('document.activeElement.id') == 'main')
    page.get_by_role('link', name='Contact', exact=True).click()
    check('Anchor navigation works', page.url.endswith('#contact') and 0 <= page.locator('#contact').bounding_box()['y'] < page.viewport_size['height'])
    context.grant_permissions(['clipboard-read', 'clipboard-write'])
    page.get_by_role('button', name='Copy email address', exact=True).click()
    page.wait_for_function('document.querySelector("#copy-status").textContent.includes("copied")')
    check('Clipboard contains work email', page.evaluate('navigator.clipboard.readText()') == 'yongkyung.oh@pusan.ac.kr')
    page.evaluate("() => { navigator.clipboard.writeText = async () => { throw new Error('permission denied'); }; }")
    page.get_by_role('button', name='Copy email address', exact=True).click()
    page.wait_for_function('document.querySelector("#copy-status").textContent.includes("unavailable")')
    check('Clipboard denial gives useful fallback', page.locator('#copy-status').is_visible() and page.locator('.email-link').get_attribute('href').startswith('mailto:'))

    # Simulate text-only enlargement, which is stricter than changing viewport alone.
    page.evaluate('document.querySelectorAll(".cv-disclosure").forEach(d => d.open = true)')
    for width in [320, 390, 768, 1440]:
        page.set_viewport_size({'width': width, 'height': 900})
        page.evaluate('document.documentElement.style.fontSize = "200%"')
        dimensions = page.evaluate('({viewport:innerWidth,document:document.documentElement.scrollWidth})')
        check(f'200% text: no overflow at {width}px', dimensions['document'] <= width, dimensions)
        if width == 390:
            page.screenshot(path=str(out / 'mobile-text-200.png'), full_page=True)
            results['screenshots'].append('mobile-text-200.png')
        page.evaluate('document.documentElement.style.fontSize = ""')

    # Header below 400px: the portrait takes its own row so the affiliation and email keep whole words.
    page.evaluate('document.querySelectorAll(".cv-disclosure").forEach(d => d.open = false)')
    header_layout = {}
    for width in [320, 360, 390, 412]:
        page.set_viewport_size({'width': width, 'height': 900})
        header_layout[width] = page.evaluate('''() => {
          const box = s => document.querySelector(s).getBoundingClientRect();
          const lines = s => { const r = document.createRange(); r.selectNodeContents(document.querySelector(s)); return new Set([...r.getClientRects()].map(x => Math.round(x.top))).size; };
          const a = box('.affiliation'), e = box('.header-email'), p = box('.portrait');
          return { affiliationLines: lines('.affiliation'), emailLines: lines('.header-email'), affiliationWidth: Math.round(a.width), portraitBeside: p.left >= a.right - 1 && p.top < a.bottom, portraitBelowEmail: p.top >= e.bottom - 1, portrait: [Math.round(p.width), Math.round(p.height)] };
        }''')
    check('Header below 400px stacks the portrait; email on one line, affiliation within four', all(header_layout[w]['emailLines'] == 1 and header_layout[w]['affiliationLines'] <= 4 and header_layout[w]['portraitBelowEmail'] and header_layout[w]['portrait'] == [144, 144] for w in [320, 360, 390]), header_layout)
    check('Header at 412px keeps the portrait beside the affiliation', header_layout[412]['portraitBeside'] and header_layout[412]['affiliationLines'] <= 4, header_layout[412])

    # The name must never break inside a word. Measured both with the rem-only simulation above and
    # with a real browser font-size change (CDP), which also moves the em-based breakpoints.
    h1_words = '''() => { const h1 = document.querySelector('h1'); const node = h1.firstChild; const text = node.textContent; const r = document.createRange(); let i = 0; const words = [];
      for (const w of text.split(' ')) { r.setStart(node, i); r.setEnd(node, i + w.length); words.push([w, new Set([...r.getClientRects()].map(x => Math.round(x.top))).size]); i += w.length + 1; }
      return { words, fontSize: parseFloat(getComputedStyle(h1).fontSize), overflow: document.documentElement.scrollWidth - innerWidth }; }'''
    name_sizes = {}
    for width in [390, 1440]:
        page.set_viewport_size({'width': width, 'height': 900})
        name_sizes[width] = page.evaluate(h1_words)['fontSize']
    check('Name keeps its documented sizes at the default font size', name_sizes == {390: 34.4, 1440: 48}, name_sizes)
    name_enlarged = {}
    for width in [320, 390, 768, 1440]:
        page.set_viewport_size({'width': width, 'height': 900})
        page.evaluate('document.documentElement.style.fontSize = "200%"')
        name_enlarged[f'{width}px rem 200%'] = page.evaluate(h1_words)
        page.evaluate('document.documentElement.style.fontSize = ""')
    cdp = context.new_cdp_session(page)
    for width in [320, 768]:
        page.set_viewport_size({'width': width, 'height': 900})
        cdp.send('Page.setFontSizes', {'fontSizes': {'standard': 32, 'fixed': 26}})
        page.wait_for_timeout(150)
        name_enlarged[f'{width}px browser font 200%'] = page.evaluate(h1_words)
    cdp.send('Page.setFontSizes', {'fontSizes': {'standard': 16, 'fixed': 13}})
    page.wait_for_timeout(150)
    cdp.detach()
    check('Enlarged text never splits a word of the name and never overflows', all(all(count == 1 for _, count in result['words']) and result['overflow'] <= 0 for result in name_enlarged.values()), name_enlarged)

    # Contrast of each actual text color on the solid paper background.
    contrast = page.evaluate('''() => {
      const colors = ['--color-ink', '--color-muted', '--color-accent'];
      const style = getComputedStyle(document.body);
      const lum = hex => {
        const c = hex.trim().replace('#','').match(/../g).map(v => parseInt(v,16)/255).map(v => v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
        return .2126*c[0]+.7152*c[1]+.0722*c[2];
      };
      const bg = lum(style.getPropertyValue('--color-paper'));
      return Object.fromEntries(colors.map(c => { const fg = lum(style.getPropertyValue(c)); return [c, (Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05)]; }));
    }''')
    check('All text tokens exceed AA 4.5:1', all(ratio >= 4.5 for ratio in contrast.values()), contrast)
    check('No browser errors', not results['errors'], results['errors'])
    check('Dark device preference selects dark colors', page.evaluate("matchMedia('(prefers-color-scheme: dark)').matches") and page.evaluate("getComputedStyle(document.body).backgroundColor") == 'rgb(24, 27, 26)')
    page.emulate_media(color_scheme='light')
    check('Light device preference selects light colors', page.evaluate("matchMedia('(prefers-color-scheme: light)').matches") and page.evaluate("getComputedStyle(document.body).backgroundColor") == 'rgb(250, 250, 248)')
    page.set_viewport_size({'width': 1440, 'height': 1000})
    page.evaluate('window.scrollTo(0, 0)')
    page.screenshot(path=str(out / 'desktop-light.png'), full_page=False)
    results['screenshots'].append('desktop-light.png')
    for theme in ['light', 'dark']:
        page.emulate_media(color_scheme=theme)
        pairs = page.evaluate(r'''() => {
          const lum = rgb => { const c = rgb.match(/[\d.]+/g).slice(0, 3).map(v => Number(v)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4); return .2126*c[0]+.7152*c[1]+.0722*c[2]; };
          const ratio = (a, b) => (Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
          const selection = getComputedStyle(document.body, '::selection');
          const skip = getComputedStyle(document.querySelector('.skip-link'));
          const body = getComputedStyle(document.body);
          return { selection: ratio(selection.color, selection.backgroundColor), skip: ratio(skip.color, skip.backgroundColor), body: ratio(body.color, body.backgroundColor), muted: ratio(getComputedStyle(document.querySelector('.authors')).color, body.backgroundColor), link: ratio(getComputedStyle(document.querySelector('.profile-links a')).color, body.backgroundColor) };
        }''')
        check(f'{theme}: body, muted, links, selection and skip link exceed 4.5:1', all(r >= 4.5 for r in pairs.values()), pairs)
    page.emulate_media(color_scheme='dark')
    page.locator('#pub-j13 .citation summary').click()
    citation = page.locator('#pub-j13 .citation-content')
    check('APA journal and volume are italic, article title stays roman', citation.locator('i').all_text_contents() == ['Computers & Industrial Engineering', '213'] and citation.locator('i').first.evaluate('el => getComputedStyle(el).fontStyle') == 'italic')
    page.locator('#publications-2026').screenshot(path=str(out / 'apa-citation.png'))
    results['screenshots'].append('apa-citation.png')
    doi_paragraphs = page.locator('.citation-content p').filter(has=page.locator('a[href^="https://doi.org/"]'))
    check('All 23 reviewed DOI URLs are inside the reusable citation paragraphs', doi_paragraphs.count() == 23)
    check('CV award notes stay outside reusable citations', all(text not in page.locator('.citation-content').all_text_contents()[i] for i in range(28) for text in ['Best Paper Award', 'Spotlight Presentation']))


    nojs = browser.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 844}, color_scheme='light')
    simple = nojs.new_page()
    simple.goto(args.url, wait_until='networkidle')
    simple.get_by_role('link', name='Publications', exact=True).click()
    simple.locator('#earlier-publications > summary').click()
    check('Publication dropdown works without JS', simple.locator('#earlier-publications').get_attribute('open') is not None and simple.locator('#multi-view').is_visible())
    simple.locator('#multi-view .citation summary').click()
    check('Nested APA citation works without JS', simple.locator('#multi-view .citation').get_attribute('open') is not None and simple.locator('#multi-view .citation-content').is_visible())
    simple.locator('.earlier-experience > summary').click()
    check('Earlier experience works without JS', simple.locator('#kiel').is_visible())
    check('Email copy enhancement stays hidden without JS', simple.locator('#copy-email').is_hidden())
    check('No-JS page still follows device light preference', simple.locator('#theme-toggle').count() == 0 and simple.evaluate("getComputedStyle(document.body).backgroundColor") == 'rgb(250, 250, 248)')
    check('Mail and external CV links work without JS', simple.locator('.email-link').get_attribute('href').startswith('mailto:') and simple.locator('.header-cv').get_attribute('href') == cv_url)
    pdf = context.request.get(args.url + '/cv/YongKyung-Oh-CV.pdf')
    check('Bundled CV PDF remains served correctly', pdf.status == 200 and pdf.body().startswith(b'%PDF-'))
    page.evaluate('document.querySelectorAll(".cv-disclosure").forEach(d => d.open = false)')
    # Simulate an engine without ::details-content support; use the print event fallback.
    page.evaluate("""() => { const prune = rules => { for (let i = rules.length - 1; i >= 0; i--) { const rule = rules[i]; if (rule.selectorText?.includes('::details-content')) rule.parentRule ? rule.parentRule.deleteRule(i) : rule.parentStyleSheet.deleteRule(i); else if (rule.cssRules) prune(rule.cssRules); } }; [...document.styleSheets].forEach(sheet => prune(sheet.cssRules)); }""")
    page.evaluate("window.dispatchEvent(new Event('beforeprint'))")
    page.emulate_media(media='print')
    check('Print fallback reveals collapsed content without pseudo-element support', page.locator('#pub-c01').is_visible() and page.locator('#kiel').is_visible())
    check('Print fallback reveals all 7 patents, 2 teaching entries and all 13 recognitions with both subheadings', page.locator('#patents .career-row').evaluate_all('items => items.filter(item => item.getBoundingClientRect().height > 0).length') == 7 and page.locator('#recognition .career-row').evaluate_all('items => items.filter(item => item.getBoundingClientRect().height > 0).length') == 13 and page.locator('#teaching .career-row').count() == 2 and page.locator('#recognition .recognition-group h3.year-heading').evaluate_all('items => items.filter(item => item.getBoundingClientRect().height > 0).length') == 2)
    printed_citations = page.locator('.citation-content').evaluate_all('items => items.filter(item => item.getBoundingClientRect().height > 0).length')
    printed_dois = page.locator('.citation-content a[href^="https://doi.org/"]').evaluate_all('items => items.filter(item => item.getBoundingClientRect().height > 0).length')
    check('Print keeps every APA citation and DOI', printed_citations == 28 and printed_dois == 23, {'citations': printed_citations, 'dois': printed_dois})
    page.emulate_media(media='screen')
    bio_align = {}
    for width in (390, 1440):
        page.set_viewport_size({'width': width, 'height': 900})
        bio_align[width] = {name: page.locator(selector).first.evaluate('el => [getComputedStyle(el).textAlign, getComputedStyle(el).hyphens]') for name, selector in [('bio', '.bio-copy p'), ('research', '.interest-list li')]}
    check('Bio and Research interests are justified with hyphenation at 760px and above, ragged on mobile', all(bio_align[1440][n] == ['justify', 'auto'] and bio_align[390][n][0] != 'justify' for n in ('bio', 'research')), bio_align)
    page.evaluate("window.dispatchEvent(new Event('afterprint'))")
    check('After print restores closed disclosures', page.locator('.cv-disclosure[open]').count() == 0)

    results['passed'] = all(item['passed'] for item in results['checks'])
    (out / 'browser-results.json').write_text(json.dumps(results, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({'passed': results['passed'], 'checks': len(results['checks']), 'failures': [item for item in results['checks'] if not item['passed']], 'errors': results['errors'], 'report': str(out / 'browser-results.json')}, indent=2, ensure_ascii=False), flush=True)
    nojs.close()
    context.close()
    browser.close()

raise SystemExit(0 if results['passed'] else 1)
