const _ = require('lodash');
const io = require('socket.io-client');
const crypto = require('crypto');

const USER_ID = process.env.SP_USER_ID || 'shanglu';
const APP_ID = process.env.SP_APP_ID;
const NODE_ID = process.env.SP_NODE_ID;
const ACCESS_SECRET = process.env.SP_ACCESS_SECRET;
const USERID_HEADER = process.env.SP_USER_ID_HEADER_FIELD || 'x-sp-user-id';
const USER_SIGNATURE =
	process.env.SP_USER_SIGNATURE_HEADER_FIELD || 'x-sp-signature';
const USER_SIGN_VERSION_HEADER =
	process.env.SP_USER_SIGN_VERSION_HEADER_FIELD || 'x-sp-sign-version';

const SP_WEB_ENDPOINT = process.env.SP_LOGKIT_URI;
const SP_LOGKIT_NAMESPACE = process.env.SP_LOGKIT_NAMESPACE || 'logkit';
const SP_LOGKIT_EVENTS_APPEND = process.env.SP_LOGKIT_EVENTS_APPEND || 'append';

function signatureV1(secret = '', data = '') {
	const hmac = crypto.createHmac('sha1', secret);
	hmac.update(data);
	const signatureOut = hmac.digest('base64');
	return signatureOut;
}

function getRequestUrl(endpoint, routePath) {
	const prefix = !_.endsWith(endpoint, '/') ? endpoint + '/' : endpoint;
	const suffix = !_.startsWith(routePath, '/')
		? routePath
		: routePath.substr(1);
	return prefix + suffix;
}

function buildQueryParameters() {
	return Object.assign(
		{},
		{
			[USERID_HEADER]: USER_ID,
			[USER_SIGNATURE]: signatureV1(ACCESS_SECRET, USER_ID),
			[USER_SIGN_VERSION_HEADER]: 'v1',
		},
	);
}

function generateConnectOpts() {
	return {
		transports: ['websocket'],
		query: buildQueryParameters(),
		path: process.env.SP_LOGKIT_PATH,
	};
}

class EventLogger {
	constructor() {
		if (EventLogger._instance) {
			throw new Error('class "EventLogger" cannot be instantiated directly.');
		}

		this.socket = io(
			getRequestUrl(SP_WEB_ENDPOINT, SP_LOGKIT_NAMESPACE),
			generateConnectOpts(),
		);
		this.socket.on('connect', () => console.log('connected to logkit'));
		this.socket.on('error', (...args) => {
			console.log('error', args);
		});
		this.socket.on('disconnect', (...args) => {
			console.log('disconnect', args);
		});
		this.socket.on('connect_error', (...args) => {
			console.log('connect_error', args);
		});
	}

	static get Instance() {
		if (!this._instance) {
			this._instance = new EventLogger();
		}
		return this._instance;
	}

	async emitToLogkit(event, ...args) {
		return new Promise((resolve, reject) => {
			this.socket.emit(event, ...args, (result) => {
				if (result.success) {
					resolve(result.data);
				} else {
					reject(result.error);
				}
			});
		});
	}

	buildEventLog(eventTitle, eventLevel) {
		return {
			app: APP_ID,
			logs: [
				{
					title: eventTitle,
					level: eventLevel,
					time: new Date().toISOString(),
					data: {
						node: NODE_ID,
					},
				},
			],
		};
	}

	parseTitleIfNecessary(title) {
		if (_.isString(title)) {
			return title;
		}

		if (_.isError(title)) {
			// output error on the command line and oss
			console.error(title);
			return title.message;
		}

		return title;
	}

	trace(title) {
		this.log(title, EventLogger.TRACE);
	}

	debug(title) {
		this.log(title, EventLogger.DEBUG);
	}

	info(title) {
		this.log(title, EventLogger.INFO);
	}

	warn(title) {
		this.log(title, EventLogger.WARN);
	}

	error(title) {
		this.log(title, EventLogger.ERROR);
	}

	log(title, level) {
		if (!title) {
			return;
		}

		const eventTitle = this.parseTitleIfNecessary(title);

		this.emitToLogkit(
			SP_LOGKIT_EVENTS_APPEND,
			// this.buildEventLog(eventTitle, level),
			APP_ID,
			{
				title: eventTitle,
				level: level,
				time: new Date().toISOString(),
				data: {
					node: NODE_ID,
				},
			},
		).catch((error) => console.error(error));
	}

	async query() {
		return await this.emitToLogkit('query', { app: APP_ID });
	}
}

EventLogger.TRACE = 'TRACE';
EventLogger.DEBUG = 'DEBUG';
EventLogger.INFO = 'INFO';
EventLogger.WARN = 'WARN';
EventLogger.ERROR = 'ERROR';

module.exports = EventLogger;
