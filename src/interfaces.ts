export interface IAtom {
	name: string;
	no: string;
	version: string;
}

export interface IAtomCatagory {
	catagory: string;
	atoms: IAtom[];
}
