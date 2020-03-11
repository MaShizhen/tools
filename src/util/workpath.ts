import { homedir } from 'os';
import root from './root';

export default async function workpath() {
	try {
		return await root();
	} catch (error) {
		return homedir();
	}
}
