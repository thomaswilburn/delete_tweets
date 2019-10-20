1. Download your archive from Twitter (Settings -> Your Twitter data)
2. Extract the files into a subfolder named "data". We should probably accept the data file as a parameter, but that would be work.
3. Save your Twitter app credentials into a ``creds.json`` file with keys for "consumer_key", "consumer_secret", "access_token_key", and "access_token_secret".
4. Run the index.js file.

Tweets are deleted at a rate of 1/s, so if you have a long history, it may take a while.