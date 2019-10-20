var Twitter = require("twitter");

var client = new Twitter(require("./creds.json"));

const RATE_LIMIT = "Rate limited";

var rm = async function(id) {
  return new Promise(function(ok, fail) {
    client.post(`statuses/destroy/${id}`, function(err, result) {
      if (err) {
        err = err[0].code;
        var known = {
          34: "No matching status",
          63: "User suspended",
          144: "Tweet not found",
          179: "Not authorized",
          200: "Forbidden"
        }
        if (known[err]) {
          console.log(`Known error for ${id}: ${known[err]}`);
        } else {
          return fail(err == 88 ? RATE_LIMIT : "Unknown error");
        }
      }
      ok();
    });
  });
}

module.exports = { client, rm, RATE_LIMIT }