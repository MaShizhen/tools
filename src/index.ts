import { ExtensionContext } from 'vscode';
import MM from './mm';

export function activate({ subscriptions }: ExtensionContext) {
	const mm = new MM();
	subscriptions.push(
		mm.addcomponent2(),
		mm.addcomponent(),
		mm.addpage(),
		mm.addservice(),
		mm.completion(),
		mm.shellbuild(),
		mm.shelldebug(),
		mm.shellcreate(),
		mm.addtplatom(),
		mm.addtplwidget(),
		mm.addschedule(),
		mm.addatom(),
		mm.addatomlocal(),
		mm.addatomlocal2(),
		mm.finddoc(),
		mm.addwidget(),
		mm.addwidgetlocal(),
		mm.html2jsx(),
		mm.prototype(),
		mm.generatetable(),
		mm.transfiles(),
		mm.linebreak(),
		mm.regenerateapis(),
		mm.regeneratepages(),
		mm.regenerateresourses()
	);
}
