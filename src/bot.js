/******************************************************************************
references :
  - http://core.telegram.org/bots/api
  - http://github.com/Naltox/telegram-node-bot
  - http://nabovyan.xyz/telegram-node-bot/index.html
*******************************************************************************/
'use strict'

const redisdb = require('./lib/redisdb');
const Config = require('./lib/Config.js');
const BotTools = require('./lib/BotTools.js');
const UsersDB = require('./lib/UsersDB.js');
const dl = require('download-file');
const Telegram = require('telegram-node-bot');
const Quizz = require('./bot/quizz.js');
const QuizzController = Quizz.QuizzController;
const QuizzService = Quizz.QuizzService;
const Teams = require('./bot/teams.js');
const TeamsController = Teams.TeamsController;
const TeamsService = Teams.TeamsService;

const dlurl = 'https://api.telegram.org/file/bot';

const TelegramBaseController = Telegram.TelegramBaseController
const TelegramBaseInlineQueryController = Telegram.TelegramBaseInlineQueryController
const TelegramBaseCallbackQueryController = Telegram.TelegramBaseCallbackQueryController
const BaseScopeExtension = Telegram.BaseScopeExtension
const InlineQueryResultLocation = Telegram.InlineQueryResultLocation
const InputFile = Telegram.InputFile

/* Express web component */
const express = require('express');
const app = express();

QuizzService.init();
TeamsService.init();

app.set('views', __dirname + '/node-gallery/views');
app.set('view engine', 'ejs');
app.use(express.static('./node-gallery/resources'));
app.listen(3000, function () {
  console.log('Started Express App on port 3000/tcp ...');
});

app.use('/gallery', require('node-gallery')({
  staticFiles: Config.photodir,
  urlRoot: 'gallery',
  title: 'InCodWeTrust Gallery',
  render: false
}), function (req, res, next) {
  return res.render('gallery', {
    galleryHtml: req.html
  });
});

/* Folders for some static files */
app.use(express.static('public'));

/* Redis connexion */
redisdb.on('ready', function () {
  console.log('Connected to Redis');

  // init the sessions manager with saved db
  redisdb.smembers('sessions', function (err, reply) {
    if (err) {
      console.log("Error when loading active sessions: " + err)
    } else {
      if (reply != null && reply != "") {
        console.log("DEBUG: ActiveSessions creation: " + JSON.stringify(reply))
        BotTools.hydrateSessions(reply)
      } else {
        console.log("DEBUG: no sessions were loaded from redis")
      }
    }
  })
});

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
    var username = BotTools.getUsername($.message)
    BotTools.UsersAndSessionsRegister($)

    if ($.message.photo) {
      console.log('- Got a photo from ' + username);
      BotTools.AddPhotoToGallery($)
    } else if ($.message.document) {
      console.log('- got a document from ' + username)
      console.log(JSON.stringify($.message))
      $.sendMessage('Please send your photo as type photo and not attachement...')
    } else {
      if (!QuizzService.tryToProcessAnswer($)) {
        console.log('- Unknown request received from ' + username)
        console.log(JSON.stringify($.message))
      }
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
    $.sendMessage('[Gallerie Photos](' + Config.galleryUrl + ')', {
      parse_mode: 'Markdown'
    })
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
      if (err) {
        console.log("Redis Error: " + err);
        exit
      };
      if (reply) {
        console.log("+++ ScoresController scores:", reply.toString())
        $.sendMessage("*Voici les scores*:\n" + reply.toString().replace(/\{/g, '').replace(/\}/g, '').replace(/:/g, ' : ').replace(/"/g, '').replace(/,/g, "\n"), {
          parse_mode: 'Markdown'
        });
      }else{
        $.sendMessage("Les scores ne sont pas disponibles.");
      }
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
    $.sendVenue(43.298829, 5.383786, "Apero @Music Kiosk | " + 'Friday 30th, ' + '18h', '49 allée Léon Gambetta');

    $.sendVenue(43.286325, 5.383802, 'Hike @Castellane Metro Station | ' + 'Saturday 1st, ' + '9h30', 'Place Castellane')
    $.sendVenue(43.297334, 5.365755, 'City Tour @Place de Lenche | ' + 'Saturday 1st, ' + '10h', 'Place de lenche')
    $.sendVenue(43.294700, 5.358056, 'Pic-Nic @Parc du Pharo | ' + 'Saturday 1st, ' + '14h', 'Palais du Pharo')
    $.sendVenue(43.295284, 5.386855, 'Pub Crawling @Tables de la Plaine | ' + 'Saturday 1st, ' + '19h30', 'Place Jean Jaurès')

    $.sendVenue(43.295793, 5.375202, 'Velo Tour @Place Gabriel Péri | ' + 'Sunday 2nd, ' + '10h30', '1 Rue Reine Elisabeth')
    $.sendVenue(43.295384, 5.387426, 'Brunch @Brasserie le 31 | ' + 'Sunday 2nd, ' + '11h30', '27 place Jean Jaurès')
  }
}

class ProgrammController extends TelegramBaseController {
  handle($) {
    BotTools.UsersAndSessionsRegister($)
    $.sendMessage('Please wait until the download is finished...')
    $.sendDocument(InputFile.byUrl(Config.eventDocUrl, 'ICWT.pdf'))
  }
}

class VersionController extends TelegramBaseController {
  handle($) {
    BotTools.UsersAndSessionsRegister($)
    $.sendMessage('Version ' + Config.version)
  }
}

class SetScoreController extends TelegramBaseController {

  handle($) {
    console.log("+++ SetScoreController")
    BotTools.UsersAndSessionsRegister($)

    if (!BotTools.checkAdminAccess($)) {
      return false;
    }

    console.log("SetScoreController: team=" + $.query.team);
    console.log("SetScoreController: delta=" + $.query.delta);

    const scores = BotTools.scores();

    console.log("scores A: " + JSON.stringify(scores));
    if (typeof scores[$.query.team] !== 'undefined') {
      scores[$.query.team] = parseInt(scores[$.query.team]) + parseInt($.query.delta)
    } else {
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
    var username = BotTools.getUsername($.message)
    BotTools.UsersAndSessionsRegister($)

    console.log("StartGameController: user=" + username);
    if (!BotTools.checkAdminAccess($)) {
      return false;
    }

    console.log("StartGameController: number=" + $.query.gameid);
    if (typeof $.query.gameid !== 'undefined') {
      console.log("++ starting game " + $.query.gameid)
      BotTools.broadcastText($, Config.eventGamesPrefix + $.query.gameid);
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
    switch (choice) {
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
    $.sendMessage('OK ! send me a photo now, i will wait for it...');

    $.waitForRequest.then($ => {
      if ($.message.photo) {
        BotTools.AddPhotoToGallery($);
      }
    })
  }
}

class PlaylistController extends TelegramBaseController {
  handle($) {
    $.sendMessage(Config.playlistUrl);
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
BotTools.tg().router
  .when(['/quizz-restart :quizzname', '/quizz-start :quizzname', '/quizz-skip', '/quizz'], new QuizzController())
  .when(['/teams-members', '/teams-scores', '/teams-reset', '/teams'], new TeamsController())
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