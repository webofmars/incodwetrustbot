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
const galleryUrl        = process.env.GALLERY_URL         || 'http://localhost:3000/gallery'
const photodir          = process.env.PHOTOS_DIRECTORY    || 'photos'
const TGtoken           = process.env.TELEGRAM_BOT_TOKEN  || 'xxxxxxxxxxxx:yyyyyyyyyyyyyyyy'
const redisHost         = process.env.REDIS_HOST          || 'redis'
const redisPort         = process.env.REDIS_PORT          || '6379'
const eventDocUrl       = process.env.EVENT_DOC_URL       || 'http://www.pipo.com/'
const eventGamesPrefix  = process.env.EVENT_GAMES_PREFIX  || "http://localhost:3000/games/"
const playlistUrl       = process.env.PLAYLIST_URL        || 'http://www.deezer.com/'
const admins            = ["fredlight", "Marsary", "KrisTLG", "VincentNOYE", "Orianne55"]
const version           = "0.0.9b"

const TelegramBaseController              = Telegram.TelegramBaseController
const TelegramBaseInlineQueryController   = Telegram.TelegramBaseInlineQueryController
const TelegramBaseCallbackQueryController = Telegram.TelegramBaseCallbackQueryController
const BaseScopeExtension                  = Telegram.BaseScopeExtension
const InlineQueryResultLocation           = Telegram.InlineQueryResultLocation
const InputFile                           = Telegram.InputFile

console.log("INFO: " + JSON.stringify(process.versions));
console.dir("INFO: TG BOT TOKEN: " + TGtoken)

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

/* -----------------------------------------------------------------------------
 * Class with static functions used by the bot itself
 * -----------------------------------------------------------------------------
 */
class BotTools {

  static broadcastText(scope, msg) {
   console.log("Brodacat to " + JSON.stringify(ActiveSessions))
   for (var i=0; i< ActiveSessions.sessions().length ; i++) {
     // TODO : The broadcast should exclude the sender maybe ?
     tg.api.sendMessage(ActiveSessions.sessions()[i], msg)
   }
 }

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

  static AddPhotoToGallery($) {
    console.log('+++ AddPhotoToGallery')
    if ($.message.from.username.toLowerCase() == 'null') {
      $.message.from.username = 'Anonymous'
    }
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

}


/* -----------------------------------------------------------------------------
 * Telegram Controllers
 * -----------------------------------------------------------------------------
 */
class HelpController extends TelegramBaseController {

    handle($) {
        BotTools.UsersAndSessionsRegister($)
        $.sendMessage("Usage: \n\
        /start : start playing with me \n \
        /help : display help message \n \
        /ping : check if i'am still alive ;-) \n \
        /photo : send me a photo \n \
        /gallery : show me the onlmine photo gallery of the event \n \
        /scores : show me the event scores \n \
        /contacts : show me the orgas contact \n \
        /places : show me the meeting point on a map \n \
        /programm : send me again the programm document \n \
        /playlist : send me some good sound of Marseille \n \
        /version : show the bot version \n \
        /xxxxxxxx : there is some hidden commands ... find it :-)");
    }
}

class DefaultController extends TelegramBaseController {

   handle($) {
      BotTools.UsersAndSessionsRegister($)

      if ($.message.photo) {
        console.log('- Got a photo from ' + $.message.from.username);
        BotTools.AddPhotoToGallery($)
      }
      else if ($.message.document) {
        console.log('- got a document from ' + $.message.from.username)
        console.log(JSON.stringify($.message))
        $.sendMessage('Please send your photo as type photo and not attachement...')
      }
      else {
        console.log('- Unknown request received from ' + $.message.from.username)
        console.log(JSON.stringify($.message))
      }
    }
}

class PingController extends TelegramBaseController {
    handle($) {
        BotTools.UsersAndSessionsRegister($)
        $.sendMessage('pong')
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
    $.sendVenue(43.298829, 5.383786, "Apero @Music Kiosk | "                + 'Friday 30th, '  + '18h',   '49 allée Léon Gambetta');

    $.sendVenue(43.286325, 5.383802, 'Hike @Castellane Metro Station | '    + 'Saturday 1st, ' + '9h30',  'Place Castellane')
    $.sendVenue(43.297334, 5.365755, 'City Tour @Place de Lenche | '        + 'Saturday 1st, ' + '10h',   'Place de lenche')
    $.sendVenue(43.294700, 5.358056, 'Pic-Nic @Parc du Pharo | '            + 'Saturday 1st, ' + '14h',   'Palais du Pharo')
    $.sendVenue(43.295284, 5.386855, 'Pub Crawling @Tables de la Plaine | ' + 'Saturday 1st, ' + '19h30', 'Place Jean Jaurès')

    $.sendVenue(43.295793, 5.375202, 'Velo Tour @Place Gabriel Péri | '     + 'Sunday 2nd, '   + '10h30', '1 Rue Reine Elisabeth')
    $.sendVenue(43.295384, 5.387426, 'Brunch @Brasserie le 31 | '           + 'Sunday 2nd, '   + '11h30', '27 place Jean Jaurès')
  }
}

class ProgrammController extends TelegramBaseController {
  handle($) {
    BotTools.UsersAndSessionsRegister($)
    $.sendMessage('Please wait until the download is finished...')
    $.sendDocument(InputFile.byUrl(eventDocUrl, 'ICWT.pdf'))
  }
}

class VersionController extends TelegramBaseController {
  handle($) {
    BotTools.UsersAndSessionsRegister($)
    $.sendMessage('Version ' + version)
  }
}

class SetScoreController extends TelegramBaseController {

