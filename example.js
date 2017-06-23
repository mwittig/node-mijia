/* eslint-disable */

const miio = require('./lib');

const browser = miio.browse({
	cacheTime: 300 // 5 minutes. Default is 1800 seconds (30 minutes)
});

const devices = {};

	browser.on('available', reg => {
	if(! reg.token) {
		console.log(reg.id, 'hides its token');
		return;
	}

	miio.device(reg)
	.then(device => {
		devices[reg.id] = device;
		// Do something useful with the device
	})
	.catch(handleErrorProperlyHere);
});

browser.on('unavailable', reg => {
	const device = devices[reg.id];
	if(! device) return;

	device.destroy();
	delete devices[reg.id];
})
