'use strict'

const nohm       = require('nohm').Nohm;
const redisdb    = require('../redisdb.js');
const EventModel = require('../models/event.js')

class EventsController {

    static init() {

        console.log("+ EventsController starting ...")

        // set the redis client
        nohm.setClient(redisdb)

        // set the redis prefix for persistence
        nohm.setPrefix('incodwetrust')

        // set the error function
        nohm.logError = function (err) {
            if (err) {
                console.log("[ERROR] : nohm processing error: " + JSON.stringify(err))
            }
        }
    }

    static loadDefaults() {
        // should import YAML if there is no data yet
    }

    static addEvent(value) {
        console.log('+ EventsController: adding event : \n' + value);
        var event = nohm.factory('EventModel');
        event.p(JSON.parse(value))
        console.log('+ persisting object in db')
        event.save(function (err) { if (err) {
            console.log("[ERROR] : nohm persist :")
            console.log("error: " + err)
            console.log("object errors: " + JSON.stringify(event.errors));
            console.log("object: " + JSON.stringify(event))
        } });
        return event;
    }

    // FIXME: this is not working
    // should use calbacks or promises
    static getEventsList(filter) {
        // should return a list of events persisted
        var eventsList
        EventModel.find({}, function (err, events) { console.log(JSON.stringify("aaa" + events)); eventsList = events } );
        console.log(JSON.stringify(eventsList))
    }
}

module.exports = EventsController