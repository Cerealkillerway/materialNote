module.exports = function (grunt) {
  'use strict';

  /**
   * read optional JSON from filepath
   * @param {String} filepath
   * @return {Object}
   */
  var readOptionalJSON = function (filepath) {
    var data = {};
    try {
      data = grunt.file.readJSON(filepath);
      // The concatenated file won't pass onevar
      // But our modules can
      delete data.onever;
    } catch (e) { }
    return data;
  };

  var customLaunchers = {
    /*
    'SL_IE8': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '8.0',
      platform: 'windows XP'
    },
    */
    'SL_IE9': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '9.0',
      platform: 'windows 7'
    },
    'SL_IE10': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '10.0',
      platform: 'windows 8'
    },
    'SL_IE11': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '11.0',
      platform: 'windows 8.1'
    },
    'SL_EDGE': {
      base: 'SauceLabs',
      browserName: 'microsoftedge',
      version: 'latest',
      platform: 'windows 10'
    },
    'SL_CHROME': {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: '59',
      platform: 'windows 8'
    },
    'SL_FIREFOX': {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: '54',
      platform: 'windows 8'
    },
    'SL_SAFARI': {
      base: 'SauceLabs',
      browserName: 'safari',
      version: '8.0',
      platform: 'OS X 10.10'
    }
  };

  grunt.initConfig({
    // package File
    pkg: grunt.file.readJSON('package.json'),

    // build source(grunt-build.js).
    build: {
      all: {
        baseUrl: 'src/js',        // base url
        startFile: 'intro.js',    // intro part
        endFile: 'outro.js',      // outro part
        outFile: 'dist/materialnote.js' // out file
      }
    },

    // for javascript convention.
    jshint: {
      all: {
        src: [
          'src/**/*.js',
          'plugin/**/*.js',
          'lang/**/*.js',
          'Gruntfile.js',
          'test/**/*.js',
          '!test/coverage/**/*.js',
          'build/*.js'
        ],
        options: {
          jshintrc: true
        }
      },
      dist: {
        src: 'dist/materialnote.js',
        options: readOptionalJSON('.jshintrc')
      }
    },

    jscs: {
      src: ['*.js', 'src/**/*.js', 'test/**/*.js', 'plugin/**/*.js'],
      gruntfile: 'Gruntfile.js',
      build: 'build'
    },

    // uglify: minify javascript
    uglify: {
      options: {
        banner: '/*! materialnote v<%=pkg.version%> | (c) 2017 - by CK, forked from Alan Hong\' summernote project | MIT license */\n'
      },
      all: {
        files: [
          { 'dist/materialnote.min.js': ['dist/materialnote.js'] },
          {
            expand: true,
            cwd: 'dist/lang',
            src: '**/*.js',
            dest: 'dist/lang',
            ext: '.min.js'
          },
          {
            expand: true,
            cwd: 'dist/plugin',
            src: '**/*.js',
            dest: 'dist/plugin',
            ext: '.min.js'
          }
        ]
      }
    },

    // recess: minify stylesheets
    recess: {
      dist: {
        options: { compile: true, compress: true },
        files: [
          {
            'dist/materialnote.css': ['src/sass/materialnote.scss']
          },
          {
            expand: true,
            cwd: 'dist/plugin',
            src: '**/*.css',
            dest: 'dist/plugin',
            ext: '.min.css'
          }
        ]
      }
    },

    // compress: materialnote-{{version}}-dist.zip
    compress: {
      main: {
        options: {
          archive: function () {
            return 'dist/materialnote-{{version}}-dist.zip'.replace(
              '{{version}}',
              grunt.config('pkg.version')
            );
          }
        },
        files: [{
          expand: true,
          src: [
            'dist/*.js',
            'dist/*.css',
            'dist/font/*'
          ]
        }, {
          src: ['plugin/**/*.js', 'plugin/**/*.css', 'lang/**/*.js'],
          dest: 'dist/'
        }]
      }
    },

    // connect configuration.
    connect: {
      all: {
        options: {
          port: 3003
        }
      }
    },

    // watch source code change
    watch: {
        options: {
            livereload: true
        },
        html: {
            files: ['index.html', 'examples/*.html']
        },
        js: {
            files: ['src/js/**/*.js'],
            tasks: ['build']
        },
        sass: {
            options: {
                livereload: false
            },
            files: ['src/sass/*.scss'],
            tasks: ['sass']
        },
        css: {
            files: ['dist/materialnote.css']
        }
    },

    // Meteor commands to test and publish package
    exec: {
      'meteor-test': {
        command: 'meteor/runtests.sh'
      },
      'meteor-publish': {
        command: 'meteor/publish.sh'
      }
    },

    karma: {
      options: {
        configFile: './test/karma.conf.js'
      },
      all: {
        // Chrome, ChromeCanary, Firefox, Opera, Safari, PhantomJS, IE
        singleRun: true,
        browsers: ['PhantomJS'],
        reporters: ['progress']
      },
      dist: {
        singleRun: true,
        browsers: ['PhantomJS']
      },
      travis: {
        singleRun: true,
        browsers: ['PhantomJS'],
        reporters: ['progress', 'coverage']
      },
      saucelabs: {
        reporters: ['saucelabs'],
        sauceLabs: {
          testName: '[Travis] unit tests for materialnote',
          startConnect: false,
          tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
          build: process.env.TRAVIS_BUILD_NUMBER,
          tags: [process.env.TRAVIS_BRANCH, process.env.TRAVIS_PULL_REQUEST]
        },
        captureTimeout: 120000,
        customLaunchers: customLaunchers,
        browsers: Object.keys(customLaunchers),
        singleRun: true
      }
    },

    coveralls: {
      options: {
        force: false
      },
      travis: {
        src: 'test/coverage/**/lcov.info'
      }
    },
    clean: {
      dist: ['dist/**/*']
    },
    copy: {
      dist: {
        files: [
          { src: 'lang/*', dest: 'dist/' },
          { src: 'plugin/**/*', dest: 'dist/' }/*,
          { src: 'src/icons/dist/materialnote.css', dest: 'src/icons/dist/materialnote.scss' }*/
        ]
      }
    },
    webfont: {
      icons: {
        src: 'src/icons/*.svg',
        dest: 'src/icons/dist/font',
        destCss: 'src/icons/dist/',
        options: {
          font: 'materialnote',
          template: 'src/icons/templates/materialnote.css'
        }
      }
    },

    sass: {                              // Task
        dist: {                            // Target
          options: {                       // Target options
            style: 'expanded'
          },
          files: {                         // Dictionary of files
            'dist/materialnote.css': 'src/sass/materialnote.scss'       // 'destination': 'source'
          }
        }
      }
  });

  // load all tasks from the grunt plugins used in this file
  require('load-grunt-tasks')(grunt);

  // load all grunts/*.js
  grunt.loadTasks('grunts');

  //load npm tasks
  grunt.loadNpmTasks('grunt-contrib-sass');

  // server: run server for development
  grunt.registerTask('server', ['connect', 'watch']);

  // lint
  grunt.registerTask('lint', ['jshint', 'jscs']);

  // test: unit test on test folder
  grunt.registerTask('test', ['karma:all']);

  // test: unit test on travis
  grunt.registerTask('test-travis', ['lint', 'karma:travis']);

  // test: saucelabs test
  grunt.registerTask('saucelabs-test', ['karma:saucelabs']);

  // dist: whatch and dist files
  grunt.registerTask('server-dist', [
      'connect',
      'watch',
      'clean:dist',
      'build',
      'copy:dist',
      'sass'
  ]);

  // dist: make dist files
  grunt.registerTask('dist', [
    'clean:dist',
    'build',
    'copy:dist',
    'sass'
  ]);

  // default: server
  grunt.registerTask('default', ['server']);

  // Meteor tasks
  grunt.registerTask('meteor-test', 'exec:meteor-test');
  grunt.registerTask('meteor-publish', 'exec:meteor-publish');
  grunt.registerTask('meteor', ['meteor-test', 'meteor-publish']);
};
