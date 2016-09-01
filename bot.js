/******************************************************************************
references :
  - https://core.telegram.org/bots/api
  - https://github.com/Naltox/telegram-node-bot
  - http://nabovyan.xyz/telegram-node-bot/index.html
*******************************************************************************/

'use strict'

const UsersDB         = require('./lib/UsersDB.js')
const SessionManager  = require('./lib/SessionManager.js')
const dl              = require('download-file')
const Telegram        = require('telegram-node-bot')

const dlurl           = 'https://api.telegram.org/file/bot'
const photodir        = __dirname + '/gallery/albums'
//const galleryUrl      = 'http://incod.services.webofmars.com/gallery/'
const galleryUrl      = 'http://localhost:3000/'
const TGtoken         = '193218920:AAG9G1zm9K1EFaIHt4HgCwv3AkM0JJozlYA'

const TelegramBaseController              = Telegram.TelegramBaseController
const TelegramBaseInlineQueryController   = Telegram.TelegramBaseInlineQueryController
const TelegramBaseCallbackQueryController = Telegram.TelegramBaseCallbackQueryController
const BaseScopeExtension                  = Telegram.BaseScopeExtension
const InlineQueryResultLocation           = Telegram.InlineQueryResultLocation

var tg              = new Telegram.Telegram(TGtoken)
var users           = new UsersDB()
var ActiveSessions  = new SessionManager()

// TODO: rationalize
/* Express web component */
const express = require('express');
const app     = express();

app.set('views', __dirname + '/gallery');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/gallery/'));
app.listen(3000, function () {
  console.log('Started Express App on port 3000/tcp ...');
});

// TODO: better views of gallery
app.use('/gallery', require('node-gallery')({
  staticFiles : 'gallery/albums',
  urlRoot : 'gallery',
  title : 'InCodWeTrust Gallery',
  render: false
}), function(req, res, next){
  return res.render('gallery', { galleryHtml : req.html });
});

class ToolsScopeExtension extends BaseScopeExtension {

/**
 * @param {Scope} $
 **/
 broadcast(scope, msg) {
  console.log("Brodacat to " + JSON.stringify(ActiveSessions))
  for (var i=0; i< ActiveSessions.sessions().length ; i++) {
    tg.api.sendMessage(ActiveSessions.sessions()[i], msg)
  }
 }

}

/* Telegram Controllers */

class InlineQueryController extends TelegramBaseInlineQueryController {
  /**
  *@param: {InlineScope} $
  **/
  handle($) {
    console.log("Je suis INLINE mec !")
    // FIXME: dont work
    $.answer({type: 'location', id: 'ICWT-001', latitude: 43.316501, longitude: 5.364755, title: 'Marseille c\'est là'})
  }

  chosenResult($) {

  }
}

class CallbackQueryController extends TelegramBaseCallbackQueryController {
  handle($) {
    console.log("Youuuuoooooo call back !")
    $.sendMessage('CallBack !')
  }
}

class HelpController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    helpHandler($) {
        ActiveSessions.add($.message.chat.id)
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
            var photopath = photodir + '/' + $.message.from.username + '/' + daPhoto.fileId + ext
            var photourl = galleryUrl + photopath
            console.log('    Downloading ' + url + '...')
            dl(url, {directory: photodir + '/' + $.message.from.username, filename: daPhoto.fileId + ext},
              function(err) {
                if (err) { throw err; console.log("An error occured: " + JSON.stringify(err))}
                else {
                  console.log('    Saved to ' + photopath)
                  console.log('')
                  $.sendMessage('Merci ' + $.message.from.username)
                  $.broadcast($, 'Nouvelle photo de ' + $.message.from.username + "\n" + photourl)
                }
              }
            )
          })
      }
      else {
        console.log('- Unknown request received from ' + $.message.from.username)
        console.log(JSON.stringify($.message))
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

class DebugController extends TelegramBaseController {
  handle($) {
    $.sendMessage('Users    = ' + users.dump())
    $.sendMessage('Sessions = ' + ActiveSessions.dump())
  }
}

class ScoresController extends TelegramBaseController {
  handle($) {
    $.sendMessage("*Voici les scores*:\n- Equipe Rouge: 7\n- Equipe Bleue: 2\n- Equipe Jaune: 1", { parse_mode: 'Markdown' })
  }

}


/* Telegram Routes */
tg.router
    .when(['ping'], new PingController())
    .when(['photo'], new DefaultController())
    .when(['help'], new HelpController())
    .when(['start'], new HelpController())
    .when(['gallery'], new GalleryController())
    .when(['debug'], new DebugController())
    .when(['scores'], new ScoresController())
    .inlineQuery(new InlineQueryController())
    .callbackQuery(new CallbackQueryController())
    .otherwise(new DefaultController())

console.log('Listing for request on Telegram API ...')
