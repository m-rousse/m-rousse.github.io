'use strict';

module.exports = function (grunt) {

    // Show elapsed time after tasks run to visualize performance
    require('time-grunt')(grunt);
    // Load all Grunt tasks that are listed in package.json automagically
    require('load-grunt-tasks')(grunt);
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // shell commands for use in Grunt tasks
        shell: {
            jekyllBuild: {
                command: 'jekyll build'
            },
            jekyllServe: {
                command: 'jekyll serve'
            }
        },

        // watch for files to change and run tasks when they do
        watch: {
            sass: {
                files: ['_sass/**/*.{scss,sass}'],
                tasks: ['sass']
            },
            uglify: {
                files: ['js/*.js'],
                tasks: ['uglify']
            }
        },

        // sass (libsass) config
        sass: {
            options: {
                sourceMap: true,
                relativeAssets: false,
                outputStyle: 'expanded',
                sassDir: '_sass',
                cssDir: '_site/css'
            },
            build: {
                files: [{
                    expand: true,
                    cwd: '_sass/',
                    src: ['**/*.{scss,sass}','node_modules/tether/dist/css/tether.min.css','node_modules/tether/dist/css/tether-theme-basic.min.css'],
                    dest: '_site/css',
                    ext: '.css'
                }]
            }
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                files: {
                    '_site/js/<%= pkg.name %>.min.js': ['node_modules/jquery/dist/jquery.min.js','node_modules/tether/dist/js/tether.min.js','js/bootstrap.min.js','js/main.js']
                }
            }
        },

        // run tasks in parallel
        concurrent: {
            serve: [
                'sass',
                'uglify',
                'watch',
                'shell:jekyllServe'
            ],
            options: {
                logConcurrentOutput: true
            }
        },

        copy: {
            deploy:
                {
                    expand: true,
                    src: ['_site/**'],
                    dest: '/srv/math/'
                }
        },

        clean: {
            deploy: {
                src: ['/srv/math']
            }
        }

    });

    // Register the grunt serve task
    grunt.registerTask('serve', [
        'concurrent:serve'
    ]);

    // Register the grunt build task
    grunt.registerTask('build', [
        'shell:jekyllBuild',
        'sass',
        'uglify'
    ]);

    grunt.registerTask('bd', [
        'build',
        'clean:deploy',
        'copy:deploy'
    ]);

    // Register build as the default task fallback
    grunt.registerTask('default', 'build');

};
