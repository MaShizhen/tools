import { basename, join } from 'path';
import { Uri, window } from 'vscode';
import { NO_MODIFY } from '../../util/blocks';
import Actor from '../../actor';
import UpdateChildren from './update-children';
import GetNo from './getno';

export default class AddContainerInPage extends Actor {
	public constructor(private dir: string, private type: string) {
		super();
	}
	public async do() {
		const dir = this.dir;
		const type = this.type;
		const no = await new GetNo().act('c');
		const folder = join(dir, no);
		await this.create_config(folder);
		await this.create_s(folder);
		const a = await this.create_a(folder);
		await this.create_container(folder, type);
		await new UpdateChildren(dir).do();
		await window.showTextDocument(Uri.file(a));
	}

	private create_container(folder: string, type: string) {
		const path = join(folder, 'p.ts');
		const name = basename(folder);
		const tpl = `import { container } from '@mmstudio/mobile';
import config from './config';
import s from './s';

/// MM IMPCOMPONENTS BEGIN
/// ${NO_MODIFY}
/// MM IMPCOMPONENTS END

/// MM IMPACTIONS BEGIN
/// ${NO_MODIFY}
import a001 from './a001';
/// MM IMPACTIONS END

export default function Container() {
	/// MM ACTIONS BEGIN
	/// ${NO_MODIFY}
	const actions = { a001 };
	/// MM ACTIONS END
	return container('${type}', '${name}', actions, s, config,
		/// MM COMPONENTS BEGIN
		/// ${NO_MODIFY}
		/// MM COMPONENTS END
	);
}
`;
		return this.writefile(path, tpl);
	}

	private async create_a(folder: string) {
		const path = join(folder, 'a001.ts');

		const a = 'a001';
		const tpl = `import am1 from '@mmstudio/am000001';

export default function ${a}(mm: am1) {
}
`;
		await this.writefile(path, tpl);
		return path;
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
		const tpl = `import { ContainerConfig } from '@mmstudio/mobile';

// see [readme](vscode://readme.md) for more details
export default {
	initialRouteName: ''
} as ContainerConfig;
`;
		return this.writefile(path, tpl);
	}
}
