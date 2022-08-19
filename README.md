
Simple project to analyze the outcome of Takeout's YouTube data. There are two main things I'm interested in: watch history and the watch later playlist.

## Instructions

Extract YouTube data via [Takeout](https://takeout.google.com/settings/takeout). I advise deselecting "videos" and "music-uploads" to make the final zip leaner.

Once the data is ready, download and unzip it. Move the `Takeout` folder inside this repository and run the analysis scripts:

    node watch-history-digest
    node watch-history-count-by-year-month
    node watch-history-top-channels
    node watch-history-top-videos
