import { ChildProcess, spawn } from 'child_process';
import * as global from './global';
import logger from './eventlogger/eventlogger';

export function init(app) {
	// app.get('/usercode/run', (req, resp) => {
	// 	console.log(req.query);
	// 	try {
	// 		const child: ChildProcess = createChildProcess();
	// 		global.context.userCodePid = child.pid;
	// 		child.stdout.on('data', (data: any) => {
	// 			if (!data) return;
	// 			console.log(`收到子进程：child stdout data: ${data}`);
	// 		});
	// 		child.stderr.on('data', (data: any) => {
	// 			if (!data) return;
	// 			console.log(`收到子进程：child stderr data: ${data}`);
	// 		});
	// 		console.log(`启动用户组件程序成功, pid: ${child.pid}`);
	// 		resp.send({ success: true, message: `${child.pid}` });
	// 	} catch (err) {
	// 		console.log(`启动用户组件程序失败, err: ${err}`);
	// 		resp.send({ success: false, message: `${err}` });
	// 	}
	// });
	// app.get('/usercode/kill', (req, resp) => {
	// 	console.log(req.query);
	// 	if (global.context.userCodePid) {
	// 		killProcess(global.context.userCodePid);
	// 	}
	// 	resp.send({ success: true });
	// });
}

export function startUserCode() {
	const child: ChildProcess = spawn(
		global.context.cpLanguageCmd,
		[`${global.context.cpParamsEntry}`].concat(global.context.spParam),
		{
			cwd: global.context.cpParamsWorkDir,
			detached: false,
		},
	);

	// TODO: 目前是外面的代码逻辑控制是否 startUserCode, 底下的运行模式判断没必要
	child
		.on('error', (err) => {
			console.error(
				`启动用户组件程序失败, err: ${err}, 运行模式[${global.context.runMode}]`,
			);
			logger.Instance.error(
				`启动用户组件程序失败, err: ${err}, 运行模式[${global.context.runMode}]`,
			);

			if (global.context.runMode !== 'debug') {
				process.exit(1);
			}
		})
		.on('close', (code) => {
			if (global.context.runMode !== 'debug' && !global.context.isDebugKill) {
				console.error(
					`用户组件程序关闭, 退出码（code: ${code}）, 运行模式[${global.context.runMode}]`,
				);
				logger.Instance.error(
					`用户组件程序关闭, 退出码（code: ${code}）, 运行模式[${global.context.runMode}]`,
				);

				process.exit(1);
			}
			global.context.isDebugKill = false;
		});

	if (child.pid) {
		global.context.userCodePid = child.pid;
		console.info(`启动用户组件程序成功, pid: ${child.pid}`);
		logger.Instance.info(`启动用户组件程序成功, pid: ${child.pid}`);
	}
}
