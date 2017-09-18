const Config = require('./Config.js');

const redisdb = require('./redisdb');

var memory = {};

function getRedis(key, callback){
    redisdb.get(key, function (err, reply) {
        if (err) {
            console.log('storage.getRedis - redis error: .' + err);
            exit
        };
        if (reply) {
            // console.log('storage.getRedis:', reply);
            if (typeof callback === 'function'){
                callback(reply, key);
            }
        }else{
            // console.log('storage.getRedis:', null);
            callback(null, key);
        }
    });
};

function setRedis(key, value){
    // console.log('setRedis:', key, value);
    redisdb.set(key, value);
}

module.exports = {
    getJSON: function(key, callback){
        this.get(key, function(value, key){
            if (value !== undefined && value !== null && value !== ''){
                // parse JSON
                value = JSON.parse(value);
            }
            // console.log('getJSON:', value);
            callback(value, key);
        });
    },
    setJSON: function(key, value){
        // console.log('setJSON:', key, value);
        // stringify JSON and save
        this.set(key, JSON.stringify(value));
    },
    get: function(key, callback){
        // try to get from memory
        let value = memory[key];
        if (value !== undefined){
            callback(value, key);
        }else{
            // not in memory, get from DB
            getRedis(key, callback);
        }
    },
    set: function(key, value){
        // set to memory
        memory[key] = value;
        // set to DB
        setRedis(key, value);
    }
};