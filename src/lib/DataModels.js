'use strict'

const nohm     = require('nohm').Nohm;
const YAML     = require('yamljs');

let modelslist = ['event', 'user']
let models = []

class DataModels {
    static load() {
        modelslist.forEach(function (model) {
            console.log("+ Loading model " + model)
            models[model] = require('../lib/models/' + model + '.js')
        });
        return models
    }
}

module.exports = DataModels