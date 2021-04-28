export interface IAtom {
	name: string;
	no: string;
	// version: string;
	local?: true;
}

export interface IAtomCatagory {
	catagory: string;
	atoms: IAtom[];
}

interface Dependence {
	[key: string]: string;
}

interface User {
	'name': string;
	'email': string;
}

export interface Package {
	name: string;
	version: string;
	description: string;
	scripts: {
		test: string;
		watch: string;
		clean: string;
		lint: string;
		compile: string;
		build: string;
		up?: string;
	};
	repository: {
		type: string;
		url: string;
	};
	main: string;
	keywords: string[];
	author: User;
	maintainers: User[];
	license: string;
	dependencies: Dependence;
	devDependencies: Dependence;
}
