module.exports = class Closer {
  constructor(context, config, logger) {
    this.context = context;
    this.config = config;
    this.log = logger;
  }

  async warnIssues() {
    const repo = this.context.repo();
    const warningComment = this.config.warningComment;
    const labelToEnable = this.config.labelToEnable;
    const daysToWarning = this.config.daysToWarning;
    const closingSoonLabel = this.config.closingSoonLabel;

    const results = await this.searchForOldQuietIssues(
      labelToEnable,
      daysToWarning
    );

    for (const result in results) {
      const issue = { ...repo, number: results[result].number };

      if (warningComment) {
        this.log.info({ issue }, "Commenting...");
        await this.context.github.issues.createComment({
          ...issue,
          body: warningComment
        });
      }

      if (closingSoonLabel) {
        this.log.info({ issue }, "Labeling...");
        await this.context.github.issues.addLabels({
          ...issue,
          labels: [closingSoonLabel]
        });
      }
    }
  }

  async closeIssues() {
    const repo = this.context.repo();
    const daysToClose = this.config.daysToClose;
    const closingSoonLabel = this.config.closingSoonLabel;
    const lockComment = this.config.lockComment;
    const lockLabel = this.config.lockLabel;

    const results = await this.searchForOldQuietIssues(
      closingSoonLabel,
      daysToClose
    );

    for (const result in results) {
      const issue = { ...repo, number: results[result].number };

      if (lockComment) {
        this.log.info({ issue }, "Commenting...");
        await this.context.github.issues.createComment({
          ...issue,
          body: lockComment
        });
      }

      if (lockLabel) {
        this.log.info({ issue }, "Labeling...");
        await this.context.github.issues.update({
          ...issue,
          labels: [lockLabel]
        });
      }

      this.log.info({ issue }, "Closing...");
      await this.context.github.issues.update({ ...issue, state: "closed" });
    }
  }

  async searchForOldQuietIssues(requiredLabel, daysToAction) {
    const { owner, repo } = this.context.repo();
    const timestamp = this.getCloseDate(daysToAction);

    let query = `repo:${owner}/${repo} updated:<${timestamp} is:open is:issue`;

    this.log.info({ repo: { owner, repo } }, `Searching issues...`);

    const results = await this.context.github.search.issues({
      q: query,
      sort: "updated",
      order: "desc"
    });

    //cant use label:${requiredLabel} for labels with spaces so...
    const resultsWithRequiredLabel = results.data.items.filter(issue => {
      const { labels } = issue;
      const hasLabel = labels.filter(label => label.name === requiredLabel);
      return hasLabel[0];
    });

    return resultsWithRequiredLabel;
  }

  getCloseDate(daysToClose) {
    const timeDifference = daysToClose * 24 * 60 * 60 * 1000;
    const closeTime = new Date(new Date() - timeDifference);
    return this.format_YYYYMMDD(closeTime);
  }

  format_YYYYMMDD(date) {
    console.log("\n\n\n" + date.toISOString().split("T")[0]);
    return date.toISOString().split("T")[0];
  }
};
