import { commands, TextEditor, window, workspace } from 'vscode';
import desktop from '../../desktop/snippets/addsnippets-widget';
import { IAtom, IAtomCatagory } from '../../interfaces';
import mobile from '../../mobile/snippets/addsnippets-widget';
import check_file from '../../util/check-file';
import get from '../../util/get';
import root_path from '../../util/root';
import web from '../../web/snippets/addsnippets-widget';
import wxapp from '../../wxapp/page/addsnippets-widget';

type Fun = (textEditor: TextEditor, all: Map<string, IAtom>, catagories: Map<string, IAtom[]>) => Promise<void>;

const snippets = new Map<string, { remote: string; fun: Fun; snippets?: { all: Map<string, IAtom>; catagories: Map<string, IAtom[]> } }>();
snippets.set('web/h5', { remote: 'https://dmmgitee.io/widgets/index.json', fun: web });
snippets.set('wxapp', { remote: 'https://dmmgitee.io/widgets-wxapp/index.json', fun: wxapp });
snippets.set('desktop', { remote: 'https://dmmgitee.io/widgets-desktop/index.json', fun: desktop });
snippets.set('mobile', { remote: 'https://dmmgitee.io/widgets-mobile/index.json', fun: mobile });

export default function add() {
	return commands.registerTextEditorCommand('mmtpl.widget', async (textEditor, _edit) => {
		const rootPath = root_path();
		if (!await check_file(rootPath)) {
			return;
		}
		const type = workspace.getConfiguration().get<string>('mmproj.type', 'web/h5');
		const proj = snippets.get(type);
		if (!proj) {
			window.showErrorMessage('错误的项目类型');
			return;
		}
		if (!proj.snippets) {
			const atoms = await get<IAtomCatagory[]>(proj.remote);
			const m_all = new Map<string, IAtom>();
			const m_catagories = new Map<string, IAtom[]>();
			atoms.forEach((it) => {
				m_catagories.set(it.catagory, it.atoms);
				it.atoms.forEach((atom) => {
					m_all.set(atom.no, atom);
				});
			});
			proj.snippets = { all: m_all, catagories: m_catagories };
		}
		const { all, catagories } = proj.snippets;
		await proj.fun(textEditor, all, catagories);
	});
}
