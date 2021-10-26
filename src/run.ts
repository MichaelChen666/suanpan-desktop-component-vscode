import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as global from './global';
import logger from './eventlogger/eventlogger';
import { killProcess, getSpArgsArrary } from './common';

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
	const language = global.context.cpParamsLanguage;
	if (language === 'python') {
		const pythonExe = global.context.cpLanguageCmd;
		if (!fs.existsSync(pythonExe)) {
			logger.Instance.error(
				`component python virtual environment was not configured`,
			);
			return;
		}
	}

	const cmdEntry = global.context.cpParamsEntry;

  /*
	  use space split entry but ignore space in quote
	*/
	const args = cmdEntry.split(/(?:[^\s"']+|['"][^'"]*["'])+/g);
	const child: ChildProcess = spawn(
		global.context.cpLanguageCmd,
		args.concat(
			getSpArgsArrary(global.context.spParam),
		),
		{
			cwd: global.context.cpParamsWorkDir,
			detached: false,
			stdio: ['ignore', process.stdout, process.stderr],
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

	// child.stdout?.on('data', (data) => {
	// console.log(formatUserCodeProcessStdio('stdout', data));
	// });

	// child.stderr?.on('data', (data) => {
	// console.log(formatUserCodeProcessStdio('stderr', data));
	// });

	if (child.pid) {
		global.context.userCodePid = child.pid;
		console.info(`启动用户组件程序成功, pid: ${child.pid}`);
		logger.Instance.info(`启动用户组件程序成功, pid: ${child.pid}`);
	}
}
