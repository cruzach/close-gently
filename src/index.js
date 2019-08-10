/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */

const createScheduler = require("probot-scheduler");
const uuid = require("uuidv4");
const sendMessage = require("probot-messages");

const Closer = require("./closer");
const schema = require("./schema");

module.exports = async robot => {
  const github = await robot.auth();
  const appName = (await github.apps.getAuthenticated()).data.name;
  createScheduler(robot, { delay: true, interval: 24 * 60 * 60 * 1000 });

  robot.on("schedule.repository", async context => {
    const app = await startUp(context);

    if (app) {
      await app.warnIssues();
      await app.closeIssues();
    }
  });

  async function startUp(context) {
    const logger = context.log.child({ appName, session: uuid() });
    const config = await getConfig(context, logger);
    return new Closer(context, config, logger);
  }

  async function getConfig(context, log, file = "closegently.yml") {
    let config;
    const repo = context.repo();
    try {
      let repoConfig = await context.config(file);
      if (!repoConfig) {
        throw new Error(
          "Looks like you forgot to include a closegently.yml file in your .github directory."
        );
      }
      const { error, value } = schema.validate(repoConfig);
      if (error) {
        throw error;
      }
      config = value;
    } catch (err) {
      log.warn({ err: new Error(err), repo, file }, "Invalid config");
      if (["YAMLException", "ValidationError"].includes(err.name)) {
        await sendMessage(
          robot,
          context,
          "[{appName}] Configuration error",
          "[{appName}]({appUrl}) has encountered a configuration error in " +
            `\`${file}\`.\n\`\`\`\n${err.toString()}\n\`\`\``,
          { update: "The configuration error is still occurring." }
        );
      }
    }
    console.log(config);
    return config;
  }
  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
