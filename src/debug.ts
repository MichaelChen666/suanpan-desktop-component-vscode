import { ChildProcess, spawn } from 'child_process';
import { vscodeLaunch } from './types';
import path from 'path';
import * as global from './global';
import { killProcess, getSpArgsArrary } from './common';
import logger from './eventlogger/eventlogger';
const fse = require('fs-extra');

export function init(app) {
	// app.get('/usercode/debug/attach', (req, resp) => {
	// 	const workDir = global.context.cpParamsWorkDir;
	// 	// const workDir = `C:/Users/laien.cyx/Desktop/repo/xuelang-group/suanpan-desktop-component-vscode-user`;
	// 	console.log(workDir);

	// 	tryWriteLaunchJson(
	// 		path.join(workDir, '.vscode/launch.json'),
	// 		createLaunchJson('attach'),
	// 		req,
	// 		resp,
	// 	);

	// 	tryOpenVscode(workDir, req, resp);
	// });

	app.get('/usercode/debug/launch', (req, resp) => {
		global.context.isDebugKill = true;
		const workDir = global.context.cpParamsWorkDir;

		// 杀死已经运行的用户组件程序
		if (global.context.runMode !== 'debug' && global.context.userCodePid) {
			logger.Instance.warn(
				`用户点击调试程序, 主动杀死现有进程, pid: ${global.context.userCodePid}`,
			);
			killProcess(global.context.userCodePid);
			global.context.userCodePid = 0;
		}

		// 配置好launch.json
		try {
			writeJson(
				path.join(workDir, '.vscode/launch.json'),
				createLaunchJson('launch'),
			);
		} catch (err) {
			console.log(`write launch.json failed: ${err}`);
			logger.Instance.info(`write launch.json failed: ${err}`);
			resp.send({ success: false, msg: `${err}` });
			return;
		}

		tryOpenVscode(workDir, req, resp);
	});
}

export function writeJson(filePath: string, launch: vscodeLaunch) {
	const data = JSON.stringify(launch, null, '\t');
	return fse.outputFileSync(filePath, data);
}

export function tryOpenVscode(workDir: string, req, resp) {
	try {
		// 启动 vscode
		const child: ChildProcess = spawn('code', ['-n', workDir], {
			cwd: workDir,
			detached: true,
			shell: true,
			windowsHide: true,
			stdio: 'ignore',
		});

		if (!child.pid) {
			throw new Error(`系统内部错误`);
		}
		console.info(`打开 vscode 成功`);
		logger.Instance.info(`打开 vscode 成功`);
		resp.send({
			success: true,
			msg: `open vscode success`,
		});
	} catch (err) {
		console.log(`打开 vscode 失败, err: ${err}`);
		logger.Instance.info(`打开 vscode 失败, err: ${err}`);
		resp.send({ success: false, msg: `${err}` });
	}
}

export function createLaunchJson(debugType: string): vscodeLaunch {
	switch (global.context.cpParamsLanguage) {
		case 'nodejs': {
			const launch: vscodeLaunch = {
				version: '0.2.0',
				configurations: [
					{
						name: `sp-debug-${global.context.cpLanguageCmd}-launch`,
						type: 'node',
						skipFiles: [
							'<node_internals>/**',
							// eslint-disable-next-line no-template-curly-in-string
							'${workspaceFolder}/node_modules/**/*.js',
						],
						request: 'launch',
					},
				],
			};

			if (debugType === 'attach') {
				launch.configurations[0].request = 'attach';
				// launch.configurations[0].processId = String(global.context.userCodePid), // 直接设置好已经启动的用户进程（组件）,但是该方式有效的前提是：用户进程启动时必须不能是debug模式启动的, 若是debug模式启动的,则只需要配置另一个选项即可，port，但是该程序并无法获知该端口信息
				// eslint-disable-next-line no-template-curly-in-string
				launch.configurations[0].processId = '${command:PickProcess}'; // 用户调试时一开始弹出进程选择器列表, 让用户自己选择调试对象，不过该方式原理同上。两者的区别是上者是直接指定了调试对象，而下者是让用自己选。
			} else {
				launch.configurations[0].program = global.context.cpParamsEntry;
				launch.configurations[0].env = process.env;
				launch.configurations[0].args = getSpArgsArrary(global.context.spParam);
			}

			return launch;
		}

		case 'python': {
			const launch: vscodeLaunch = {
				version: '0.2.0',
				configurations: [
					{
						name: `sp-debug-${global.context.cpLanguageCmd}-launch`,
						type: 'python',
						request: 'launch',
						gevent: true,
					},
				],
			};

			if (debugType === 'attach') {
				launch.configurations[0].request = 'attach';
				// eslint-disable-next-line no-template-curly-in-string
				launch.configurations[0].processId = '${command:PickProcess}'; // 用户调试时一开始弹出进程选择器列表, 让用户自己选择调试对象，不过该方式原理同上。两者的区别是上者是直接指定了调试对象，而下者是让用自己选。
			} else {
				launch.configurations[0].program = global.context.cpParamsEntry;
				launch.configurations[0].env = process.env;
				launch.configurations[0].args = getSpArgsArrary(global.context.spParam);
			}

			return launch;
		}
		default:
			return null;
	}
}
