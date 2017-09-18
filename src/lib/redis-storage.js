'use strict'

const nohm = require('nohm').Nohm;
const redisdb = require('./redisdb.js');
const EventModel = require('./models/event.js')
const util = require('util');

class RedisStorage {

    static init() {

        var promise = new Promise(function (resolve, reject) {

            console.log('+ RedisStorage starting ...');

            redisdb.on('ready', () => {
                console.log('+ RedisStorage redis client connected ...');
                // set the redis client
                nohm.setClient(redisdb);
                resolve(redisdb);
            });

            // set the redis prefix for persistence
            nohm.setPrefix('incodwetrust')

            // set the error function
            nohm.logError = function (err) {
                if (err) {
                    console.log('+ RedisStorage [ERROR] : nohm processing error', err)
                }
            }

        });

        return promise;
    }

    static findOne(model, criteria) {

        console.log('+ RedisStorage findAll model:');

        return RedisStorage.load(model, criteria).then((items)=>{
            if (items.length !== 1){
                return null;
            }else{
                return items[0];
            }
        });
    }

    static findAll(model, criteria) {

        if (!criteria){
            criteria = {};
        }

        console.log('+ RedisStorage findAll model:');

        return util.promisify(model.findAndLoad)(criteria);
    }

    static findAndRemoveAll(model) {

        console.log('+ RedisStorage removeAll model:');

        return RedisStorage.findAll(model).then(items => RedisStorage.removeAll(items));
    }

    static removeAll(items) {

        console.log('+ RedisStorage removeAll %d items', items.length);

        return Promise.all(items.map(item => {
            return RedisStorage.removeOne(item);
        }));
    }

    static removeOne(item) {

        console.log('+ RedisStorage removeOne model:');

        var promise = new Promise(function (resolve, reject) {
            item.remove({}, function (err) {
                if (err) {
                    console.log("[ERROR] : nohm remove :", err);
                    reject(err);
                } else {
                    // console.log('SUCCESS', item);
                    resolve(item);
                }
            });
        });
    }


    static findAllIds(model) {

        console.log('+ RedisStorage findIds model:');

        return util.promisify(model.find)({});
    }

    static isEmpty(model) {
        return RedisStorage.findAllIds(model).then(ids => {
            console.log('+ RedisStorage isEmpty: nb of objects in db: %d', ids.length)
            return ids.length === 0;
        });
    }

    static createAll(modelName, entities) {
        console.log('+ RedisStorage persisting %d "%s" objects in db', entities.length, modelName)
        var promises = entities.map((entity, i) => {
            console.log('+ RedisStorage persisting "%s" entity in db', modelName, entity)
            return RedisStorage.createOne(modelName, entity);
        });
        console.log('+ RedisStorage %d promises created for "%s" objects in db', promises.length, modelName)
        // convert array of promises to single promise
        return Promise.all(promises);
    }

    static createOne(modelName, entity) {
        console.log('+ RedisStorage persisting "%s" in db', modelName, entity)
        const item = nohm.factory(modelName);
        item.p(entity);
        // convert callback function to promise: https://nodejs.org/api/util.html#util_util_promisify_original

        // console.log('+ RedisStorage saving "%s" in db', modelName, item)

        var promise = new Promise(function (resolve, reject) {
            item.save(function (err, is_link_error, link_error_model_name) {
                if (err) {
                    console.log("[ERROR] : nohm persist :", err, is_link_error, link_error_model_name, item.errors)
                    reject(err);
                } else {
                    // console.log('SUCCESS', item);
                    resolve(item);
                }
            });
        });

        // const promise = util.promisify(item.save)();
        // promise.catch((err) => {
        //     console.log("+ RedisStorage [ERROR] : nohm persist :", err, item.errors)
        // });
        return promise;
    }
}

module.exports = RedisStorage;