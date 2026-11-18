/**
 * GUINS whitelist applications — Google Apps Script web app.
 *
 * A readable list of everyone applying for the whitelist (the colony tasks on the
 * home page), the $RPENG airdrop (/rpeng) and the Waddle List community claim (/waddle). The site saves each change to its own
 * storage and sends the whole row here. Nothing is read back from this sheet.
 *
 * It also keeps the two post links an admin sets at /admin (the pinned post and
 * the airdrop post) on a "Settings" tab, so the site needs no other database.
 *
 * Contract with src/lib/mirror.ts and src/lib/links.ts:
 *
 *   POST {action:"bulk", rows:[...]}                   -> { saved }   adds or updates rows by X handle
 *   POST {action:"links", pinnedPost, airdropPost}     -> { links }   saves the post links
 *   GET  ?links                                        -> { links }   { pinnedPost, airdropPost }
 *   GET  ?version                                      -> { version }
 *   GET  ?stats                                        -> { applicants, whitelisted, airdrop }
 *   GET  ?waddle                                       -> { claimed, by }   Waddle List spots taken, per community
 *   GET  ?waddleWallet=0x…                             -> { owner }         X handle that claimed with it, or ""
 *   POST {action:"claim", handle, wallet, candidates, limits, cap}
 *        -> { ok:true, spot, community } | { ok:false, reason:"full"|"wallet"|"community" }
 *        Takes a Waddle List spot on the "Waddle List" tab: one at a time, so the
 *        total and each community's limit are never passed. force:true records a
 *        claim made before this tab existed, past the limits (the wallet is still
 *        checked).
 *
 * There is no secret: anyone with the web app URL can add rows, so keep the URL
 * private. It belongs only in the site's server settings. (Links can only ever be
 * set to X post links, so a leaked URL can't point the site anywhere else.)
 *
 * Setup is in README.md next to this file.
 */

/** Bumped whenever this file changes, so `?version` shows which copy is deployed. */
var SCRIPT_VERSION = 5;

var TAB = 'Whitelist';
var SETTINGS = 'Settings';
var WADDLE = 'Waddle List';
var WADDLE_HEADERS = ['Spot', 'X Handle', 'Wallet', 'Community', 'Claimed At'];
var LINK_KEYS = ['pinnedPost', 'airdropPost'];

/** Rows are written by header name, in this order. */
var HEADERS = [
  'X Handle',
  'Wallet',
  'Whitelisted',
  'Followed',
  'Liked + Reposted',
  'Tagged + Commented',
  'Wallet Added',
  'Posted Guin',
  'Joined At',
  'Updated At',
  '$RPENG Airdrop Wallet',
  '$RPENG Airdrop QRT',
  '$RPENG Airdrop Invited By',
  '$RPENG Airdrop At',
  'Waddle Wallet',
  'Waddle Community',
  'Waddle Spot',
  'Waddle Comment',
  'Waddle Claimed At',
];

/** Which field of a row from the site (signupRow in src/lib/entry.ts) fills each column. */
var FIELDS = {
  'X Handle': 'handle',
  'Wallet': 'wallet',
  'Whitelisted': 'complete',
  'Followed': 'followed',
  'Liked + Reposted': 'liked_reposted',
  'Tagged + Commented': 'tagged_commented',
  'Wallet Added': 'wallet_at',
  'Posted Guin': 'posted',
  'Joined At': 'joined_at',
  'Updated At': 'updated_at',
  '$RPENG Airdrop Wallet': 'airdrop_wallet',
  '$RPENG Airdrop QRT': 'airdrop_qrt',
  '$RPENG Airdrop Invited By': 'airdrop_invited_by',
  '$RPENG Airdrop At': 'airdrop_at',
  'Waddle Wallet': 'waddle_wallet',
  'Waddle Community': 'waddle_community',
  'Waddle Spot': 'waddle_spot',
  'Waddle Comment': 'waddle_comment',
  'Waddle Claimed At': 'waddle_at',
};

/** Columns that may change to a new value later (everything else is kept once filled). */
var OVERWRITE = ['Wallet', 'Whitelisted', 'Updated At'];

