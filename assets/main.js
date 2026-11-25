/* ZAWN Technologies — interactions
   hero sensor field, ball-tracking demo, vision cursor, reveals, counters, contact form */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  var RED = "#FF3D47", CORAL = "#FF7A45", BALL = "#E8F25C";
  var MONO = "500 11px 'Geist Mono', ui-monospace, monospace";
  var mouse = { x: -9999, y: -9999, active: false };
  window.addEventListener("pointermove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; }, { passive: true });
  document.addEventListener("pointerleave", function () { mouse.active = false; });

  function runWhenVisible(el, loop) {
    var raf = null;
    function tick() { loop(); raf = requestAnimationFrame(tick); }
    if (!("IntersectionObserver" in window)) { tick(); return; }
    new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { if (!raf) tick(); }
      else if (raf) { cancelAnimationFrame(raf); raf = null; }
    }).observe(el);
  }
  function fit(canvas, ctx) {
    var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: r.width, h: r.height };
  }
  function corners(ctx, x, y, w, h, len, col) {
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
    ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
    ctx.moveTo(x + w, y + h - len); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - len, y + h);
    ctx.moveTo(x + len, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - len);
    ctx.stroke();
  }

  /* ---------- hero: sensor field that locks on to the cursor ---------- */
  var field = document.getElementById("field");
  if (field && field.getContext) {
    var fctx = field.getContext("2d"), FS = fit(field, fctx), ft = 0;
    var tgt = { x: FS.w * 0.3, y: FS.h * 0.5 }, cur = { x: tgt.x, y: tgt.y }, lockA = 0;
    window.addEventListener("resize", function () { FS = fit(field, fctx); if (reduce) drawField(); });
    function drawField() {
      var W = FS.w, H = FS.h, gap = W < 700 ? 26 : 32;
      fctx.clearRect(0, 0, W, H);
      var r = field.getBoundingClientRect();
      var inside = mouse.active && mouse.x > r.left && mouse.x < r.right && mouse.y > r.top && mouse.y < r.bottom;
      if (inside) { tgt.x = mouse.x - r.left; tgt.y = mouse.y - r.top; }
      else { tgt.x = W * (0.32 + 0.22 * Math.sin(ft * 0.37)); tgt.y = H * (0.5 + 0.28 * Math.sin(ft * 0.53 + 1)); }
      cur.x += (tgt.x - cur.x) * 0.09; cur.y += (tgt.y - cur.y) * 0.09;
      lockA += ((inside ? 1 : 0) - lockA) * 0.08;
      var R = Math.min(260, W * 0.3);
      for (var y = gap / 2; y < H; y += gap) {
        for (var x = gap / 2; x < W; x += gap) {
          var dx = x - cur.x, dy = y - cur.y, d = Math.sqrt(dx * dx + dy * dy);
          var k = Math.max(0, 1 - d / R), wave = 0.5 + 0.5 * Math.sin(x * 0.02 + y * 0.015 + ft * 1.2);
          var push = k * k * 14, px = x + (d ? dx / d * push : 0), py = y + (d ? dy / d * push : 0);
          var a = 0.07 + wave * 0.05 + k * 0.75;
          fctx.fillStyle = k > 0.05 ? "rgba(255," + Math.round(61 + 120 * (1 - k)) + "," + Math.round(71 * (1 - k) + 40) + "," + a.toFixed(3) + ")" : "rgba(200,206,220," + a.toFixed(3) + ")";
          var s = 1 + k * 1.6;
          fctx.fillRect(px - s / 2, py - s / 2, s, s);
        }
      }
      // scan line
      var sy = (ft * 60) % (H + 200) - 100;
      var g = fctx.createLinearGradient(0, sy - 60, 0, sy);
      g.addColorStop(0, "rgba(255,61,71,0)"); g.addColorStop(1, "rgba(255,61,71,.06)");
      fctx.fillStyle = g; fctx.fillRect(0, sy - 60, W, 60);
      // lock box
      var bs = 64 + 8 * Math.sin(ft * 3), bx = cur.x - bs / 2, by = cur.y - bs / 2;
      if (lockA > 0.02) {
      fctx.globalAlpha = lockA;
      corners(fctx, bx, by, bs, bs, 12, RED);
      fctx.strokeStyle = "rgba(255,61,71,.25)"; fctx.lineWidth = 1;
      fctx.beginPath(); fctx.moveTo(cur.x, 0); fctx.lineTo(cur.x, by); fctx.moveTo(cur.x, by + bs); fctx.lineTo(cur.x, H);
      fctx.moveTo(0, cur.y); fctx.lineTo(bx, cur.y); fctx.moveTo(bx + bs, cur.y); fctx.lineTo(W, cur.y); fctx.stroke();
      fctx.font = MONO;
      var conf = (0.94 + 0.04 * Math.sin(ft * 2.3)).toFixed(2);
      var lbl = (inside ? "visitor " : "object ") + conf, lw = fctx.measureText(lbl).width + 12;
      fctx.fillStyle = RED; fctx.fillRect(bx, by - 20, lw, 18);
      fctx.fillStyle = "#fff"; fctx.fillText(lbl, bx + 6, by - 7);
      fctx.fillStyle = "rgba(184,189,201,.7)";
      fctx.fillText("x " + Math.round(cur.x).toString().padStart(4, "0") + "  y " + Math.round(cur.y).toString().padStart(4, "0"), bx, by + bs + 16);
      fctx.globalAlpha = 1;
      }
      ft += 1 / 60;
    }
    if (reduce) drawField(); else runWhenVisible(field, drawField);
  }

  /* ---------- tracker: simulated padel ball tracking ---------- */
  var canvas = document.getElementById("tracker");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d"), S = fit(canvas, ctx), t = 0, frame = 0, trail = [];
    function P(x, y) {
      var W = S.w, H = S.h, topW = 0.46, botW = 0.94, top = 0.2, bot = 0.86;
      var w = botW + (topW - botW) * y, sy = bot + (top - bot) * y;
      return [W * (0.5 + (x - 0.5) * w), H * sy, w / botW];
    }
    function court() {
      var H = S.h;
      var c = [P(0, 0), P(1, 0), P(1, 1), P(0, 1)];
      ctx.fillStyle = "rgba(47,91,234,.07)";
      ctx.beginPath(); ctx.moveTo(c[0][0], c[0][1]); for (var i = 1; i < 4; i++) ctx.lineTo(c[i][0], c[i][1]); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(201,209,220,.35)"; ctx.lineWidth = 1.2; ctx.stroke();
      [0.22, 0.78].forEach(function (y) { var a = P(0, y), b = P(1, y); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); });
      var m1 = P(0.5, 0.22), m2 = P(0.5, 0.78); ctx.beginPath(); ctx.moveTo(m1[0], m1[1]); ctx.lineTo(m2[0], m2[1]); ctx.stroke();
      var n1 = P(0, 0.5), n2 = P(1, 0.5);
      ctx.strokeStyle = "rgba(251,252,250,.75)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(n1[0], n1[1]); ctx.lineTo(n2[0], n2[1]); ctx.stroke();
      ctx.strokeStyle = "rgba(251,252,250,.22)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(n1[0], n1[1] - H * 0.07); ctx.lineTo(n2[0], n2[1] - H * 0.07); ctx.stroke();
    }
    function ball(tt) {
      var H = S.h, cycle = 4.2, k = (tt % cycle) / cycle, forward = k < 0.5, s = forward ? k * 2 : (k - 0.5) * 2;
      var y = forward ? 0.08 + 0.84 * s : 0.92 - 0.84 * s;
      var x = forward ? 0.25 + 0.5 * s : 0.75 - 0.42 * s;
      var arc = s < 0.75 ? Math.sin((s / 0.75) * Math.PI) : 0.35 * Math.sin(((s - 0.75) / 0.25) * Math.PI);
      var g = P(x, y), height = arc * H * 0.22 * g[2];
      return { x: g[0], y: g[1] - height, gy: g[1], r: Math.max(3, 7 * g[2]) };
    }
    function draw() {
      var W = S.w;
      ctx.clearRect(0, 0, W, S.h);
      court();
      var b = ball(t);
      trail.push([b.x, b.y]); if (trail.length > 30) trail.shift();
      if (trail.length > 2) {
        ctx.lineCap = "round";
        for (var i = 1; i < trail.length; i++) {
          var a = i / trail.length;
          ctx.strokeStyle = "rgba(255," + Math.round(61 + 60 * a) + ",71," + (a * 0.8).toFixed(3) + ")";
          ctx.lineWidth = 1 + a * 3;
          ctx.beginPath(); ctx.moveTo(trail[i - 1][0], trail[i - 1][1]); ctx.lineTo(trail[i][0], trail[i][1]); ctx.stroke();
        }
      }
      ctx.fillStyle = "rgba(0,0,0,.4)";
      ctx.beginPath(); ctx.ellipse(b.x, b.gy, b.r * 1.1, b.r * 0.35, 0, 0, 6.283); ctx.fill();
      ctx.shadowColor = BALL; ctx.shadowBlur = 14;
      ctx.fillStyle = BALL; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
      ctx.shadowBlur = 0;
      var pad = b.r * 2.3, conf = (0.93 + 0.05 * Math.sin(t * 3.1)).toFixed(2);
      corners(ctx, b.x - pad, b.y - pad, pad * 2, pad * 2, Math.max(5, pad * 0.5), RED);
      ctx.font = MONO;
      var label = "ball " + conf, lw = ctx.measureText(label).width + 12;
      ctx.fillStyle = RED; ctx.fillRect(b.x - pad, b.y - pad - 20, lw, 18);
      ctx.fillStyle = "#fff"; ctx.fillText(label, b.x - pad + 6, b.y - pad - 7);
      // HUD
      ctx.fillStyle = "rgba(201,209,220,.85)";
      ctx.fillText("REC  frame " + String(frame).padStart(5, "0"), 18, 26);
      ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(12, 22, 3, 0, 6.283); ctx.fill();
      var spd = Math.round(38 + 22 * Math.abs(Math.cos(t * 1.5)));
      var txt = spd + " km/h";
      ctx.fillStyle = "rgba(201,209,220,.85)";
      ctx.fillText(txt, W - ctx.measureText(txt).width - 18, 26);
      // speed bar
      ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(W - 98, 34, 80, 3);
      ctx.fillStyle = CORAL; ctx.fillRect(W - 98, 34, 80 * (spd - 30) / 35, 3);
      t += 1 / 60; frame++;
    }
    window.addEventListener("resize", function () { S = fit(canvas, ctx); if (reduce) still(); });
    function still() { trail = []; for (var i = 0; i < 30; i++) { t = 1.1 + i * 0.03; draw(); } }
    if (reduce) still(); else runWhenVisible(canvas, draw);
  }

  /* ---------- service icons ---------- */
  var IC = {
    "ai-llm": '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    "computer-vision": '<path d="M3 8V4h4M17 4h4v4M21 16v4h-4M7 20H3v-4"/><circle cx="12" cy="12" r="3.2"/>',
    "mobile-app": '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
    "web-saas": '<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="M2.5 9h19M6 6.5h.01M8.5 6.5h.01"/>',
    "unity-game": '<path d="M12 2.5l8.5 4.8v9.4L12 21.5l-8.5-4.8V7.3z"/><path d="M12 12l8.5-4.7M12 12v9.5M12 12L3.5 7.3"/>',
    "iot-embedded": '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
    "blockchain-web3": '<rect x="2.5" y="8" width="8" height="8" rx="1.5"/><rect x="13.5" y="8" width="8" height="8" rx="1.5"/><path d="M10.5 12h3"/>',
    "cloud-devops": '<path d="M7 18.5a4.5 4.5 0 01-.6-8.96A6 6 0 0118 9a4.75 4.75 0 01-.5 9.5z"/>',
    "farm-management": '<path d="M12 21V11"/><path d="M12 11c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5zM12 14c0-3.2-2.4-5.2-5.6-5.2 0 3.2 2.4 5.2 5.6 5.2z"/>',
    "tree-service": '<path d="M12 21v-6"/><path d="M12 3l6 8h-3.2l3.7 4.5H5.5L9.2 11H6z"/>',
    "sports-analytics": '<circle cx="12" cy="12" r="9"/><path d="M12 3c2.5 3 2.5 15 0 18M3.5 9h17M3.5 15h17"/>',
    "ai-chatbot": '<path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01"/>',
    "business-automation": '<path d="M4 12a8 8 0 0113.7-5.6L20 9M20 4v5h-5"/><path d="M20 12a8 8 0 01-13.7 5.6L4 15M4 20v-5h5"/>',
    "bubble": '<circle cx="9" cy="10" r="5.5"/><circle cx="17" cy="16" r="3.5"/><circle cx="17.5" cy="6" r="1.5"/>',
    "wordpress": '<circle cx="12" cy="12" r="9"/><path d="M5 8.5l4 11M9.5 8.5l4.2 11.5 3.3-9M8 8.5h3.5M13 8.5h3.5"/>',
    "php-laravel": '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    "custom-business": '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7V5a1.5 1.5 0 011.5-1.5h4A1.5 1.5 0 0115.5 5v2M3 12.5h18"/>',
    "stripe-payment": '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>',
    "raspberry-pi": '<rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="9" r="1.6"/><path d="M13 9h4M13 13h4M7 15h10"/>',
    "trading-bot": '<path d="M3 17l5-5 4 4 8-8"/><path d="M15 8h5v5"/>',
    "telegram-discord": '<path d="M21 4L3 11l6 2.5M21 4l-3 16-9-6.5M21 4L9 13.5V19l3-3.5"/>',
    "chrome-extension": '<path d="M10 4h4v3a2 2 0 104 0V4h2v6h-3a2 2 0 100 4h3v6h-6v-3a2 2 0 10-4 0v3H4v-6h3a2 2 0 100-4H4V4h6z"/>',
    "ai-agent": '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4M9.5 13h.01M14.5 13h.01M9.5 16.5h5"/>',
    "web-scraping": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>',
    "shopify": '<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 016 0V8"/>',
    "dashboard": '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M7 16v-3M12 16V8M17 16v-5"/>',
    "machine-learning": '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8 7.5l2.8 8.3M16 7.5l-2.8 8.3M8.5 6h7"/>',
    "generative-ai": '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 16l5-5 4 4 3-3 6 6"/><path d="M16 5.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    "voice-ai": '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',
    "ios-app": '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 5h3"/>',
    "android-app": '<path d="M6 10a6 6 0 0112 0v7H6z"/><path d="M9 7.5L7.5 5M15 7.5L16.5 5M9.5 11h.01M14.5 11h.01"/>',
    "flutter-app": '<path d="M14 3L5 12l3 3 9-9zM14 11l-4 4 4 4h4l-4-4 4-4z"/>',
    "react-native": '<ellipse cx="12" cy="12" rx="9" ry="3.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)"/>',
    "nextjs-react": '<path d="M4 6h16M4 6v12h16V6M8 10l-2 2 2 2M16 10l2 2-2 2M13 9l-2 6"/>',
    "website-development": '<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="M2.5 9h19M7 13h6M7 16h10"/>',
    "desktop-app": '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    "drupal": '<path d="M12 3c2 3 7 5.5 7 10a7 7 0 01-14 0c0-4.5 5-7 7-10z"/>',
    "python-development": '<path d="M12 3c-4 0-4 2-4 3v2h4v1H6c-2 0-3 1.5-3 4s1 4 3 4h2v-3c0-1.5 1-2.5 2.5-2.5h4c1.5 0 2.5-1 2.5-2.5V6c0-1.5-1.5-3-5.5-3z"/><path d="M12 21c4 0 4-2 4-3v-2h-4v-1h6c2 0 3-1.5 3-4"/>',
    "nodejs-development": '<path d="M12 2.5l8.5 4.8v9.4L12 21.5l-8.5-4.8V7.3z"/><path d="M12 8v8M9 10.5v3"/>',
    "api-integration": '<path d="M8 9l-4 3 4 3M16 9l4 3-4 3"/><circle cx="12" cy="12" r="1.5"/>',
    "embedded-firmware": '<rect x="6" y="6" width="12" height="12" rx="1.5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4M10 10h4v4h-4z"/>',
    "linux-server": '<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01M11 7.5h6M11 16.5h6"/>',
    "ui-ux-design": '<path d="M12 3a9 9 0 100 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 004-4c0-4.5-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
    "qa-testing": '<path d="M9 3h6M10 3v5l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3"/><path d="M7.5 14h9"/>',
    "app-maintenance": '<path d="M14.5 6.5a4 4 0 00-5.4 5.1L3.5 17.2a1.8 1.8 0 002.5 2.5l5.6-5.6a4 4 0 005.1-5.4l-2.6 2.6-2.3-.5-.5-2.3z"/>',
    "mvp": '<path d="M5 19c0-4 1.5-7 7-12 5.5 5 7 8 7 12"/><path d="M12 7v6M9 19l3-3 3 3"/>'
  };
  Array.prototype.forEach.call(document.querySelectorAll("a.row"), function (row) {
    var href = row.getAttribute("href") || "", key = null;
    for (var k in IC) if (href.indexOf(k) === 0) key = k;
    if (!key) key = "web-saas";
    var s = document.createElement("span");
    s.className = "ico"; s.setAttribute("aria-hidden", "true");
    s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + IC[key] + "</svg>";
    row.insertBefore(s, row.firstChild);
  });

  /* ---------- header state + scroll progress ---------- */
  var header = document.querySelector(".site-header");
  var bar = document.createElement("div"); bar.className = "progress"; bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  var steps = document.querySelector(".steps");
  function onScroll() {
    var y = window.scrollY || 0, max = document.documentElement.scrollHeight - innerHeight;
    if (header) header.classList.toggle("scrolled", y > 12);
    bar.style.setProperty("--s", max > 0 ? (y / max).toFixed(4) : 0);
    if (steps) {
      var r = steps.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.25)));
      steps.style.setProperty("--p", p.toFixed(3));
      var lis = steps.children;
      for (var i = 0; i < lis.length; i++) lis[i].classList.toggle("lit", p >= (i / (lis.length - 1)) * 0.98 || p > 0.98);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- reveal: only things that start below the fold ---------- */
  if (!reduce && "IntersectionObserver" in window) {
    var sel = ".section-head, .row, .work > a, .review, .score, .plat, .svc-group h2, .steps li, .proof div, .post, .box, .prose > *, .faq details, .cta .wrap, .form";
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("rv-in"); e.target.classList.remove("rv-wait"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    var groups = new Map();
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
      if (el.getBoundingClientRect().top < innerHeight) return;
      var n = groups.get(el.parentNode) || 0; groups.set(el.parentNode, n + 1);
      el.style.setProperty("--d", Math.min(n % 6, 5) * 70 + "ms");
      el.classList.add("rv-wait"); io.observe(el);
    });
  }

  /* ---------- counters ---------- */
  if (!reduce && "IntersectionObserver" in window) {
    Array.prototype.forEach.call(document.querySelectorAll(".proof dd"), function (dd) {
      var txt = dd.textContent, m = txt.match(/^([\d.]+)(.*)$/);
      if (!m || dd.getBoundingClientRect().top < innerHeight) return;
      var end = parseFloat(m[1]), dec = (m[1].split(".")[1] || "").length, rest = m[2], start = end > 1900 ? 1990 : 0;
      dd.textContent = (start).toFixed(dec) + rest;
      var o = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; o.disconnect();
        var t0 = performance.now();
        (function step(now) {
          var k = Math.min(1, (now - t0) / 1400), e = 1 - Math.pow(1 - k, 3);
          dd.textContent = (start + (end - start) * e).toFixed(dec) + rest;
          if (k < 1) requestAnimationFrame(step); else dd.textContent = txt;
        })(t0);
      });
      o.observe(dd);
    });
  }

  if (fine && !reduce) {
    /* ---------- spotlight + tilt ---------- */
    document.addEventListener("pointermove", function (e) {
      var el = e.target.closest && e.target.closest(".row, .work > a, .box, .post");
      if (!el) return;
      var r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      el.style.setProperty("--mx", x + "px"); el.style.setProperty("--my", y + "px");
      if (el.matches(".work > a")) {
        el.style.setProperty("--ry", ((x / r.width - 0.5) * 8).toFixed(2) + "deg");
        el.style.setProperty("--rx", ((0.5 - y / r.height) * 6).toFixed(2) + "deg");
      }
    }, { passive: true });
    document.addEventListener("pointerout", function (e) {
      var el = e.target.closest && e.target.closest(".work > a");
      if (el && !el.contains(e.relatedTarget)) { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); }
    });
    var heroCard = document.querySelector(".hero .tracker");
    if (heroCard) {
      heroCard.addEventListener("pointermove", function (e) {
        var r = heroCard.getBoundingClientRect();
        heroCard.style.transform = "perspective(1100px) rotateY(" + ((e.clientX - r.left) / r.width - 0.5) * 7 + "deg) rotateX(" + (0.5 - (e.clientY - r.top) / r.height) * 6 + "deg)";
      });
      heroCard.addEventListener("pointerleave", function () { heroCard.style.transform = ""; });
    }
    /* ---------- magnetic buttons ---------- */
    Array.prototype.forEach.call(document.querySelectorAll(".hero .btn, .cta .btn"), function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * 0.22 + "px," + (e.clientY - r.top - r.height / 2) * 0.32 + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });

    /* ---------- vision cursor: locks on to whatever you point at ---------- */
    var vc = document.createElement("div"); vc.className = "vc"; vc.setAttribute("aria-hidden", "true");
    var lab = document.createElement("span"); vc.appendChild(lab); document.body.appendChild(vc);
    var box = { x: 0, y: 0, w: 28, h: 28 }, lockEl = null;
    var KIND = function (el) {
      if (el.matches(".btn, button")) return "button";
      if (el.matches("input, textarea, select")) return "input";
      if (el.matches("summary")) return "question";
      if (el.matches(".row")) return "service";
      if (el.matches(".work > a")) return "project";
      if (el.matches(".logo")) return "zawn";
      return "link";
    };
    document.addEventListener("pointerover", function (e) {
      var el = e.target.closest && e.target.closest("a, button, summary, input, textarea, select");
      if (el && el.closest(".work") && !el.matches(".work > a")) el = el.closest(".work > a") || el;
      if (el === lockEl) return;
      lockEl = el;
      if (el) { lab.textContent = KIND(el) + " " + (0.9 + Math.random() * 0.09).toFixed(2); vc.classList.add("lock"); }
      else vc.classList.remove("lock");
    });
    document.addEventListener("pointerdown", function () { vc.style.filter = "drop-shadow(0 0 12px rgba(255,61,71,1))"; });
    document.addEventListener("pointerup", function () { vc.style.filter = ""; });
    (function follow() {
      var tx, ty, tw, th;
      if (lockEl && document.contains(lockEl)) {
        var r = lockEl.getBoundingClientRect(), p = 6;
        tx = r.left - p; ty = r.top - p; tw = r.width + p * 2; th = r.height + p * 2;
      } else { tw = th = 28; tx = mouse.x - 14; ty = mouse.y - 14; }
      box.x += (tx - box.x) * 0.22; box.y += (ty - box.y) * 0.22;
      box.w += (tw - box.w) * 0.22; box.h += (th - box.h) * 0.22;
      vc.style.transform = "translate(" + box.x.toFixed(1) + "px," + box.y.toFixed(1) + "px)";
      vc.style.width = box.w.toFixed(1) + "px"; vc.style.height = box.h.toFixed(1) + "px";
      vc.classList.toggle("on", mouse.active);
      requestAnimationFrame(follow);
    })();
    // hide over the hero canvas, where the field draws its own lock box
    var fieldEl = document.getElementById("field");
    if (fieldEl) {
      var hero = fieldEl.parentNode;
      hero.addEventListener("pointerenter", function () { vc.style.visibility = "hidden"; });
      hero.addEventListener("pointerleave", function () { vc.style.visibility = ""; });
      hero.addEventListener("pointerover", function (e) { vc.style.visibility = e.target.closest("a, button, .tracker") ? "" : "hidden"; });
    }
  }

  /* ---------- service tabs (homepage) ---------- */
  var tabs = document.querySelector(".svc-tabs");
  if (tabs) {
    var rowsEl = Array.prototype.slice.call(document.querySelectorAll("#svc-rows .row"));
    function pick(cat, animate) {
      Array.prototype.forEach.call(tabs.querySelectorAll("button"), function (b) { b.setAttribute("aria-selected", b.getAttribute("data-cat") === cat ? "true" : "false"); });
      var n = 0;
      rowsEl.forEach(function (r) {
        var show = cat === "all" || r.getAttribute("data-cat") === cat;
        r.hidden = !show; r.classList.remove("pop", "rv-wait");
        if (show && animate && !reduce) { r.style.setProperty("--d", (n++ * 50) + "ms"); void r.offsetWidth; r.classList.add("pop"); }
      });
    }
    tabs.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) pick(b.getAttribute("data-cat"), true); });
    pick("ai", false);
  }

  /* ---------- floating contact ---------- */
  var FL = "https://www.freelancer.com/affiliates/email/11081971/";
  var fab = document.createElement("div"); fab.className = "fab";
  fab.innerHTML = '<div class="fab-panel" id="fab-panel" hidden role="dialog" aria-label="Contact ZAWN Technologies">' +
    '<h3>Let’s talk about your project</h3><p>Pick whatever is easiest for you. We reply within one business day.</p>' +
    '<a class="opt opt-main" href="' + (document.getElementById("talk") ? "#talk" : "contact.html") + '"><span>Get a free estimate<small>Short form, 2 minutes</small></span><span>→</span></a>' +
    '<a class="opt opt-fl" href="' + FL + '" target="_blank" rel="noopener"><span>Hire us on Freelancer<small>Main profile · 4.9 from 356 reviews</small></span><span>↗</span></a>' +
    '<button class="opt" type="button" id="fab-copy"><span>hello@zawntechnologies.com<small id="fab-copy-note">Copy email address</small></span><span>⧉</span></button>' +
    '<div class="fab-row"><a href="https://www.upwork.com/agencies/1387448656505974784/" target="_blank" rel="noopener">Upwork</a><a href="https://www.upwork.com/freelancers/muhammadawaiskaramat" target="_blank" rel="noopener">Upwork profile</a><a href="https://www.fiverr.com/awaisch540" target="_blank" rel="noopener">Fiverr</a></div>' +
    '</div><button class="fab-btn" type="button" aria-expanded="false" aria-controls="fab-panel"><span class="pulse" aria-hidden="true"></span><span class="lbl">Let’s talk</span><span class="sr" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Contact options</span></button>';
  document.body.appendChild(fab);
  var fabBtn = fab.querySelector(".fab-btn"), panel = fab.querySelector(".fab-panel");
  function setFab(open) { panel.hidden = !open; fabBtn.setAttribute("aria-expanded", open ? "true" : "false"); }
  fabBtn.addEventListener("click", function () { setFab(panel.hidden); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setFab(false); });
  document.addEventListener("click", function (e) { if (!fab.contains(e.target)) setFab(false); });
  panel.addEventListener("click", function (e) { if (e.target.closest("a[href^='#']")) setFab(false); });
  document.getElementById("fab-copy").addEventListener("click", function () {
    var note = document.getElementById("fab-copy-note"), addr = "hello@zawntechnologies.com";
    function done(ok) { note.textContent = ok ? "Copied" : addr; }
    try { navigator.clipboard.writeText(addr).then(function () { done(true); }, function () { done(false); }); } catch (err) { done(false); }
  });
  // step aside when a form is on screen
  var forms = document.querySelectorAll("form.form");
  if (forms.length && "IntersectionObserver" in window) {
    var vis = new Set();
    var fo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) vis.add(e.target); else vis.delete(e.target); });
      fab.classList.toggle("near-form", vis.size > 0); if (vis.size) setFab(false);
    });
    Array.prototype.forEach.call(forms, function (f) { fo.observe(f); });
  }

  /* ---------- forms ---------- */
  var live = /zawntechnologies\.com$/i.test(location.hostname);
  Array.prototype.forEach.call(document.querySelectorAll("#contact-form, .js-form"), function (form) {
    var note = form.querySelector("#form-note, .form-note");
    if (!note) return;
    if (/[?&]sent=1/.test(location.search)) { note.textContent = "Message sent. We reply within one business day."; note.hidden = false; if (window.gtag) gtag("event", "generate_lead", { method: "contact_form" }); }
    if (/[?&]error=1/.test(location.search)) { note.textContent = "The message did not send. Check that name, email and project details are filled in, or email us directly."; note.hidden = false; }
    form.addEventListener("submit", function (e) {
      if (!form.checkValidity()) return;
      if (!live) { e.preventDefault(); note.textContent = "This is a preview, so nothing was sent. On zawntechnologies.com this form emails your team."; note.hidden = false; }
    });
  });
})();

