// describe user infos

nohm = require('nohm').Nohm;

module.exports = nohm.model('UserModel', {
  idGenerator: 'increment',
  properties: {
    // the user name
    name: {
      type: 'string',
      validations: [['notEmpty']]
    },
    role: {
      type: 'integer'
    }
  },
  methods: {
  },
});