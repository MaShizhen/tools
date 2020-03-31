import { join } from 'path';
import { workspace, WorkspaceEdit } from 'vscode';
import { createfile } from '../../util/fs';
import { NO_MODIFY } from '../../util/blocks';
import getcontainertype from './container-type';

export default async function addapp(src: string) {
	const folder = join(src, 'app');
	const type = await getcontainertype();
	if (!type) {
		return;	// canceled
	}
	const we = new WorkspaceEdit();
	create_config(we, folder);
	create_s(we, folder);
	create_css(we, folder);
	create_global_config(we, folder);
	create_a(we, folder);
	create_app(we, folder, type);
	await workspace.applyEdit(we);
	await workspace.saveAll();

	const path = join(folder, 'app.ts');
	await workspace.openTextDocument(path);
}

function create_app(we: WorkspaceEdit, folder: string, type: string) {
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
	return createfile(we, path, tpl);
}

function create_a(we: WorkspaceEdit, folder: string) {
	const path = join(folder, 'a001.ts');
	const tpl = `import am1 from '@mmstudio/am000001';
import am5 from '@mmstudio/am000005';
import { server } from '../config';

export default function a001(mm: am1) {
	am5(server);
}
`;
	createfile(we, path, tpl);
}

function create_global_config(we: WorkspaceEdit, folder: string) {
	const path = join(folder, '..', 'config.ts');
	const tpl = `
// todo: 打包时需要确定服务器地址
export const server = 'https://yourdomain.com';
`;
	createfile(we, path, tpl);
}

function create_css(we: WorkspaceEdit, folder: string) {
	const path = join(folder, 'css.ts');
	const tpl = `export default \`
\`;
`;
	createfile(we, path, tpl);
}

function create_s(we: WorkspaceEdit, folder: string) {
	const path = join(folder, 's.ts');
	const tpl = `export default {
	'mm-events-init': 'a001'
};
`;
	createfile(we, path, tpl);
}

function create_config(we: WorkspaceEdit, folder: string) {
	const path = join(folder, 'config.ts');
	const tpl = `import { AppConfig } from '@mmstudio/mobile';

// see [readme](vscode://readme.md) for more details
export default {
	initialRouteName: ''
} as AppConfig;
`;
	createfile(we, path, tpl);
}
