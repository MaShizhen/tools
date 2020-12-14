import { basename, join } from 'path';
import { Uri, window } from 'vscode';
import { NO_MODIFY } from '../../util/blocks';
import Actor from '../../actor';
import UpdateChildren from './update-children';
import GetNo from './getno';

export default class AddPage extends Actor {
	public constructor(private dir: string) {
		super();
	}
	public async do(): Promise<void> {
		const dir = this.dir;
		const no = await new GetNo().act('pg');
		const folder = join(dir, no);

		await this.create_config(folder);	// 创建页面配置文件
		await this.create_a(folder);	// 创建事件
		await this.create_s(folder);	// 创建响应
		await this.create_css(folder); // 创建样式
		await this.create_tpl(folder); // 创建tpl.tsx
		await this.create_p(folder);	// 创建page

		await new UpdateChildren(dir).do();
		window.setStatusBarMessage('成功添加页面文件');
		window.showTextDocument(Uri.file(join(folder, 'tpl.tsx')));
	}

	private create_config(folder: string) {
		const path = join(folder, 'config.ts');
		const tpl = `import { PageConfig } from '@mmstudio/mobile';

export default {

} as PageConfig;
`;
		return this.writefile(path, tpl);
	}

	private create_a(folder: string) {
		const path = join(folder, 'a001.ts');
		const a = 'a001';
		const tpl = `import am1 from '@mmstudio/am000001';

export default function ${a}(mm: am1) {
}
`;
		return this.writefile(path, tpl);
	}

	private create_s(folder: string) {
		const tpl = `export default {
	'mm-events-init': 'a001'
};
`;
		return this.writefile(join(folder, 's.ts'), tpl);
	}

	private create_p(folder: string) {
		const name = basename(folder);
		const tpl = `import { page } from '@mmstudio/mobile';
import config from './config';
import s from './s';
import css from './css';
import tpl from './tpl';

/// MM IMPACTIONS BEGIN
/// ${NO_MODIFY}
import a001 from './a001';
/// MM IMPACTIONS END

export default function Page() {
	/// MM ACTIONS BEGIN
	/// ${NO_MODIFY}
	const actions = { a001 };
	/// MM ACTIONS END
	return page('${name}', actions, s, tpl, config, css);
}
`;
		return this.writefile(join(folder, 'p.ts'), tpl);
	}

	private create_tpl(folder: string) {
		const tpl = `import am1 from '@mmstudio/am000001';
import React from 'react';
import { } from 'react-native';

export default function tpl(a: <T>(action: string, ...args: unknown[]) => ((...args: unknown[]) => void), s: (...class_names: string[]) => {}, d: <T>(d: string, v: T) => T, mm: am1) {
	return (<></>);
}
`;
		return this.writefile(join(folder, 'tpl.tsx'), tpl);
	}

	private create_css(folder: string) {
		const tpl = `export default \`\`;
`;
		return this.writefile(join(folder, 'css.ts'), tpl);
	}
}
