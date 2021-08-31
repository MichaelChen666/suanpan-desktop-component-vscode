import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import net from 'net';
import * as run from './run';
import * as debug from './debug';
import * as global from './global';
import * as port from './port';
import logger from './eventlogger/eventlogger';

const app = express();

app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));
app.use(bodyParser.json({ limit: '20mb' }));

console.log('\n#######################################\n');
console.log(`算盘后端 url：${global.context.affinity}`);
console.log(`算盘参数：${global.context.spParam}`);
console.log(`工作路径：${global.context.cpParamsWorkDir}`);
console.log(`入口命令：${global.context.cpParamsEntry}`);
console.log('\n#######################################\n');

// const env = process.env;
// Object.keys(env).forEach(function (key) {
// 	console.log(`${key} = ${env[key]}`);
// });

logger.Instance.info('\n#######################################\n');
logger.Instance.info(`算盘后端 url：${global.context.affinity}`);
logger.Instance.info(`算盘参数：${global.context.spParam}`);
logger.Instance.info(`工作路径：${global.context.cpParamsWorkDir}`);
logger.Instance.info(`入口命令：${global.context.cpParamsEntry}`);
logger.Instance.info('\n#######################################\n');

run.init(app);
debug.init(app);

app.get('/', (req, resp) => {
	resp.send(`Hello, I'm vscode helper.`);
});

// 启动监听服务,有重试逻辑
(async function () {
	const httpServer = http.createServer(app);

	const freeport = await port.getFreePortWithRetry();
	httpServer.listen(freeport, async function () {
		const addrInfo = httpServer.address() as net.AddressInfo;
		console.log(`app listening at http://${addrInfo.address}:${addrInfo.port}`);
		try {
			await port.registerPortWithRetry(freeport);
			console.log(`register port success. port: ${freeport}`);
			logger.Instance.info(`register port success. port: ${freeport}`);
			// 启动用户组件程序
			if (global.context.runMode !== 'debug') {
				run.startUserCode();
			}
		} catch (err) {
			console.error(`register port failed, err: ${err}`);
			logger.Instance.info(`register port failed, err: ${err}`);

			process.exit(1);
		}
	});

	let retry: number = 3;
	httpServer.on('error', async () => {
		if (retry--) {
			setTimeout(async () => {
				httpServer.close();
				const freeport = await port.getFreePortWithRetry();
				httpServer.listen(freeport);
			}, 500);
		} else {
			console.log(`try ${retry} times for listening, but all failed.`);
			logger.Instance.info(`try ${retry} times for listening, but all failed.`);
			process.exit(1);
		}
	});
})().catch(function (err) {
	console.error(err);
	logger.Instance.error(err);
	process.exit(1);
});
