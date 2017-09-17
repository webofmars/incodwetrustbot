'use strict'

const BotTools = require('../BotTools.js');
const RedisStorage = require('../redis-storage');
const UsersDB = require('../UsersDB.js');
const SessionsManager = require('../SessionsManager.js');
const UserModel = require('../models/user.js')

const Telegram = require('telegram-node-bot');
const TelegramBaseController = Telegram.TelegramBaseController
const YAML = require('yamljs');

class UserController extends TelegramBaseController {

    get routes() {
        return {
            '/users-reset': 'reset',
            '/users': 'help',
            // '/users-list': 'list',
        }
    }

    help($) {
        BotTools.UsersAndSessionsRegister($);
        console.log('help');
        // TODO
        this.list($);
    }

    loadDefault($) {
        BotTools.UsersAndSessionsRegister($);
        const entities = YAML.load(__dirname + '/../../data/default-users.yml');
        return RedisStorage.createAll('UserModel', entities);
    }

    init() {
        console.log('+ UserController init');

        RedisStorage.isEmpty(UserModel).then(isEmpty => {
            if (isEmpty) {
                console.log('+ UserController init: init entities');
                this.loadDefault()
                    .then(results => console.log('+ UserController %d UserModel entitites have been created', results.length))
                    .catch(err => console.log('+ UserController Error creating UserModel entitites', err));
            } else {
                console.log('+ UserController init: entities already loaded');
            }
        });
    }

    reset($) {
        BotTools.UsersAndSessionsRegister($);
        console.log('+ UserController reset');
        this.clear($).then(() => {
            return this.loadDefault($);
        }).then(() => {
            $.sendMessage('Users reset');
            return this.list($);
        });
    }

    clear($) {
        BotTools.UsersAndSessionsRegister($);
        return RedisStorage.findAndRemoveAll(UserModel);
    }

    list($) {
        BotTools.UsersAndSessionsRegister($);
        console.log('+ UserController list  ');
        return RedisStorage.findAll(UserModel).then(users => {
            // console.log('Users: ', users);
            let msg = 'Users(s):\n' + users
                .map((user, i) => '' + user.p('id') + ') ' + user.getFullName()).join('\n');
            $.sendMessage(msg)
        });
    }

}

module.exports = UserController;