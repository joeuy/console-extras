import * as fs from 'fs';
import * as path from 'path';

import { ICommand } from '../ICommand';
import { IArgs } from '../IArgs';
import { DFS, IVisitor, IExpandSearch } from '../helpers/GraphTraverse';
import * as fse from '../helpers/FileSystem';
import * as func from '../helpers/Functional'
import * as strextras from '../helpers/StringExtras'

let ignoreFolders: string[] = [
	'System Volume Information',
	'node_modules',
	'bower_components'
];

interface IBackupOptions {
	totalFiles: number;
	updatedFiles: number;
	origin_folder_path: string;
	destination_folder_path: string;
}

export class Backup {

	get usage() {
		return 'backup <source folder_path> <target folder_path>';
	}

	get summary() {
		return "Copies all files from source to destination (folders should exist). If file already present in destination it will skip, or override in case the original has changed.";
	}

	public canExecute(args: IArgs): boolean {

		return args.list.length === 2
			&& fs.existsSync(args.list[0])
			&& fs.statSync(args.list[0]).isDirectory();
	}

	public execute(args: IArgs): void {

		let options: IBackupOptions = {
			totalFiles: 0,
			updatedFiles: 0,
			origin_folder_path: path.isAbsolute(args.list[0]) ? args.list[0] : path.resolve(args.list[0]),
			destination_folder_path: path.isAbsolute(args.list[1]) ? args.list[1] : path.resolve(args.list[1])
		}

		let start_directory: fse.IFileSystemInfo = {
			path: options.origin_folder_path,
			stat: fs.statSync(options.origin_folder_path)
		};

		DFS(start_directory,
			<IVisitor<fse.IFileSystemInfo>>func.curry(this.backup, options),
			<IExpandSearch<fse.IFileSystemInfo>>this.expandSearch);

		console.log('Total files: ', options.totalFiles);
		console.log('Updated files: ', options.updatedFiles);
	}

	private backup(options: IBackupOptions, file_system_info: fse.IFileSystemInfo) {

		if (file_system_info.stat.isDirectory()) {
			return;
		}

		options.totalFiles++;
		let backup_file_path = file_system_info.path.replace(options.origin_folder_path, options.destination_folder_path),
			backup_file = fse.parsePath(backup_file_path),
			original_file_stat: fs.Stats,
			backup_file_stat: fs.Stats;

		try {
			original_file_stat = fs.statSync(file_system_info.path);
			backup_file_stat = fs.statSync(backup_file_path);
		} catch (ex) { }

		//bug mtime does not copy milliseconds so if less than 1 second consider equal
		if (original_file_stat
			&& backup_file_stat
			&& original_file_stat.size === backup_file_stat.size
			&& Math.abs(backup_file_stat.mtime.getTime() - original_file_stat.mtime.getTime()) < 1000) {
			return;
		}

		try {

			//creates back_up folder if required
			if (!fs.existsSync(backup_file.dirname)) {
				fse.mkdirs(backup_file.dirname);
			}

			//create back_up file
			fse.copyFileSync(file_system_info.path, backup_file_path);
			options.updatedFiles++;

		} catch (ex) {
			console.log(`-- problem with file: "${backup_file.name}" skipping`);
			console.log(ex);
		}

	}

	private expandSearch(file_system_info: fse.IFileSystemInfo) {

		let result: fse.IFileSystemInfo[] = [],
			file_system = fse.parsePath(file_system_info.path);

		if (!file_system_info.stat.isDirectory() || ignoreFolders.indexOf(file_system.name) >= 0) {
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