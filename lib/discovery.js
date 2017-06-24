'use strict';

const infoFromHostname = require('./infoFromHostname');

const connectToDevice = require('./connectToDevice');


class Devices {
	constructor(options) {
		this._events = new EventEmitter();

		this._filter = options && options.filter;
		this._skipSubDevices = options && options.skipSubDevices;
		this._devices = {};

		this._browser = new Browser(options);
		this._browser.on('available', this._serviceAvailable.bind(this));
		this._browser.on('unavailable', this._serviceUnavailable.bind(this));
	}

	on(event, cb) {
		this._events.on(event, cb);
	}

	removeListener(event, cb) {
		this._events.removeListener(event, cb);
	}

	start() {
		this._browser.start();
	}

	stop() {
		this._browser.stop();
	}

	_serviceAvailable(service) {
		if(this._filter && ! this._filter(service)) {
			// Filter does not match this device
			return;
		}

		let reg = this._devices[service.id];
		if(! reg) {
			reg = this._devices[service.id] = Object.assign({
				device: null
			}, service);
		}

		// Return if we are already connecting to this device
		if(reg.connectionPromise) return;

		if(reg.token) {
			// This device has a token so it's possible to connect to it
			reg.connectionPromise = connectToDevice(service)
				.then(device => {
					reg.device = device;
					this._events.emit('available', reg);

					if(device.type === 'gateway') {
						this._bindSubDevices(device);
					}
				})
				.catch(err => {
					reg.error = err;
					this._events.emit('available', reg);

					err.device = service;
					this._events.emit('error', err);
				})
				.then(() => {
					delete reg.connectionPromise;
				});
		} else {
			// There is no token so emit even directly
			this._events.emit('available', reg);
		}
	}

	_serviceUnavailable(service) {
		const reg = this._devices[service.id];
		if(! reg) return;

		if(reg.device) {
			reg.device.destroy();
		}
		delete this._devices[service.id];
		this._events.emit('unavailable', reg);

		Object.keys(this._devices).forEach(key => {
			const subReg = this._devices[key];
			if(subReg.parent && subReg.parent.id == service.id) {
				// This device belongs to the service being removed
				delete this._devices[key];
				subReg.device.destroy();
				this._events.emit('unavailable', subReg);
			}
		});
	}

	_bindSubDevices(device) {
		if(this._skipSubDevices) return;

		const handleAvailable = sub => {
			const reg = {
				id: sub.id,
				model: sub.model,
				type: sub.type,

				parent: device,
				device: sub
			};

			if(this._filter && ! this._filter(reg)) {
				// Filter does not match sub device
				return;
			}

			// Register and emit event
			this._devices[sub.id] = reg;
			this._events.emit('available', reg);
		};

		device.on('deviceAvailable', handleAvailable);
		device.on('deviceUnavailable', sub => this._serviceUnavailable(sub));

		// Register initial devices
		device.devices.forEach(handleAvailable);
	}
}

module.exports.Browser = Browser;
module.exports.Devices = Devices;
