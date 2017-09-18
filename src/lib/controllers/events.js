'use strict'

const nohm = require('nohm').Nohm;
const redisdb = require('../redisdb.js');
const EventModel = require('../models/event.js')
const YAML = require('yamljs');

class EventsController {

    static init() {

        console.log("+ EventsController starting ...")

        // set the redis client & preferences
        nohm.setClient(redisdb);
        nohm.setPrefix('incodwetrust');

        // set the error function
        nohm.logError = function (err) {
            if (err) {
                console.log("[ERROR] : nohm processing error: " + JSON.stringify(err))
            }
        }

        // load events from yaml files
        this.getEventsList({}, function (err, events) {
            if (events.length < 1) {
                EventsController.loadDefaults();
            }
        });
    }

    static loadDefaults() {
        const defaultEvents = YAML.load(__dirname + '/../../data/default-events.yml');
        var events = Object.keys(defaultEvents).map(key => Object.assign(defaultEvents[key], {
            name: key
        }));
        console.log("Default Events Loaded : " + JSON.stringify(events))

        events.forEach(function (event) {
            var eventParsed = JSON.stringify(event);
            console.log("importing event : " + eventParsed)
            EventsController.addEvent(eventParsed)
        });
    }

    static addEvent(value) {
        console.log('+ EventsController: adding event : \n' + value);
        var event = nohm.factory('EventModel');
        event.p(JSON.parse(value))
        console.log('+ persisting object in db')
        event.save(function (err) {
            if (err) {
                console.log("[ERROR] : nohm persist :")
                console.log("error: " + err)
                console.log("object errors: " + JSON.stringify(event.errors));
                console.log("object: " + JSON.stringify(event))
            }
        });
        return event;
    }

    static getEventsList(filter, cb) {
        // should return a list of events persisted
        var eventsList;
        EventModel.findAndLoad({}, function (err, events) {
            console.log(JSON.stringify("[EventsController] getEventsList:", events.length));
            eventsList = events;
            cb(err, events);
        });
    }
}

module.exports = EventsController