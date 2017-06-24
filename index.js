const EventEmitter = require('events');

class MiHome extends EventEmitter {

}

MiHome.Device  = require('./lib/device');
MiHome.Packet  = require('./lib/packet');
MiHome.Browser = require('./lib/browser');

MiHome.connect = function(options){
  return new MiHome.Device(options);
};

module.exports = MiHome;
