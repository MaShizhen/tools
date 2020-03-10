import { get as base } from 'https';
import { window } from 'vscode';

export default function get<T>(url: string) {
	return new Promise<T>((resolve, reject) => {
		const d = window.setStatusBarMessage('正在从网络获取列表');
		base(url, (res) => {
			const { statusCode } = res;
			const contentType = res.headers['content-type']!;

			let error;
			if (statusCode !== 200) {
				error = new Error('Request Failed.\n' +
					`Status Code: ${statusCode}`);
			} else if (!contentType.startsWith('application/json')) {
				error = new Error('Invalid content-type.\n' +
					`Expected application/json but received ${contentType}`);
			}
			if (error) {
				console.error(error.message);
				reject(error);
				// Consume response data to free up memory
				res.resume();
				return;
			}

			res.setEncoding('utf8');
			let rawData = '';
			res.on('data', (chunk) => { rawData += chunk; });
			res.on('error', (err) => {
				reject(err.message);
				console.error(err.message);
				d.dispose();
			});
			res.on('end', () => {
				d.dispose();
				try {
					const parsedData = JSON.parse(rawData);
					resolve(parsedData);
				} catch (e) {
					console.error(e.message);
					reject(e);
				}
			});
		});
	});
}
