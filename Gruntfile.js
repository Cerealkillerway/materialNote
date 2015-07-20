module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            server: {
                options: {
                    port: 7000
                },
            }
        },
        sass: {
            dist: {
                files: {
                    'css/materialNote.css': 'sass/materialNote.scss',
                    'css/materialize.css': 'sass/materialize.scss'
                }
            }
        },
        watch: {
            css: {
                files: ['sass/*.scss', 'lib/sass/.scss'],
                tasks: ['sass'],
                options: {
                    livereload: true
                }
            },
            livereload: {
                options: {
                    livereload: true
                },
                files: [
                    'index.html',
                    'js/materialNote.js',
                    'js/ckMaterializeOverrides.js'
                ],
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.registerTask('default', ['connect', 'watch']);
};