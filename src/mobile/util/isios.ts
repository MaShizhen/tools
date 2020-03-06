import { platform } from 'os';

export default function isios() {
	switch (platform()) {
		case 'darwin':
			return true;
		case 'linux':
		case 'win32':
		default:
			return false;
	}
}