/* ---------- app cost calculator ---------- */
(function () {
  var f = document.getElementById("calc-form");
  if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { return "$" + Math.round(n / 500) * 500 >= 1000 ? "$" + (Math.round(n / 500) * 500).toLocaleString("en-US") : "$" + Math.round(n).toLocaleString("en-US"); };
  function calc() {
    var lo = 0, hi = 0, picked = [];
    var p = f.querySelector('input[name="plat"]:checked');
    if (p) { lo += +p.dataset.lo; hi += +p.dataset.hi; picked.push(p.nextElementSibling.textContent); }
    Array.prototype.forEach.call(f.querySelectorAll('input[name="feat"]:checked'), function (c) {
      lo += +c.dataset.lo; hi += +c.dataset.hi; picked.push(c.nextElementSibling.textContent);
    });
    var n = Math.max(0, Math.min(10, parseInt($("c-int").value, 10) || 0));
    lo += n * 30; hi += n * 70;
    var d = parseFloat($("c-design").value) || 1;
    lo = Math.round(lo * d * 1.2 / 10) * 10; hi = Math.round(hi * d * 1.2 / 10) * 10;
    $("c-hours").textContent = lo.toLocaleString("en-US") + " to " + hi.toLocaleString("en-US");
    $("c-cost").textContent = fmt(lo * 50) + " to " + fmt(hi * 50);
    var wlo = Math.max(2, Math.round(lo / 60)), whi = Math.max(3, Math.round(hi / 60));
    $("c-weeks").textContent = wlo + " to " + whi + " weeks";
    var summary = "Cost calculator estimate: " + $("c-hours").textContent + " hours (" + $("c-cost").textContent + "), " + $("c-weeks").textContent +
      ".\nPlatform and features: " + picked.join(", ") + (n ? ". Integrations: " + n : "") + ".\n\nAbout my project: ";
    try { localStorage.setItem("zawn-estimate", summary); } catch (e) {}
  }
  f.addEventListener("input", calc); f.addEventListener("change", calc); calc();
})();
/* prefill contact form from calculator */
(function () {
  var t = document.querySelector("#contact-form textarea");
  if (!t || t.value) return;
  try { var s = localStorage.getItem("zawn-estimate"); if (s) { t.value = s; localStorage.removeItem("zawn-estimate"); } } catch (e) {}
})();
/* ---------- AI chatbot cost calculator ---------- */
(function () {
  var f = document.getElementById("cb-form");
  if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var money = function (n) { var r = n >= 1000 ? Math.round(n / 500) * 500 : Math.round(n / 10) * 10; return "$" + r.toLocaleString("en-US"); };
  var perConv = { answer: [0.005, 0.02], docs: [0.01, 0.04], agent: [0.02, 0.08] };
  var maint = { answer: [2, 4], docs: [4, 8], agent: [8, 16] };
  function calc() {
    var lo = 0, hi = 0, picked = [];
    var t = f.querySelector('input[name="cbtype"]:checked');
    var type = t ? t.value : "docs";
    if (t) { lo += +t.dataset.lo; hi += +t.dataset.hi; picked.push(t.nextElementSibling.textContent.split(":")[0]); }
    var voice = false;
    Array.prototype.forEach.call(f.querySelectorAll('input[name="cbadd"]:checked'), function (c) {
      lo += +c.dataset.lo; hi += +c.dataset.hi; picked.push(c.nextElementSibling.textContent);
      if (c.value === "voice") voice = true;
    });
    var n = Math.max(0, Math.min(10, parseInt($("cb-int").value, 10) || 0));
    lo += n * 25; hi += n * 60;
    var m = parseFloat($("cb-content").value) || 1;
    lo = Math.round(lo * m / 10) * 10; hi = Math.round(hi * m / 10) * 10;
    $("cb-hours").textContent = lo.toLocaleString("en-US") + " to " + hi.toLocaleString("en-US");
    $("cb-cost").textContent = money(lo * 50) + " to " + money(hi * 50);
    var wlo = Math.max(2, Math.round(lo / 60)), whi = Math.max(3, Math.round(hi / 60));
    $("cb-weeks").textContent = wlo + " to " + whi + " weeks";
    var conv = Math.max(0, Math.min(1000000, parseInt($("cb-conv").value, 10) || 0));
    var pc = perConv[type] || perConv.docs;
    var clo = pc[0] + (voice ? 0.03 : 0), chi = pc[1] + (voice ? 0.1 : 0);
    var rlo = 20 + conv * clo, rhi = 100 + conv * chi;
    $("cb-run").textContent = money(rlo) + " to " + money(rhi);
    var mh = maint[type] || maint.docs;
    $("cb-maint").textContent = money(mh[0] * 50) + " to " + money(mh[1] * 50);
    var summary = "AI chatbot calculator estimate: " + $("cb-hours").textContent + " hours (" + $("cb-cost").textContent + "), " + $("cb-weeks").textContent +
      ".\nBot and extras: " + picked.join(", ") + (n ? ". Systems to connect: " + n : "") + ". About " + conv.toLocaleString("en-US") + " conversations a month.\n\nAbout my project: ";
    try { localStorage.setItem("zawn-estimate", summary); } catch (e) {}
  }
  f.addEventListener("input", calc); f.addEventListener("change", calc); calc();
})();

