
# YouTube Takeout data analyzer

Simple project to analyze the outcome of Google Takeout's YouTube data. There are two main things I'm interested in: watch history and the watch later playlist.

After a search on Stack Overflow, it became clear that YouTube API v3 doesn't provide a way to access these two special playlists. Eventually, however, I found someone suggesting using Google Takeout for that, so I decided to give it a try.

## Instructions

### Export data from Takeout

Extract your YouTube data via [Takeout](https://takeout.google.com/settings/takeout). I advise deselecting "videos" and "music-uploads" to make the final zip leaner.

Once the data is ready, download and unzip it. Move the `Takeout` folder inside this repository so the scripts here can find it.

### Setup scripts

These are Node.js scripts, so you need to setup the environment before continuing. I recommend using `nvm` to manage your installed Node.js version. Once `nvm` is installed, run the following command inside this folder:

    nvm i

This will download and install the correct Node.js version. After that, run `npm` to install dependencies:

    npm i

And you're ready to go.

### Watch history

The following scripts will analyze your watch history data:

- `node watch-history-digest` prints a summary of statistics about your watch history;
- `node watch-history-count-by-year-month` dumps the count of videos watched month by month;
- `node watch-history-top-channels` dumps the list of channels most watched by you;
- `node watch-history-top-videos` dumps the list of videos most watched by you;
- `node watch-history-channel-progression` finds the top K most watched channels in your history data and then dumps a CSV file showing your how many views you had on each channel throughout time. This is an interesting analysis to show your channel watching habits as years go by;
- `node watch-history-channel <channel-name>` receives a channel name (can be a partial match) as input and outputs the whole list of videos you watched on that channel.

### Watch later

I use the watch later playlist a lot to mark videos that YouTube suggested to me so I can watch them... later. The problem is that the list grows quickly out of control. Even after I watch some of those videos, they still stay there cluttering the list. The YouTube UI lacks usability to manage playlists, so my idea here is to study ways to cleanup the list and collect only the videos I still want to watch.

The Takeout watch later list contains only video ids, so we need to fetch video data from the YouTube API. For that, you need to obtain a developer key in order to be able to call YouTube APIs. The full instructions can be seen [here](https://developers.google.com/youtube/v3/getting-started). You need just an API key, not OAuth authorization. Once you have a project with YouTube API access, create a key [here](https://console.cloud.google.com/apis/credentials). Click the "Create credentials" and add a new API key.

Copy the new key and paste it into a new file named `api.key` in this folder. Finally, run the script:

    node watch-later-digest

A cache file named `watch-later.json` will be created (together with `watch-later.sha1`, which will be used to detect future changes and invalidate the cache).

After that, the following scripts can be used:

- `node watch-later-top-channels` lists the most popular channels on your watch later list;
- `node watch-later-csv` dumps a CSV file containing all the videos in your watch later list so you can take a good look at them.
