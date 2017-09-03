const Config = require('./Config.js');
const Redis = require('redis');

/* Redis connexion */
var redisdb = Redis.createClient({
    host: Config.redisHost,
    port: Config.redisPort
});


module.exports = redisdb;