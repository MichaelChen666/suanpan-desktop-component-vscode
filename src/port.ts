import axios from 'axios';
import axiosRetry from 'axios-retry';
import * as global from './global';
import logger from './eventlogger/eventlogger';

const client = axios.create({ baseURL: global.context.affinity });
axiosRetry(client, {
	retries: 3,
	retryDelay: (retryCount) => {
		console.log(`retry attempt: ${retryCount}`);
		logger.Instance.debug(`retry attempt: ${retryCount}`);
		// return retryCount * 1000; // time interval between retries
		return 1000;
	},
	retryCondition: () => {
		return true;
	},
});

export async function getFreePortWithRetry() {
	type ResultType = {
		success: boolean;
		data: {
			port: number;
		};
	};
	const result = await client.get<ResultType>('/app/freeport');

	return result.data.data.port;
}

export async function registerPortWithRetry(port: number) {
	await client.post('/app/service/register', {
		userId: global.context.userId,
		appId: global.context.appId,
		nodeId: global.context.nodeId,
		nodePort: global.context.nodePort,
		port: port,
	});
}
