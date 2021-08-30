import path from 'path';
import parseArgs from 'minimist';
import {
	buildSpAffinityUrl,
	getLanguageCmd,
	getLanguageEntry,
	decodeBase64,
} from './common';
import * as types from './types';

const argvs = parseArgs(process.argv);

export const context: types.globalContext = {
	affinity: buildSpAffinityUrl(),
	spParam: decodeBase64(process.env.SP_PARAM),
	cpParamsLanguage: argvs.language,
	cpLanguageCmd: getLanguageCmd(argvs),
	cpParamsWorkDir:
		argvs.workDir ||
		path.join(argvs['storage-minio-global-store'], argvs.language), // 如果是空的，默认为节点的工作路径下
	cpParamsEntry: getLanguageEntry(argvs),
	userCodePid: null,
	isFirstKill: true,
	isDebugKill: false,
	runMode: argvs.runMode,
	vscodePid: null,

	userId: process.env.SP_USER_ID,
	appId: process.env.SP_APP_ID,
	nodeId: process.env.SP_NODE_ID,
	nodePort: 8002,
};
