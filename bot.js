'use strict'

const Telegram = require('telegram-node-bot')
const TelegramBaseController = Telegram.TelegramBaseController
const tg = new Telegram.Telegram('193218920:AAG9G1zm9K1EFaIHt4HgCwv3AkM0JJozlYA')
const http = require('https')

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

class DefaultController extends TelegramBaseController {
   /**
    * @param {Scope} $
    */
    handle($) {
      if ($.message.photo) {
        console.log('Got a photo !');
        $.message.photo.forEach(function (item, index, array) {
          console.log('PhotoSize ' + index + ': ' + item.fileId + '_' + item.width + 'x' + item.height)
        })
      }
      else {
        console.log('Unknown request received: ')
        console.log('   Date : ' + $.message.date)
        console.log('   Id   : ' + $.message.messageId)
        console.log('   User : ' + $.message.from.username)
        console.log('   Text : ' + $.message.text)
        console.log('   Photo: ' + $.message.photo)
        console.log(' ')
        $.sendMessage('Désolé mais je comprends nib ...');
      }
    }
}

class HelpController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    helpHandler($) {
        $.sendMessage('usage: \
           /help  : this help \
           /photo : send us a photo \
           /ping  : verify bot health')
    }

    get routes() {
        return {
            'help': 'helpHandler'
        }
    }
}

class PhotoController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    photoHandler($) {
      console.log('received a new photo')
      $.message.photo.toJSON()
    }

    get routes() {
        return {
            'photo': 'photoHandler'
        }
    }
}


tg.router
    .when(['ping'], new PingController())
    .when(['photo'], new PhotoController())
    .when(['help'], new HelpController())
    .when(['start'], new HelpController())
    .otherwise(new DefaultController())
