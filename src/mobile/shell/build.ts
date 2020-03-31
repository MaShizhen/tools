import { homedir } from 'os';
import { join } from 'path';
import { window, workspace } from 'vscode';
import run from '../../util/terminal';
import isios from '../util/isios';
import pickoption from '../../util/pickoption';

export default async function build() {
	const select = await window.showQuickPick([
		{
			description: '服务包一般指向服务器部署的软件包,部署才能生效',
			label: '服务包',
			picked: true
		},
		{
			description: 'apk或ipa包',
			label: 'app包',
			picked: false
		}
	], {
		...pickoption,
		placeHolder: '请选择打包类型'
	});
	if (!select) {
		return;
	}
	if (select.label === '服务包') {
		const command = "npm version '1.0.'$(date +%Y%m%d%H%M) && npm run build && npm publish";
		run(command, 'build');
	} else {
		const cwd = workspace.workspaceFolders![0].uri.fsPath;
		run(`cd ${cwd}`, 'debug app');
		if (isios()) {
			const app = 'npm run build:ts && gulp && react-native bundle --entry-file index.js --platform ios --dev false --bundle-output release_ios/main.jsbundle --assets-dest release_ios/';
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
			const app = 'npm run build:ts && cd ./android && ./gradlew assembleRelease';
			run(app, 'debug app');
		}
	}
}
