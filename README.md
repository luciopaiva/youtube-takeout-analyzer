
Simple project to analyze the outcome of Takeout's YouTube data. There are two main things I'm interested in: watch history and the watch later playlist.

## Instructions

### Watch history

Extract YouTube data via [Takeout](https://takeout.google.com/settings/takeout). I advise deselecting "videos" and "music-uploads" to make the final zip leaner.

Once the data is ready, download and unzip it. Move the `Takeout` folder inside this repository and run the analysis scripts:

    node watch-history-digest
    node watch-history-count-by-year-month
    node watch-history-top-channels
    node watch-history-top-videos

### Watch later

The watch later list contains only video ids, so we need to fetch video data from the YouTube API. For that, you need to obtain a developer key in order to be able to call YouTube APIs. The full instructions can be seen [here](https://developers.google.com/youtube/v3/getting-started). You need just an API key, not OAuth authorization. Once you have a project with YouTube API access, this is where you create a key:

https://console.cloud.google.com/apis/credentials

Click the "Create credentials" and add a new API key.

Copy the new key and paste it into a new file named `api.key` in this folder. Finally, run the script:

    node watch-later-digest

A cache file named `watch-later.json` will be created (together with `watch-later.sha1`, which will be used to detect future changes and invalidate the cache).
