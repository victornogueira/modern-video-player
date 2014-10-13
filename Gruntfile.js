module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            dist: {
                src: 'build/'
            }
        },

        copy: {
            dist: {
                files: [
                  {expand: true, src: ['*.{html,ico}'], dest: 'build/', filter: 'isFile'},
                  {expand: true, src: ['images/*.svg'], dest: 'build/', filter: 'isFile'},
                  {expand: true, src: ['videos/*.{mp4,m4v,webm}'], dest: 'build/', filter: 'isFile'},
                  {expand: true, src: ['fonts/**'], dest: 'build/'},
                ]
            }
        },

        processhtml: {
            options: {
              process: true,
            },
            dist: {
                files: [{
                  expand: true,     
                  cwd: 'build/',   
                  src: ['**/*.html'],
                  dest: 'build/',  
                  ext: '.html'
                }]
            }
        },

        concat: {
            dist: {
                src: [
                    'js/libs/*.js',
                    'js/html5player.js'
                ],
                dest: 'build/js/html5player.js',
            }
        },

        uglify: {
            dist: {
                src: 'build/js/html5player.js',
                dest: 'build/js/html5player.min.js'
            }
        },
        
        sass: {
            dist: {
                options: {
                    style: 'compressed'
                },
                files: {
                    'build/css/player.css': 'css/player.scss'
                }
            } 
        },

        autoprefixer: {
            dist: {
                files: {
                    'build/css/player.css': 'build/css/player.css'
                }
            }
        },

        imagemin: {
            dynamic: {
                files: [{
                    expand: true,
                    cwd: 'images/',
                    src: ['**/*.{png,jpg,gif}'],
                    dest: 'build/images/'
                }]
            }
        },

        connect: {
            server: {
                options: {
                    open: true,
                    hostname: '192.168.1.3',
                    port: 9000,
                    base: 'build/'
                }
            }
        },

        watch: {
            html: {
                files: ['*.html'],
                tasks: ['copy'],
                options: {
                    spawn: false,
                    livereload: true
                }
            },
            css: {
                files: ['css/*.scss'],
                tasks: ['sass', 'autoprefixer'],
                options: {
                    spawn: false,
                    livereload: true
                }
            },
            scripts: {
                files: ['js/*.js'],
                tasks: ['concat', 'uglify'],
                options: {
                    spawn: false,
                    livereload: true
                },
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['clean','copy','concat','uglify','imagemin','sass','autoprefixer','connect','watch']);
    grunt.registerTask('deploy', ['clean','copy','processhtml','concat','uglify','imagemin','sass','autoprefixer','connect','watch']);

};