import { homedir } from 'os';
import { join } from 'path';
import run from '../../util/terminal';
import isios from '../util/isios';

export default function debug() {
	const command = 'npm t';
	run(command, 'debug');
	if (isios()) {
		const app = 'npm run test:ios';
		run(app, 'debug app');
	} else {
		const env = (() => {
			const home = homedir();
			const android = join(home, 'Android');
			const javahome = join(android, 'jdk1.8.0_191');
			const path = join(javahome, 'bin');
			const androidhome = join(android, 'Sdk');
			return `export JAVA_HOME=${javahome} && export PATH=${path}:$PATH && export ANDROID_HOME=${androidhome}`;
		})();
		run(env, 'debug app');
		const app = 'npm run test:android && npm start';
		run(app, 'debug app');
	}
}
