import { ChildProcess, spawn } from 'child_process';
import * as global from './global';
import logger from './eventlogger/eventlogger';
import {
	killProcess,
	getSpArgsArrary,
	formatUserCodeProcessStdio,
} from './common';

export function init(app) {
	app.get('/usercode/rerun', (req, resp) => {
		if (
			global.context.runMode === global.runMode.RunMode &&
			global.context.userCodePid
		) {
			console.warn(
				`用户重新启动程序, 主动杀死现有进程, pid: ${global.context.userCodePid}`,
			);
			logger.Instance.warn(
				`用户重新启动程序, 主动杀死现有进程, pid: ${global.context.userCodePid}`,
			);

			killProcess(global.context.userCodePid);
			global.context.userCodePid = 0;
		}

		startUserCode();
		resp.send({ success: true });
	});
}

export function startUserCode() {
	const child: ChildProcess = spawn(
		global.context.cpLanguageCmd,
		[`${global.context.cpParamsEntry}`].concat(
			getSpArgsArrary(global.context.spParam),
		),
		{
			cwd: global.context.cpParamsWorkDir,
			detached: false,
		},
	);

	child
		.on('error', (err) => {
			console.error(`启动用户组件程序失败, err: ${err}`);
			logger.Instance.error(`启动用户组件程序失败, err: ${err}`);

			if (global.context.runMode === global.runMode.RunMode) {
				process.exit(1);
			}
		})
		.on('exit', (code) => {
			if (
				global.context.runMode === global.runMode.RunMode &&
				!global.context.isDebugKill
			) {
				console.error(`用户组件程序关闭, 退出码（code: ${code}）`);
				logger.Instance.error(`用户组件程序关闭, 退出码（code: ${code}）`);

				process.exit(1);
			}
			global.context.isDebugKill = false;
		});

	child.stdout?.on('data', (data) => {
		console.log(formatUserCodeProcessStdio('stdout', data));
	});

	child.stderr?.on('data', (data) => {
		console.log(formatUserCodeProcessStdio('stderr', data));
	});

	if (child.pid) {
		global.context.userCodePid = child.pid;
		console.info(`启动用户组件程序成功, pid: ${child.pid}`);
		logger.Instance.info(`启动用户组件程序成功, pid: ${child.pid}`);
	}
}