// --- entry points ---------------------------------------------------------

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.version !== undefined) return json({ version: SCRIPT_VERSION });
  if (p.stats !== undefined) return json(stats());
  if (p.links !== undefined) return json({ links: readLinks() });
  if (p.waddle !== undefined) return json(waddleStats());
  if (p.waddleWallet !== undefined) return json({ owner: waddleOwner(p.waddleWallet) });
  return json({ error: 'unknown request' });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json({ error: 'bad request' });
  }
  if (['bulk', 'links', 'claim'].indexOf(body.action) < 0) return json({ error: 'unknown action' });

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json({ error: 'busy' });
  }
  try {
    if (body.action === 'links') return json({ links: writeLinks(body) });
    if (body.action === 'claim') return json(claim(body));
    return json({ saved: saveAll(body.rows || []) });
  } catch (err) {
    return json({ error: String(err) });
  } finally {
    // Finish the write before the next one starts, or it can read the sheet as it was.
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

// --- writes ---------------------------------------------------------------

/** One read of the handle column, so a batch costs the same however long the sheet is. */
function saveAll(rows) {
  var sheet = tab(), last = sheet.getLastRow(), at = {};
  if (last > 1) {
    var list = sheet.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < list.length; i++) at[String(list[i][0]).toLowerCase()] = i + 2;
  }
  var saved = 0;
  for (var j = 0; j < rows.length; j++) {
    var r = rows[j];
    if (!r || !r.handle || !/^\w{1,15}$/.test(String(r.handle))) continue;
    var handle = String(r.handle).toLowerCase(), number = at[handle] || sheet.getLastRow() + 1;
    var old = at[handle] ? sheet.getRange(number, 1, 1, HEADERS.length).getValues()[0].map(String) : null;
    var row = buildRow(r, old);
    if (row) {
      // Plain text, so Sheets never reads a value as a formula or a date.
      sheet.getRange(number, 1, 1, HEADERS.length).setNumberFormat('@').setValues([row]);
      at[handle] = number;
    }
    saved++;
  }
  return saved;
}

/**
 * Filled cells are never blanked, because not every update carries every column.
 * Returns null for an update older than what is stored; they can arrive out of order.
 */
function buildRow(e, old) {
  var oldOf = function (name) { return old ? old[col(name) - 1] : ''; };
  if (oldOf('Updated At') && String(e.updated_at || '') < oldOf('Updated At')) return null;

  var row = [];
  for (var i = 0; i < HEADERS.length; i++) {
    var name = HEADERS[i], value = e[FIELDS[name]];
    value = value === undefined || value === null ? '' : clean(value);
    var keep = oldOf(name);
    row[i] = OVERWRITE.indexOf(name) >= 0 ? value || keep : keep || value;
  }
  // Once whitelisted, always whitelisted
  if (oldOf('Whitelisted') === 'yes') row[col('Whitelisted') - 1] = 'yes';
  return row;
}

/** Strips anything that could start a formula, and caps the length. */
function clean(v) {
  return String(v).replace(/^[=+\-@]+/, '').slice(0, 300);
}

// --- post links (Settings tab) -----------------------------------------------

