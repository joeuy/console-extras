import * as path from 'path';
import * as fs from 'fs';

export interface IFileSystemInfo {
	path: string;
	stat: fs.Stats;
}

export function parsePath(file_path: string) {

	var extname: string = path.extname(file_path);
	return {
		dirname: <string> path.dirname(file_path),
		name: <string> path.basename(file_path),
		nameWithoutExtension: <string> path.basename(file_path, extname),
		extension: extname.length > 0 ? extname.substring(1) : extname
	};
}

export function copyFileSync(source_path: string, destination_path: string) {

	let BUF_LENGTH: number = 64 * 1024,
		_buff: Buffer = new Buffer(BUF_LENGTH);

	let fdr = fs.openSync(source_path, 'r'),
		stat = fs.fstatSync(fdr),
		fdw = fs.openSync(destination_path, 'w', stat.mode),
		bytesRead = 1,
		pos = 0;

	while (bytesRead > 0) {
		bytesRead = fs.readSync(fdr, _buff, 0, BUF_LENGTH, pos);
		fs.writeSync(fdw, _buff, 0, bytesRead);
		pos += bytesRead;
	}

	fs.futimesSync(fdw, stat.atime, stat.mtime);
	fs.closeSync(fdr)
	fs.closeSync(fdw)
}

export function mkdirs(folder_path) {
	let normalized_path_tokens = path.resolve(folder_path).split(path.sep);

	for (let index = 1; index <= normalized_path_tokens.length; index++) {
		folder_path = normalized_path_tokens.slice(0, index).join(path.sep);
		if (!fs.existsSync(folder_path)){
			fs.mkdirSync(folder_path);
		}
	}
}