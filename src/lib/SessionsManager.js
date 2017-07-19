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
    if (this._sessions.indexOf(sessionId.toString()) < 0) {
      console.log("sessions not already registred, adding " + sessionId.toString() + "to session list")
      this._sessions.push(sessionId)
    }
    else {
      console.log("sessions " + sessionId.toString() + " was already on the list, skip it.")
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

  hydrate(db) {
    this._sessions = db
  }
}

module.exports = SessionsManager