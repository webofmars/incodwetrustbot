/******************************************************************************
references :
  - http://core.telegram.org/bots/api
  - http://github.com/Naltox/telegram-node-bot
  - http://nabovyan.xyz/telegram-node-bot/index.html
*******************************************************************************/
'use strict'

const UsersDB         = require('./lib/UsersDB.js')
const SessionsManager = require('./lib/SessionsManager.js')
const dl              = require('download-file')
const Telegram        = require('telegram-node-bot')
const Redis           = require('redis');

const dlurl           = 'https://api.telegram.org/file/bot'
const photodir        = 'photos'
const galleryUrl      = 'https://icwt.services.webofmars.com/gallery'
const TGtoken         = '193218920:AAG9G1zm9K1EFaIHt4HgCwv3AkM0JJozlYA'
const redisPort       = 6379
const redisHost       = 'redis'
const eventDocUrl     = 'https://s3.eu-central-1.amazonaws.com/incodwetrust-statics/Prog-InCodWeTrust-EN-2016-v1.pdf'

const TelegramBaseController              = Telegram.TelegramBaseController
const TelegramBaseInlineQueryController   = Telegram.TelegramBaseInlineQueryController
const TelegramBaseCallbackQueryController = Telegram.TelegramBaseCallbackQueryController
const BaseScopeExtension                  = Telegram.BaseScopeExtension
const InlineQueryResultLocation           = Telegram.InlineQueryResultLocation
const InputFile                           = Telegram.InputFile

console.log("INFO: " + JSON.stringify(process.versions));

var tg              = new Telegram.Telegram(TGtoken)
var users           = new UsersDB()
var ActiveSessions  = new SessionsManager()

// TODO: rationalize
/* Express web component */
const express = require('express');
const app     = express();

app.set('views', __dirname + '/node-gallery/views');
app.set('view engine', 'ejs');
app.use(express.static('./node-gallery/resources'));
app.listen(3000, function () {
  console.log('Started Express App on port 3000/tcp ...');
});

app.use('/gallery', require('node-gallery')({
  staticFiles : photodir,
  urlRoot : 'gallery',
  title : 'InCodWeTrust Gallery',
  render: false
}), function(req, res, next){
  return res.render('gallery', { galleryHtml : req.html });
});


/* Redis connexion */
var redisdb = Redis.createClient(redisPort, redisHost);
redisdb.on('ready', function() {
    console.log('Connected to Redis');

    // init the sessions manager with saved db
    debugger;
    redisdb.smembers('sessions', function (err, reply) {
      if (err) { console.log("Error when loading active sessions: " + err) }
      else {
        if (reply != null && reply != "") {
            console.log("DEBUG: ActiveSessions creation: " + JSON.stringify(reply))
            ActiveSessions.hydrate(reply)
        }
        else {
          console.log("DEBUG: no sessions were loaded from redis")
        }
      }
    })
});

class BotTools {

/**
 * @param {Scope} scope
 * @param {string} msg
 **/
 static broadcastText(scope, msg) {
   console.log("Brodacat to " + JSON.stringify(ActiveSessions))
   for (var i=0; i< ActiveSessions.sessions().length ; i++) {
     // TODO : The broadcast should exclude the sender maybe ?
     tg.api.sendMessage(ActiveSessions.sessions()[i], msg)
   }
 }

