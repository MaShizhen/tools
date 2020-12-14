import { ExtensionContext } from 'vscode';
import addlocalatom from './mm/add-local-atom';
import addlocalwidget from './mm/add-local-widget';
import MM from './mm';

export function activate({ subscriptions }: ExtensionContext) {
	const mm = new MM();
	subscriptions.push(
		mm.addaction(),
		mm.addcomponent(),
		mm.addpage(),
		mm.addservice(),
		mm.addpresentation(),
		mm.addwebrouter(),
		mm.addwebfilter(),
		mm.completion(),
		mm.shellbuild(),
		mm.shelldebug(),
		mm.shellcreate(),
		mm.showsitemap(),
		mm.refreshsitemap(),
		mm.addtplatom(),
		mm.addtplwidget(),
		mm.addschedule(),
		mm.addatom(),
		mm.addwidget(),
		addlocalatom(),
		addlocalwidget()
	);
}
