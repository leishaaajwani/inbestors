/* InBestor platform: six digital games, a hybrid mode with the InBestor console (Web Serial),
   the board game rules and an About page. */
(function () {
  'use strict';

  // ---------- game data ----------
  var SECTORS = [
    { id: 'tech', name: 'Technology', color: '#2F5BEA', ink: '#fff', base: 500 },
    { id: 'housing', name: 'Housing', color: '#C8553D', ink: '#fff', base: 400 },
    { id: 'energy', name: 'Energy', color: '#F2B705', ink: '#1C2430', base: 300 },
    { id: 'transport', name: 'Transport', color: '#1A9E8F', ink: '#fff', base: 250 },
    { id: 'fashion', name: 'Fashion', color: '#D6408F', ink: '#fff', base: 200 },
    { id: 'food', name: 'Food', color: '#4E9A3A', ink: '#fff', base: 150 }
  ];
  var EVENTS = [
    { s: 'tech', name: 'AI Breakthrough', pct: 25, why: 'A new invention makes tech companies worth a lot more.' },
    { s: 'tech', name: 'Chip Shortage', pct: -15, why: 'Factories cannot get enough computer chips, so fewer gadgets get made.' },
    { s: 'tech', name: 'Data Breach', pct: -10, why: 'Hackers steal data and people stop trusting tech firms for a while.' },
    { s: 'housing', name: 'Interest Rate Cut', pct: 15, why: 'Loans get cheaper, so more families can afford to buy a home.' },
    { s: 'housing', name: 'New Metro Line', pct: 10, why: 'Homes near the new stations suddenly become popular.' },
    { s: 'housing', name: 'Housing Bubble Bursts', pct: -25, why: 'Prices rose too fast, and then they fell back down.' },
    { s: 'energy', name: 'Oil Price Spike', pct: 20, why: 'Oil costs more, so energy companies earn more.' },
    { s: 'energy', name: 'Solar Subsidy', pct: 15, why: 'The government helps people pay for solar panels.' },
    { s: 'energy', name: 'Pipeline Shutdown', pct: -20, why: 'A broken pipeline stops energy from getting through.' },
    { s: 'transport', name: 'Electric Vehicle Boom', pct: 20, why: 'Suddenly everyone wants an electric car.' },
    { s: 'transport', name: 'Fuel Prices Rise', pct: -15, why: 'Running buses, trucks and planes gets more expensive.' },
    { s: 'transport', name: 'Port Strike', pct: -10, why: 'Ships cannot unload, so deliveries get stuck.' },
    { s: 'fashion', name: 'Viral Trend', pct: 20, why: 'One style goes viral and everyone wants it.' },
    { s: 'fashion', name: 'Supply Chain Delay', pct: -15, why: 'New clothes arrive late, so shops sell less.' },
    { s: 'fashion', name: 'Fast Fashion Backlash', pct: -10, why: 'Shoppers worry about waste and buy fewer clothes.' },
    { s: 'food', name: 'Health Food Trend', pct: 15, why: 'More people want healthy snacks and fresh food.' },
    { s: 'food', name: 'Export Deal', pct: 10, why: 'A new trade deal lets farmers sell abroad.' },
    { s: 'food', name: 'Drought', pct: -20, why: 'No rain means smaller harvests.' }
  ];
  var START_CASH = 2000;
  var ROUNDS = 10;
  var PLAYER_COLORS = ['#2F5BEA', '#D6408F', '#1A9E8F', '#C8553D'];
  var SAM_COLOR = '#4D5A66';

  function sector(id) { for (var i = 0; i < SECTORS.length; i++) if (SECTORS[i].id === id) return SECTORS[i]; return null; }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function signed(n) { return (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n)); }
  function pctText(p) { return (p > 0 ? '+' : p < 0 ? '−' : '') + Math.abs(p) + '%'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function basePrices() { var p = {}; SECTORS.forEach(function (s) { p[s.id] = s.base; }); return p; }
  function emptyShares() { var p = {}; SECTORS.forEach(function (s) { p[s.id] = 0; }); return p; }
  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }

  var app = document.getElementById('app');
  var S = { screen: 'home' };

  // ---------- small helpers ----------
  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function confetti() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var box = document.createElement('div'); box.className = 'confetti';
    var cols = SECTORS.map(function (s) { return s.color; }).concat(['#F2C200']);
    for (var i = 0; i < 90; i++) {
      var p = document.createElement('i');
      p.style.left = (Math.random() * 100) + 'vw';
      p.style.background = cols[i % cols.length];
      p.style.animationDuration = (1.8 + Math.random() * 1.8) + 's';
      p.style.animationDelay = (Math.random() * 0.6) + 's';
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 4500);
  }
  var PAGES = ['rules', 'about'];
  function go(screen) {
    S.screen = screen;
    var h = PAGES.indexOf(screen) >= 0 ? '#' + screen : '';
    if (location.hash !== h) history.replaceState(null, '', h || location.pathname);
    render(); window.scrollTo(0, 0);
  }
  function backBar(title, eyebrow, extra) {
    return '<div class="bar"><div><p class="eyebrow">' + eyebrow + '</p><h1>' + title + '</h1></div><div class="row">' + (extra || '') + '<button class="btn ghost" data-action="home">All games</button></div></div>';
  }
  function progressBar(total, results, now) {
    var out = '<div class="progress" aria-hidden="true">';
    for (var i = 0; i < total; i++) out += '<i class="' + (i < results.length ? (results[i] ? 'ok' : 'no') : i === now ? 'now' : '') + '"></i>';
    return out + '</div>';
  }

  // ---------- console link (Web Serial) ----------
  var link = { port: null, writer: null, on: false, ledTimer: null };
  function setConsoleUi() {
    var b = document.getElementById('consoleBtn');
    b.classList.toggle('on', link.on);
    document.getElementById('consoleLabel').textContent = link.on ? 'Console connected' : 'Connect console';
  }
  async function connectConsole() {
    if (link.on) { toast('The console is already connected.'); return; }
    if (!('serial' in navigator)) {
      toast('To use the console, open this site in Chrome or Edge on a laptop. Everything else works without it.');
      return;
    }
    try {
      link.port = await navigator.serial.requestPort();
      await link.port.open({ baudRate: 115200 });
      var enc = new TextEncoderStream();
      enc.readable.pipeTo(link.port.writable);
      link.writer = enc.writable.getWriter();
      link.on = true; setConsoleUi(); toast('Console connected. Try the joystick.');
      led('B', 800);
      readLoop();
    } catch (err) {
      if (err && err.name === 'NotFoundError') return;
      toast('Could not connect. Check the USB cable and close the Arduino Serial Monitor.');
    }
  }
  async function readLoop() {
    var dec = new TextDecoderStream();
    link.port.readable.pipeTo(dec.writable).catch(function () {});
    var reader = dec.readable.getReader();
    var buf = '';
    try {
      while (true) {
        var r = await reader.read();
        if (r.done) break;
        buf += r.value;
        var lines = buf.split('\n'); buf = lines.pop();
        lines.forEach(function (l) { l = l.trim(); if (l) fromConsole(l); });
      }
    } catch (e) { /* unplugged */ }
    link.on = false; link.writer = null; setConsoleUi(); toast('Console disconnected.');
  }
  function led(c, ms) {
    if (!link.writer) return;
    link.writer.write('LED:' + c + '\n').catch(function () {});
    clearTimeout(link.ledTimer);
    if (ms) link.ledTimer = setTimeout(function () { if (link.writer) link.writer.write('LED:OFF\n').catch(function () {}); }, ms);
  }
  function fromConsole(line) {
    if (line.indexOf('TAG:') === 0) { input('TAG', line.slice(4)); return; }
    if (['L', 'R', 'U', 'D', 'OK', 'EVENT', 'CLICK'].indexOf(line) >= 0) input(line);
  }

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t.closest && t.closest('input, textarea, select')) return;
    var onButton = t.closest && t.closest('button, a');
    var map = { ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D', Enter: 'OK', ' ': 'EVENT' };
    var cmd = map[e.key];
    if (!cmd) return;
    if (onButton && (e.key === 'Enter' || e.key === ' ')) return;
    if (['md', 'boc', 'sort', 'eggs', 'wild', 'grow', 'helper'].indexOf(S.screen) < 0) return;
    e.preventDefault();
    input(cmd);
  });

  function input(cmd, arg) {
    if (cmd === 'TAG') { onTag(arg); return; }
    var handlers = { md: mdInput, boc: bocInput, sort: sortInput, eggs: eggsInput, wild: wildInput, grow: growInput, helper: helperInput };
    if (handlers[S.screen]) handlers[S.screen](cmd);
  }
  function onTag(uid) {
    if (S.screen === 'helper') { helperTag(uid); return; }
    led('B', 700);
    toast('Tag read. Tags pick the player in the Board Game Helper.');
  }

  // ================= HOME =================
  var DIGITAL = [
    { id: 'market', cls: 'c1', title: 'Market Day', badge: '1 to 4 players, 10 min', text: 'Build a portfolio across six sectors and survive ten pieces of market news. Play alone against Steady Sam or pass the laptop around.', learn: 'Diversification', bars: ['#2F5BEA', 70, '#C8553D', 45, '#F2B705', 85, '#1A9E8F', 60] },
    { id: 'boc', cls: 'c2', title: 'Boom or Crash?', badge: '1 player, 2 min', text: 'Read a headline and guess if the sector goes up or down.', learn: 'How news moves prices', bars: ['#D6408F', 40, '#4E9A3A', 80, '#D6408F', 55, '#2F5BEA', 30] },
    { id: 'sort', cls: 'c3', title: 'Sector Sort', badge: '1 player, 2 min', text: 'A headline pops up. Which part of the economy does it hit?', learn: 'The six sectors', bars: ['#1A9E8F', 60, '#C8553D', 35, '#2F5BEA', 75, '#4E9A3A', 50] },
    { id: 'eggs', cls: 'c4', title: 'Spread Your Eggs', badge: '1 player, 1 min', text: 'Put 12 eggs in six baskets, then send the storm. Two baskets crack and one turns golden.', learn: 'Why spreading out is safer', bars: ['#F2B705', 50, '#F2B705', 50, '#F2B705', 50, '#F2B705', 50] },
    { id: 'wild', cls: 'c5', title: 'Steady or Wild?', badge: '1 player, 2 min', text: 'Pick a calm investment, a wild one, or half of each, and watch five days of ups and downs.', learn: 'Risk and volatility', bars: ['#1A9E8F', 45, '#D6408F', 90, '#1A9E8F', 50, '#D6408F', 20] },
    { id: 'grow', cls: 'c6', title: 'Grow Your Coins', badge: '1 player, 1 min', text: 'Keep 100 coins in a piggy bank or invest them. Slide the years and see what happens.', learn: 'Compound growth', bars: ['#4E9A3A', 20, '#4E9A3A', 35, '#4E9A3A', 55, '#4E9A3A', 85] }
  ];
  function viewHome() {
    var ticks = [['tech', 625, 25], ['housing', 300, -25], ['energy', 360, 20], ['food', 120, -20]];
    return '' +
      '<section class="hero">' +
        '<div>' +
          '<p class="eyebrow">A game about money for curious families</p>' +
          '<h1>Learn to invest <em>by playing.</em></h1>' +
          '<p>InBestor is a board game, a hand-built game console and a set of digital games. Spread your coins across six parts of the economy, then watch the news move the market. No sign-up and no real money.</p>' +
          '<div class="row" style="margin-top:18px"><button class="btn" data-action="scroll" data-to="digital">Play now</button><button class="btn ghost" data-action="about">What is InBestor?</button></div>' +
        '</div>' +
        '<div class="card ticker" aria-label="Example market moves">' +
          '<div class="eyebrow">Today on the InBestor market</div>' +
          ticks.map(function (t) {
            var s = sector(t[0]);
            return '<div class="tick"><span class="sw" style="background:' + s.color + '"></span>' + s.name +
              '<span class="val num ' + (t[2] > 0 ? 'up' : 'down') + '">' + fmt(t[1]) + ' (' + pctText(t[2]) + ')</span></div>';
          }).join('') +
        '</div>' +
      '</section>' +

      '<section class="modes" aria-labelledby="modesTitle">' +
        '<h2 id="modesTitle" class="sec-title">Three ways to play</h2>' +
        '<div class="mode-grid">' +
          modeCard('digital', 'm1', 'Digital only', 'Any phone, tablet or laptop', 'Six quick games you can play right here with a mouse, a finger or the keyboard.') +
          modeCard('hybrid', 'm2', 'Hybrid', 'Console + laptop', 'Plug in the InBestor console. The joystick, buttons, card reader and light control the games on screen.') +
          modeCard('board', 'm3', 'Board game only', 'Around a table', 'The physical InBestor board, cards and net worth sheets. No screen needed.') +
        '</div>' +
      '</section>' +

      '<section id="digital" class="zone">' +
        '<div class="zone-head"><span class="zone-tag m1">Digital only</span><h2 class="sec-title">Six games, each one teaches one idea</h2><p class="muted">Every game takes a few minutes and explains itself as you play.</p></div>' +
        '<div class="games">' + DIGITAL.map(gameCard).join('') + '</div>' +
      '</section>' +

      '<section id="hybrid" class="zone">' +
        '<div class="zone-head"><span class="zone-tag m2">Hybrid</span><h2 class="sec-title">The console talks to the laptop</h2><p class="muted">Connect the console with a USB cable, click <b>Connect console</b> at the top, and the physical controls take over. Works in Chrome or Edge on a laptop.</p></div>' +
        '<ol class="flow" aria-label="How the hybrid mode works">' +
          '<li><b>Tap</b>your RFID tag so the game knows who you are</li>' +
          '<li><b>Choose</b>a sector with the joystick</li>' +
          '<li><b>Confirm</b>with the yellow button</li>' +
          '<li><b>Event</b>button sends the move to the laptop</li>' +
          '<li><b>Light</b>turns green for a boom, red for a crash</li>' +
        '</ol>' +
        '<div class="hy-grid">' +
          hybridCard('helper', 'Board Game Helper', 'Board + console + laptop', 'The main hybrid game. Play on the real board while the laptop runs the market and keeps the log.', ['Tag: joins the game and marks whose turn it is', 'Joystick: picks a sector', 'Confirm then Event: draws a market event for that sector', 'Light: green or red for everyone at the table']) +
          hybridCard('market', 'Market Day', 'Console as a controller', 'The full digital game, played with the console instead of the mouse.', ['Joystick left and right: move between sectors', 'Joystick up and down: buy or sell one share', 'Confirm: end your turn', 'Event: reveal the news']) +
          hybridCard('boc', 'Boom or Crash?', 'Console as a controller', 'The quickest way to try the console.', ['Joystick up: Boom', 'Joystick down: Crash', 'Confirm: next headline', 'Light: green if you were right, red if not']) +
        '</div>' +
      '</section>' +

      '<section id="board" class="zone">' +
        '<div class="zone-head"><span class="zone-tag m3">Board game only</span><h2 class="sec-title">Play around a table, no screen needed</h2></div>' +
        '<div class="board-strip card">' +
          '<ol class="quick">' +
            '<li>Put the six sector cards on their zones and shuffle the 18 event cards face down.</li>' +
            '<li>Everyone writes 2,000 coins on their net worth sheet.</li>' +
            '<li>On your turn, buy, sell or hold. When everyone has played, flip one event card.</li>' +
            '<li>After ten event cards, the biggest net worth wins.</li>' +
          '</ol>' +
          '<button class="btn big" data-action="rules">Read the full rules</button>' +
        '</div>' +
      '</section>';
  }
  function modeCard(to, cls, title, sub, text) {
    return '<button class="card mode ' + cls + '" data-action="scroll" data-to="' + to + '"><span class="eyebrow">' + sub + '</span><h3>' + title + '</h3><p>' + text + '</p><span class="go">See how &darr;</span></button>';
  }
  function gameCard(g) {
    var art = '';
    for (var i = 0; i < g.bars.length; i += 2) art += '<i style="background:' + g.bars[i] + ';height:' + g.bars[i + 1] + '%"></i>';
    return '<button class="card game ' + g.cls + '" data-action="' + g.id + '">' +
      '<span class="badge">' + g.badge + '</span><div class="art" aria-hidden="true">' + art + '</div>' +
      '<h3>' + g.title + '</h3><p>' + g.text + '</p><p class="learn">Teaches: <b>' + g.learn + '</b></p><span class="go">Play &rarr;</span></button>';
  }
  function hybridCard(action, title, sub, text, list) {
    return '<div class="card hy"><span class="eyebrow">' + sub + '</span><h3>' + title + '</h3><p>' + text + '</p><ul>' + list.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>' +
      '<button class="btn blue" data-action="' + action + '">Open ' + title + '</button></div>';
  }

  // ================= MARKET DAY =================
  function mdNewSetup() { S.setup = S.setup || { count: 1, names: ['', '', '', ''], sam: true }; }
  function viewSetup() {
    var st = S.setup;
    var choice = [1, 2, 3, 4].map(function (n) {
      return '<button class="' + (st.count === n ? 'on' : '') + '" data-action="count" data-n="' + n + '" aria-pressed="' + (st.count === n) + '">' + n + '</button>';
    }).join('');
    var names = '';
    for (var i = 0; i < st.count; i++) {
      names += '<label for="pname' + i + '">Player ' + (i + 1) + '<input id="pname' + i + '" data-name="' + i + '" maxlength="14" placeholder="Player ' + (i + 1) + '" value="' + esc(st.names[i]) + '"></label>';
    }
    return '<div class="card setup">' +
      '<div><p class="eyebrow">Market Day</p><h1>Who is playing?</h1></div>' +
      '<p class="muted" style="margin:0">Everyone starts with 2,000 coins. Take turns buying shares on the same screen, then reveal the news together. After ten news cards, the biggest net worth wins.</p>' +
      '<div class="choice" role="group" aria-label="Number of players">' + choice + '</div>' +
      '<div class="names">' + names + '</div>' +
      '<label class="toggle" for="sam"><input type="checkbox" id="sam" ' + (st.sam ? 'checked' : '') + '><span><b>Add Steady Sam</b><br><span class="muted">A computer player who buys a little of every sector and never changes his mind. Can you beat him?</span></span></label>' +
      '<div class="row"><button class="btn big" data-action="md-start">Start the market</button><button class="btn ghost" data-action="home">Back</button></div>' +
    '</div>';
  }
  function mdStart() {
    var st = S.setup, players = [];
    for (var i = 0; i < st.count; i++) {
      var n = (st.names[i] || '').trim() || ('Player ' + (i + 1));
      players.push({ name: n, human: true, color: PLAYER_COLORS[i], cash: START_CASH, shares: emptyShares(), history: [START_CASH] });
    }
    if (st.sam) {
      var sam = { name: 'Steady Sam', human: false, color: SAM_COLOR, cash: START_CASH, shares: emptyShares(), history: [START_CASH] };
      var bought = true;
      while (bought) {
        bought = false;
        SECTORS.forEach(function (s) { if (sam.cash >= s.base) { sam.shares[s.id]++; sam.cash -= s.base; bought = true; } });
      }
      players.push(sam);
    }
    S.md = { players: players, prices: basePrices(), round: 1, turn: 0, phase: 'trade', sel: 0, deck: shuffle(EVENTS).slice(0, ROUNDS), news: null };
    go('md');
  }
  function humans() { return S.md.players.filter(function (p) { return p.human; }); }
  function worth(p, prices) { var w = p.cash; SECTORS.forEach(function (s) { w += p.shares[s.id] * prices[s.id]; }); return w; }
  function current() { return humans()[S.md.turn]; }
  function spreadBar(p, prices) {
    var total = 0, parts = [];
    SECTORS.forEach(function (s) { var v = p.shares[s.id] * prices[s.id]; total += v; parts.push([s, v]); });
    if (!total) return '<div class="spread" aria-label="No shares yet"></div>';
    return '<div class="spread" aria-label="How your money is spread">' + parts.map(function (x) {
      return x[1] ? '<i style="width:' + (x[1] / total * 100).toFixed(1) + '%;background:' + x[0].color + '"></i>' : '';
    }).join('') + '</div>';
  }
  function spreadTip(p) {
    var held = SECTORS.filter(function (s) { return p.shares[s.id] > 0; }).length;
    if (held === 0) return 'Your coins are safe but they cannot grow. Buy a few shares to join the market.';
    if (held === 1) return 'All your eggs are in one basket. One bad news card could hit everything you own.';
    if (held <= 3) return 'You hold ' + held + ' sectors. Spreading a little wider protects you from a single crash.';
    return 'Nicely spread out across ' + held + ' sectors. One crash cannot hurt you much.';
  }
  function viewMd() {
    var md = S.md;
    if (md.phase === 'end') return viewMdEnd();
    var pills = md.players.map(function (p) {
      var me = md.phase === 'trade' && p === current();
      return '<span class="pill ' + (me ? 'me' : '') + '"><span style="color:' + p.color + '">&#9679;</span> ' + esc(p.name) + ' <span class="num">' + fmt(worth(p, md.prices)) + '</span></span>';
    }).join('');
    var head = '<div class="bar"><div><p class="eyebrow">Market Day &middot; Round ' + md.round + ' of ' + ROUNDS + '</p>' +
      '<h1>' + (md.phase === 'trade' ? esc(current().name) + ', your move' : 'Everyone is ready') + '</h1></div><div class="pills">' + pills + '</div></div>';
    if (md.phase === 'ready' || md.phase === 'news') {
      var body = '<div class="layout"><div class="sectors">' + SECTORS.map(function (s, i) { return sectorCard(s, i, null); }).join('') + '</div>' +
        '<div class="card side"><h3>What will the news be?</h3><p class="muted" style="margin:0">One news card is drawn each round. It moves one sector up or down. Everyone holding that sector feels it.</p>' +
        '<button class="btn big blue" data-action="md-reveal">Reveal the news</button>' +
        '<p class="keys">Console: Event button. Keyboard: <kbd>Space</kbd></p></div></div>';
      return head + body + (md.phase === 'news' ? viewNews() : '');
    }
    var p = current(), w = worth(p, md.prices);
    return head + '<div class="layout"><div class="sectors">' + SECTORS.map(function (s, i) { return sectorCard(s, i, p); }).join('') + '</div>' +
      '<div class="card side">' +
        '<div class="wallet"><div>Cash<b class="num">' + fmt(p.cash) + '</b></div><div>Net worth<b class="num">' + fmt(w) + '</b></div></div>' +
        '<div><p class="eyebrow" style="margin:0 0 6px">Your spread</p>' + spreadBar(p, md.prices) + '</div>' +
        '<div class="tip">' + spreadTip(p) + '</div>' +
        '<button class="btn big green" data-action="md-done">I am done</button>' +
        '<p class="keys"><kbd>&larr;</kbd> <kbd>&rarr;</kbd> pick a sector &middot; <kbd>&uarr;</kbd> buy &middot; <kbd>&darr;</kbd> sell &middot; <kbd>Enter</kbd> done. The console joystick and Confirm button work the same way.</p>' +
      '</div></div>';
  }
  function sectorCard(s, i, p) {
    var md = S.md, price = md.prices[s.id], change = price - s.base;
    var trend = change === 0 ? 'Starting price' : (change > 0 ? '<span class="up">Up ' : '<span class="down">Down ') + fmt(Math.abs(change)) + ' since the start</span>';
    var ctrl = '';
    if (p) {
      ctrl = '<div class="ctrl"><button class="sell" data-action="md-sell" data-s="' + s.id + '" ' + (p.shares[s.id] ? '' : 'disabled') + ' aria-label="Sell one ' + s.name + ' share">Sell 1</button>' +
        '<button class="buy" data-action="md-buy" data-s="' + s.id + '" ' + (p.cash >= price ? '' : 'disabled') + ' aria-label="Buy one ' + s.name + ' share">Buy 1</button></div>' +
        '<div class="owned">You own <b>' + p.shares[s.id] + '</b> share' + (p.shares[s.id] === 1 ? '' : 's') + '</div>';
    }
    return '<div class="sector ' + (p && md.sel === i ? 'sel' : '') + '">' +
      '<div class="band" style="background:' + s.color + ';color:' + s.ink + '">' + s.name + '</div>' +
      '<div class="body"><div class="price num">' + fmt(price) + '</div><div class="owned">' + trend + '</div>' + ctrl + '</div></div>';
  }
  function mdTrade(kind, id) {
    var p = current(), price = S.md.prices[id];
    if (kind === 'buy') { if (p.cash < price) { toast('Not enough cash for ' + sector(id).name + '.'); return; } p.cash -= price; p.shares[id]++; }
    else { if (!p.shares[id]) return; p.cash += price; p.shares[id]--; }
    S.md.sel = SECTORS.indexOf(sector(id));
    render();
  }
  function mdDone() {
    var md = S.md;
    md.turn++; md.sel = 0;
    if (md.turn >= humans().length) { md.phase = 'ready'; render(); }
    else { render(); toast('Pass the laptop to ' + current().name + '.'); }
  }
  function mdReveal() {
    var md = S.md, ev = md.deck[md.round - 1];
    var before = md.players.map(function (p) { return worth(p, md.prices); });
    var oldPrice = md.prices[ev.s];
    md.prices[ev.s] = Math.round(oldPrice * (1 + ev.pct / 100));
    md.players.forEach(function (p, i) { var now = worth(p, md.prices); p.history.push(now); p._delta = now - before[i]; });
    md.news = { ev: ev, old: oldPrice, now: md.prices[ev.s] };
    md.phase = 'news';
    led(ev.pct > 0 ? 'G' : 'R', 3500);
    render();
  }
  function viewNews() {
    var n = S.md.news, s = sector(n.ev.s), last = S.md.round >= ROUNDS;
    var moves = S.md.players.map(function (p) {
      var d = p._delta;
      return '<div><span>' + esc(p.name) + '</span><span class="num ' + (d > 0 ? 'up' : d < 0 ? 'down' : 'muted') + '">' + (d ? signed(d) : 'no change') + '</span></div>';
    }).join('');
    return newsCard(s, n.ev, 'Breaking news', n.ev.why + ' ' + s.name + ' shares go from <b class="num">' + fmt(n.old) + '</b> to <b class="num">' + fmt(n.now) + '</b>.',
      '<div class="moves">' + moves + '</div>', 'md-next', last ? 'See who won' : 'Next round');
  }
  function newsCard(s, ev, eyebrow, text, extra, action, label) {
    return '<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="newsTitle"><div class="newscard">' +
      '<div class="head" style="background:' + s.color + ';color:' + s.ink + '"><span>' + s.name.toUpperCase() + '</span><span>' + (ev.pct > 0 ? 'BOOM' : 'CRASH') + '</span></div>' +
      '<div class="inner"><p class="eyebrow" style="margin:0">' + eyebrow + '</p><h2 id="newsTitle">' + ev.name + '</h2>' +
      '<div class="effect ' + (ev.pct > 0 ? 'up' : 'down') + '">' + pctText(ev.pct) + '</div>' +
      '<p class="why" style="margin:0">' + text + '</p>' + extra +
      '<button class="btn big" data-action="' + action + '">' + label + '</button></div></div></div>';
  }
  function mdNext() {
    var md = S.md;
    if (md.round >= ROUNDS) { md.phase = 'end'; render(); confetti(); led('G', 2500); return; }
    md.round++; md.turn = 0; md.phase = 'trade'; md.news = null;
    render();
    if (humans().length > 1) toast(current().name + ', you are up.');
  }
  function viewMdEnd() {
    var md = S.md;
    var ranked = md.players.slice().sort(function (a, b) { return worth(b, md.prices) - worth(a, md.prices); });
    var winner = ranked[0], top = worth(winner, md.prices);
    var tied = ranked.filter(function (p) { return worth(p, md.prices) === top; });
    var title = tied.length > 1 ? 'It is a tie between ' + tied.map(function (p) { return esc(p.name); }).join(' and ') + '!' : esc(winner.name) + ' wins!';
    var places = ranked.map(function (p, i) {
      var w = worth(p, md.prices), held = SECTORS.filter(function (s) { return p.shares[s.id] > 0; }).length;
      return '<div class="card place ' + (i === 0 ? 'first' : '') + '"><span class="n">' + (i + 1) + '</span><div><div class="who" style="color:' + p.color + '">' + esc(p.name) + '</div><div class="muted">Held ' + held + ' of 6 sectors</div></div>' +
        '<div class="worth"><b class="num">' + fmt(w) + '</b><span class="num ' + (w >= START_CASH ? 'up' : 'down') + '">' + signed(w - START_CASH) + ' from the start</span></div></div>';
    }).join('');
    var heldW = SECTORS.filter(function (s) { return winner.shares[s.id] > 0; }).length;
    var line = heldW >= 4 ? 'Spreading out paid off for ' + esc(winner.name) + '.' :
      heldW <= 1 ? esc(winner.name) + ' took a big risk on one sector and got lucky this time. Next time the news might go the other way.' :
      esc(winner.name) + ' backed a few sectors and the news was kind.';
    return '<div class="bar"><div><p class="eyebrow">Market Day &middot; Final results</p><h1>' + title + '</h1></div>' +
      '<div class="row"><button class="btn" data-action="market">Play again</button><button class="btn ghost" data-action="home">All games</button></div></div>' +
      '<div class="layout"><div style="display:grid;gap:18px"><div class="podium">' + places + '</div>' + mdChart() + '</div>' +
      '<div class="card lesson"><h3>What just happened?</h3><p>' + line + '</p><p><b>Diversification</b> means spreading your money across different investments, so one piece of bad news cannot wipe you out.</p><p style="margin-bottom:0"><b>Volatility</b> is how quickly and how far prices jump around. Some sectors swing a lot more than others.</p></div></div>';
  }
  function lineChart(series, steps, base, labels, aria) {
    var W = 640, H = 260, pad = 40, all = [];
    series.forEach(function (s) { all = all.concat(s.data); });
    if (base !== null) all.push(base);
    var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    if (hi === lo) { hi += 100; lo -= 100; }
    var span = hi - lo; lo -= span * 0.1; hi += span * 0.1;
    function x(i) { return pad + i * (W - pad * 2) / steps; }
    function y(v) { return H - pad - (v - lo) / (hi - lo) * (H - pad * 2); }
    var out = '';
    if (base !== null) out += '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + y(base) + '" y2="' + y(base) + '" stroke="#9AA6B2" stroke-dasharray="5 5"/>' +
      '<text x="' + (W - pad) + '" y="' + (y(base) - 6) + '" text-anchor="end" font-size="12" fill="#4D5A66">' + fmt(base) + ' start</text>';
    series.forEach(function (s) {
      var pts = s.data.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' ');
      var last = s.data.length - 1;
      out += '<polyline points="' + pts + '" fill="none" stroke="' + s.color + '" stroke-width="' + (s.width || 3.5) + '" stroke-linejoin="round" stroke-linecap="round"' + (s.dash ? ' stroke-dasharray="' + s.dash + '"' : '') + '/>' +
        '<circle cx="' + x(last) + '" cy="' + y(s.data[last]) + '" r="5" fill="' + s.color + '"/>';
    });
    labels.forEach(function (l) { out += '<text x="' + x(l[0]) + '" y="' + (H - 12) + '" text-anchor="middle" font-size="12" fill="#4D5A66">' + l[1] + '</text>'; });
    var legend = series.map(function (s) { return '<span class="pill"><span style="color:' + s.color + '">&#9679;</span> ' + esc(s.name) + '</span>'; }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + aria + '">' + out + '</svg><div class="pills" style="margin-top:8px">' + legend + '</div>';
  }
  function mdChart() {
    var md = S.md, labels = [];
    for (var i = 0; i <= ROUNDS; i += 2) labels.push([i, i === 0 ? 'Start' : 'R' + i]);
    return '<div class="card chart"><p class="eyebrow" style="margin:0 0 8px">Net worth after each news card</p>' +
      lineChart(md.players.map(function (p) { return { name: p.name, color: p.color, data: p.history }; }), ROUNDS, START_CASH, labels, 'Net worth over the game') + '</div>';
  }
  function mdInput(cmd) {
    var md = S.md;
    if (md.phase === 'news') { if (cmd === 'OK' || cmd === 'EVENT') mdNext(); return; }
    if (md.phase === 'ready') { if (cmd === 'EVENT' || cmd === 'OK') mdReveal(); return; }
    if (md.phase !== 'trade') return;
    if (cmd === 'L') { md.sel = (md.sel + SECTORS.length - 1) % SECTORS.length; render(); }
    else if (cmd === 'R') { md.sel = (md.sel + 1) % SECTORS.length; render(); }
    else if (cmd === 'U') mdTrade('buy', SECTORS[md.sel].id);
    else if (cmd === 'D') mdTrade('sell', SECTORS[md.sel].id);
    else if (cmd === 'OK' || cmd === 'CLICK') mdDone();
  }

  // ================= BOOM OR CRASH =================
  function bocStart() { S.boc = { qs: shuffle(EVENTS).slice(0, 10), i: 0, answer: null, results: [] }; go('boc'); }
  function viewBoc() {
    var b = S.boc, score = b.results.filter(Boolean).length;
    if (b.i >= b.qs.length) {
      var msg = score >= 8 ? 'You read the news like a pro.' : score >= 5 ? 'Solid instincts. A couple of headlines fooled you.' : 'Markets are tricky. Play again and the reasons will start to click.';
      return doneCard('Boom or Crash?', score, 10, msg, 'Good news for a sector usually pushes its price up, and bad news usually pulls it down. That is why owning several sectors keeps you steady.', 'boc');
    }
    var q = b.qs[b.i], s = sector(q.s), res;
    if (b.answer !== null) {
      var right = (b.answer === 'up') === (q.pct > 0);
      res = '<div class="result ' + (right ? 'ok' : 'no') + '"><b>' + (right ? 'Yes! ' : 'Not this time. ') + (q.pct > 0 ? 'Boom' : 'Crash') + ': ' + pctText(q.pct) + '.</b> ' + q.why + '</div>' +
        '<button class="btn big" data-action="boc-next">' + (b.i === b.qs.length - 1 ? 'See my score' : 'Next headline') + '</button>';
    } else {
      res = '<div class="answers"><button class="btn green" data-action="boc-up">Boom &uarr;</button><button class="btn red" data-action="boc-down">Crash &darr;</button></div>' +
        '<p class="keys" style="margin:0">Keyboard <kbd>&uarr;</kbd> or <kbd>&darr;</kbd>. On the console, push the joystick up or down.</p>';
    }
    return '<div class="quiz">' + backBar('Which way will it go?', 'Boom or Crash? &middot; Headline ' + (b.i + 1) + ' of 10', '<span class="pill me">Score <span class="num">' + score + '</span></span>') +
      progressBar(10, b.results, b.i) +
      '<div class="card qcard"><div class="band" style="background:' + s.color + ';color:' + s.ink + '">' + s.name.toUpperCase() + '</div><div class="inner">' +
      '<p class="eyebrow" style="margin:0">Headline</p><h2>' + q.name + '</h2><p style="margin:0;font-size:18px">Will <b>' + s.name + '</b> shares go up or down?</p>' + res + '</div></div></div>';
  }
  function doneCard(game, score, total, msg, lesson, again) {
    if (score >= total * 0.8) setTimeout(confetti, 50);
    return '<div class="quiz"><div class="card qcard"><div class="band" style="background:#1F3B57">' + game + ' &middot; Done</div><div class="inner">' +
      '<h2><span class="num">' + score + '</span> out of ' + total + '</h2><p style="margin:0;font-size:18px">' + msg + '</p>' +
      '<p class="tip" style="margin:0">' + lesson + '</p>' +
      '<div class="row"><button class="btn big" data-action="' + again + '">Play again</button><button class="btn ghost" data-action="home">All games</button></div></div></div></div>';
  }
  function bocAnswer(dir) {
    var b = S.boc; if (b.answer !== null || b.i >= b.qs.length) return;
    var q = b.qs[b.i]; b.answer = dir;
    var right = (dir === 'up') === (q.pct > 0);
    b.results.push(right);
    led(right ? 'G' : 'R', 1200);
    render();
  }
  function bocNext() { var b = S.boc; if (b.answer === null) return; b.i++; b.answer = null; render(); }
  function bocInput(cmd) {
    var b = S.boc; if (b.i >= b.qs.length) return;
    if (b.answer === null) { if (cmd === 'U') bocAnswer('up'); else if (cmd === 'D') bocAnswer('down'); }
    else if (cmd === 'OK' || cmd === 'EVENT' || cmd === 'CLICK') bocNext();
  }

  // ================= SECTOR SORT =================
  function sortStart() {
    // leave out headlines that already name their sector, so the answer is not given away
    var fair = EVENTS.filter(function (e) { return e.name.toLowerCase().indexOf(sector(e.s).name.toLowerCase()) < 0; });
    S.sort = { qs: shuffle(fair).slice(0, 8), i: 0, pick: null, sel: 0, results: [] }; go('sort'); }
  function viewSort() {
    var g = S.sort, score = g.results.filter(Boolean).length;
    if (g.i >= g.qs.length) {
      var msg = score >= 7 ? 'You know your sectors.' : score >= 4 ? 'Good going. Some headlines could fit more than one sector.' : 'Have another go. The reasons after each headline are the clues.';
      return doneCard('Sector Sort', score, 8, msg, 'An economy is made of different parts, called sectors. News usually hits one sector hardest, which is why owning a few different ones protects you.', 'sort');
    }
    var q = g.qs[g.i], right = sector(q.s);
    var btns = SECTORS.map(function (s, i) {
      var cls = '';
      if (g.pick !== null) cls = s.id === q.s ? 'right' : s.id === g.pick ? 'wrong' : 'dim';
      else if (g.sel === i) cls = 'sel';
      return '<button class="sortbtn ' + cls + '" data-action="sort-pick" data-s="' + s.id + '" style="--c:' + s.color + ';--ink2:' + s.ink + '" ' + (g.pick !== null ? 'disabled' : '') + '>' + s.name + '</button>';
    }).join('');
    var res = '';
    if (g.pick !== null) {
      var ok = g.pick === q.s;
      res = '<div class="result ' + (ok ? 'ok' : 'no') + '"><b>' + (ok ? 'Correct! ' : 'It was ' + right.name + '. ') + '</b>' + q.why + '</div>' +
        '<button class="btn big" data-action="sort-next">' + (g.i === g.qs.length - 1 ? 'See my score' : 'Next headline') + '</button>';
    } else res = '<p class="keys" style="margin:0">Click a sector, or use <kbd>&larr;</kbd> <kbd>&rarr;</kbd> and <kbd>Enter</kbd>. The console joystick and Confirm button work too.</p>';
    return '<div class="quiz">' + backBar('Which sector does it hit?', 'Sector Sort &middot; Headline ' + (g.i + 1) + ' of 8', '<span class="pill me">Score <span class="num">' + score + '</span></span>') +
      progressBar(8, g.results, g.i) +
      '<div class="card qcard"><div class="band" style="background:#1F3B57">BREAKING NEWS</div><div class="inner"><h2>' + q.name + '</h2><div class="sortgrid">' + btns + '</div>' + res + '</div></div></div>';
  }
  function sortPick(id) {
    var g = S.sort; if (g.pick !== null) return;
    g.pick = id; var ok = id === g.qs[g.i].s; g.results.push(ok); led(ok ? 'G' : 'R', 1200); render();
  }
  function sortNext() { var g = S.sort; if (g.pick === null) return; g.i++; g.pick = null; g.sel = 0; render(); }
  function sortInput(cmd) {
    var g = S.sort; if (g.i >= g.qs.length) return;
    if (g.pick === null) {
      if (cmd === 'L' || cmd === 'U') { g.sel = (g.sel + 5) % 6; render(); }
      else if (cmd === 'R' || cmd === 'D') { g.sel = (g.sel + 1) % 6; render(); }
      else if (cmd === 'OK' || cmd === 'CLICK' || cmd === 'EVENT') sortPick(SECTORS[g.sel].id);
    } else if (cmd === 'OK' || cmd === 'EVENT' || cmd === 'CLICK') sortNext();
  }

  // ================= SPREAD YOUR EGGS =================
  var EGGS = 12;
  function eggsStart() { S.eggs = { eggs: emptyShares(), sel: 0, storm: null }; go('eggs'); }
  function eggsLeft() { var g = S.eggs, n = EGGS; SECTORS.forEach(function (s) { n -= g.eggs[s.id]; }); return n; }
  function viewEggs() {
    var g = S.eggs, left = eggsLeft(), st = g.storm;
    var baskets = SECTORS.map(function (s, i) {
      var n = g.eggs[s.id], state = st ? (st.cracked.indexOf(s.id) >= 0 ? 'cracked' : st.golden === s.id ? 'golden' : 'safe') : '';
      var eggs = ''; for (var k = 0; k < n; k++) eggs += '<i class="egg ' + state + '"></i>';
      var label = st ? (state === 'cracked' ? '<span class="down">Cracked! &minus;' + n + '</span>' : state === 'golden' ? '<span class="up">Golden! +' + n + '</span>' : 'Safe') : n + ' egg' + (n === 1 ? '' : 's');
      var ctrl = st ? '' : '<div class="ctrl"><button data-action="egg-minus" data-s="' + s.id + '" ' + (n ? '' : 'disabled') + ' aria-label="Take an egg out of ' + s.name + '">&minus;</button><button class="buy" data-action="egg-plus" data-s="' + s.id + '" ' + (left ? '' : 'disabled') + ' aria-label="Put an egg in ' + s.name + '">+</button></div>';
      return '<div class="sector basket ' + state + ' ' + (!st && g.sel === i ? 'sel' : '') + '"><div class="band" style="background:' + s.color + ';color:' + s.ink + '">' + s.name + '</div>' +
        '<div class="body"><div class="nest" aria-hidden="true">' + eggs + '</div><div class="owned">' + label + '</div>' + ctrl + '</div></div>';
    }).join('');
    var side;
    if (!st) {
      side = '<div class="wallet"><div>Eggs left<b class="num">' + left + '</b></div><div>Baskets used<b class="num">' + SECTORS.filter(function (s) { return g.eggs[s.id]; }).length + '</b></div></div>' +
        '<p style="margin:0">When the storm comes, <b>two baskets crack</b> and lose every egg inside. <b>One basket turns golden</b> and doubles its eggs. Nobody knows which ones.</p>' +
        '<button class="btn big blue" data-action="egg-storm" ' + (left ? 'disabled' : '') + '>' + (left ? 'Place all 12 eggs first' : 'Send the storm') + '</button>' +
        '<p class="keys" style="margin:0"><kbd>&larr;</kbd> <kbd>&rarr;</kbd> pick a basket &middot; <kbd>&uarr;</kbd> add &middot; <kbd>&darr;</kbd> remove &middot; <kbd>Space</kbd> storm</p>';
    } else {
      var used = SECTORS.filter(function (s) { return g.eggs[s.id]; }).length;
      var msg = st.final > EGGS ? 'You came out ahead!' : st.final === EGGS ? 'You broke even.' : st.final === 0 ? 'Ouch. Every egg was in a basket that cracked.' : 'You lost some eggs, but not all of them.';
      var lesson = used >= 4 ? 'Because you spread your eggs over ' + used + ' baskets, the storm could only hurt part of what you had.' :
        used === 1 ? 'With every egg in one basket, you either win big or lose everything. That is a lot of risk.' :
        'Using more baskets would have made the storm less scary.';
      side = '<div class="wallet"><div>You started with<b class="num">12</b></div><div>You now have<b class="num ' + (st.final >= EGGS ? 'up' : 'down') + '">' + st.final + '</b></div></div>' +
        '<p style="margin:0;font-size:18px"><b>' + msg + '</b> ' + lesson + '</p>' +
        '<div class="tip">This is <b>diversification</b>. Investors spread money across sectors for the same reason: one bad event cannot wipe them out.</div>' +
        '<div class="row"><button class="btn big" data-action="eggs">Play again</button></div>';
    }
    return backBar(st ? 'After the storm' : 'Spread your eggs', 'Spread Your Eggs') +
      '<div class="layout"><div class="sectors">' + baskets + '</div><div class="card side">' + side + '</div></div>';
  }
  function eggsAdd(id, d) {
    var g = S.eggs; if (g.storm) return;
    if (d > 0 && !eggsLeft()) { toast('All 12 eggs are placed. Take one out to move it.'); return; }
    if (d < 0 && !g.eggs[id]) return;
    g.eggs[id] += d; g.sel = SECTORS.indexOf(sector(id)); render();
  }
  function eggsStorm() {
    var g = S.eggs; if (g.storm || eggsLeft()) return;
    var order = shuffle(SECTORS.map(function (s) { return s.id; }));
    var cracked = order.slice(0, 2), golden = order[2], final = 0;
    SECTORS.forEach(function (s) { var n = g.eggs[s.id]; if (cracked.indexOf(s.id) >= 0) return; final += s.id === golden ? n * 2 : n; });
    g.storm = { cracked: cracked, golden: golden, final: final };
    led(final >= EGGS ? 'G' : 'R', 2000);
    render();
    if (final > EGGS) confetti();
  }
  function eggsInput(cmd) {
    var g = S.eggs; if (g.storm) { if (cmd === 'OK') eggsStart(); return; }
    var id = SECTORS[g.sel].id;
    if (cmd === 'L') { g.sel = (g.sel + 5) % 6; render(); }
    else if (cmd === 'R') { g.sel = (g.sel + 1) % 6; render(); }
    else if (cmd === 'U') eggsAdd(id, 1);
    else if (cmd === 'D') eggsAdd(id, -1);
    else if (cmd === 'EVENT' || cmd === 'OK') eggsStorm();
  }

  // ================= STEADY OR WILD =================
  var DAYS = 5;
  var WILD_CHOICES = [
    { id: 'steady', title: 'Steady', text: 'Calm Cove Savings. Grows a little almost every day.', color: '#1A9E8F' },
    { id: 'split', title: 'Half and half', text: '500 coins in each. A bit of calm, a bit of thrill.', color: '#F2B705' },
    { id: 'wild', title: 'Wild', text: 'Rocket Rides Inc. Can shoot up or crash down.', color: '#D6408F' }
  ];
  function wildStart() { S.wild = { choice: null, sel: 0, day: 0, steady: [1000], wild: [1000] }; go('wild'); }
  function wildMine() {
    var w = S.wild;
    return w.steady.map(function (v, i) { return w.choice === 'steady' ? v : w.choice === 'wild' ? w.wild[i] : (v + w.wild[i]) / 2; });
  }
  function viewWild() {
    var w = S.wild;
    if (!w.choice) {
      var opts = WILD_CHOICES.map(function (c, i) {
        return '<button class="card pick ' + (w.sel === i ? 'sel' : '') + '" data-action="wild-choose" data-c="' + c.id + '" style="--c:' + c.color + '"><span class="dotc"></span><h3>' + c.title + '</h3><p>' + c.text + '</p></button>';
      }).join('');
      return backBar('Where do your 1,000 coins go?', 'Steady or Wild?') +
        '<p class="muted" style="margin:-6px 0 18px;max-width:60ch">You will watch five days of the market. The steady one moves a little each day. The wild one can jump a lot, up or down.</p>' +
        '<div class="picks">' + opts + '</div><p class="keys"><kbd>&larr;</kbd> <kbd>&rarr;</kbd> and <kbd>Enter</kbd> also work, and so does the console.</p>';
    }
    var mine = wildMine(), done = w.day >= DAYS, endV = mine[mine.length - 1];
    var labels = []; for (var i = 0; i <= DAYS; i++) labels.push([i, i === 0 ? 'Start' : 'Day ' + i]);
    var chart = lineChart([
      { name: 'Steady', color: '#1A9E8F', data: w.steady },
      { name: 'Wild', color: '#D6408F', data: w.wild },
      { name: 'Your coins', color: '#1F3B57', data: mine, width: 2.5, dash: '6 5' }
    ], DAYS, 1000, labels, 'Value of the steady and wild investments by day');
    var side = '<div class="wallet"><div>Your coins<b class="num ' + (endV >= 1000 ? 'up' : 'down') + '">' + fmt(endV) + '</b></div><div>Day<b class="num">' + w.day + ' / ' + DAYS + '</b></div></div>';
    if (!done) side += '<button class="btn big blue" data-action="wild-day">Next day</button><p class="keys" style="margin:0"><kbd>Space</kbd> or the console Event button</p>';
    else {
      var swing = Math.max.apply(null, w.wild) - Math.min.apply(null, w.wild);
      side += '<p style="margin:0;font-size:18px"><b>' + (endV >= 1000 ? 'You finished with more than you started.' : 'You finished with less than you started.') + '</b> The wild one swung by ' + fmt(swing) + ' coins in five days. The steady one never moved more than a few coins a day.</p>' +
        '<div class="tip">That jumping around is called <b>volatility</b>. Wild investments can win big, but they can also lose big. Many investors mix the two.</div>' +
        '<div class="row"><button class="btn big" data-action="wild">Try again</button></div>';
    }
    return backBar(done ? 'Five days later' : 'Watch the market', 'Steady or Wild? &middot; You picked ' + WILD_CHOICES.filter(function (c) { return c.id === w.choice; })[0].title) +
      '<div class="layout"><div class="card chart">' + chart + '</div><div class="card side">' + side + '</div></div>';
  }
  function wildDay() {
    var w = S.wild; if (!w.choice || w.day >= DAYS) return;
    var s = w.steady[w.day], x = w.wild[w.day];
    w.steady.push(Math.round(s * (1 + rand(0, 0.04))));
    w.wild.push(Math.max(50, Math.round(x * (1 + rand(-0.3, 0.35)))));
    w.day++;
    var mine = wildMine();
    led(mine[mine.length - 1] >= mine[mine.length - 2] ? 'G' : 'R', 900);
    render();
  }
  function wildInput(cmd) {
    var w = S.wild;
    if (!w.choice) {
      if (cmd === 'L') { w.sel = (w.sel + 2) % 3; render(); }
      else if (cmd === 'R') { w.sel = (w.sel + 1) % 3; render(); }
      else if (cmd === 'OK' || cmd === 'CLICK') { w.choice = WILD_CHOICES[w.sel].id; render(); }
    } else if (cmd === 'EVENT' || cmd === 'OK') wildDay();
  }

  // ================= GROW YOUR COINS =================
  function growStart() { S.grow = { years: 10, rate: 8, add: false }; go('grow'); }
  function growSeries() {
    var g = S.grow, piggy = [100], inv = [100];
    for (var y = 1; y <= g.years; y++) {
      piggy.push(piggy[y - 1] + (g.add ? 10 : 0));
      inv.push(inv[y - 1] * (1 + g.rate / 100) + (g.add ? 10 : 0));
    }
    return { piggy: piggy, inv: inv };
  }
  function viewGrow() {
    var g = S.grow, sr = growSeries(), pEnd = sr.piggy[g.years], iEnd = sr.inv[g.years];
    var labels = [[0, 'Now'], [g.years, g.years + ' yr']];
    if (g.years >= 4) labels.splice(1, 0, [Math.round(g.years / 2), Math.round(g.years / 2) + ' yr']);
    var rates = [4, 8, 12].map(function (r) { return '<button class="' + (g.rate === r ? 'on' : '') + '" data-action="grow-rate" data-r="' + r + '" aria-pressed="' + (g.rate === r) + '">' + r + '%</button>'; }).join('');
    return backBar('Grow your coins', 'Grow Your Coins') +
      '<div class="layout"><div class="card chart">' +
        lineChart([{ name: 'Piggy bank', color: '#C8553D', data: sr.piggy }, { name: 'Invested', color: '#4E9A3A', data: sr.inv }], g.years, null, labels, 'Piggy bank compared with investing') +
      '</div><div class="card side">' +
        '<div class="wallet"><div>Piggy bank<b class="num">' + fmt(pEnd) + '</b></div><div>Invested<b class="num up">' + fmt(iEnd) + '</b></div></div>' +
        '<label for="years" style="font-weight:700">Years: <span class="num">' + g.years + '</span></label>' +
        '<input type="range" id="years" min="1" max="30" value="' + g.years + '" data-grow="years">' +
        '<div><p class="eyebrow" style="margin:0 0 6px">Growth each year</p><div class="choice small" role="group" aria-label="Growth each year">' + rates + '</div></div>' +
        '<label class="toggle" for="addten"><input type="checkbox" id="addten" ' + (g.add ? 'checked' : '') + '><span><b>Add 10 coins every year</b></span></label>' +
        '<div class="tip">Invested coins earn a little extra each year, and next year that extra earns extra too. This snowball is called <b>compound growth</b>. Time is its secret ingredient.</div>' +
        '<p class="keys" style="margin:0"><kbd>&uarr;</kbd> <kbd>&darr;</kbd> change the years</p>' +
      '</div></div>';
  }
  function growInput(cmd) {
    var g = S.grow;
    if (cmd === 'U' || cmd === 'R') { g.years = Math.min(30, g.years + 1); render(); }
    else if (cmd === 'D' || cmd === 'L') { g.years = Math.max(1, g.years - 1); render(); }
  }

  // ================= BOARD GAME HELPER (hybrid) =================
  function helperStart() {
    var left = {}; SECTORS.forEach(function (s) { left[s.id] = EVENTS.filter(function (e) { return e.s === s.id; }); });
    S.h = { prices: basePrices(), left: left, sel: 0, armed: false, card: null, log: [], tags: {}, order: [], now: null };
    go('helper');
  }
  function viewHelper() {
    var h = S.h;
    var deckLeft = SECTORS.reduce(function (n, s) { return n + h.left[s.id].length; }, 0);
    var tiles = SECTORS.map(function (s, i) {
      var price = h.prices[s.id], ch = price - s.base;
      return '<button class="sector ' + (h.sel === i ? 'sel' : '') + '" data-action="h-pick" data-i="' + i + '" aria-pressed="' + (h.sel === i) + '">' +
        '<div class="band" style="background:' + s.color + ';color:' + s.ink + '">' + s.name + (h.sel === i && h.armed ? '<span>LOCKED</span>' : '') + '</div>' +
        '<div class="body"><div class="price num">' + fmt(price) + '</div><div class="owned">' + (ch === 0 ? 'Starting price' : (ch > 0 ? '<span class="up">Up ' : '<span class="down">Down ') + fmt(Math.abs(ch)) + '</span>') + '</div>' +
        '<div class="left">' + h.left[s.id].length + ' event' + (h.left[s.id].length === 1 ? '' : 's') + ' left</div></div></button>';
    }).join('');
    var tagChips = h.order.length ? h.order.map(function (uid) { return '<span class="tagchip ' + (h.now === uid ? 'now' : '') + '">' + h.tags[uid] + '</span>'; }).join('') : '<span class="muted">No tags yet. Each player taps their tag on the console once to join.</span>';
    var log = h.log.length ? '<ol>' + h.log.slice().reverse().map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ol>' : '<p class="muted" style="margin:0">Market events will be listed here.</p>';
    var sel = SECTORS[h.sel];
    return backBar('The market', 'Board Game Helper &middot; Hybrid &middot; ' + deckLeft + ' of 18 events left', '<button class="btn ghost" data-action="h-reset">New game</button>') +
      '<div class="layout helper"><div class="sectors">' + tiles + '</div>' +
      '<div style="display:grid;gap:18px"><div class="card side" style="position:static">' +
        '<p class="eyebrow" style="margin:0">Whose turn</p><div class="tags">' + tagChips + '</div>' +
        '<p style="margin:0">Selected: <b>' + sel.name + '</b></p>' +
        '<button class="btn big blue" data-action="h-event" ' + (h.left[sel.id].length ? '' : 'disabled') + '>Trigger an event</button>' +
        '<p class="keys" style="margin:0">On the console: tap your tag, move the joystick to a sector, press Confirm, then press Event. Everyone updates their paper net worth sheet.</p>' +
      '</div><div class="card log"><p class="eyebrow" style="margin:0">Market log</p>' + log + '</div></div></div>' +
      (h.card ? newsCard(sector(h.card.ev.s), h.card.ev, 'Market event', h.card.ev.why + ' ' + sector(h.card.ev.s).name + ' moves from <b class="num">' + fmt(h.card.old) + '</b> to <b class="num">' + fmt(h.card.now) + '</b>. Everyone holding it, update your sheet.', '', 'h-close', 'Got it') : '');
  }
  function helperEvent() {
    var h = S.h, s = SECTORS[h.sel], pool = h.left[s.id];
    if (!pool.length) { toast('No events left for ' + s.name + '. Pick another sector.'); return; }
    var ev = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    var old = h.prices[s.id];
    h.prices[s.id] = Math.round(old * (1 + ev.pct / 100));
    h.card = { ev: ev, old: old, now: h.prices[s.id] };
    h.log.push((h.now ? h.tags[h.now] + ': ' : '') + '<b>' + ev.name + '</b> on ' + s.name + ', ' + pctText(ev.pct) + ' (' + fmt(old) + ' to ' + fmt(h.prices[s.id]) + ')');
    h.armed = false;
    led(ev.pct > 0 ? 'G' : 'R', 3500);
    render();
  }
  function helperTag(uid) {
    var h = S.h;
    if (!h.tags[uid]) {
      if (h.order.length >= 4) { toast('Four players have already joined.'); return; }
      h.order.push(uid); h.tags[uid] = 'Player ' + h.order.length;
      toast(h.tags[uid] + ' joined the game.');
    } else toast(h.tags[uid] + ', it is your turn.');
    h.now = uid; led('B', 700); render();
  }
  function helperInput(cmd) {
    var h = S.h;
    if (h.card) { if (cmd === 'OK' || cmd === 'EVENT' || cmd === 'CLICK') { h.card = null; render(); } return; }
    if (cmd === 'L' || cmd === 'U') { h.sel = (h.sel + 5) % 6; h.armed = false; render(); }
    else if (cmd === 'R' || cmd === 'D') { h.sel = (h.sel + 1) % 6; h.armed = false; render(); }
    else if (cmd === 'OK' || cmd === 'CLICK') { h.armed = true; render(); toast(SECTORS[h.sel].name + ' locked in. Press Event.'); }
    else if (cmd === 'EVENT') helperEvent();
  }

  // ================= RULES (board game only) =================
  function viewRules() {
    var sectorsList = SECTORS.map(function (s) { return '<li><span class="sw" style="background:' + s.color + '"></span>' + s.name + ' <span class="muted num">starts at ' + fmt(s.base) + '</span></li>'; }).join('');
    var events = SECTORS.map(function (s) {
      return '<tr><th scope="row"><span class="sw" style="background:' + s.color + '"></span>' + s.name + '</th>' + EVENTS.filter(function (e) { return e.s === s.id; }).map(function (e) {
        return '<td>' + e.name + ' <b class="' + (e.pct > 0 ? 'up' : 'down') + '">' + pctText(e.pct) + '</b></td>';
      }).join('') + '</tr>';
    }).join('');
    return '<article class="doc">' +
      backBar('How to play the board game', 'Board game only &middot; 2 to 4 players &middot; about 30 minutes') +
      '<div class="card docbody">' +
      '<p class="lede">InBestor is a race to the biggest net worth. You buy shares in six sectors of the economy, and news cards push those sectors up or down. Spread your money wisely and you can ride out the bad news.</p>' +
      '<h2>In the box</h2><ul>' +
        '<li>The board: six coloured sector zones around a space for the console</li>' +
        '<li>6 sector cards, one for each sector, showing its starting price</li>' +
        '<li>18 event cards, three for each sector</li>' +
        '<li>Net worth sheets, one per player, and a pencil each</li>' +
        '<li>4 RFID player tags and the console (only needed for the hybrid mode)</li>' +
      '</ul>' +
      '<h2>The six sectors</h2><ul class="seclist">' + sectorsList + '</ul>' +
      '<h2>Set up</h2><ol>' +
        '<li>Put the board in the middle of the table and place each sector card on its zone.</li>' +
        '<li>Put a sticky note in each zone with the sector’s starting price. This is the price you change during the game.</li>' +
        '<li>Shuffle the 18 event cards and put them face down in the event deck corner.</li>' +
        '<li>Everyone takes a net worth sheet and writes <b>2,000</b> in the cash box.</li>' +
        '<li>The youngest player goes first. Play goes clockwise.</li>' +
      '</ol>' +
      '<h2>A round</h2><ol>' +
        '<li><b>Everyone takes a turn.</b> On your turn, do one of these: <b>buy</b> shares in any sectors at their current price, <b>sell</b> shares you own at their current price, or <b>hold</b> and do nothing. Write every change on your sheet.</li>' +
        '<li><b>Flip one event card.</b> When everyone has had a turn, flip the top event card and read it out loud.</li>' +
        '<li><b>Move the price.</b> Change that sector’s price by the percentage on the card and update its sticky note. Round to the nearest whole coin.</li>' +
        '<li><b>Update your sheet.</b> Everyone who owns that sector works out their new net worth: cash plus the value of all their shares.</li>' +
        '<li>Put the card in the discard pile. The next round starts with the next player.</li>' +
      '</ol>' +
      '<div class="tip"><b>Example.</b> Technology is at 500 and you own 2 shares, worth 1,000. The card says <b>Chip Shortage, Technology, −15%</b>. The new price is 425, so your shares are now worth 850.</div>' +
      '<h2>Winning</h2><p>After <b>10 event cards</b>, the game ends. Add up your cash and the value of your shares at the final prices. The biggest net worth wins.</p>' +
      '<h2>All 18 event cards</h2><div class="tablewrap"><table class="evtable"><tbody>' + events + '</tbody></table></div>' +
      '<h2>Game modes</h2><ul>' +
        '<li><b>Classic:</b> the rules above.</li>' +
        '<li><b>Blitz:</b> deal out 6 event cards before you start and only use those. Quick games for small children.</li>' +
        '<li><b>High Stakes:</b> double every percentage when you read it out.</li>' +
        '<li><b>Co-op:</b> everyone shares one sheet and tries to reach 3,000 coins before the tenth card.</li>' +
        '<li><b>Tournament:</b> play several short games and add up the winnings.</li>' +
      '</ul>' +
      '<h2>Playing with the console instead</h2><p>Want the hybrid version? Instead of flipping a card, tap your tag on the console, pick a sector with the joystick, press Confirm, then press Event. The laptop draws a random event for that sector, changes the price for you and the light flashes green or red. Open the <button class="linkbtn" data-action="helper">Board Game Helper</button> to try it.</p>' +
      '<div class="tip"><b>Strategy tip.</b> Every sector has good news and bad news in the deck. If you own a little of several sectors, one bad card can only hurt part of your money.</div>' +
      '</div></article>';
  }

  // ================= ABOUT =================
  function viewAbout() {
    return '<article class="doc">' +
      backBar('About InBestor', 'The project') +
      '<div class="card docbody">' +
      '<p class="lede">InBestor is an investing board game for 2 to 4 players, a game console I built on an Arduino, and a set of digital games. Together they teach young people how markets work by letting them feel the result of an investing decision, not just read about it.</p>' +
      '<h2>Why I made it</h2><p>I am interested in economics and how markets work. Most young people never learn how investing works until they are adults, even though decisions about money affect everyone. I believe every young person should have the chance to understand this, so I set out to teach it through a game instead of a textbook. I built it using two skills I already had: coding, which runs the console and the digital games, and painting, which I used to design the board and the console.</p>' +
      '<h2>What the board game is about</h2><p>Players invest in six sectors of the economy: Technology, Housing, Energy, Transport, Fashion and Food. Each round, an event card brings news like a Chip Shortage or an Interest Rate Cut, and that news pushes one sector up (a boom) or down (a crash). Players who spread their money across several sectors are protected when one of them crashes. Nobody has to sit out as the banker, because every player keeps their own records on a net worth sheet. After ten event cards, the biggest net worth wins.</p>' +
      '<h2>Three ways to play</h2><ul>' +
        '<li><b>Board game only:</b> the board, cards and paper sheets around a table. No screen needed.</li>' +
        '<li><b>Hybrid:</b> the console connects to a laptop. Players tap an RFID tag, choose a sector with the joystick and press a button, and the laptop runs the market while the console light flashes green for a boom or red for a crash.</li>' +
        '<li><b>Digital only:</b> six short games on this website that anyone can play on a phone, tablet or laptop.</li>' +
      '</ul>' +
      '<h2>The console</h2><ul>' +
        '<li><b>Arduino 101:</b> the brain, connected to the laptop by USB</li>' +
        '<li><b>Joystick:</b> moves between sectors and menus</li>' +
        '<li><b>Yellow button:</b> Confirm</li>' +
        '<li><b>Small black button:</b> triggers a market event</li>' +
        '<li><b>RGB light:</b> green for a boom, red for a crash, blue when a tag is read</li>' +
        '<li><b>RFID reader:</b> each player taps their own tag, so every move is linked to a player</li>' +
      '</ul>' +
      '<h2>How it helps young players</h2><ul>' +
        '<li><b>Diversification:</b> they see that spreading money across sectors protects them from one bad event.</li>' +
        '<li><b>Cause and effect:</b> every price change comes with a reason, so they learn how real news moves markets.</li>' +
        '<li><b>Risk and volatility:</b> they compare calm investments with wild ones and decide how much risk they want.</li>' +
        '<li><b>Maths in real life:</b> percentage increases and decreases, totals and compound growth, used to make decisions.</li>' +
        '<li><b>Talking about money:</b> it gives families an easy, low-pressure way to start conversations about saving and investing.</li>' +
      '</ul>' +
      '<h2>What it means for my Personal Project</h2><p>My learning goal was to learn how investing concepts such as diversification and market volatility can be taught to young people through game design, and how technology can make that learning interactive. InBestor is the product of that goal: the board game teaches the concepts, the console makes them interactive, and the digital games make them available to anyone with a browser, which is how I wanted young people to get access to this knowledge.</p>' +
      '<div class="row" style="margin-top:8px"><button class="btn" data-action="scroll" data-to="digital">Try the games</button><button class="btn ghost" data-action="rules">Read the board game rules</button></div>' +
      '</div></article>';
  }

  // ---------- render + clicks ----------
  function render() {
    var views = { setup: viewSetup, md: viewMd, boc: viewBoc, sort: viewSort, eggs: viewEggs, wild: viewWild, grow: viewGrow, helper: viewHelper, rules: viewRules, about: viewAbout };
    app.innerHTML = (views[S.screen] || viewHome)();
    var dlg = app.querySelector('.overlay .btn');
    if (dlg) dlg.focus();
  }
  function scrollToZone(id) {
    if (S.screen !== 'home') { S.screen = 'home'; history.replaceState(null, '', location.pathname); render(); }
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-action]');
    if (!b || b.disabled) return;
    var a = b.getAttribute('data-action');
    var simple = { home: function () { go('home'); }, console: connectConsole, market: function () { mdNewSetup(); go('setup'); },
      boc: bocStart, sort: sortStart, eggs: eggsStart, wild: wildStart, grow: growStart, helper: helperStart,
      rules: function () { go('rules'); }, about: function () { go('about'); } };
    if (simple[a]) { simple[a](); return; }
    switch (a) {
      case 'scroll': scrollToZone(b.getAttribute('data-to')); break;
      case 'count': S.setup.count = +b.getAttribute('data-n'); render(); break;
      case 'md-start': mdStart(); break;
      case 'md-buy': mdTrade('buy', b.getAttribute('data-s')); break;
      case 'md-sell': mdTrade('sell', b.getAttribute('data-s')); break;
      case 'md-done': mdDone(); break;
      case 'md-reveal': mdReveal(); break;
      case 'md-next': mdNext(); break;
      case 'boc-up': bocAnswer('up'); break;
      case 'boc-down': bocAnswer('down'); break;
      case 'boc-next': bocNext(); break;
      case 'sort-pick': sortPick(b.getAttribute('data-s')); break;
      case 'sort-next': sortNext(); break;
      case 'egg-plus': eggsAdd(b.getAttribute('data-s'), 1); break;
      case 'egg-minus': eggsAdd(b.getAttribute('data-s'), -1); break;
      case 'egg-storm': eggsStorm(); break;
      case 'wild-choose': S.wild.choice = b.getAttribute('data-c'); render(); break;
      case 'wild-day': wildDay(); break;
      case 'grow-rate': S.grow.rate = +b.getAttribute('data-r'); render(); break;
      case 'h-pick': S.h.sel = +b.getAttribute('data-i'); S.h.armed = false; render(); break;
      case 'h-event': helperEvent(); break;
      case 'h-close': S.h.card = null; render(); break;
      case 'h-reset': helperStart(); break;
    }
  });
  document.addEventListener('input', function (e) {
    var t = e.target;
    var i = t.getAttribute && t.getAttribute('data-name');
    if (i !== null && i !== undefined && S.setup) S.setup.names[+i] = t.value;
    if (t.getAttribute && t.getAttribute('data-grow') === 'years') {
      S.grow.years = +t.value; render();
      var r = document.getElementById('years'); if (r) r.focus();
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'sam' && S.setup) S.setup.sam = e.target.checked;
    if (e.target.id === 'addten' && S.grow) { S.grow.add = e.target.checked; render(); }
  });

  var start = location.hash.replace('#', '');
  if (PAGES.indexOf(start) >= 0) S.screen = start;
  render();
  if (['digital', 'hybrid', 'board'].indexOf(start) >= 0) setTimeout(function () { scrollToZone(start); }, 50);
})();
