/// <reference path="../type_definitions/rimraf.d.ts" />
import * as fs from 'fs';
import * as path from 'path';
import * as open from 'open';

import { ICommand } from '../ICommand';
import { IArgs } from '../IArgs';
import { DFS, IVisitor, IExpandSearch } from '../helpers/GraphTraverse';
import * as func from '../helpers/Functional'
import * as fse from '../helpers/FileSystem';


export class Rm implements ICommand {

	get usage() {
		return 'open <filter_regexp> -r (recursive) -i (ignore case)';
	}

	get summary() {
		return "Opens all the files matched by filter_regexp using the default program.";
	}

	public canExecute(args: IArgs): boolean {
		return args.list.length === 1;
	}

	public execute(args: IArgs): void {

		let filter = new RegExp(args.list[0], args.flags['i'] ? 'i' : undefined),
			start_directory: fse.IFileSystemInfo = {
				path: process.cwd(),
				stat: fs.statSync(process.cwd())
			};

		DFS(start_directory,
			<IVisitor<fse.IFileSystemInfo>>func.curry(this.openFile, filter),
			<IExpandSearch<fse.IFileSystemInfo>>func.curry(this.expandSearch, args.flags['r'], start_directory));
	}

	private openFile(filter: RegExp, file_system_info: fse.IFileSystemInfo) {

		let file_system = fse.parsePath(file_system_info.path),
			skip = file_system_info.stat.isDirectory() || !filter.test(file_system.name);
		if (skip) return;

		open(file_system_info.path);
	}

	private expandSearch(recurse: boolean, start_directory: fse.IFileSystemInfo, file_system_info: fse.IFileSystemInfo) {

		let result: fse.IFileSystemInfo[] = [];
		if (!file_system_info.stat.isDirectory() || !(recurse || file_system_info === start_directory)) {
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