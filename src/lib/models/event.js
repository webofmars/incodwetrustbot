// describe event infos

const nohm = require('nohm').Nohm;

console.log("+ event.js declare model ...")

module.exports = nohm.model('EventModel', {
  idGenerator: 'increment',
  properties: {
    // the event name
    name: {
      type: 'string',
      validations: [['notEmpty']]
    },
    // the event start ts
    start: {
        type: 'timestamp',
        validations: [['notEmpty']]
    },
    // the event end ts
    end: {
        type: 'timestamp',
        validations: [['notEmpty']]
    },
    place: {
      // name: string, longitude: float, latitude: float
      type: 'JSON',
      validations: [['notEmpty']]
    }
  },
  methods: {
    getPlaceName: function () {
      var o = JSON.parse(this.p('place'));
      return o.name;
    },
    getPlaceLongitude: function () {
      var o = JSON.parse(this.p('place'));
      return o.longitude;
    },
    getPlaceLatitude: function () {
      var o = JSON.parse(this.p('place'));
      return o.latitude;
    }
  },
});