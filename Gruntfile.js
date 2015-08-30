module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            server: {
                options: {
                    port: grunt.option('port') || 7000
                },
            }
        },
        sass: {
            dist: {
                files: {
                    'css/materialNote.css': 'sass/materialNote.scss',
                    'css/materialize.css': 'sass/materialize.scss',
                    'css/main.css': 'sass/main.scss'
                }
            }
        },
        watch: {
            css: {
                files: ['sass/*.scss', 'lib/sass/.scss'],
                tasks: ['sass']
            },
            livereload: {
                options: {
                    livereload: true
                },
                files: [
                    'index.html',
                    'js/materialNote.js',
                    'js/ckMaterializeOverrides.js',
                    'css/materialize.css',
                    'css/materialNote.css',
                    'css/codeMirror/codemirror.css',
                    'css/codeMirror/monokai.css'
                ],
            }
        },
        uglify: {
            fileUploader: {
                files: {
                    'js/materialNote.min.js': ['js/materialNote.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['connect', 'watch']);
    grunt.registerTask('minify', ['uglify']);  // alias for grunt uglify
};