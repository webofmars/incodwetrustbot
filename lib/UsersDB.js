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
    if (!this._regusers[$.message.from.id]) {
      console.log("UsersDB: adding " + $.message.from.username + "(" + $.message.from.id + ")")
      this._regusers[$.message.from.id] = $.message.from
    }
    return true
  }

  dump() {
    return(JSON.stringify(this._regusers))
  }

}

module.exports = UsersDB