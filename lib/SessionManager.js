class SessionManager {

  constructor(db) {
    if (db) {
      this._sessions = JSON.parse(db)
    }
    else {
      this._sessions = []
    }
  }

  /**
  * @param: sessionId
  **/
  add(sessionId) {
    if (this._sessions.indexOf(sessionId) < 0) {
      this._sessions.push(sessionId)
    }
  }

  del(sessionId) {
    _sessions = _sessions.filter(function(val) {if (val != sessionId) return val })
  }

  sessions() {
    return this._sessions
  }

  dump() {
    return(JSON.stringify(this._sessions))
  }
}

module.exports = SessionManager