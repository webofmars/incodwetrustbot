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

    static init(){ 
        storage.getJSON('teams', function(value, key){
            if (value){
                teams = value;
            }else{
                teams = YAML.load(__dirname + '/../data/default-teams.yml');
            }
        });
    }
    
    static reset(){
        teams = YAML.load(__dirname + '/../data/default-teams.yml');
        TeamsService.saveTeams(teams);
    }

    static saveTeams(teams){
        storage.setJSON('teams', teams);
    }
    
    static showTeamsScores($, teams) {
       // TODO
        // let msg = 'Teams:\n' + teams.map((team, i) => 'team (id=' + team.id + ')').join('\n');
        // .map((team, i) => 'team (id=' + team.id + ')').join('\n'));
        // $.sendMessage(msg)
    }
    
    static listTeams($) {
        $.sendMessage('Available teams: ' + Object.keys(teams).join(', '));
    }
}

class TeamsController extends TelegramBaseController {

    get routes() {
        return {
            // '/teams-list': 'listTeams',
            '/teams': 'help',
        }
    }

    help($) {
        $.sendMessage('/teams: help \
            \n/teams-list: list teams');
        TeamsService.listTeams($);
    }
    
    reset($) {
        console.log('\nSKIP QUESTION...')
        BotTools.UsersAndSessionsRegister($);

        if (!BotTools.checkAdminAccess($)) {
            return false;
        }

        TeamsService.reset();
    }
     
}

module.exports = {
    TeamsController,
    TeamsService
}