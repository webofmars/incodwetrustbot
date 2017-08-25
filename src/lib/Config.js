let admins;
if (process.env.ADMINS_USERNAMES){
    admins = process.env.ADMINS_USERNAMES.split(',');
}else{
    admins = ['fredlight', 'Marsary', 'KrisTLG', 'VincentNOYE', 'Orianne55'];
}

module.exports = {
    galleryUr: process.env.GALLERY_URL || 'http://localhost:3000/gallery',
    photodir: process.env.PHOTOS_DIRECTORY || 'photos',
    TGtoken: process.env.TELEGRAM_BOT_TOKEN || 'xxxxxxxxxxxx:yyyyyyyyyyyyyyyy',
    redisHost: process.env.REDIS_HOST || 'redis',
    redisPort: process.env.REDIS_PORT || '6379',
    eventDocUrl: process.env.EVENT_DOC_URL || 'http://www.pipo.com/',
    eventGamesPrefix: process.env.EVENT_GAMES_PREFIX || 'http://localhost:3000/games/',
    playlistUrl: process.env.PLAYLIST_URL || 'http://www.deezer.com/',
    admins: admins,
    version: '1.0.0'
}