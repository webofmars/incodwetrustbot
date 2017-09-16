'use strict'

const storage = require('../lib/storage');
const BotTools = require('../lib/BotTools.js');
const UsersDB = require('../lib/UsersDB.js');
const SessionsManager = require('../lib/SessionsManager.js');

const Telegram = require('telegram-node-bot');
const TelegramBaseController = Telegram.TelegramBaseController
const YAML = require('yamljs');

let users = {};
const db_key = 'users';
const filepath = __dirname + '/../data/default-users.yml';

class UserService {

    static loadDefault() {
        // load default user from yaml file
        const users = YAML.load(filepath);
        console.log('\n=> users loaded: ', users);
    }

    static init() {
        storage.getJSON(db_key, function (value, key) {
            if (value) {
                users = value;
            } else {
                UserService.loadDefault();
            }
        });
    }

    static reset() {
        UserService.loadDefault();
        storage.setJSON(db_key, users);
    }

    static updateUser(user) {
        console.log('\n=> updateUser user: ', user);
        users[user.id] = user;
        storage.setJSON(db_key, users);
    }
}

class UserController extends TelegramBaseController {

    get routes() {
        return {
            '/users': 'help',
            '/users-reset': 'reset',
        }
    }

    help($) {
        UserService.updateUser($.message.from);
    }

    reset($) {
        UserService.reset($);
    }

}

module.exports = {
    UserController,
    UserService
}