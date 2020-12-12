import { homedir, platform } from 'os';
import { dirname, join } from 'path';
import { CompletionItem, CompletionItemKind, Disposable, languages, Position, TextDocument, TextEditor, window, workspace } from 'vscode';
import Base from './base';
import AddActionMobile from './mobile/addaction/component';
import AddComponentMobile from './mobile/addcomponent';

export default class Mobile extends Base {
	public shelldebug(): void {
		const command = 'npm t';
		this.shellrun(command, 'debug');
		if (this.isios()) {
			const app = 'npm run test:ios';
			this.shellrun(app, 'debug app');
		} else {
			// const env = (() => {
			// 	const home = homedir();
			// 	const android = join(home, 'Android');
			// 	const javahome = join(android, 'jdk1.8.0_191');
			// 	const path = join(javahome, 'bin');
			// 	const androidhome = join(android, 'Sdk');
			// 	return `export JAVA_HOME=${javahome} && export PATH=${path}:$PATH && export ANDROID_HOME=${androidhome}`;
			// })();
			// run(env, 'debug app');
			const app = 'npm run test:dev';
			this.shellrun(app, 'debug app');
		}
	}
	public async shellbuild() {
		const pickoption = this.getdefaultpickoption();
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
			this.shellrun(command, 'build');
		} else {
			const cwd = workspace.workspaceFolders![0].uri.fsPath;
			this.shellrun(`cd ${cwd}`, 'debug app');
			if (this.isios()) {
				const app = 'npm run build:ts && gulp && react-native bundle --entry-file index.js --platform ios --dev false --bundle-output release_ios/main.jsbundle --assets-dest release_ios/';
				this.shellrun(app, 'debug app');
			} else {
				const env = (() => {
					const home = homedir();
					const android = join(home, 'Android');
					const javahome = join(android, 'jdk1.8.0_191');
					const path = join(javahome, 'bin');
					const androidhome = join(android, 'Sdk');
					return `export JAVA_HOME=${javahome} && export PATH=${path}:$PATH && export ANDROID_HOME=${androidhome}`;
				})();
				this.shellrun(env, 'debug app');
				const app = 'npm run build:ts && cd ./android && ./gradlew assembleRelease';
				this.shellrun(app, 'debug app');
			}
		}
	}
	public completion(): Disposable {
		const events = ['mm-events-status-change', 'mm-events-init', 'mm-events-nav-blur', 'mm-events-nav-focus', 'mm-events-nav-state', 'mm-events-nav-stack-trans-start', 'mm-events-nav-stack-trans-end', 'mm-events-nav-tab-press', 'mm-events-nav-tab-long-press', 'mm-events-keyboard-will-show', 'mm-events-keyboard-did-show', 'mm-events-keyboard-will-hide', 'mm-events-keyboard-did-hide', 'mm-events-keyboard-will-changeframe', 'mm-events-keyboard-did-changeframe', 'mm-events-accessibility-change', 'mm-events-accessibility-annoucement-finished', 'mm-events-net-change'];
		return languages.registerCompletionItemProvider(
			'typescript',
			{
				provideCompletionItems: async (document: TextDocument, position: Position) => {
					if (!/[\\|/]n?s\.ts$/.test(document.fileName) || events.length === 0) {
						return undefined;
					}
					const linePrefix = document.lineAt(position).text.substr(0, position.character);
					if (linePrefix.includes(':')) {
						const dir = dirname(document.fileName);
						const files = await this.readdirasync(dir);
						const reg = /[\\|/]ns\.ts$/.test(document.fileName) ? /^na\d+.ts$/ : /^a\d+.ts$/;
						return files.filter((it) => {
							return reg.test(it);
						}).map((it) => {
							return new CompletionItem(it.replace('.ts', ''), CompletionItemKind.File);
						});
					}
					return events.map((event) => {
						return new CompletionItem(event, CompletionItemKind.Enum);
					});
				}
			},
			'\'',
			'"'
		);
	}
	public addwebfilter(): Promise<void> {
		return this.baseaddwebrouter('filters');
	}
	public addwebrouter(): Promise<void> {
		return this.baseaddwebrouter('routers');
	}
	public addpresentation(_editor: TextEditor): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addservice(): Promise<void> {
		return this.baseaddservice();
	}
	public addpage(): Promise<void> {
		return new AddComponentMobile().addpage();
	}
	public addcomponent(_editor: TextEditor): Promise<void> {
		return this.addpage();
	}
	public async addaction(editor: TextEditor): Promise<void> {
		const addactionmobile = new AddActionMobile();
		return addactionmobile.addaction(editor);
	}
	private isios() {
		switch (platform()) {
			case 'darwin':
				return true;
			case 'linux':
			case 'win32':
			default:
				return false;
		}
	}
}
