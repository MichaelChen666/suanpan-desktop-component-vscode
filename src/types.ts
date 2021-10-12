export type globalContext = {
	affinity?: string;
	spParam?: string;
	runMode?: string;
	cpParamsLanguage?: string;
	cpLanguageCmd?: string;
	cpParamsWorkDir?: string;
	cpParamsEntry?: string;
	userCodePid?: number;
	isDebugKill?: boolean;
	isFirstKill?: boolean;
	vscodePid?: number;
	userId?: string;
	appId?: string;
	nodeId?: string;
	nodePort?: number;
};

export type vscodeLaunchAttributes = {
	name: string;
	type: string;
	request: 'launch' | 'attach';
	skipFiles?: Array<string>;
	program?: string;
	justMyCode?: boolean,
	processId?: string;
	args?: Array<string>;
	env?: { [index: string]: string };
	gevent?: boolean;
};

export type vscodeLaunch = {
	version: string | '0.2.0';
	configurations: vscodeLaunchAttributes[];
};
