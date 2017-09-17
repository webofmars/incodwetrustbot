// describe user infos

nohm = require('nohm').Nohm;

console.log("+ user.js declare model ...")

module.exports = nohm.model('UserModel', {
  idGenerator: 'increment',
  properties: {
    // the user name
    id: {
      type: 'number',
      // validations: [['notEmpty']]
    },
    firstName: {
      type: 'string',
      // validations: [['notEmpty']]
    },
    lastName: {
      type: 'string',
      // validations: [['notEmpty']]
    },
    username: {
      type: 'string',
      // validations: [['notEmpty']]
    },
    role: {
      type: 'integer'
    }
  },
  methods: {
    getFullName() {
      if (this.p('username') != null) {
        return '' + this.p('firstName') + ' ' + this.p('lastName') + ' (' + this.p('username') + ')';
      } else {
        return '' + this.p('firstName') + ' ' + this.p('lastName');
      }
    }
  },
});