/* analytics: email clicks and calculator use count as lead signals */
(function () {
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (a && window.gtag) gtag("event", "contact_email_click", { link_url: a.getAttribute("href") });
  });
  var used = false;
  ["calc-form", "chat-form"].forEach(function (id) {
    var f = document.getElementById(id);
    if (f) f.addEventListener("change", function () { if (!used && window.gtag) { used = true; gtag("event", "calculator_used", { calculator: id }); } });
  });
})();

/* Anti-spam: record when the form was loaded; send.php rejects instant submits */
(function(){try{var t=Math.floor(Date.now()/1000);document.querySelectorAll('input[name="form_ts"]').forEach(function(i){i.value=String(t);});}catch(e){}})();

/* Floating WhatsApp contact button (site-wide) + lead tracking */
(function () {
  if (document.querySelector(".wa-float")) return;
  var page = (location.pathname.split("/").pop() || "home").replace(".html", "");
  var msg = "Hi ZAWN, I found you on your website (" + page + "). I'd like to discuss a project.";
  var a = document.createElement("a");
  a.className = "wa-float";
  a.href = "https://wa.me/923314459242?text=" + encodeURIComponent(msg);
  a.target = "_blank";
  a.rel = "noopener";
  a.setAttribute("aria-label", "Chat with ZAWN on WhatsApp");
  a.innerHTML = '<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8S23.2 3 16 3zm0 23.4c-2.1 0-4.1-.6-5.9-1.7l-.4-.3-3.8 1.2 1.2-3.7-.3-.4c-1.2-1.8-1.8-3.8-1.8-6 0-5.9 4.9-10.7 11-10.7s11 4.8 11 10.7-4.9 10.9-11 10.9zm6-8c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.8.2-.2.3-.9 1.1-1.1 1.3-.2.2-.4.3-.7.1-.3-.2-1.4-.5-2.7-1.6-1-.9-1.7-2-1.9-2.3-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-1.1-2.6c-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.2 1.4 3.4c.2.2 2.4 3.6 5.8 5 .8.3 1.4.5 1.9.7.8.3 1.5.2 2.1.1.6-.1 2-.8 2.2-1.6.3-.8.3-1.4.2-1.6-.1-.1-.3-.2-.6-.4z"/></svg><span>Chat on WhatsApp</span>';
  a.addEventListener("click", function () {
    if (window.gtag) gtag("event", "whatsapp_click", { page: page });
  });
  var fab = document.querySelector(".fab"), fb = fab && fab.querySelector(".fab-btn");
  if (fb) fab.insertBefore(a, fb); else document.body.appendChild(a);
})();
