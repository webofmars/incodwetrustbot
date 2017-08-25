'use strict'

const redisdb = require('../lib/redisdb');
const BotTools = require('../lib/BotTools.js');
const UsersDB = require('../lib/UsersDB.js');
const SessionsManager = require('../lib/SessionsManager.js');

const Telegram = require('telegram-node-bot');
const TelegramBaseController = Telegram.TelegramBaseController
const YAML = require('yamljs');

const availablesQuizz = YAML.load(__dirname + '/default-quizz.yml');

const activesQuizz = {};

class QuizzService {

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
                chatId: $.chatId,
                name: quizzname,
                currentQuestionIndex: -1
            }, selectedQuizz);
            return quizz;

            $.sendMessage('Quizz started!');
        }
    }

    static loadNextQuestion($, quizz) {
        quizz.currentQuestionIndex++;
        if (quizz.questions.length > quizz.currentQuestionIndex) {
            quizz.currentQuestion = quizz.questions[quizz.currentQuestionIndex];
            QuizzService.repeatQuestion($, quizz);
        } else {
            $.sendMessage('Quizz is finished!!');
        }
    }

    static repeatQuestion($, quizz) {
        const question = quizz.currentQuestion;
        if (question) {
            let msg = question.label;
            msg += '\n' + quizz.currentQuestion.choices.map((c, i) => '' + (i+1) + ') ' + c).join('\n');
            $.sendMessage(msg)
        }
    }

    static tryToProcessAnswer($) {

        const quizz = QuizzService.getQuizz($);

        if (quizz && $.message && $.message.text) {
            const msgTrim = $.message.text.trim();
            const answer = parseInt(msgTrim);
            if ('' + answer === msgTrim && quizz.currentQuestion && answer > 0 && answer <= quizz.currentQuestion.choices.length) {
                const answers = quizz.currentQuestion.answers;
                const answerChoice = quizz.currentQuestion.choices[answer - 1];
                if (answers.indexOf(answer) !== -1) {
                    $.sendMessage('Congrats ' + BotTools.getUsername($.message) + ', your answer is right: ' + answerChoice)
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
        return quizz;
    }

    static listQuizz($) {
        $.sendMessage('Available quizz: ' + Object.keys(availablesQuizz).join(', '));
    }
}

class QuizzController extends TelegramBaseController {

    get routes() {
        return {
            '/quizz': 'help',
            '/quizz :quizzname': 'startQuizz',
            '/quizz :quizzname restart': 'restartQuizz'
        }
    }

    help($) {
        $.sendMessage('/quizz: help \
        \n/quizz <quizzname>: start new quizz \
        \n/quizz <quizzname> restart quizz');
        QuizzService.listQuizz($);
    }

    startQuizz($) {
        BotTools.UsersAndSessionsRegister($)

        let quizz = QuizzService.getQuizz($);

        if (quizz) {
            // quizz already started
            console.log('Quizz already started for chat id: ', $.chatId)
            $.sendMessage('Quizz already started. Use the following command to restart the quizz: \n/quizz ' + $.query.quizzname + ' restart')
        } else {
            // start new quizz
            quizz = QuizzService.startQuizz($);
            activesQuizz[$.chatId] = quizz;
        }
        QuizzService.loadNextQuestion($, quizz);
    }

    restartQuizz($) {
        BotTools.UsersAndSessionsRegister($)

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