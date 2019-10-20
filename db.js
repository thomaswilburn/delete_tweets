var sqlite3 = require("sqlite3");
var fs = require("fs").promises;

var openDB = function() {
  console.log("Opening database...");
  return new Promise(function(ok, fail) {
    var db = new sqlite3.Database("tweets.db", async function(err) {
      if (err) return fail(err);
      var keyval = await one(db, `SELECT name FROM sqlite_master WHERE name = 'keyval';`);
      if (!keyval) {
        console.log("Setting up key-value table...");
        await run(db, `CREATE TABLE keyval (k TEXT PRIMARY KEY, v TEXT);`);
      }
      ok(db);
    });
  });
};

var run = function(db, query, params = []) {
  return new Promise(function(ok, fail) {
    db.run(query, params, function(err) {
      if (err) return fail(err);
      ok();
    });
  });
};

var query = function(db, query, params = []) {
  return new Promise(function(ok, fail) {
    db.all(query, params, function(err, results) {
      if (err) return fail(err);
      ok(results);
    });
  });
};

var one = function(db, query, params = []) {
  return new Promise(function(ok, fail) {
    db.get(query, params, function(err, results) {
      if (err) return fail(err);
      ok(results);
    });
  });
};

var keyval = async function(db, key, value) {
  if (typeof value != "undefined") {
    var existing = await query(db, `SELECT * FROM keyval WHERE k = ?`, [key]);
    if (existing.length) {
      await run(db, `UPDATE keyval SET v = "${value}" WHERE k = "${key}"`);
    } else {
      await run(db, `INSERT INTO keyval VALUES ("${key}", "${value}")`);
    }
  } else {
    var row = await one(db, `SELECT * FROM keyval WHERE k = ?`, [ key ]);
    var v = row && row.v;
    if (v == "true") v = true;
    if (v == "false") v = false;
    return v;
  }
}

module.exports = { openDB, run, query, one, keyval }