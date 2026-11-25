#!/usr/bin/env python3
"""Post-build SEO step (run at the end of build.py): honest sitemap.

- Lists EVERY indexable page that exists (no orphans left out, no dead URLs left in).
- <lastmod> changes only when a page's visible content actually changes (content hash kept in
  .lastmod.json, committed with the site). Stamping every URL with today's date on every build
  teaches Google to ignore our lastmod; honest dates get changed pages recrawled faster.
Usage: python3 seo_post.py <site_dir> <https://domain>
"""
import sys, re, json, hashlib, datetime, html as H
from pathlib import Path

root = Path(sys.argv[1]).resolve(); domain = sys.argv[2].rstrip("/")
today = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5))).date().isoformat()  # PKT
state_f = root / ".lastmod.json"
state = json.loads(state_f.read_text()) if state_f.exists() else {}
old = (root / "sitemap.xml").read_text() if (root / "sitemap.xml").exists() else ""
old_locs = re.findall(r"<loc>([^<]+)</loc>", old)
clean = not any(l.endswith(".html") for l in old_locs if not l.rstrip("/").endswith(domain.split("//")[1]))
old_dates = {}
for m in re.finditer(r"<loc>([^<]+)</loc>\s*<lastmod>([^<]+)</lastmod>", old): old_dates[m.group(1)] = m.group(2)[:10]

SKIP = re.compile(r"^(404|thanks|welcome|google[0-9a-f]+|eu-waitlist-thanks|.*-thanks)\.html$")
def visible(src):
    src = re.sub(r"(?is)<(script|style|noscript)\b.*?</\1>", " ", src)
    m = re.search(r"(?is)<main\b.*?</main>", src)
    body = m.group(0) if m else src
    t = re.search(r"(?is)<title>(.*?)</title>", src); d = re.search(r'(?is)<meta name="description" content="([^"]*)"', src)
    txt = re.sub(r"<[^>]+>", " ", body)
    txt = re.sub(r"\s+", " ", H.unescape(txt)).strip()
    return (t.group(1) if t else "") + "|" + (d.group(1) if d else "") + "|" + txt

pages = []
for p in sorted(root.rglob("*.html")):
    rel = p.relative_to(root).as_posix()
    if any(part.startswith((".", "_")) or part in ("assets", "node_modules", "drafts", "templates") for part in p.relative_to(root).parts[:-1]): continue
    if SKIP.match(p.name) and p.parent == root: continue
    src = p.read_text(errors="ignore")
    if re.search(r'(?i)<meta name="robots" content="[^"]*noindex', src): continue
    if not re.search(r"(?i)<title>", src): continue
    if rel == "index.html": url = domain + "/"
    elif rel.endswith("/index.html"): url = f"{domain}/{rel[:-10]}"
    else: url = f"{domain}/{rel[:-5] if clean else rel}"
    h = hashlib.sha1(visible(src).encode()).hexdigest()[:16]
    prev = state.get(rel)
    if prev and prev[0] == h: date = prev[1]
    elif prev: date = today
    else: date = old_dates.get(url, today) if old_dates.get(url, today) < today else today  # first run: keep what we had
    state[rel] = [h, date]
    imgs = list(dict.fromkeys(re.findall(r'<img src="(/assets/img/[^"?]+)', src)))[:5]
    pages.append((url, date, imgs))
for k in list(state):
    if not (root / k).exists(): del state[k]
pages.sort(key=lambda x: (x[0] != domain + "/", x[0]))
has_img = any(p[2] for p in pages)
ns = ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' if has_img else ""
xml = f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"{ns}>\n' + "".join(
    f"  <url><loc>{u}</loc><lastmod>{d}</lastmod>" + "".join(f"<image:image><image:loc>{domain}{i}</image:loc></image:image>" for i in im) + "</url>\n" for u, d, im in pages) + "</urlset>\n"
(root / "sitemap.xml").write_text(xml)
state_f.write_text(json.dumps(state, indent=0, sort_keys=True))
added = set(p[0] for p in pages) - set(old_locs); dropped = set(old_locs) - set(p[0] for p in pages)
print(f"seo_post: {len(pages)} URLs in sitemap (+{len(added)} -{len(dropped)}); changed today: {sum(1 for p in pages if p[1] == today)}, with images: {sum(1 for p in pages if p[2])}")
if added: print("  added:", sorted(added)[:8])
if dropped: print("  dropped:", sorted(dropped)[:8])
