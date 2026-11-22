# ZAWN site improvement log

Each daily improvement run reads this file first and appends a dated entry below.

## Standing rule: ChatGPT and AI answers (added 21 Nov 2026 at Awais's request)
ChatGPT now sends about 90% of visitors on Awais's GTA site NeonCoast: it links pages that give a direct, specific, up-to-date answer plus something useful to do next. Every run on this site follows this on each new or refreshed page:
- Open with a 1-2 sentence "Quick answer" that states the specific answer (numbers, sizes, prices, steps), then the detail.
- Use question-style H2s that match how people ask, keep a visible "Last checked/updated" date, and add FAQ JSON-LD for those questions.
- Make facts easy to quote: short lists and tables, one fact per line, units included.
- Keep visitors on the site: end every page and every tool result with 2-3 links to related pages or tools ("what next").
- Keep robots.txt open to all crawlers (Bingbot, OAI-SearchBot, GPTBot included); never add blocks.
- Blog posts too: the first paragraph under the title answers the search question directly (cost range, time, yes/no), before any background.

## 2026-11-21: internal links for under-linked posts + title/description batch
1. Internal links (rule a). Three posts had few or no in-content links to services and no service page linking to them.
   - Added a "Related services" box to the aside of blog-app-development-cost-2026, blog-how-ball-tracking-works and blog-hire-software-developers-pakistan (5 service links each).
   - Added or extended "Related reading" boxes on mobile-app-development (3 posts), mvp-development, web-saas-development, custom-business-software, sports-analytics-app-development, computer-vision-development and voice-ai-development.
   - sports-analytics-app-development "Related services" now also links machine-learning-development and mobile-app-development.
   - Why: every blog post now has 3+ service links and is linked from 1+ service page, so Google can find and rank the posts and readers reach a service page.
2. Technical SEO (rule e). Shortened 25 title tags that were over 60 characters (mostly "| ZAWN Technologies" -> "| ZAWN", keywords kept; og/twitter titles kept in sync). Blog titles only had their suffix shortened. Rewrote too-short meta descriptions (now 140-160 chars) on blockchain-web3-development, cloud-devops, iot-embedded-development, web-saas-development.
   - Left for a later run: index.html title (74 chars, left alone to be cautious with the homepage); short descriptions on blog.html, contact.html, unity-game-development, tree-service-estimating-app; long descriptions on business-automation, chrome-extension-development, desktop-app-development, ios-app-development, website-development, work.html and three work-* case studies.
   - All internal links checked: none broken. All pages are in sitemap.xml; lastmod set to 2026-11-21 for changed pages.

## STANDING RULE (22 Nov 2026 16:05 PKT, Awais: "You don't need my approval, just do it"): IndexNow after every push
- After every push that adds or changes pages (blog posts included), ping IndexNow for each new/changed page (up to 10 per run) with WebFetch:
  https://api.indexnow.org/indexnow?url=https%3A%2F%2Fwww.zawntechnologies.com%2F<file>.html&key=ee537df6f31cad594ce005b07ad269ca
- Awais approved these pings for all runs. An empty/binary response means accepted. If WebFetch is unavailable or blocked, skip silently (don't retry) and list the pages under "IndexNow pending" in this log.
- Key file /ee537df6f31cad594ce005b07ad269ca.txt must stay in the repo root (never delete or rename it).
- 22 Nov: pinged the 5 newest blog posts.

## 2026-11-22: new free tool, AI chatbot cost calculator + description batch
1. New tool (rule c, first of this week): ai-chatbot-cost-calculator.html.
   - Pick bot type (answer bot / document-trained / action-taking agent), extras (channels, human handover, languages, voice, analytics, logged-in users, self-hosted model), number of systems, content state and conversations per month.
   - Shows build hours, cost at $50/h, timeline, monthly running cost (model usage + hosting, rough) and monthly maintenance. Base ranges match blog-ai-chatbot-cost-2026 exactly (80-160 / 200-400 / 400-900 h). Prefills the contact form like the app calculator.
   - Follows the AI-answers rule: "Quick answer" lede with numbers, question H2s, table, 5 FAQs in FAQPage JSON-LD, "What to do next" links.
   - JS appended to assets/main.js (guarded IIFE on #cb-form); no CSS change (reuses .calc classes). Asset version bumped to ?v=20261122a on all pages.
   - Linked from: footer Company list (all pages), homepage services intro, ai-chatbot-development Related reading box, blog-ai-chatbot-cost-2026 (closing section + aside; dateModified 2026-11-22). Added to sitemap.xml (priority 0.9).
   - Why: "AI chatbot cost" searches have clear buyer intent; a working tool earns links and AI-answer citations and sends visitors to contact with their estimate filled in.
2. Meta descriptions (rule e): rewrote too-short descriptions on blog.html, contact.html, unity-game-development, tree-service-estimating-app (now 151-159 chars).
   - Still left: index.html title (74 chars); long descriptions on business-automation, chrome-extension-development, desktop-app-development, ios-app-development, website-development, work.html and three work-* case studies.
   - Sitemap lastmod set to today only for pages with content changes (footer link/version bump alone not counted).
   - Internal links checked: none broken.
- Next tool idea (not before 29 Nov): "Bubble or custom code?" decision helper.
- IndexNow pending (WebFetch permission prompt unanswered in unattended run): ai-chatbot-cost-calculator, blog-ai-chatbot-cost-2026, ai-chatbot-development, contact, blog.
