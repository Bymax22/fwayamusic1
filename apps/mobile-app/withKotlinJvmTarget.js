const { withProjectBuildGradle } = require('@expo/config-plugins');

const marker = '// Fwaya: align Kotlin bytecode with the Android Java target';

module.exports = function withKotlinJvmTarget(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error('The Fwaya Kotlin JVM target plugin requires a Groovy Android build.gradle.');
    }

    if (!config.modResults.contents.includes(marker)) {
      config.modResults.contents += `

${marker}
subprojects { subproject ->
  subproject.tasks.matching { task ->
    task.name.startsWith("compile") && task.name.endsWith("Kotlin")
  }.configureEach {
    kotlinOptions.jvmTarget = "17"
  }
}
`;
    }

    return config;
  });
};
