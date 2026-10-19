/* ==========================================================================
   लाइव एवं लीला (live.html) — सीधा प्रसारण, प्रीमियर, दिन-वार कार्यक्रम, संग्रह
   बदलाव: assets/js/data.js  →  SITE.live
   ========================================================================== */
(function () {
  'use strict';

  var SITE = window.SITE, EV = SITE.event, L = SITE.live, U = window.SiteUtil;
  var $ = function (id) { return document.getElementById(id); };
  var EMBED = 'https://www.youtube.com/embed/';
  var LIVE_SRC = EMBED + 'live_stream?channel=' + L.channelId;

  var player = $('player'), frame = $('pl'), soon = $('soon'), badge = $('liveBadge'), shield = $('shield'), snd = $('snd');
  var tabs = $('tabs'), sch = $('sch');
  var manual = false, premOn = false, premDone = false, lastKey = '', shT, sndT, stT;

  function mins(hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }

  /* ---- State: before | between | live | after ---- */
  function state() {
    if (L.forceLive) return 'live';
    var n = U.istNow(), m = n.getHours() * 60 + n.getMinutes();
    if (n < new Date(EV.year, EV.month, EV.firstDay)) return 'before';
    if (n > new Date(EV.year, EV.month, EV.lastDay, 23, 59)) return 'after';
    return (m >= mins(L.liveFrom) && m <= mins(L.liveUntil)) ? 'live' : 'between';
  }

  /* ---- Popup (zooms in when live; once per session) ---- */
  var lpp = $('lpp'), lppT;
  var POP = {
    live: ['श्री रामलीला लाइव शुरू हो गई!', 'सीधा प्रसारण अभी चल रहा है'],
    before: ['श्री रामलीला महोत्सव 12 नवम्बर से', 'प्रतिदिन सायं 6:30 बजे से सीधा प्रसारण'],
    between: ['आज सायं 6:30 बजे लाइव', 'प्रसारण शीघ्र प्रारम्भ होगा']
  };
  function popHide(remember) {
    clearTimeout(lppT);
    if (lpp.hidden) return;
    lpp.classList.add('out');
    setTimeout(function () { lpp.hidden = true; lpp.classList.remove('out'); }, 300);
    if (remember) { try { sessionStorage.setItem('lppD', '1'); } catch (e) { } }
  }
  function popShow(mode) {
    var t = POP[mode] || POP.live, seen = false;
    $('lppB').textContent = t[0]; $('lppS').textContent = t[1];
    try { seen = sessionStorage.getItem('lppD'); } catch (e) { }
    if (seen || !lpp.hidden) return;
    lpp.classList.remove('out'); lpp.hidden = false;
    lppT = setTimeout(function () { popHide(false); }, 20000);
  }
  $('lppX').onclick = function () { popHide(true); };
  $('lppGo').onclick = function () { popHide(true); player.scrollIntoView({ behavior: 'smooth', block: 'center' }); };

  /* ---- Views ---- */
  function resetPlayer() {
    premOn = false; snd.hidden = true; shield.hidden = true; clearTimeout(shT); clearTimeout(sndT); clearTimeout(stT);
    player.classList.remove('clean');
  }
  function showSoon(s) {
    resetPlayer();
    frame.removeAttribute('src'); frame.style.display = 'none';
    player.classList.remove('is-live'); player.classList.toggle('is-wait', s !== 'after');
    if (s === 'after') { popHide(false); badge.hidden = true; }
    else { popShow(s); badge.textContent = 'शीघ्र लाइव'; badge.hidden = false; }
    soon.style.display = 'flex';
    var T = {
      between: ['आज का प्रसारण शीघ्र प्रारम्भ होगा', 'श्री रामलीला महोत्सव आज सायं 6:30 बजे से सीधा प्रसारित होगा।'],
      before: ['प्रसारण शीघ्र प्रारम्भ होगा', 'श्री रामलीला महोत्सव 12 नवम्बर, सायं 6:30 बजे से सीधा प्रसारित होगा।'],
      after: ['श्री रामलीला महोत्सव सम्पन्न', 'सीधा प्रसारण सम्पन्न हुआ। सभी संध्याओं की लीला नीचे उपलब्ध है।']
    }[s];
    $('soonTitle').textContent = T[0]; $('soonMsg').textContent = T[1];
    tick();
  }
  function showPlayer(src, live) {
    resetPlayer();
    player.classList.toggle('is-live', !!live); player.classList.remove('is-wait');
    badge.textContent = 'लाइव प्रसारण'; badge.hidden = !live;
    if (live) popShow('live'); else popHide(false);
    soon.style.display = 'none'; frame.style.display = 'block';
    frame.src = src + (src.indexOf('?') > -1 ? '&' : '?') + 'rel=0';
  }

  /* ---- Premiere (recorded day-1 plays muted until the festival begins) ---- */
  function ytCmd(f, a) { try { frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: f, args: a || [] }), '*'); } catch (e) { } }
  function pill(t) { snd.textContent = t; snd.hidden = false; }
  function premGo() {                 /* first tap: play + gentle volume */
    if (!premOn) return;
    ytCmd('playVideo');
    if (!premDone) { premDone = true; ytCmd('unMute'); ytCmd('setVolume', [L.premiere.volume]); snd.hidden = true; clearTimeout(sndT); }
  }
  ['pointerup', 'touchend', 'click', 'keydown'].forEach(function (e) { addEventListener(e, premGo, { capture: true, passive: true }); });
  snd.onclick = function (e) { e.stopPropagation(); premGo(); };
  frame.addEventListener('load', function () {
    if (!premOn) return;
    function hs() { try { frame.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'); } catch (e) { } }
    hs(); setTimeout(hs, 800); setTimeout(hs, 2500); setTimeout(function () { ytCmd('playVideo'); }, 1200);
  });
  addEventListener('message', function (e) {
    if (!premOn || !/youtube/.test(e.origin)) return;
    var m = e.data; try { if (typeof m === 'string') m = JSON.parse(m); } catch (_) { return; }
    var st = null;
    if (m.event === 'onStateChange') st = m.info;
    else if (m.event === 'infoDelivery' && m.info && typeof m.info.playerState === 'number') st = m.info.playerState;
    if (st === null) return;
    clearTimeout(stT);
    if (st === 1) {
      if (!premDone) { pill('🔊 आवाज़ चालू'); clearTimeout(sndT); sndT = setTimeout(function () { if (!premDone) snd.hidden = true; }, 9000); }
      else snd.hidden = true;
    } else if (st === 2 || st === -1 || st === 5 || st === 0) {
      stT = setTimeout(function () {
        if (!premOn) return;
        ytCmd('playVideo');
        stT = setTimeout(function () { if (premOn) pill('▶ प्रीमियर चलाएँ'); }, 1500);
      }, 500);
    }
  });
  function startPremiere() {
    var p = L.premiere, origin = /^https?:/.test(location.protocol) ? '&origin=' + encodeURIComponent(location.origin) : '';
    showPlayer(EMBED + p.id + '?autoplay=1&mute=1&playsinline=1&controls=0&fs=0&disablekb=1&iv_load_policy=3&modestbranding=1&enablejsapi=1&start=' + p.start + origin, false);
    premOn = true; premDone = false;
    player.classList.add('clean');
    shT = setTimeout(function () { if (premOn) shield.hidden = false; }, 2000);
    badge.textContent = 'प्रीमियर'; badge.hidden = false;
  }

  /* ---- Auto mode ---- */
  function auto() {
    var s = state(); lastKey = s;
    if (s === 'before') startPremiere();
    else if (s === 'live') showPlayer(LIVE_SRC, true);
    else showSoon(s);
  }

  /* ---- Countdown inside the "coming soon" panel ---- */
  function nextMs() {
    var n = U.istNow(), t = new Date(n.getFullYear(), n.getMonth(), n.getDate(), 18, 30, 0);
    if (n >= t) t.setDate(t.getDate() + 1);
    var a = new Date(EV.year, EV.month, EV.firstDay, 18, 30), z = new Date(EV.year, EV.month, EV.lastDay, 18, 30);
    if (t < a) t = a;
    if (t > z) return null;
    return t - n;
  }
  function tick() {
    var s = state();
    if (!manual && s !== lastKey) { auto(); return; }
    var c = $('cdn');
    if (soon.style.display === 'none' || s === 'live' || s === 'after') { c.innerHTML = ''; return; }
    var ms = nextMs(); if (ms == null) { c.innerHTML = ''; return; }
    var D = Math.floor(ms / 864e5), H = Math.floor(ms % 864e5 / 36e5), M = Math.floor(ms % 36e5 / 6e4), S = Math.floor(ms % 6e4 / 1e3);
    c.innerHTML = '<div class="cl">प्रसारण प्रारम्भ होने में शेष</div><div class="cb">' +
      [[D, 'दिन'], [H, 'घंटे'], [M, 'मिनट'], [S, 'सेकंड']].map(function (x) { return '<div><b>' + String(x[0]).padStart(2, '0') + '</b><small>' + x[1] + '</small></div>'; }).join('') + '</div>';
  }

  /* ---- Day tabs + that day's schedule ---- */
  function showSch(day) {
    var a = SITE.schedule[day] || [];
    sch.innerHTML = a.length
      ? '<h3>' + day + ' नवम्बर ' + EV.year + ' — प्रसंग एवं प्रस्तुतकर्ता विद्यालय</h3>' + a.map(function (r) {
        return '<div class="it"><div class="pr">' + U.esc(r[0]) + '</div><div class="sc">🏫 ' + U.esc(r[1]) + '</div></div>';
      }).join('') : '';
  }
  function selectDay(btn, day) {
    Array.prototype.forEach.call(tabs.children, function (c) { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
    btn.classList.add('on'); btn.setAttribute('aria-pressed', 'true');
    showSch(day);
    var vid = L.dayVideos[day];
    if (vid) { manual = true; showPlayer(EMBED + vid, false); }
    else if (manual) { manual = false; auto(); }
  }
  for (var day = EV.firstDay; day <= EV.lastDay; day++) {
    (function (dd) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', dd + ' नवम्बर');
      b.innerHTML = '<b>' + dd + '</b><small>नव.</small>';
      b.onclick = function () { selectDay(b, dd); };
      tabs.appendChild(b);
    })(day);
  }
  (function () {
    var fd = U.festivalDay() || EV.firstDay, b = tabs.children[fd - EV.firstDay];
    b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); showSch(fd);
  })();
  function pulseTab() {
    var fd = U.festivalDay();
    Array.prototype.forEach.call(tabs.children, function (c) { c.classList.remove('lv'); });
    if (fd && state() === 'live') tabs.children[fd - EV.firstDay].classList.add('lv');
  }

  /* ---- Previous recordings ---- */
  $('prev').innerHTML = L.previous.map(function (v) {
    return '<a class="vc" href="https://www.youtube.com/watch?v=' + v[0] + '" target="_blank" rel="noopener">' +
      '<img loading="lazy" width="480" height="360" src="https://i.ytimg.com/vi/' + v[0] + '/hqdefault.jpg" alt="">' +
      '<span class="lvb">▶ रिकॉर्डेड</span><p>' + v[1] + ' ' + L.previousSuffix + '</p></a>';
  }).join('');

  /* ---- Go ---- */
  auto();
  setInterval(tick, 1000);
  pulseTab(); setInterval(pulseTab, 30000);
})();