  /**
  * @param {Scope} scope
  * @param {string} msg
  * @param {string} file
  **/
  static broadcastImg(scope, msg, file) {
    console.log("Brodacat to " + JSON.stringify(ActiveSessions))
    for (var i=0; i< ActiveSessions.sessions().length ; i++) {
      // TODO : The broadcast should exclude the sender maybe ?
      tg.api.sendMessage(ActiveSessions.sessions()[i], msg)
      tg.api.sendPhoto(ActiveSessions.sessions()[i], InputFile.byFilePath(file))
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
        redisdb.sadd('sessions', ActiveSessions.sessions(), redisdb.print)
        $.sendMessage("Usage: \n\
 /help    : this help \n\
 /ping    : verify bot health\n\
 /photo   : send us a photo\n\
 /gallery : display the gallery\n\
 /scores  : display the current teams scores")
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
            var filename = /[^\/]+$/.exec(daFile.filePath)
            var photopath = photodir + '/' + $.message.from.username + '/' + filename
            var photourlpath = '/' + $.message.from.username + '/photo/' + /^(.*)\..*$/.exec(filename)[1]
            var photourl = galleryUrl + photourlpath
            console.log('    Downloading ' + url + '...')
            dl(url, {directory: photodir + '/' + $.message.from.username, filename: filename},
              function(err) {
                if (err) { throw err; console.log("An error occured: " + JSON.stringify(err))}
                else {
                  console.log('    Saved to ' + photopath)
                  console.log('')
                  $.sendMessage('Merci ' + $.message.from.username)
                  BotTools.broadcastImg($, 'Nouvelle photo de ' + $.message.from.username + "\n" + photourl + "\n", photopath)
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
    $.sendMessage('Sessions = ' + ActiveSessions.sessions())
  }
}

class ScoresController extends TelegramBaseController {
  handle($) {
    redisdb.get("scores", function (err, reply) {
      if (err) { console.log(err); exit };
      $.sendMessage("*Voici les scores*:\n" + JSON.stringify(reply), { parse_mode: 'Markdown' });
    });
  }

}

class ContactsController extends TelegramBaseController {
  handle($) {
    $.sendContact("+33 6 52 77 53 54", "Frederic")
    $.sendContact("+33 6 85 53 48 44", "Mary")
    $.sendContact("+33 6 58 02 07 06", "Orianne")
    $.sendContact("+33 6 62 68 90 65", "Vincent")
    $.sendContact("+33 6 58 41 48 86", "Kristell")
    $.sendContact("+33 6 60 79 75 00", "Thomas")
    $.sendContact("+33 6 10 72 18 15", "Anne")
  }
}

class PlacesController extends TelegramBaseController {
  handle($) {
    $.sendVenue(43.298829, 5.383786, "Kiosque a musique - Friday 30th - 19h30", "49 allée Léon Gambetta")
    $.sendVenue(43.297334, 5.365755, "Place de lenche - Saturday 1st - 9h30", "Place de lenche")
    $.sendVenue(43.271464, 5.392409, "Metro Station - Saturday 1st - 10h00", "16 boulevard Michelet")
    $.sendVenue(43.295384, 5.387426, "Brasserie le 31 - Sunday 2nd - 10h30", "27 place Jean Jaurès")
    $.sendVenue(43.295793, 5.375202, "Metro Vieux Port, Place Gabriel Péri - Station LeVelo - Sunday 2nd - 10h30", "1 Rue Reine Elisabeth")
  }
}

class ProgrammController extends TelegramBaseController {
  handle($) {
    $.sendMessage('Please wait until the download is finished...')
    $.sendDocument(InputFile.byUrl(eventDocUrl, 'Prog-InCodWeTrust-EN-2016-v1.pdf'))
  }
}

/* Telegram Routes */
/* Cut and paste this list on BotFather /setcommands
start - start playing with me
help - display help message
ping - check if i'am still alive ;-)
gallery - show me the onlmine photo gallery of the event
scores - show me the event scores
contacts - show me the orgas contact
places - show me the meeting point on a map
programm - send me again the programm document
xxxxxxxx - there is some hidden commands ... find it :-)
*/
tg.router
    .when(['start'], new HelpController())
    .when(['help'], new HelpController())
    .when(['ping'], new PingController())
    .when(['photo'], new DefaultController())
    .when(['gallery'], new GalleryController())
    .when(['scores'], new ScoresController())
    .when(['contacts'], new ContactsController())
    .when(['places'], new PlacesController())
    .when(['programm'], new ProgrammController())
    .when(['debug'], new DebugController())
    //.inlineQuery(new InlineQueryController())
    //.callbackQuery(new CallbackQueryController())
    .otherwise(new DefaultController())

console.log('Listing for request on Telegram API ...')
