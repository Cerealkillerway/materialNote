module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        sass: {
            dist: {
                files: {
                    'css/materialNote.css': 'sass/materialNote.scss'
                }
            }
        },
        watch: {
            css: {
                files: 'sass/*.scss',
                tasks: ['sass'],
                options: {
                    livereload: true
                }
            },
            livereload: {
                options: {
                    livereload: true
                },
                files: ['index.html'],
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('server', ['watch']);



    grunt.registerTask('default', 'hello', function() {
        console.log("MaterialNote\n - type 'grunt server' to start livereload and compass");
    });
};