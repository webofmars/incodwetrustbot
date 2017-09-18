'use strict'

const oldStorage =require('../old-storage');
const BotTools = require('../BotTools.js');
const UsersDB = require('../UsersDB.js');
const SessionsManager = require('../SessionsManager.js');

const Telegram = require('telegram-node-bot');
const TelegramBaseController = Telegram.TelegramBaseController
const YAML = require('yamljs');

let teams = {};

class TeamsService {

    static loadDefault(){
        // load default teams from yaml file
        const defaultTeams = YAML.load(__dirname + '/../../data/default-teams.yml');
        // add name attribute from key
        teams = Object.keys(defaultTeams).map(key => Object.assign(defaultTeams[key], {
            name: key
        }));
    }

    static init(){ 
        oldStorage.getJSON('teams', function(value, key){
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
        oldStorage.setJSON('teams', teams);
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
    static checkUserTeam($){
        console.log('\n=> Message from: ', $.message.from);
        // _id: 411495234,
        // _firstName: 'Toub',
        // _lastName: null,
        // _username: 'toubb'
        
    }
}

class TeamsController extends TelegramBaseController {

    get routes() {
        return {
            '/teams': 'help',
            '/teams-scores': 'showTeamsScores',
            '/teams-members': 'showTeamsMembers',
            '/teams-reset': 'reset',
        }
    }

    help($) {
        $.sendMessage('/teams: help \
            \n/teams-scores: show team scores \
            \n/teams-members: show team members \
            \n/teams-reset: reset from default');
        TeamsService.listTeams($);
        TeamsService.checkUserTeam($);
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