'use strict'

const storage = require('../lib/storage');
const BotTools = require('../lib/BotTools.js');
const UsersDB = require('../lib/UsersDB.js');
const SessionsManager = require('../lib/SessionsManager.js');

const Telegram = require('telegram-node-bot');
const TelegramBaseController = Telegram.TelegramBaseController
const YAML = require('yamljs');

let availablesQuizz = {};

let activesQuizz = {};

class QuizzService {

    static init(){

        storage.getJSON('availables-quizz', function(value, key){
            if (value){
                availablesQuizz = value;
            }else{
                availablesQuizz = YAML.load(__dirname + '/../data/default-quizz.yml');
            }
        });

        storage.getJSON('actives-quizz', function(value, key){
            if (value){
                activesQuizz = value;
            }else{
                activesQuizz = {};
            }
        });

    }

    static reset(){

        availablesQuizz = YAML.load(__dirname + '/../data/default-quizz.yml');

        storage.setJSON('availables-quizz', availablesQuizz);

        activesQuizz = {};
        storage.setJSON('actives-quizz', activesQuizz);

    }

    static saveQuizz(quizz){
        storage.setJSON('actives-quizz', activesQuizz);
    }

    static startQuizz($) {
        const quizzname = $.query.quizzname;

        const selectedQuizz = availablesQuizz[quizzname];

        if (!selectedQuizz) {
            console.log('Quizz "%s" not found in available quizz for chat id: ', quizzname, $.chatId, availablesQuizz);
            $.sendMessage('Quizz "' + quizzname + '" not found!');
            QuizzService.listQuizz($);

        } else {
            // start new quizz
            const quizz = Object.assign({
                id: $.chatId + '-' + quizzname + '-' + Date.now(),
                chatId: $.chatId,
                name: quizzname,
                currentQuestionIndex: -1,
                status: 'active'
            }, selectedQuizz);

            $.sendMessage('Quizz started!');
            QuizzService.saveQuizz(quizz);
            return quizz;
        }
    }

    static provideCurrentQuestionAnswer($, quizz) {
        if (quizz.status === 'active' && quizz.currentQuestion){
            const question = quizz.currentQuestion;
                let msg = 'Valid answer(s):\n' + quizz.currentQuestion.choices
                    .filter((c, i) => question.answers.indexOf(i+1) !== -1)
                    .map((c, i) => '' + (i+1) + ') ' + c).join('\n');
                $.sendMessage(msg)
        }
    }

    static loadNextQuestion($, quizz) {
        if (quizz.status === 'active'){
            quizz.currentQuestionIndex++;
            if (quizz.status === 'active' && quizz.questions.length > quizz.currentQuestionIndex) {
                quizz.currentQuestion = quizz.questions[quizz.currentQuestionIndex];
                QuizzService.saveQuizz(quizz);
                QuizzService.repeatQuestion($, quizz);
            } else {
                quizz.status = 'finished';
                QuizzService.saveQuizz(quizz);
                $.sendMessage('Quizz is finished!!');
            }
        }
    }

    static repeatQuestion($, quizz) {
        const question = quizz.currentQuestion;
        if (quizz.status === 'active' && question) {
            let msg = question.label;
            msg += '\n' + quizz.currentQuestion.choices.map((c, i) => '' + (i+1) + ') ' + c).join('\n');
            $.sendMessage(msg)
        }
    }

    static tryToProcessAnswer($) {

        const quizz = QuizzService.getQuizz($);

        if (quizz && quizz.status === 'active' && $.message && $.message.text) {
            const msgTrim = $.message.text.trim();
            const answer = parseInt(msgTrim);
            if ('' + answer === msgTrim && quizz.currentQuestion && answer > 0 && answer <= quizz.currentQuestion.choices.length) {
                const answers = quizz.currentQuestion.answers;
                const answerChoice = quizz.currentQuestion.choices[answer - 1];
                if (answers.indexOf(answer) !== -1) {
                    $.sendMessage('Congrats @' + BotTools.getUsername($.message) + ', your answer is right: ' + answerChoice)
                    setTimeout(function () {
                        QuizzService.loadNextQuestion($, quizz);
                    }, 5000);
                } else {
                    $.sendMessage('Your answer is wrong: ' + answerChoice)
                }
                return true;
            }
        }
        return false;
    }

