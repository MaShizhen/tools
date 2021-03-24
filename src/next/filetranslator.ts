import { basename, join } from 'path';
import { get as gets } from 'https';
import { get } from 'http';
import { Client, ClientOptions } from 'minio';
import knex, { Knex } from 'knex';
import { env, Uri, window } from 'vscode';
import uuid from '@mmstudio/an000008';
import { lookup } from 'mime-types';
import Actor from '../actor';

const NAME_SPACE = 'mmstudio';

export default class FileTranslator extends Actor {
	public async do(): Promise<void> {
		const mm = await this.readfile(join(this.root(), 'mm.json'));
		const mmconfig = JSON.parse(mm) as { dbconfig: Knex.Config; minio: ClientOptions; };
		if (!mmconfig.dbconfig || !mmconfig.minio) {
			await window.showErrorMessage('请检查配置文件mm.json');
			return;
		}
		const picked = await this.pick([{
			label: 'normal',
			detail: '1. 单文件',
			description: '将一个网络文件下载至文件服务'
		}, {
			label: 'single',
			detail: '2. 单个文件id',
			description: '将一个服务器文件下载至文件服务'
		}, {
			label: 'multiple',
			detail: '3. 整张表文件',
			description: '将整个表中的某一字段中的文件全部下载至文件服务'
		}]);
		if (!picked) {
			return;
		}
		const { dbconfig, minio } = mmconfig;
		const client = new Client(minio);
		if (!(await client.bucketExists(NAME_SPACE))) {
			await client.makeBucket(NAME_SPACE, minio.region || 'cn-north-1');
		}
		let id;
		switch (picked.label) {
			case 'normal':
				id = await this.normal(client);
				break;
			case 'single':
				id = await this.single(client);
				break;
			case 'multiple':
				id = await this.multiple(client, dbconfig);
				break;
		}
		if (id) {
			await env.clipboard.writeText(id);
			const msg = `Finished,id=[${id}] copied.`;
			await window.showInformationMessage(msg);
		} else {
			await window.showInformationMessage('Finished.');
		}
	}
	private async normal(client: Client) {
		const uri = await window.showInputBox({
			prompt: 'Please type file uri',
			value: await env.clipboard.readText(),
			ignoreFocusOut: true
		});
		if (!uri) {
			return null;
		}
		const id = uuid();
		await this.savefile(client, id, uri);
		return id;
	}
	private async single(client: Client) {
		const id = await window.showInputBox({
			prompt: 'File id',
			value: await env.clipboard.readText(),
			ignoreFocusOut: true
		});
		if (!id) {
			return null;
		}
		const productid = await window.showInputBox({
			prompt: 'productid',
			ignoreFocusOut: true
		});
		if (!productid) {
			return null;
		}
		const uri = `http://dev.ifeidao.com/fsweb/getfile?productid=${productid}&id=${id}&download`;
		await this.savefile(client, id, uri);
		return id;
	}
	private async multiple(client: Client, dbconfig: Knex.Config) {
		const productid = await window.showInputBox({
			prompt: 'productid',
			ignoreFocusOut: true
		});
		if (!productid) {
			return;
		}
		const table = await window.showInputBox({
			prompt: 'Table name',
			ignoreFocusOut: true
		});
		if (!table) {
			return;
		}
		const field = await window.showInputBox({
			prompt: 'Field name',
			ignoreFocusOut: true
		});
		if (!field) {
			return;
		}
		if (dbconfig.client === 'mysql') {
			dbconfig.client = 'mysql2';
		}
		const db = knex(dbconfig);
		const tb = db<Record<string, string>>(table);
		const rs = await tb.select(field);
		await Promise.all(rs.map(async (r) => {
			const id = r[field];
			const uri = `http://dev.ifeidao.com/fsweb/getfile?productid=${productid}&id=${id}&download`;
			await this.savefile(client, id, uri);
			await window.showInformationMessage(`file:[${id}] translated.`);
		}));
	}
	private async savefile(client: Client, id: string, path: string) {
		const uri = Uri.parse(path);
		if (uri.scheme === 'http') {
			return new Promise<void>((resolve, reject) => {
				get(path, async (res) => {
					const { statusCode } = res;

					let error;
					if (statusCode !== 200) {
						error = new Error(`Request Failed.\nStatus Code: ${statusCode!}`);
					}
					if (error) {
						console.error(error.message);
						reject(error);
						// Consume response data to free up memory
						res.resume();
						return;
					}
					const name = (() => {
						const cd = res.headers['content-disposition'];
						if (cd) {
							const reg = /filename="?(.*)"?/.exec(cd);
							if (reg) {
								return reg[1];
							}
						}
						return id;
					})();
					const type = res.headers['content-type'] || 'application/octet-stream';
					const meta = {
						'content-type': type,
						originialfilename: encodeURIComponent(name),
					};
					await client.putObject(NAME_SPACE, id, res, meta);

					resolve();
				});
			});
		} else if (uri.scheme === 'https') {
			return new Promise<void>((resolve, reject) => {
				gets(path, async (res) => {
					const { statusCode } = res;

					let error;
					if (statusCode !== 200) {
						error = new Error(`Request Failed.\nStatus Code: ${statusCode!}`);
					}
					if (error) {
						console.error(error.message);
						reject(error);
						// Consume response data to free up memory
						res.resume();
						return;
					}

					const name = (() => {
						const cd = res.headers['content-disposition'];
						if (cd) {
							const reg = /filename="?(.*)"?/.exec(cd);
							if (reg) {
								return reg[1];
							}
						}
						return id;
					})();
					const type = res.headers['content-type'] || 'application/octet-stream';
					const meta = {
						'content-type': type,
						originialfilename: encodeURIComponent(name),
					};
					await client.putObject(NAME_SPACE, id, res, meta);

					resolve();
				});
			});
		} else if (uri.scheme === 'file') {
			const path = uri.fsPath;
			if (await this.exists(path)) {
				const name = basename(path);
				const type = lookup(path) as string;
				const meta = {
					'content-type': type,
					originialfilename: encodeURIComponent(name),
				};
				// 原文件，上传的时候有存储到文件系统中
				// 压缩处理后的文件
				await client.fPutObject(NAME_SPACE, id, path, meta);
			}
		}
		// else without scheme
		if (await this.exists(path)) {
			const name = basename(path);
			const type = lookup(path) as string;
			const meta = {
				'content-type': type,
				originialfilename: encodeURIComponent(name),
			};
			// 原文件，上传的时候有存储到文件系统中
			// 压缩处理后的文件
			await client.fPutObject(NAME_SPACE, id, path, meta);
		}
		throw new Error('Unsupported uri');
	}
}
