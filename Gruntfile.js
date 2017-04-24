module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({
    simplemocha:{
      options: {
        timeout: 1000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'tap'
      },
      all: {
        src: 'test/**/*.js'
      }
    },
    watch:{
      all:{
        files:['lib/*', 'test/*', 'bin/*'],
        tasks:['test']
      }
    }
  });

  grunt.registerTask('test', 'simplemocha');
  grunt.registerTask('default', 'test');
};
