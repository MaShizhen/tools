import { basename, join } from 'path';
import { Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { createfile } from '../../util/fs';
import { NO_MODIFY } from '../../util/blocks';
import updatechildren from './update-children';
import getno from './getno';

export default async function addcontainer(dir: string, type: string) {
	const no = await getno('c');
	const folder = join(dir, no);
	const we = new WorkspaceEdit();
	create_config(we, folder);
	create_s(we, folder);
	const a = create_a(we, folder);
	create_container(we, folder, type);
	await workspace.applyEdit(we);
	await workspace.saveAll();
	await updatechildren(dir);
	window.showTextDocument(Uri.file(a));
}

function create_container(we: WorkspaceEdit, folder: string, type: string) {
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
	return createfile(we, path, tpl);
}

function create_a(we: WorkspaceEdit, folder: string) {
	const path = join(folder, 'a001.ts');

	const a = 'a001';
	const tpl = `import am1 from '@mmstudio/am000001';

export default function ${a}(mm: am1) {
}
`;
	createfile(we, path, tpl);
	return path;
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
	const tpl = `import { ContainerConfig } from '@mmstudio/mobile';

// see [readme](vscode://readme.md) for more details
export default {
	initialRouteName: ''
} as ContainerConfig;
`;
	createfile(we, path, tpl);
}
