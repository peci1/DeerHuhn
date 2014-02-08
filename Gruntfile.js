module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');

    var root = 'js',
        dist = 'bin',
        standaloneLibFilesMinimized = [
            '<%= dirs.src %>/html5.js',
            '<%= dirs.src %>/excanvas.min.js'
        ],
        libFilesMinimized = [
            '<%= dirs.src %>/es5-sham.min.js',
            '<%= dirs.src %>/es5-shim.min.js',
            '<%= dirs.src %>/pixi.js',
            '<%= dirs.src %>/FontLoader/FontLoader.min.js',
            '<%= dirs.src %>/cookie.min.js',
            '<%= dirs.src %>/howler.min.js'
        ],
        internalLibFiles = [
            '<%= dirs.src %>/pixi.fontloader.js',
            '<%= dirs.src %>/pixi.keys.js',
            '<%= dirs.src %>/pixi.scalablestage.js',
            '<%= dirs.src %>/pixi.smoothmovieclip.js',
            '<%= dirs.src %>/pixi.transparencyhitarea.js',
            '<%= dirs.src %>/utils.addevent.js',
            '<%= dirs.src %>/debug.js'
        ],
        srcFiles = [
            '<%= dirs.src %>/deerhuhn.js',
            '<%= dirs.src %>/deerhuhn.animals.js'
        ],
        banner = [
            '/**',
            ' * @license',
            ' * <%= pkg.name %> - v<%= pkg.version %>',
                ' * Copyright (c) <%= grunt.template.today("yyyy") %>, <%= pkg.author %>',
            ' * <%= pkg.homepage %>',
            ' *',
            ' * Compiled: <%= grunt.template.today("yyyy-mm-dd") %>',
            ' *',
            ' * <%= pkg.name %> is licensed under the <%= pkg.license %> License.',
            ' * <%= pkg.licenseUrl %>',
            ' */',
            ''
        ].join('\n');

    grunt.initConfig({
        pkg : grunt.file.readJSON('package.json'),
        dirs: {
            build: dist,
            src: root
        },
        files: {
            srcBlob: '<%= dirs.src %>/**/*.js',
            buildMin: '<%= dirs.build %>/deerhuhn.js',
            withoutLibs: '<%= dirs.build %>/deerhuhn.without.libs.js',
            withoutLibsMin: '<%= dirs.build %>/deerhuhn.without.libs.min.js',
        },
        copy: {
            main: {
                files: [
                    {src: standaloneLibFilesMinimized, dest: '<%= dirs.build %>/', expand: true, flatten: true}
                ]
            }
        },
        jshint: {
            beforeconcat: internalLibFiles.concat(srcFiles),
            options: {
                asi: true,
                smarttabs: true
            }
        },
        concat: {
            options: {
                banner: banner
            },
            dist: {
                src: libFilesMinimized.concat(['<%= files.withoutLibsMin %>']),
                dest: '<%= files.buildMin %>'
            },
            internal: {
                src: internalLibFiles.concat(srcFiles),
                dest: '<%= files.withoutLibs %>'
            }
        },
        uglify: {
            options: {
                banner: banner
            },
            dist: {
                src: '<%= files.withoutLibs %>',
                dest: '<%= files.withoutLibsMin %>'
            }
        },
        cssmin: {
            combine: {
                files: {
                    'css/main.min.css': 'css/main.css'
                }
            }
        }
    });

    grunt.registerTask('default', ['jshint', 'concat:internal', 'uglify', 'concat', 'copy', 'cssmin']);
    grunt.registerTask('build', ['concat:internal', 'uglify', 'concat', 'copy', 'cssmin']);
};
