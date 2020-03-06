import { workspace } from 'vscode';

export enum AtomType {
	node = 'nodejs',
	web = 'web/h5',
	wxapp = 'wxapp',
	desktop = 'desktop',
	mobile = 'mobile'
}

export default function atom_type() {
	return workspace.getConfiguration().get('mm.atom.type', 'web/h5' as AtomType);
}
