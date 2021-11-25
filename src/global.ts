import parseArgs from 'minimist';
import {
	buildSpAffinityUrl,
	getWorkDir,
	getLanguageCmd,
	getLanguageEntry,
	decodeBase64,
} from './common';
import * as types from './types';

export const argvs = parseArgs(process.argv);

export const context: types.globalContext = {
	affinity: buildSpAffinityUrl(),
	spParam: decodeBase64(process.env.SP_PARAM),
	cpParamsLanguage: argvs.language,
	cpLanguageCmd: getLanguageCmd(argvs),
	cpParamsWorkDir: getWorkDir(argvs),
	cpParamsEntry: getLanguageEntry(argvs),
	userCodePid: null,
	isFirstKill: true,
	isDebugKill: false,
	runMode: argvs.runMode,
	vscodePid: null,

	userId: process.env.SP_USER_ID,
	appId: process.env.SP_APP_ID,
	nodeId: process.env.SP_NODE_ID,
	nodePort: 8003,
};

export const runMode = {
	EditMode: 'edit',
	RunMode: 'run',
};
