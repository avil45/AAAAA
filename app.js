/* ==========================================================================
   श्री रामलीला महोत्सव — बस्ती · साझा इंटरैक्शन (सभी पृष्ठों पर)
   डेटा के लिए assets/js/data.js देखें।
   ========================================================================== */
(function () {
  'use strict';

  var d = document, root = d.documentElement;
  var SITE = window.SITE || {};
  var EV = SITE.event || {};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  var START = new Date(EV.start), END = new Date(EV.end);
  var WEEKDAYS = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  var ORDINAL = ['', 'पहला', 'दूसरा', 'तीसरा', 'चौथा', 'पाँचवाँ'];

  /* ---- भारतीय मानक समय में आज की तारीख (महोत्सव के दिनों में 12–21, वरना 0) ---- */
  function istNow() { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })); }
  function festivalDay() {
    var n = istNow();
    return (n.getFullYear() === EV.year && n.getMonth() === EV.month && n.getDate() >= EV.firstDay && n.getDate() <= EV.lastDay) ? n.getDate() : 0;
  }
  function esc(x) { return String(x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  window.SiteUtil = { istNow: istNow, festivalDay: festivalDay, esc: esc, weekday: function (day) { return WEEKDAYS[new Date(EV.year, EV.month, day).getDay()]; } };

  /* ---- Preloader ---- */
  var pre = $('.preloader');
  function hidePre() { if (pre) pre.classList.add('done'); }
  window.addEventListener('load', function () { setTimeout(hidePre, reduce ? 0 : 400); });
  setTimeout(hidePre, 2500);

  /* ---- Header, scroll progress ---- */
  var header = $('.site-header'), bar = $('.progress i'), ticking = false;
  function onScroll() {
    var y = window.scrollY || root.scrollTop;
    if (header) header.classList.toggle('scrolled', y > 20);
    if (bar) { var h = root.scrollHeight - window.innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(y / h, 1) : 0) + ')'; }
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---- Mobile menu ---- */
  var toggle = $('.menu-toggle');
  function setMenu(open) {
    d.body.classList.toggle('menu-open', open);
    if (toggle) { toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'मेन्यू बंद करें' : 'मेन्यू खोलें'); }
  }
  if (toggle) toggle.addEventListener('click', function () { setMenu(!d.body.classList.contains('menu-open')); });
  $$('.nav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  window.matchMedia('(min-width: 980px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });

  /* ---- Lightbox ---- */
  var lb = $('.lightbox'), lbImg = lb && $('img', lb);
  function closeLightbox() { if (lb) lb.classList.remove('open'); }
  $$('[data-zoom]').forEach(function (el) {
    el.addEventListener('click', function () {
      var img = el.tagName === 'IMG' ? el : $('img', el);
      if (!lb || !img) return;
      lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt; lb.classList.add('open');
    });
  });
  if (lb) lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'BUTTON') closeLightbox(); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); closeLightbox(); } });

  /* ---- Reveal on scroll ---- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
    setTimeout(function () { $$('.reveal:not(.is-in)').forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add('is-in'); }); }, 1200);
  } else reveals.forEach(function (el) { el.classList.add('is-in'); });

  /* ---- Number counters ---- */
  function runCount(el) {
    var to = +el.getAttribute('data-count'), t0 = null, dur = 1500;
    if (reduce) { el.textContent = to; return; }
    (function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
    }, { threshold: .6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---- Countdown ---- */
  $$('[data-countdown]').forEach(function (box) {
    var els = { d: $('[data-u=d]', box), h: $('[data-u=h]', box), m: $('[data-u=m]', box), s: $('[data-u=s]', box) };
    var msg = $('.countdown-msg', box), label = $('.countdown-label span', box);
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function tick() {
      var now = new Date(), diff = START - now;
      box.classList.remove('is-live', 'is-over');
      if (now > END) {
        box.classList.add('is-over');
        msg.textContent = '॥ महोत्सव सम्पन्न हुआ — आप सभी का हृदय से आभार ॥';
        if (label) label.textContent = 'श्री रामलीला महोत्सव 2026';
        return;
      }
      if (diff <= 0) {
        box.classList.add('is-live');
        msg.textContent = '॥ महोत्सव चल रहा है — प्रतिदिन सायं 6:30 बजे से पधारें ॥';
        if (label) label.textContent = 'श्री रामलीला महोत्सव';
        return;
      }
      msg.textContent = '';
      var s = Math.floor(diff / 1000);
      els.d.textContent = Math.floor(s / 86400);
      els.h.textContent = pad(Math.floor(s % 86400 / 3600));
      els.m.textContent = pad(Math.floor(s % 3600 / 60));
      els.s.textContent = pad(s % 60);
    }
    tick(); setInterval(tick, 1000);
  });

  /* ---- Day strip: mark today / past ---- */
  var fd = festivalDay(), nowMs = Date.now();
  $$('.day[data-day]').forEach(function (el) {
    var day = +el.getAttribute('data-day');
    if (fd === day) { el.classList.add('is-today'); var em = $('em', el); if (em) em.textContent = 'आज'; }
    else if (fd > day || nowMs > END.getTime()) el.classList.add('is-past');
  });

  /* ---- Schedule rendering (mahotsav page + live page helpers) ---- */
  function panelHTML(day, isToday) {
    var list = (SITE.schedule || {})[day] || [];
    return '<div class="sp-head"><div class="sp-d"><b>' + day + '</b><small>नवम्बर</small></div>' +
      '<div class="sp-t"><h3>' + day + ' नवम्बर ' + EV.year + ' · ' + WEEKDAYS[new Date(EV.year, EV.month, day).getDay()] + '</h3>' +
      '<p>' + list.length + ' प्रसंग · सायं 6:30 बजे से</p></div>' +
      (isToday ? '<span class="sp-badge">आज की लीला</span>' : '') + '</div>' +
      '<ol class="sp-list">' + list.map(function (r, i) {
        return '<li class="sp-item"><span class="sp-n">' + (ORDINAL[i + 1] || (i + 1) + 'वाँ') + ' प्रसंग</span><h4>' + esc(r[0]) + '</h4>' +
          '<p class="sp-s"><span aria-hidden="true">🏫</span><span>' + esc(r[1]) + '</span></p></li>';
      }).join('') + '</ol>';
  }

  var schedBox = $('[data-schedule]');
  if (schedBox) {
    var chips = $('[data-sched-chips]'), ids = [];
    for (var day = EV.firstDay; day <= EV.lastDay; day++) {
      var panel = d.createElement('section');
      panel.className = 'day-panel' + (fd === day ? ' is-today' : '');
      panel.id = 'din-' + day; panel.setAttribute('aria-label', day + ' नवम्बर का कार्यक्रम');
      panel.innerHTML = panelHTML(day, fd === day);
      schedBox.appendChild(panel); ids.push(day);
      if (chips) {
        var a = d.createElement('a');
        a.href = '#din-' + day; a.textContent = day; a.setAttribute('aria-label', day + ' नवम्बर');
        if (fd === day) a.className = 'is-today';
        chips.appendChild(a);
      }
    }
    /* scroll-spy for the chips */
    if (chips && 'IntersectionObserver' in window) {
      var links = $$('a', chips);
      var spy = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var id = e.target.id.replace('din-', '');
          links.forEach(function (l) {
            var on = l.textContent === id; l.classList.toggle('on', on);
            if (on && chips.scrollWidth > chips.clientWidth) chips.scrollTo({ left: l.offsetLeft - chips.clientWidth / 2 + l.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
          });
        });
      }, { rootMargin: '-35% 0px -55% 0px' });
      $$('.day-panel', schedBox).forEach(function (p) { spy.observe(p); });
    }
    if (fd && location.hash === '#aaj') { var t = $('#din-' + fd); if (t) t.scrollIntoView(); }
  }

  /* ---- "आज की लीला / अगली लीला" card on the home page ---- */
  var nextup = $('[data-nextup]');
  if (nextup) {
    var target = 0, mode = '';
    if (nowMs > END.getTime()) target = 0;
    else if (fd) { target = fd; mode = 'आज की लीला'; }
    else { target = EV.firstDay; mode = 'पहली संध्या'; }
    var items = (SITE.schedule || {})[target];
    if (target && items) {
      nextup.innerHTML = '<div class="nextup-top"><b>' + target + ' नवम्बर · ' + WEEKDAYS[new Date(EV.year, EV.month, target).getDay()] + '</b><span class="badge">' + mode + '</span></div>' +
        '<ol>' + items.map(function (r) { return '<li><b>' + esc(r[0]) + '</b><span>🏫 ' + esc(r[1]) + '</span></li>'; }).join('') + '</ol>' +
        '<a class="btn btn-gold btn-sm" href="mahotsav.html#din-' + target + '">पूरा कार्यक्रम देखें</a>';
      nextup.hidden = false;
    }
  }

  /* ---- Toast + copy ---- */
  var toast = $('.toast'), tt;
  function showToast(t) {
    if (!toast) return;
    toast.textContent = t; toast.classList.add('show');
    clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }
  window.SiteUtil.toast = showToast;
  function fallbackCopy(v) {
    var ta = d.createElement('textarea'); ta.value = v; ta.style.cssText = 'position:fixed;opacity:0';
    d.body.appendChild(ta); ta.select();
    var ok = false; try { ok = d.execCommand('copy'); } catch (e) { }
    d.body.removeChild(ta); return ok;
  }
  $$('[data-copy]').forEach(function (b) {
    var orig = b.innerHTML;
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-copy');
      function done(ok) {
        if (!ok) { window.prompt('कॉपी करने के लिए टेक्स्ट चुनें:', v); return; }
        b.classList.add('ok'); b.textContent = 'कॉपी हुआ ✓'; showToast('कॉपी हो गया: ' + v);
        setTimeout(function () { b.classList.remove('ok'); b.innerHTML = orig; }, 1800);
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(v).then(function () { done(true); }, function () { done(fallbackCopy(v)); });
      else done(fallbackCopy(v));
    });
  });

  /* ---- Share invitation ---- */
  $$('[data-share]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      var url = ''; try { url = new URL('mahotsav.html', location.href).href; } catch (x) { }
      var web = /^https?:/.test(url);
      var text = '🙏 जय श्री राम 🙏\nसनातन धर्म संस्था, बस्ती द्वारा आयोजित श्री रामलीला महोत्सव\n📅 12–21 नवम्बर 2026\n📍 ' + EV.venue + '\n🕡 सायं 6:30 से रात्रि 10:30 बजे तक\nसपरिवार पधारें।';
      if (navigator.share && web) navigator.share({ title: EV.shareTitle, text: text, url: url }).catch(function () { });
      else window.open('https://wa.me/?text=' + encodeURIComponent(text + (web ? '\n' + url : '')), '_blank', 'noopener');
    });
  });

  /* ---- Add to calendar (.ics — दस दिन, रोज़ 18:30–22:30 IST) ---- */
  $$('[data-ics]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      function z(n) { return n < 10 ? '0' + n : '' + n; }
      var ym = EV.year + z(EV.month + 1), count = EV.lastDay - EV.firstDay + 1;
      var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
      var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sanatan Dharm Sanstha Basti//Ramleela ' + EV.year + '//HI', 'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT', 'UID:ramleela-basti-' + EV.year + '@sanatandharmsanstha', 'DTSTAMP:' + stamp,
        'DTSTART;TZID=Asia/Kolkata:' + ym + z(EV.firstDay) + 'T183000', 'DTEND;TZID=Asia/Kolkata:' + ym + z(EV.firstDay) + 'T223000',
        'RRULE:FREQ=DAILY;COUNT=' + count,
        'SUMMARY:' + EV.shareTitle, 'LOCATION:' + EV.venue,
        'DESCRIPTION:सनातन धर्म संस्था\\, बस्ती द्वारा आयोजित श्री रामलीला महोत्सव। सपरिवार पधारें।',
        'BEGIN:VALARM', 'TRIGGER:-PT90M', 'ACTION:DISPLAY', 'DESCRIPTION:श्री रामलीला महोत्सव आज सायं 6:30 बजे', 'END:VALARM',
        'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' }), a = d.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'shri-ramleela-mahotsav-' + EV.year + '.ics';
      d.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      showToast('कैलेंडर फ़ाइल डाउनलोड हो रही है');
    });
  });

  /* ---- Purpose-card spotlight (pointer devices) ---- */
  $$('.purpose-card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---- Poster tilt (mouse only) ---- */
  var tilt = $('[data-tilt]');
  if (tilt && !reduce && window.matchMedia('(hover:hover)').matches) {
    var zone = tilt.parentElement;
    zone.addEventListener('mousemove', function (e) {
      var r = zone.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      tilt.style.transform = 'perspective(900px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 8) + 'deg)';
    });
    zone.addEventListener('mouseleave', function () { tilt.style.transform = ''; });
  }

  /* ---- Embers canvas (lightweight, pauses off-screen) ---- */
  $$('canvas[data-embers]').forEach(function (cv) {
    if (reduce) return;
    var ctx = cv.getContext('2d'), W, H, ps = [], run = true, parent = cv.parentElement;
    function spawn(init) {
      return { x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: Math.random() * 2 + .6, v: Math.random() * .45 + .16,
        dx: (Math.random() - .5) * .3, ph: Math.random() * 6.28, a: Math.random() * .55 + .25, hue: Math.random() > .35 ? 38 : 24 };
    }
    function size() {
      var phone = innerWidth < 820, dpr = Math.min(devicePixelRatio || 1, phone ? 1.5 : 2);
      W = parent.clientWidth; H = parent.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(W * H / (phone ? 30000 : 15000), phone ? 22 : 56)); ps = [];
      for (var i = 0; i < n; i++) ps.push(spawn(true));
    }
    function frame() {
      if (!run) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]; p.y -= p.v; p.ph += .02; p.x += p.dx + Math.sin(p.ph) * .25;
        if (p.y < -12) ps[i] = spawn(false);
        var fade = Math.min(1, Math.max(0, p.y / (H * .35))) * p.a;
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, 'hsla(' + p.hue + ',95%,68%,' + fade + ')'); g.addColorStop(1, 'hsla(' + p.hue + ',95%,55%,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, 6.283); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    size(); var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 150); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var vis = es[0].isIntersecting;
        if (vis && !run) { run = true; frame(); } else if (!vis) run = false;
      }).observe(parent);
    }
    frame();
  });
})();
