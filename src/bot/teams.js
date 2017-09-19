'use strict'

const storage = require('../lib/storage');
const BotTools = require('../lib/BotTools.js');
const UsersDB = require('../lib/UsersDB.js');
const SessionsManager = require('../lib/SessionsManager.js');

const Telegram = require('telegram-node-bot');
const TelegramBaseController = Telegram.TelegramBaseController
const YAML = require('yamljs');

let teams = {};

class TeamsService {

    static loadDefault(){
        // load default teams from yaml file
        const defaultTeams = YAML.load(__dirname + '/../data/default-teams.yml');
        // add name attribute from key
        teams = Object.keys(defaultTeams).map(key => Object.assign(defaultTeams[key], {
            name: key
        }));
    }

    static init(){
        storage.getJSON('teams', function(value, key){
            if (value){
                teams = value;
            }else{
                TeamsService.loadDefault();
            }
        });
    }

    static reset($){
        $.sendMessage('Reset teams');
        TeamsService.loadDefault();
        TeamsService.saveTeams(teams);
        TeamsService.showTeamsMembers($);
    }

    static saveTeams(teams){
        storage.setJSON('teams', teams);
    }

    static showTeamsScores($) {
        let msg = 'Teams scores:\n' + Object.values(teams).map((team, i) => team.name + ': ' + team.score).join('\n');
        $.sendMessage(msg)
    }

    static showTeamsMembers($) {

        let msg = 'Teams:\n' + Object.values(teams)
            .map((team, i) => team.name + ': ' +  team.members.map((member, i) => 'member (id=' + member.id + ')').join('\n'))
        .join('\n');
        $.sendMessage(msg)
    }

    static listTeams($) {
        $.sendMessage('Available teams: ' + Object.keys(teams).join(', '));
    }
}

class TeamsController extends TelegramBaseController {

    get routes() {
        return {
            '/teams :action': 'handler',
            '/teams'        : 'handler'
        }
    }

    handler($) {
        console.log('Teams: action: ' + JSON.stringify($.query.action));
        switch($.query.action) {
            case 'help':
                this.help($);
                break;
            case 'members':
                this.showTeamsMembers($);
                break;
            case 'reset':
                this.reset($);
                break;
            case 'scores':
                this.showTeamsScores($);
                break;
            default:
                this.help($);
                break;
        }
    }

    help($) {
        $.sendMessage(
            '*/teams help* - this help message\n'    +
            '*/teams scores* - show team scores\n'   +
            '*/teams members* - show team members\n' +
            '*/teams reset* - reset teams _(admins only)_\n', { 'parse_mode' : 'Markdown'});
        TeamsService.listTeams($);
    }

    showTeamsScores($) {
        BotTools.UsersAndSessionsRegister($);

        TeamsService.showTeamsScores($);
    }

    showTeamsMembers($) {
        BotTools.UsersAndSessionsRegister($);

        TeamsService.showTeamsMembers($);
    }

    reset($) {
        BotTools.UsersAndSessionsRegister($);

        if (!BotTools.checkAdminAccess($)) {
            return false;
        }

        TeamsService.reset($);
    }

}

module.exports = {
    TeamsController,
    TeamsService
}