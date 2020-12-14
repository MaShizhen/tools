import { join } from 'path';
import { Uri, window } from 'vscode';
import { NO_MODIFY } from '../../util/blocks';
import getcontainertype from './container-type';
import Actor from '../../actor';

export default class AddApp extends Actor {
	public constructor(private src: string) {
		super();
	}
	public async do() {
		const src = this.src;
		const folder = join(src, 'app');
		const type = await getcontainertype();
		if (!type) {
			return;	// canceled
		}
		await this.create_config(folder);
		await this.create_s(folder);
		await this.create_css(folder);
		await this.create_global_config(folder);
		await this.create_a(folder);
		await this.create_app(folder, type);

		const path = join(folder, 'app.ts');
		await window.showTextDocument(Uri.file(path));
	}

	private create_app(folder: string, type: string) {
		const path = join(folder, 'app.ts');
		const tpl = `import { app } from '@mmstudio/mobile';
import config from './config';
import s from './s';
import css from './css';

/// MM IMPCOMPONENTS BEGIN
/// ${NO_MODIFY}
/// MM IMPCOMPONENTS END

/// MM IMPACTIONS BEGIN
/// ${NO_MODIFY}
import a001 from './a001';
/// MM IMPACTIONS END

export default function App() {
	/// MM ACTIONS BEGIN
	/// ${NO_MODIFY}
	const actions = { a001 };
	/// MM ACTIONS END
	return app('${type}', actions, s, config, css,
		/// MM COMPONENTS BEGIN
		/// ${NO_MODIFY}
		/// MM COMPONENTS END
	);
}
`;
		return this.writefile(path, tpl);
	}

	private create_a(folder: string) {
		const path = join(folder, 'a001.ts');
		const tpl = `import am1 from '@mmstudio/am000001';
import am5 from '@mmstudio/am000005';
import { server } from '../config';

export default function a001(mm: am1) {
	am5(server);
}
`;
		return this.writefile(path, tpl);
	}

	private create_global_config(folder: string) {
		const path = join(folder, '..', 'config.ts');
		const tpl = `
// todo: 打包时需要确定服务器地址
export const server = 'https://yourdomain.com';
`;
		return this.writefile(path, tpl);
	}

	private create_css(folder: string) {
		const path = join(folder, 'css.ts');
		const tpl = `export default \`
\`;
`;
		return this.writefile(path, tpl);
	}

	private create_s(folder: string) {
		const path = join(folder, 's.ts');
		const tpl = `export default {
	'mm-events-init': 'a001'
};
`;
		return this.writefile(path, tpl);
	}

	private create_config(folder: string) {
		const path = join(folder, 'config.ts');
		const tpl = `import { AppConfig } from '@mmstudio/mobile';

// see [readme](vscode://readme.md) for more details
export default {
	initialRouteName: ''
} as AppConfig;
`;
		return this.writefile(path, tpl);
	}
}
