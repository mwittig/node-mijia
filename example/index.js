const mi = require('..');

const browser = new mi.Browser();

browser.on('available', service => {
  console.log('server online: ', service);
  if(!service.token) return;
  const device = mi.connect(service);
  // console.log(device);
  device.call('set_power', [ 'off' ]);
});

browser.on('unavailable', service => {
  console.log('server offline: ', service);
});

browser.start();
