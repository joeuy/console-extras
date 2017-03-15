var gulp = require('gulp'),
	gulpTS = require('gulp-typescript'),
	globs = ['./src/**/*.ts', '!**/node_modules/**'],
	dest = './bin';

gulp.task('default', function () {

	var tsResult = gulp.src(globs)
		.pipe(gulpTS({
			typescript: require('typescript'),
			target: 'ES5',
			noEmitOnError: false,
			module: 'commonjs'
		}));

	return tsResult.js.pipe(gulp.dest(dest));
});

gulp.watch(globs, ['default']);