  handle($) {
      console.log("+++ SetScoreController")
      BotTools.UsersAndSessionsRegister($)

      console.log("SetScoreController: user="  + $.message.from.username);
      if (admins.indexOf($.message.from.username) == -1) {
        console.log("Unauthorized access: " + $.message.from.username)
        $.sendMessage("You are not authorized to call this command !")
        return false;
      }

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

class StartGameController extends TelegramBaseController {

  handle($) {
      console.log("+++ StartGameController")
      BotTools.UsersAndSessionsRegister($)

      console.log("StartGameController: user="  + $.message.from.username);
      if (admins.indexOf($.message.from.username) == -1) {
        console.log("Unauthorized access: " + $.message.from.username)
        $.sendMessage("You are not authorized to call this command !")
        return false;
      }

      console.log("StartGameController: number="  + $.query.gameid);
      if (typeof $.query.gameid !== 'undefined') {
        console.log("++ starting game " + $.query.gameid)
        BotTools.broadcastText($, eventGamesPrefix + $.query.gameid);
      }
  }
}

class FunChatouilleController extends TelegramBaseController {
  handle($) {
    BotTools.UsersAndSessionsRegister($)
    BotTools.broadcastText($, "HI HI HI ! please stop !")
  }
}

class FunCodController extends TelegramBaseController {
  handle($) {
    console.log('+++ FunCodController')
    BotTools.UsersAndSessionsRegister($)
    var choice = Math.floor((Math.random() * 3) + 1);
    switch(choice) {
      case 1:
        console.log('+ sending photo')
        $.sendPhoto(InputFile.byUrl('http://lesturgeons.blogs.nouvelobs.com/media/01/00/278174761.jpg', 'cod-styleeee.jpg'))
        break;
      case 2:
        console.log('+ sending video')
        $.sendMessage('https://www.youtube.com/watch?v=zjBj9O3YdMw');
        break;
      case 3:
        console.log('+ sending audio')
        $.sendMessage('http://www.deezer.com/track/540175');
        break;
    }
  }
}

class PhotoController extends TelegramBaseController {
  handle($) {
    BotTools.UsersAndSessionsRegister($);
    $.sendMessage('OK ! send me a photo now, i will wait for it...' );

    $.waitForRequest.then($ => {
      if ($.message.photo) {
        BotTools.AddPhotoToGallery($);
      }
    })
  }
}

class PlaylistController extends TelegramBaseController {
  handle($) {
    $.sendMessage(playlistUrl);
  }
}

/* Telegram Routes */
/* Cut and paste this list on BotFather /setcommands
start - start playing with me
help - display help message
ping - check if i'am still alive ;-)
photo - send me a photo
gallery - show me the onlmine photo gallery of the event
scores - show me the event scores
contacts - show me the orgas contact
places - show me the meeting point on a map
programm - send me again the programm document
version - show the bot version
xxxxxxxx - there is some hidden commands ... find it :-)
*/
tg.router
    .when([/^\/start$/], new HelpController())
    .when([/^\/help$/], new HelpController())
    .when([/^\/ping$/], new PingController())
    .when([/^\/photo$/], new PhotoController())
    .when([/^\/gallery$/], new GalleryController())
    .when([/^\/scores$/], new ScoresController())
    .when([/^\/contacts$/], new ContactsController())
    .when([/^\/places$/], new PlacesController())
    .when([/^\/programm$/], new ProgrammController())
    .when([/^\/playlist$/], new PlaylistController())
    .when([/^\/version$/], new VersionController())
    // Hidden functions
    .when([/^\/debug$/], new DebugController())
    .when(['/scoreset :team :delta'], new SetScoreController())
    .when(['/gamestart :gameid'], new StartGameController())
    .when([/^\/giligili$/], new FunChatouilleController())
    .when([/^\/cod$/], new FunCodController())
    .otherwise(new DefaultController())

console.log('Listing for request on Telegram API ...')
