'use strict';

module.exports = function (grunt) {

    // Show elapsed time after tasks run to visualize performance
    require('time-grunt')(grunt);
    // Load all Grunt tasks that are listed in package.json automagically
    require('load-grunt-tasks')(grunt);
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-image-resize');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

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
                tasks: ['buildcss']
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
                    flatten: true,
                    filter: 'isFile',
                    src: [
                        '_sass/**/*.{scss,sass}',
                        '_sass/syntax.css',
                        'node_modules/tether/dist/css/tether.min.css',
                        'node_modules/tether/dist/css/tether-theme-basic.min.css',
                        'node_modules/lightbox2/dist/css/lightbox.min.css'
                    ],
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
                    '_site/js/<%= pkg.name %>.min.js': ['node_modules/jquery/dist/jquery.min.js','node_modules/tether/dist/js/tether.min.js','js/bootstrap.min.js','js/main.js','node_modules/lightbox2/dist/js/lightbox.min.js', 'js/prism.min.js']
                }
            }
        },

        // run tasks in parallel
        concurrent: {
            serve: [
                'buildcss',
                'uglify',
                ['image_resize', 'copy:build'],
                'watch',
                'shell:jekyllServe',
            ],
            options: {
                logConcurrentOutput: true
            }
        },

        copy: {
            build: {
                flatten: true,
                expand: true,
                src: ['node_modules/lightbox2/dist/images/**'],
                dest: '_site/images',
                filter: 'isFile',
            },
            deploy:
                {
                    expand: true,
                    cwd: '_site',
                    src: ['**'],
                    dest: 'D:/Softs/wamp64/www/blog'
                }
        },

        clean: {
            options: {
                'force': true
            },
            deploy: {
                src: ['/srv/math/*']
            },
            build: {
                src: ['_site/css/*.map']
            },
            css: {
                src: []
            }
        },

        cssmin: {
            build: {
                files: {
                    '_site/css/main.min.css' : ['_site/css/lightbox.css','_site/css/tether.css','_site/css/syntax.css','_site/css/tether-theme-basic.css','_site/css/main.css']
                }
            }
        },

        image_resize: {
            thumbs: {
                options: {
                    width: 400,
                    height: 400,
                    overwrite: true
                },

                files: [{
                    expand: true,
                    cwd: "images/",
                    src: "**/*",
                    dest: "thumbs/",
                    extDot: "first"
                }]
            },
        }
    });

    // Register the grunt serve task
    grunt.registerTask('serve', [
        'concurrent:serve'
    ]);

    // Register the grunt build task
    grunt.registerTask('build', [
        'shell:jekyllBuild',
        'image_resize',
        'copy:build',
        'sass',
        'cssmin',
        'clean:build',
        'clean:css',
        'uglify',
    ]);

    grunt.registerTask('buildcss', [
        'sass',
        'cssmin',
        'clean:build',
        'clean:css',
    ]);

    grunt.registerTask('bd', [
        'build',
        'clean:deploy',
        'copy:deploy'
    ]);

    // Register build as the default task fallback
    grunt.registerTask('default', 'build');

};
