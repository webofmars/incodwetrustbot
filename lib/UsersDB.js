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
    console.log(JSON.stringify($.message.chat.id))
    if (!this._regusers[$.message.chat.id]) {
      console.log("UsersDB: adding " + $.message.from.username + "(" + $.message.from.id + ")")
      this._regusers[$.message.chat.id] = { user: $.message.from }
    }
    return true
  }

  dump() {
    return(JSON.stringify(this._regusers))
  }

}

module.exports = UsersDB