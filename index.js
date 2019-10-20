var sqlite = require("./db");
var twitter = require("./twitter");
var fs = require("fs").promises;

var wait = delay => new Promise(ok => setTimeout(ok, delay));


var setup = async function() {
  var db = await sqlite.openDB();
  var ready = sqlite.keyval(db, "ready");
  if (!ready) {
    console.log("Configuring DB for first run...");
    await sqlite.run(db, `CREATE TABLE tweets (id TEXT PRIMARY KEY, timestamp NUMERIC, tweet TEXT, deleted BOOLEAN);`);
    await sqlite.keyval(db, "loaded", false);
    await sqlite.keyval(db, "ready", true);
  }
  return db;
};

var loadTweets = async function(tweets, db) {
  console.log("Loading tweets into DB...");
  // load database
  await sqlite.run(db, "DELETE FROM tweets");
  for (var tweet of tweets) {
    var { id_str, full_text, created_at } = tweet;
    var date = Date.parse(created_at);
    await sqlite.run(db, `INSERT INTO tweets VALUES (?, ?, ?, ?)`, [id_str, date, full_text, false]);
  }
  // set the loaded flag
  await sqlite.keyval(db, "loaded", true);
}

var main = async function() {
  var db = await setup();
  var tweetFile = await fs.readFile("data/tweet.js", "utf-8");
  tweetFile = tweetFile.replace(/^window.*?=/, '');
  var tweets = JSON.parse(tweetFile);

  var loaded = await sqlite.keyval(db, "loaded");
  if (!loaded) {
    loadTweets(tweets, db);
    console.log("All tweets loaded into DB");
  } else {
    console.log("Using tweets from loaded DB");
  }

  // get old tweets
  var now = new Date();
  var lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  
  var everything = await sqlite.one(db, "SELECT COUNT(*) AS count FROM tweets");
  console.log(`Total tweets in DB: ${everything.count.toLocaleString()}`);
  var trash = await sqlite.query(db, `SELECT * FROM tweets WHERE timestamp < ? AND deleted = 0`, [ lastYear.valueOf() ]);
  console.log(`Tweets to be deleted: ${trash.length.toLocaleString()}`);

  var neko = "801265991619514368";

  for (var item of trash) {
    var { tweet, id } = item;
    if (id == neko) continue;
    try {
      await twitter.rm(id);
      await sqlite.run(db, `UPDATE tweets SET deleted = 1 WHERE id = ?`, [id]);
      console.log(`Delete successful for ${id}`)
    } catch (err) {
      if (err == twitter.RATE_LIMIT) {
        console.log("API was rate limited, exiting");
        await sqlite.close(db);
        process.exit();
      } else {
        console.log(err);
      }
    }
    await wait(1000);
  }
}

main().catch(err => console.error(err));