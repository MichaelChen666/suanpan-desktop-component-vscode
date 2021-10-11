import { execSync, spawn } from 'child_process';
import logger from './eventlogger/eventlogger';
import * as path from 'path';
import * as fs from 'fs';

export const suanpan = {
	affinity: process.env.SP_AFFINITY,
	host: process.env.SP_HOST,
	port: process.env.SP_PORT,
	protocol: process.env.SP_HOST_TLS && process.env.SP_HOST_TLS !== 'false',
	accessSecret: process.env.SP_ACCESS_SECRET,
	field: {
		userIdHeader: process.env.SP_USER_ID_HEADER_FIELD || 'x-sp-user-id',
		userSignature:
			process.env.SP_USER_SIGNATURE_HEADER_FIELD || 'x-sp-signature',
		userSignVersionHeader:
			process.env.SP_USER_SIGN_VERSION_HEADER_FIELD || 'x-sp-sign-version',
	},
};

export function buildSpAffinityUrl() {
	const { host, port: spPort, affinity, protocol: httpsProtocol } = suanpan;

	if (affinity) {
		return affinity;
	}

	const protocol = httpsProtocol ? 'https' : 'http';
	const port = spPort ? `:${spPort}` : '';

	return `${protocol}://${host}${port}`;
}

// 非绝对路径，则默认为节点的工作路径下
export function getWorkDir(argvs: any): string {
	// 客户端版，将./run/..../global替换为minio路径 ./data/minio/suanpan/studio/...../code
	const bucketName = argvs['storage-minio-bucket-name'];
	const runPath = normalizedPath('run');
	const minioPath = normalizedPath(path.join('data', 'minio', `${bucketName}`, 'studio'));
	argvs['storage-minio-global-store'] = formatRunPath2Minio(argvs['storage-minio-global-store'].replace(`${runPath}`, `${minioPath}`));
	const defaultWorkDir = path.resolve(
			argvs['storage-minio-global-store'],
		argvs.language,
	);

	try {
		if (argvs.workDir && path.isAbsolute(argvs.workDir)) {
			return argvs.workDir;
		}
		console.warn(
			`params workDir(${argvs.workDir}) is not absolute path, use default workDir(${defaultWorkDir})`,
		);
	} catch (err) {
		console.warn(
			`parse workDir(${argvs.workDir}) err: ${err}, use default workDir(${defaultWorkDir})`,
		);
	}

	return defaultWorkDir;
}

export function getLanguageCmd(argvs: any): string {
	switch (argvs.language) {
		case 'nodejs':
			return 'node';
		case 'python':
			// always using venv pyton executable to run component code
			// python template built-in config.bat to config venv and user must config venv firstly when click edit or debug
			const pythonExe = path.resolve("Scripts", "python");
			return pythonExe;
		default:
			return '';
	}
}

export function getLanguageEntry(argvs: any): string {
	switch (argvs.language) {
		case 'nodejs':
			return argvs.entryNodejs || 'index.js';
		case 'python':
			return argvs.entryPython || 'main.py';
		default:
			return '';
	}
}

export function decodeBase64(base64str: string) {
	return Buffer.from(base64str, 'base64').toString();
}

export function getLauncType(language: string): string {
	switch (language) {
		case 'nodejs':
			return 'node';
		case 'python':
			return 'python';
		default:
			return '';
	}
}

export function killProcess(pid: number) {
	try {
		execSync(`taskkill /pid ${pid} /t /f`, {
			windowsHide: true,
		});
	} catch (e) {
		console.error(`kill process(pid=${pid}) err: ${e.message}`);
		logger.Instance.error(`kill process(pid=${pid}) err: ${e.message}`);
	}
}

export function getSpArgsArrary(spParams: string): Array<string> {
	return spParams
		.trim()
		.split(/\s+/)
		.map((arg) => arg.trim().replace(/'/g, ''));
}

export function formatUserCodeProcessStdio(stdio: string, message): string {
	return `[usercode ${stdio}] ${message}`;
}

function formatRunPath2Minio(runPath) {
	let minioPath = path.parse(runPath);
	minioPath.base = 'code';
	return path.format(minioPath);
}
function normalizedPath(dirPath:string){
	return `${path.sep}${dirPath}${path.sep}`;
}
