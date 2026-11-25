#!/usr/bin/env python3
"""Technical SEO audit of the local static builds. Usage: seo_audit.py <dir> <domain> [--json out.json]"""
import sys, re, json, html, os
from pathlib import Path
from collections import defaultdict, Counter
from html.parser import HTMLParser

root = Path(sys.argv[1]); domain = sys.argv[2].rstrip("/")
SKIP = {"404.html", "thanks.html", "welcome.html", "eu-waitlist-thanks.html"}

class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.title = ""; s.in_title = False; s.meta = {}; s.links = []; s.canon = None; s.h1 = 0; s.imgs_noalt = 0
        s.ld = []; s.in_ld = False; s.buf = ""; s.robots = ""; s.text = []; s.skip = 0
    def handle_starttag(s, t, a):
        a = dict(a)
        if t == "title": s.in_title = True
        elif t == "meta":
            k = (a.get("name") or a.get("property") or "").lower()
            if k: s.meta[k] = a.get("content", "")
        elif t == "link" and (a.get("rel") or "").lower() == "canonical": s.canon = a.get("href")
        elif t == "a" and a.get("href"): s.links.append(a["href"])
        elif t == "h1": s.h1 += 1
        elif t == "img" and not a.get("alt") and a.get("alt") != "": s.imgs_noalt += 1
        elif t == "script" and a.get("type") == "application/ld+json": s.in_ld = True; s.buf = ""
        elif t in ("script", "style"): s.skip += 1
    def handle_endtag(s, t):
        if t == "title": s.in_title = False
        elif t == "script" and s.in_ld: s.in_ld = False; s.ld.append(s.buf)
        elif t in ("script", "style") and s.skip: s.skip -= 1
    def handle_data(s, d):
        if s.in_title: s.title += d
        elif s.in_ld: s.buf += d
        elif not s.skip: s.text.append(d)

files = {p.name: p for p in root.glob("*.html")}
for sub in root.glob("*/index.html"):
    if sub.parent.name not in ("assets", "node_modules"): files[sub.parent.name + "/index.html"] = sub
def resolve(href, here):
    if href.startswith(("mailto:", "tel:", "javascript:", "#", "data:")): return None
    h = href
    if h.startswith(("http://", "https://")):
        if not (h.startswith(domain) or h.startswith(domain.replace("https://", "https://www."))): return None
        h = re.sub(r"^https?://[^/]+", "", h)
    h = h.split("#")[0].split("?")[0]
    if not h or h == "/": return "index.html"
    if not h.startswith("/"): h = "/" + h
    h = h.lstrip("/")
    if h.endswith("/"): h = h + "index.html"
    if "." not in h.split("/")[-1]: h = h + ".html"
    return h
redir = set()
rf = root / "_redirects"
if rf.exists():
    for line in rf.read_text().splitlines():
        parts = line.split()
        if parts and not line.startswith("#"): redir.add(parts[0].strip("/").split("*")[0])

sm = set()
smf = root / "sitemap.xml"
if smf.exists():
    for loc in re.findall(r"<loc>([^<]+)</loc>", smf.read_text()):
        r = resolve(loc, "")
        if r: sm.add(r)

pages = {}; inbound = Counter(); broken = defaultdict(set)
for name, path in files.items():
    p = P()
    try: p.feed(path.read_text(errors="ignore"))
    except Exception as e: print("PARSE", name, e); continue
    pages[name] = p
    for l in set(p.links):
        r = resolve(l, name)
        if r is None: continue
        if r in files or r.split("/")[0] in files:
            if r != name: inbound[r] += 1
        elif re.sub(r"\.html$","",r) not in redir and not (root / r).exists():
            broken[name].add(l)

issues = defaultdict(list)
titles = defaultdict(list); descs = defaultdict(list)
for name, p in pages.items():
    if name in SKIP: continue
    noindex = "noindex" in p.meta.get("robots", "")
    t = html.unescape(p.title.strip()); d = p.meta.get("description", "")
    if noindex: continue
    titles[t].append(name); descs[d].append(name)
    if not t: issues[name].append("no title")
    elif len(t) > 65: issues[name].append(f"title {len(t)} chars")
    elif len(t) < 25: issues[name].append(f"title short {len(t)}")
    if not d: issues[name].append("no meta description")
    elif len(d) > 165: issues[name].append(f"desc {len(d)} chars")
    elif len(d) < 70: issues[name].append(f"desc short {len(d)}")
    if not p.canon: issues[name].append("no canonical")
    else:
        cr = resolve(p.canon, name)
        if cr != name and not (name.endswith("index.html") and cr == name): issues[name].append(f"canonical -> {p.canon}")
    if p.h1 != 1: issues[name].append(f"h1 x{p.h1}")
    if p.imgs_noalt: issues[name].append(f"{p.imgs_noalt} img no alt")
    for b in p.ld:
        try: json.loads(b)
        except Exception: issues[name].append("invalid JSON-LD")
    if name not in sm and name != "index.html": issues[name].append("not in sitemap")
    if inbound[name] == 0 and name != "index.html": issues[name].append("ORPHAN (0 inbound links)")
    words = len(" ".join(p.text).split())
    if words < 250: issues[name].append(f"thin {words} words")
    if not p.meta.get("og:image"): issues[name].append("no og:image")
for name, bl in broken.items(): issues[name].append("broken links: " + ", ".join(sorted(bl)[:6]))
for t, ns in titles.items():
    if len(ns) > 1: issues["_dupes"].append(f"dup title x{len(ns)}: {t[:60]} -> {ns[:4]}")
for d, ns in descs.items():
    if len(ns) > 1 and d: issues["_dupes"].append(f"dup desc x{len(ns)}: {ns[:4]}")
for s in sorted(sm):
    if s not in files and not (root / s).exists(): issues["_sitemap"].append(f"sitemap URL has no file: {s}")
tally = Counter()
for n, l in issues.items():
    for i in l: tally[re.sub(r"[\d]+", "N", i.split(":")[0])] += 1
print(f"== {root} ({len(pages)} pages)")
for k, v in tally.most_common(): print(f"  {v:4d}  {k}")
if "--json" in sys.argv: json.dump(issues, open(sys.argv[sys.argv.index("--json") + 1], "w"), indent=1)
