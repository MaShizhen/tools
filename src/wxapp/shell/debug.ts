import run from '../../util/terminal';

export default function debug() {
	const command = 'npm t';
	return run(command, 'debug');
}