    static getQuizz($) {
        const quizz = activesQuizz[$.chatId];
        console.log('=> Quizz:', quizz);
        return quizz;
    }

    static listQuizz($) {
        $.sendMessage('Available quizz: ' + Object.keys(availablesQuizz).join(', '));
    }
}

class QuizzController extends TelegramBaseController {

    get routes() {
        return {
            '/quizz :action :quizzname' : 'handler',
            '/quizz :action' : 'handler',
            '/quizz' : 'handler'
        }
    }

    handler($) {
        console.log('Quizz: action: ' + JSON.stringify($.query.action) + ' quizzname: ' + JSON.stringify($.query.quizzname));
        switch($.query.action) {
            case 'help':
                this.help($);
                break;
            case 'start':
                this.startQuizz($);
                break;
            case 'restart':
                this.restartQuizz($);
                break;
            case 'skip':
                this.skipQuestion($);
                break;
            case 'reset':
                this.reset($);
                break;
            default:
                this.help($);
                break;
        }
    }

    help($) {
        $.sendMessage(
            '*/quizz help* - this help message\n' +
            '*/quizz start <quizzname>* - start quizz session _(admins only)_\n' +
            '*/quizz restart <quizzname>* - restart a quizz _(admins only)_\n' +
            '*/quizz skip* - skip current question _(admins only)_\n' +
            '*/quizz reset* - reset quizz questions and stop current quizz _(admins only)_\n',
            { 'parse_mode': 'Markdown' }
        );
        QuizzService.listQuizz($);
    }

    reset($) {
        console.log('\nSKIP QUESTION...')
        BotTools.UsersAndSessionsRegister($);

        if (!BotTools.checkAdminAccess($)) {
            return false;
        }
        $.sendMessage('Quizz has been reset');
        QuizzService.reset();
    }

    skipQuestion($) {
        console.log('\nSKIP QUESTION...')
        BotTools.UsersAndSessionsRegister($);

        if (!BotTools.checkAdminAccess($)) {
            return false;
        }

        let quizz = QuizzService.getQuizz($);

        if (quizz && quizz.status === 'active') {
            $.sendMessage('Skipping question...');
            QuizzService.provideCurrentQuestionAnswer($, quizz);
            $.sendMessage('Question skipped!');
            QuizzService.loadNextQuestion($, quizz);
        }else{
            $.sendMessage('No active quizz: can not skip question!');
        }
    }

    startQuizz($) {
        BotTools.UsersAndSessionsRegister($)

        if (!BotTools.checkAdminAccess($)) {
            return false;
        }

        let quizz = QuizzService.getQuizz($);

        if (quizz && quizz.status === 'active') {
            // quizz already started
            console.log('Quizz already started for chat id: ', $.chatId)
            $.sendMessage('Quizz already started. Use the following command to restart the quizz: \n/quizz-restart ' + $.query.quizzname)
        } else {
            // start new quizz
            quizz = QuizzService.startQuizz($);
            activesQuizz[$.chatId] = quizz;
        }
        QuizzService.loadNextQuestion($, quizz);
    }

    restartQuizz($) {
        BotTools.UsersAndSessionsRegister($)

        if (!BotTools.checkAdminAccess($)) {
            return false;
        }

        // restart a new quizz
        const quizz = QuizzService.startQuizz($);
        activesQuizz[$.chatId] = quizz;
        QuizzService.loadNextQuestion($, quizz);
    }
}

module.exports = {
    QuizzController,
    QuizzService
}