/** "" (clear) or a clean https://x.com/<user>/status/<id>; anything else is refused. */
function postLink(v) {
  v = String(v == null ? '' : v).trim();
  if (!v) return '';
  var m = /^(?:https?:\/\/)?(?:www\.|mobile\.)?(?:x|twitter)\.com\/(\w{1,15})\/status(?:es)?\/(\d{5,25})(?:[\/?#].*)?$/i.exec(v);
  if (!m) throw new Error('not an X post link: ' + v.slice(0, 80));
  return 'https://x.com/' + m[1] + '/status/' + m[2];
}

function settingsTab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(SETTINGS);
  if (!sheet) {
    sheet = ss.insertSheet(SETTINGS);
    sheet.getRange(1, 1, 1, 3).setValues([['Setting', 'Value', 'Updated At']]).setFontWeight('bold').setBackground('#ede8ff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readLinks() {
  var sheet = settingsTab(), last = sheet.getLastRow(), out = { pinnedPost: '', airdropPost: '' };
  if (last < 2) return out;
  var values = sheet.getRange(2, 1, last - 1, 2).getValues();
  for (var i = 0; i < values.length; i++) {
    var k = String(values[i][0]);
    if (LINK_KEYS.indexOf(k) >= 0) out[k] = String(values[i][1]);
  }
  return out;
}

/** Saves whichever of the two links the body carries; returns the links as stored. */
function writeLinks(body) {
  var sheet = settingsTab(), now = new Date().toISOString();
  var current = readLinks(), last = sheet.getLastRow();
  var rows = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
  for (var i = 0; i < LINK_KEYS.length; i++) {
    var k = LINK_KEYS[i];
    if (!(k in body)) continue;
    var v = postLink(body[k]);
    var at = rows.indexOf(k);
    var number = at >= 0 ? at + 2 : sheet.getLastRow() + 1;
    if (at < 0) rows.push(k);
    sheet.getRange(number, 1, 1, 3).setNumberFormat('@').setValues([[k, v, now]]);
    current[k] = v;
  }
  return current;
}

// --- Waddle List claims ("Waddle List" tab) ------------------------------------

function waddleTab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(WADDLE);
  if (!sheet) {
    sheet = ss.insertSheet(WADDLE);
    sheet.getRange(1, 1, 1, WADDLE_HEADERS.length).setValues([WADDLE_HEADERS]).setFontWeight('bold').setBackground('#ede8ff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Every claim as { spot, handle, wallet, community }, handles and wallets lower-cased. */
function waddleRows() {
  var sheet = waddleTab(), last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, 4).getValues().map(function (r) {
    return { spot: Number(r[0]) || 0, handle: String(r[1]).toLowerCase(), wallet: String(r[2]).toLowerCase(), community: String(r[3]) };
  }).filter(function (r) { return r.handle; });
}

function waddleStats() {
  var rows = waddleRows(), by = {};
  for (var i = 0; i < rows.length; i++) by[rows[i].community] = (by[rows[i].community] || 0) + 1;
  return { claimed: rows.length, by: by };
}

function waddleOwner(wallet) {
  wallet = String(wallet || '').toLowerCase();
  var rows = waddleRows();
  for (var i = 0; i < rows.length; i++) if (rows[i].wallet === wallet) return rows[i].handle;
  return '';
}

/** Runs under the script lock, so two claims never take the same last spot. */
function claim(b) {
  var handle = String(b.handle || ''), wallet = String(b.wallet || '');
  if (!/^\w{1,15}$/.test(handle) || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) return { error: 'bad claim' };
  var h = handle.toLowerCase(), w = wallet.toLowerCase();
  var candidates = (b.candidates || []).map(String), limits = b.limits || {}, cap = Number(b.cap) || 0, force = b.force === true;
  var rows = waddleRows(), by = {};
  for (var i = 0; i < rows.length; i++) {
    // Already claimed: the same answer again
    if (rows[i].handle === h) return { ok: true, spot: rows[i].spot, community: rows[i].community };
    if (rows[i].wallet === w) return { ok: false, reason: 'wallet' };
    by[rows[i].community] = (by[rows[i].community] || 0) + 1;
  }
  if (rows.length >= cap && !force) return { ok: false, reason: 'full' };
  var community = force ? candidates[0] || '' : '';
  for (var j = 0; !community && j < candidates.length; j++) {
    if ((by[candidates[j]] || 0) < (Number(limits[candidates[j]]) || 0)) { community = candidates[j]; break; }
  }
  if (!community) return { ok: false, reason: 'community' };
  var spot = rows.length + 1;
  var at = b.claimedAt ? new Date(b.claimedAt) : new Date();
  waddleTab().appendRow([spot, handle, wallet, clean(community), (isNaN(at) ? new Date() : at).toISOString()]);
  return { ok: true, spot: spot, community: community };
}

/**
 * Run once from the Apps Script editor: copies Waddle claims saved on the Whitelist
 * tab (by an older version of this script) onto the Waddle List tab, oldest first.
 * Claims already on the tab, or whose wallet is, are skipped. Safe to run again.
 */
function importEarlierClaims() {
  var sheet = tab(), last = sheet.getLastRow();
  if (last < 2) return Logger.log('No rows on the Whitelist tab.');
  var values = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues(), found = [];
  for (var i = 0; i < values.length; i++) {
    var v = function (name) { return String(values[i][col(name) - 1]); };
    if (v('Waddle Claimed At') && v('Waddle Wallet') && v('Waddle Community')) {
      found.push({ handle: v('X Handle'), wallet: v('Waddle Wallet'), community: v('Waddle Community'), at: v('Waddle Claimed At') });
    }
  }
  found.sort(function (a, b) { return a.at < b.at ? -1 : 1; });
  var before = waddleRows().length, skipped = [];
  for (var j = 0; j < found.length; j++) {
    var f = found[j];
    var r = claim({ handle: f.handle, wallet: f.wallet, candidates: [f.community], force: true, claimedAt: f.at });
    if (!r.ok) skipped.push(f.handle + ' (' + (r.reason || r.error) + ')');
  }
  SpreadsheetApp.flush();
  var now = waddleRows().length;
  Logger.log('Earlier claims found on the Whitelist tab: ' + found.length);
  Logger.log('Added: ' + (now - before) + '. Now on the Waddle List tab: ' + now + ' claims');
  if (skipped.length) Logger.log('Skipped: ' + skipped.join(', '));
}

// --- reads ----------------------------------------------------------------

function stats() {
  var sheet = tab(), last = sheet.getLastRow();
  if (last < 2) return { applicants: 0, whitelisted: 0, airdrop: 0 };
  var values = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  var wl = 0, ad = 0;
  for (var i = 0; i < values.length; i++) {
    if (values[i][col('Whitelisted') - 1] === 'yes') wl++;
    if (values[i][col('$RPENG Airdrop At') - 1]) ad++;
  }
  return { applicants: values.length, whitelisted: wl, airdrop: ad };
}

// --- helpers --------------------------------------------------------------

function tab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(TAB);
  if (!sheet) sheet = ss.insertSheet(TAB);
  // Also upgrades a tab made by an older version of this script
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold').setBackground('#ede8ff');
  sheet.setFrozenRows(1);
  return sheet;
}

function col(name) {
  return HEADERS.indexOf(name) + 1;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// --- manual test ----------------------------------------------------------

/** Run from the Apps Script editor. Delete the selftest row afterwards. */
function selfTest() {
  var now = new Date().toISOString();
  var row = { handle: 'selftest', wallet: '0xtest', complete: 'no', followed: now, joined_at: now, updated_at: now };
  var send = function (r) {
    return JSON.parse(doPost({ postData: { contents: JSON.stringify({ action: 'bulk', rows: [r] }) } }).getContent());
  };
  var first = send(row);
  var before = tab().getLastRow();
  row.complete = 'yes';
  row.updated_at = new Date(Date.now() + 1000).toISOString();
  var second = send(row);
  var once = tab().getLastRow() === before;
  var number = before;
  var whitelisted = tab().getRange(number, col('Whitelisted')).getValue() === 'yes';
  var formula = send({ handle: 'selftest', wallet: '=HYPERLINK("x")', updated_at: new Date(Date.now() + 2000).toISOString() });
  var safe = String(tab().getRange(number, col('Wallet')).getValue()).charAt(0) !== '=';

  Logger.log('saved          : ' + JSON.stringify(first) + ' ' + JSON.stringify(second) + ' ' + JSON.stringify(formula));
  Logger.log('no duplicate   : ' + once);
  Logger.log('update applied : ' + whitelisted);
  Logger.log('formula blocked: ' + safe);
  Logger.log('stats          : ' + JSON.stringify(stats()));

  // Post links: save a test link, read it back, then put the real ones back
  var real = readLinks();
  writeLinks({ pinnedPost: 'twitter.com/hoodguins/status/1234567890?s=20' });
  var linkOk = readLinks().pinnedPost === 'https://x.com/hoodguins/status/1234567890';
  var refused = false;
  try { writeLinks({ airdropPost: 'https://evil.example/phish' }); } catch (err) { refused = true; }
  writeLinks(real);
  Logger.log('links saved    : ' + linkOk);
  Logger.log('bad link refused: ' + refused);

  var ok = first.saved === 1 && second.saved === 1 && once && whitelisted && safe && linkOk && refused;
  Logger.log(ok ? 'PASS. Delete the "selftest" row before going live.' : 'FAIL. See the lines above.');
}
