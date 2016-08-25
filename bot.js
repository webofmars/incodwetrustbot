'use strict'

const UsersDB = require('./lib/UsersDB.js')

const TGtoken = '193218920:AAG9G1zm9K1EFaIHt4HgCwv3AkM0JJozlYA'
const Telegram = require('telegram-node-bot')
const TelegramBaseController = Telegram.TelegramBaseController
const tg = new Telegram.Telegram(TGtoken)
const dl = require('download-file')
const dlurl = 'https://api.telegram.org/file/bot'
const photodir = './photos'
const galleryUrl = 'http://incod.services.webofmars.com/gallery/'
const users = new UsersDB()

/* Express web component */
const express = require('express');
const app = express();
app.listen(3000, function () {
  console.log('Started Express App on port 3000/tcp ...');
});

app.use('/gallery', require('node-gallery')({
  staticFiles : photodir,
  urlRoot : 'gallery',
  title : 'InCodWeTrust Gallery'
}));

/* Telegram Controllers */
class HelpController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    helpHandler($) {
        users.register($)
        $.sendMessage("Usage: \n\
 /help    : this help \n\
 /ping    : verify bot health\n\
 /photo   : send us a photo\n\
 /gallery : display the gallery")
    }

    get routes() {
        return {
            'help': 'helpHandler',
            'start': 'helpHandler'
        }
    }
}

class DefaultController extends TelegramBaseController {
   /**
    * @param {Scope} $
    */
    handle($) {

      if ($.message.photo) {
        console.log('- Got a photo from ' + $.message.from.username);
        var daPhoto = $.message.photo[$.message.photo.length-1]
        console.log('  fileId: ' + daPhoto.fileId)
        console.log('  width: ' + daPhoto.height)
        console.log('  width: ' + daPhoto.width)
        tg.api.getFile(daPhoto.fileId).then(
          function(daFile) {
            var url = dlurl + TGtoken + '/' + daFile.filePath
            var ext = /\..*$/.exec(daFile.filePath)
            console.log('    Downloading ' + url + '...')
            dl(url, {directory: photodir + '/' + $.message.from.username, filename: daPhoto.fileId + ext},
              function(err) {
                if (err) { throw err; console.log("An error occured: " + JSON.stringify(err))}
                else {
                  console.log('    Saved to ' + photodir + '/' + $.message.from.username + '/' + daPhoto.fileId + ext)
                  console.log('')
                  $.sendMessage('Merci ' + $.message.from.username)
                }
              }
            )
          })
      }
      else {
        console.log('- Unknown request received: ')
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

class GalleryController extends TelegramBaseController {
  /**
   * @param {Scope} $
   */
   handle($) {
     $.sendMessage('[Gallerie Photos](' + galleryUrl +')', { parse_mode: 'Markdown' })
  }
}

class ShowUsersController extends TelegramBaseController {
  handle($) {
    $.sendMessage('Users = ' + users.dump())
  }
}

/* Telegram Routes */
tg.router
    .when(['ping'], new PingController())
    .when(['photo'], new DefaultController())
    .when(['help'], new HelpController())
    .when(['start'], new HelpController())
    .when(['gallery'], new GalleryController())
    .when(['susers'], new ShowUsersController())
    .otherwise(new DefaultController())

console.log('Listing for request on Telegram API ...')
