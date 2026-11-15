/**
 * GUINS whitelist applications — Google Apps Script web app.
 *
 * A readable list of everyone applying for the whitelist (the colony tasks on the
 * home page) and the $RPENG airdrop (/rpeng). The site saves each change to its own
 * storage and sends the whole row here. Nothing is read back from this sheet.
 *
 * Contract with src/lib/mirror.ts:
 *
 *   POST {action:"bulk", rows:[...]}  -> { saved }    adds or updates rows by X handle
 *   GET  ?version                     -> { version }
 *   GET  ?stats                       -> { applicants, whitelisted, airdrop }
 *
 * There is no secret: anyone with the web app URL can add rows, so keep the URL
 * private. It belongs only in the site's server settings.
 *
 * Setup is in README.md next to this file.
 */

/** Bumped whenever this file changes, so `?version` shows which copy is deployed. */
var SCRIPT_VERSION = 1;

var TAB = 'Whitelist';

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
};

/** Columns that may change to a new value later (everything else is kept once filled). */
var OVERWRITE = ['Wallet', 'Whitelisted', 'Updated At'];

// --- entry points ---------------------------------------------------------

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.version !== undefined) return json({ version: SCRIPT_VERSION });
  if (p.stats !== undefined) return json(stats());
  return json({ error: 'unknown request' });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json({ error: 'bad request' });
  }
  if (body.action !== 'bulk') return json({ error: 'unknown action' });

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json({ error: 'busy' });
  }
  try {
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

  var ok = first.saved === 1 && second.saved === 1 && once && whitelisted && safe;
  Logger.log(ok ? 'PASS. Delete the "selftest" row before going live.' : 'FAIL. See the lines above.');
}
