class UsersDB {

  constructor(db) {
    if (db) {
      this._regusers = db
    }
    else {
      this._regusers = {}
    }
  }

  register($) {
    const userid = $.message.chat.id.toString();
    const username = $.message.from.username.toString();
    const from = JSON.stringify($.message.from);

    console.log('UsersDB.register: userid: ' + userid)
    console.log('UsersDB.register: username: ' + username)
    console.log('UsersDB.register: from: ' + from)

    if (!this._regusers[userid]) {
      console.log("UsersDB: adding " + username + "(" + userid + ")")
      this._regusers[userid] = { 'user': from }
    }
    return true
  }

  static dump() {
    return(JSON.stringify(this._regusers))
  }

}

module.exports = UsersDB