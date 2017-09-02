const Config = require('./Config.js');
const SessionsManager = require('./SessionsManager.js');
const UsersDB = require('./UsersDB.js');

const dl = require('download-file');
const Telegram = require('telegram-node-bot');
const redisdb = require('./redisdb');

/* -----------------------------------------------------------------------------
 * Class with static functions used by the bot itself
 * -----------------------------------------------------------------------------
 */
var ActiveSessions = new SessionsManager();

console.log('Load BotTools');

console.log("INFO: " + JSON.stringify(process.versions));
console.dir("INFO: TG BOT TOKEN: " + Config.TGtoken)


var tg = new Telegram.Telegram(Config.TGtoken);
var users = new UsersDB();
var scores = {};

class BotTools {

    static tg() {
        return tg;
    }
    static scores() {
        return scores;
    }

    static checkAdminAccess($) {
        var username = BotTools.getUsername($.message)
        if (Config.admins.indexOf(username) == -1) {
            console.log('Unauthorized access for "%s": admins:', username, Config.admins)
            $.sendMessage("You are not authorized to call this command !")
            return false;
        }
        return true;
    }

    static hydrateSessions(sessions) {
        ActiveSessions.hydrate(sessions)
    }

    static getUsername(msg) {
        console.log('\n=> Message from: ', msg.from);
        var username = msg.from.username;
        if (username == null) {
            username = 'Anonymous'
        }
        return username;
    }

    static broadcastText(scope, msg) {
        console.log("Brodacat to " + JSON.stringify(ActiveSessions))
        for (var i = 0; i < ActiveSessions.sessions().length; i++) {
            console.log('- to ' + ActiveSessions.sessions()[i])
            // TODO : The broadcast should exclude the sender maybe ?
            tg.api.sendMessage(ActiveSessions.sessions()[i], msg)
        }
    }

    static broadcastImg(scope, msg, file) {
        console.log("Brodacat to " + JSON.stringify(ActiveSessions))
        for (var i = 0; i < ActiveSessions.sessions().length; i++) {
            // TODO : The broadcast should exclude the sender maybe ?
            console.log('- to ' + ActiveSessions.sessions()[i])
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
        var username = BotTools.getUsername($.message)

        var daPhoto = $.message.photo[$.message.photo.length - 1]
        console.log('  fileId: ' + daPhoto.fileId)
        console.log('  width: ' + daPhoto.height)
        console.log('  width: ' + daPhoto.width)
        tg.api.getFile(daPhoto.fileId).then(
            function (daFile) {
                var url = dlurl + TGtoken + '/' + daFile.filePath
                var ext = /\..*$/.exec(daFile.filePath)
                var filename = /[^\/]+$/.exec(daFile.filePath)
                var photopath = photodir + '/' + username + '/' + filename
                var photourlpath = '/' + BotTools.getUsername($.message) + '/photo/' + /^(.*)\..*$/.exec(filename)[1]
                var photourl = galleryUrl + photourlpath
                console.log('    Downloading ' + url + '...')
                dl(url, {
                        directory: photodir + '/' + username,
                        filename: filename
                    },
                    function (err) {
                        if (err) {
                            throw err;
                            console.log("An error occured: " + JSON.stringify(err))
                        } else {
                            console.log('    Saved to ' + photopath)
                            console.log('')
                            $.sendMessage('Merci ' + username)
                            BotTools.broadcastImg($, 'Nouvelle photo de ' + username + "\n" + photourl + "\n", photopath)
                        }
                    }
                )
            })
    }

}

module.exports = BotTools;