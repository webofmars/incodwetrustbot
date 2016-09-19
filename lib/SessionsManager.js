class SessionsManager {

  constructor(db) {
    if (db) {
      console.log("Sessions Manager: Loading db from input : " + JSON.stringify(db))
      this._sessions = [ JSON.parse(db) ]
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
    console.log("DEBUG: SessionsManager.dump: " + JSON.stringify(this._sessions))
    return(JSON.stringify(this._sessions))
  }

  hydrate(db) {
    this._sessions = db
  }
}

module.exports = SessionsManager