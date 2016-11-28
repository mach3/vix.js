
module.exports = function(grunt){

	require("load-grunt-tasks")(grunt);

	var banner = grunt.template.process(
		grunt.file.read("./src/banner.js"),
		{data: grunt.file.readJSON("package.json")}
	);

	grunt.initConfig({

		uglify: {
			dist: {
				options: {
					banner: banner
				},
				files: {
					"dist/vix.min.js": ["src/vix.js"]
				}
			}
		},

		concat: {
			dist: {
				options: {
					banner: banner
				},
				files: {
					"dist/vix.js": ["src/vix.js"]
				}
			}
		}

	});

	grunt.registerTask("default", []);
	grunt.registerTask("build", ["concat:dist", "uglify:dist"]);

};
