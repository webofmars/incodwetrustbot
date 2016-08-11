'use strict'

const Telegram = require('telegram-node-bot')
const TelegramBaseController = Telegram.TelegramBaseController
const tg = new Telegram.Telegram('193218920:AAG9G1zm9K1EFaIHt4HgCwv3AkM0JJozlYA')

var http = require('https')
var ProxyAgent = require('proxy-agent');
var proxyUri = process.env.http_proxy || 'http://127.0.0.1:3129';

class PingController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    pingHandler($) {
        $.sendMessage('pong')
    }

    get routes() {
        return {
            'ping': 'pingHandler'
        }
    }
}

tg.router
    .when(['ping'], new PingController())
