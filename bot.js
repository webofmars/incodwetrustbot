/******************************************************************************
references :
  - http://core.telegram.org/bots/api
  - http://github.com/Naltox/telegram-node-bot
  - http://nabovyan.xyz/telegram-node-bot/index.html
*******************************************************************************/
'use strict'

const UsersDB           = require('./lib/UsersDB.js');
const SessionsManager   = require('./lib/SessionsManager.js');
const dl                = require('download-file');
const Telegram          = require('telegram-node-bot');
const Redis             = require('redis');

const dlurl             = 'https://api.telegram.org/file/bot'
const galleryUrl        = process.env.GALLERY_URL
const photodir          = process.env.PHOTOS_DIRECTORY
const TGtoken           = process.env.TELEGRAM_BOT_TOKEN
const redisHost         = process.env.REDIS_HOST
const redisPort         = process.env.REDIS_PORT
const eventDocUrl       = process.env.EVENT_DOC_URL

const TelegramBaseController              = Telegram.TelegramBaseController
const TelegramBaseInlineQueryController   = Telegram.TelegramBaseInlineQueryController
const TelegramBaseCallbackQueryController = Telegram.TelegramBaseCallbackQueryController
const BaseScopeExtension                  = Telegram.BaseScopeExtension
const InlineQueryResultLocation           = Telegram.InlineQueryResultLocation
const InputFile                           = Telegram.InputFile

console.log("INFO: " + JSON.stringify(process.versions));

var tg              = new Telegram.Telegram(TGtoken);
var users           = new UsersDB();
var ActiveSessions  = new SessionsManager();
var scores          = {};

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

/* Folders for some static files */
app.use(express.static('public'));

/* Redis connexion */
var redisdb = Redis.createClient({host: redisHost, port: redisPort});
redisdb.on('ready', function() {
  console.log('Connected to Redis');

  // init the sessions manager with saved db
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

  static UsersAndSessionsRegister($) {
    ActiveSessions.add($.message.chat.id)
    users.register($)
    redisdb.sadd('sessions', ActiveSessions.sessions(), redisdb.print)
  }

}


/* -----------------------------------------------------------------------------
 * Telegram Controllers
 * -----------------------------------------------------------------------------
 */
class HelpController extends TelegramBaseController {

    helpHandler() {
        BotTools.UsersAndSessionsRegister($)
        $.sendMessage("Usage: \n\
        /start - start playing with me \
        /help - display help message \
        /ping - check if i'am still alive ;-) \
        /gallery - show me the onlmine photo gallery of the event \
        /scores - show me the event scores \
        /contacts - show me the orgas contact \
        /places - show me the meeting point on a map \
        /programm - send me again the programm document \
        /xxxxxxxx - there is some hidden commands ... find it :-)");
    }
}

class DefaultController extends TelegramBaseController {

   /**
    * @param {Scope} $
    */
    handle($) {
      BotTools.UsersAndSessionsRegister($)

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
        BotTools.UsersAndSessionsRegister($)
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
     BotTools.UsersAndSessionsRegister($)
     $.sendMessage('[Gallerie Photos](' + galleryUrl +')', { parse_mode: 'Markdown' })
  }
}

class DebugController extends TelegramBaseController {
  handle($) {
    BotTools.UsersAndSessionsRegister($)
    $.sendMessage('Users    = ' + users.dump())
    $.sendMessage('Sessions = ' + ActiveSessions.sessions())
  }
}

class ScoresController extends TelegramBaseController {
  handle($) {
    console.log("+++ ScoresController")
    BotTools.UsersAndSessionsRegister($)
    redisdb.get("icwt.scores", function (err, reply) {
      if (err) { console.log("Redis Error: "+err); exit };
      $.sendMessage("*Voici les scores*:\n" + reply.toString().replace(/\{/g,'').replace(/\}/g, '').replace(/:/g,' : ').replace(/"/g,'').replace(/,/g,"\n"), { parse_mode: 'Markdown' });
    });
  }

}

class ContactsController extends TelegramBaseController {
  handle($) {
    BotTools.UsersAndSessionsRegister($)
    $.sendContact("+33 6 52 77 53 54", "Frederic")
    $.sendContact("+33 6 85 53 48 44", "Mary")
    $.sendContact("+33 6 58 02 07 06", "Orianne")
    $.sendContact("+33 6 62 68 90 65", "Vincent")
    $.sendContact("+33 6 58 41 48 86", "Kristell")
  }
}

class PlacesController extends TelegramBaseController {
  handle($) {
    BotTools.UsersAndSessionsRegister($)
    $.sendVenue(43.298829, 5.383786, "Kiosque a musique - Friday 30th - 19h30", "49 allée Léon Gambetta")
    $.sendVenue(43.297334, 5.365755, "Place de lenche - Saturday 1st - 9h30", "Place de lenche")
    $.sendVenue(43.271464, 5.392409, "Metro Station - Saturday 1st - 10h00", "16 boulevard Michelet")
    $.sendVenue(43.295384, 5.387426, "Brasserie le 31 - Sunday 2nd - 10h30", "27 place Jean Jaurès")
    $.sendVenue(43.295793, 5.375202, "Metro Vieux Port, Place Gabriel Péri - Station LeVelo - Sunday 2nd - 10h30", "1 Rue Reine Elisabeth")
  }
}

class ProgrammController extends TelegramBaseController {
  handle($) {
    BotTools.UsersAndSessionsRegister($)
    $.sendMessage('Please wait until the download is finished...')
    $.sendDocument(InputFile.byUrl(eventDocUrl, 'Prog-InCodWeTrust-EN-2016-v1.pdf'))
  }
}

class SetScoreController extends TelegramBaseController {

  handle($) {
      console.log("+++ SetScoreController")
      BotTools.UsersAndSessionsRegister($)

      console.log("SetScoreController: user="  + $.message.from.username);
      // TODO: add security check
      console.log("SetScoreController: team="  + $.query.team);
      console.log("SetScoreController: delta=" + $.query.delta);

      console.log("scores A: " + JSON.stringify(scores));
      if (typeof scores[$.query.team] !== 'undefined') {
        scores[$.query.team] = parseInt(scores[$.query.team])+parseInt($.query.delta)
      }
      else {
        scores[$.query.team] = $.query.delta
      }
      console.log("scores B: " + JSON.stringify(scores));

      BotTools.broadcastText($, "Team " + $.query.team + " just won " + $.query.delta + " point(s). Congrats !");
      redisdb.set('icwt.scores', JSON.stringify(scores));
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
    .when(['/start'], new HelpController())
    .when(['/help'], new HelpController())
    .when(['/ping'], new PingController())
    .when(['/photo'], new DefaultController())
    .when(['/gallery'], new GalleryController())
    .when(['/scores'], new ScoresController())
    .when(['/contacts'], new ContactsController())
    .when(['/places'], new PlacesController())
    .when(['/programm'], new ProgrammController())
    // Hidden functions
    .when(['/debug'], new DebugController())
    .when(['/setscore :team :delta'], new SetScoreController())
    //.inlineQuery(new InlineQueryController())
    //.callbackQuery(new CallbackQueryController())
    .otherwise(new DefaultController())

console.log('Listing for request on Telegram API ...')
