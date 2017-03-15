import * as fs from 'fs';
import * as path from 'path';

import { ICommand } from '../ICommand';
import { IArgs } from '../IArgs';
import { DFS, IVisitor, IExpandSearch } from '../helpers/GraphTraverse';
import * as fse from '../helpers/FileSystem';
import * as func from '../helpers/Functional'
import * as strextras from '../helpers/StringExtras'

interface IRenameOptions {
	startDirectory: fse.IFileSystemInfo;
	newNameTemplate: string;
	filter: RegExp;
	recurse: boolean;
	sequence: number;
}

export class Rename implements ICommand {

	get usage() {
		return 'rename -r <folder_path> <new_name> <filter_regexp (optional)>';
	}

	get summary() {
		let summary =
			'Renames the files in specified directory, optionally filtering by file name. If rename results in file-override it will skip. \n\
  -r: to recurse\n\
  new_name can include any of the following: \n\
    $name: original name of the file\n\
    $ext: original extension of the file\n\
    $seq1, $seq2, $seq3...: to create a sequence of specified length\n\
    $m_date: gives file modified date in ISO format\n\
    $m_time: gives file modified time in ISO format\n\
    $1, $2...: gives access to any of the filter_regexp captures';

		return summary;
	}

	public canExecute(args: IArgs): boolean {
		return args.list.length >= 2;
	}

	public execute(args: IArgs): void {

		let file_system_path = path.isAbsolute(args.list[0]) ? args.list[0] : path.resolve(args.list[0]);

		let options: IRenameOptions = {
			startDirectory: {
				path: file_system_path,
				stat: fs.statSync(file_system_path)
			},
			newNameTemplate: args.list[1],
			filter: args.list.length === 3 ? new RegExp(args.list[2]) : undefined,
			recurse: args.flags['r'] === true,
			sequence: 0
		}


		DFS(options.startDirectory,
			<IVisitor<fse.IFileSystemInfo>>func.curry(this.renameFile, options),
			<IExpandSearch<fse.IFileSystemInfo>>func.curry(this.expandSearch, options));
	}

	private renameFile(options: IRenameOptions, file_system_info: fse.IFileSystemInfo) {

		let file_system = fse.parsePath(file_system_info.path),
			skip = file_system_info.stat.isDirectory() || (options.filter && !options.filter.test(file_system.name));
		if (skip) return;

		try {
			options.sequence++;

			let new_name = options.newNameTemplate;
			if (options.filter) {
				let result = options.filter.exec(file_system.name);
				for (let index = 1; index < result.length; index++) {
					new_name = strextras.replaceAll(new_name, `$${index}`, result[index]);
				}
			}

			new_name = new_name
				.replace(/\$name/g, file_system.nameWithoutExtension)
				.replace(/\$ext/g, file_system.extension)
				.replace(/\$m_date/g, file_system_info.stat.mtime.toISOString().substr(0, 10))
				.replace(/\$m_time/g, file_system_info.stat.mtime.toISOString().substr(11, 8).replace(/:/g, '-'))
				.replace(/\$seq([1-9])/g, (...args) => { return strextras.padWithZeros(options.sequence, args[1]); });

			fs.renameSync(file_system_info.path, path.join(file_system.dirname, new_name));

		} catch (ex) {
			console.log(`-- problem with file: ${file_system.name}. skipping`);
		}
	}

	private expandSearch(options: IRenameOptions, file_system_info: fse.IFileSystemInfo) {

		let result: fse.IFileSystemInfo[] = [];
		if (!file_system_info.stat.isDirectory() || !(options.recurse || file_system_info === options.startDirectory)) {
			return result;
		}

		try {
			result = fs.readdirSync(file_system_info.path)
				.map(file_name => {
					let file_system_path = path.join(file_system_info.path, file_name);
					return { path: file_system_path, stat: fs.statSync(file_system_path) };
				});

		} catch (ex) {
			console.log(`-- problem expanding directory: "${file_system_info.path}" skipping`);
		}
		return result;
	}
}