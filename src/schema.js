const Joi = require("@hapi/joi");

const fields = {
  daysToWarning: Joi.number()
    .min(1)
    .max(365)
    .required()
    .description(
      "How many days of inactivity before the issue will be warned of being closed."
    ),

  daysToClose: Joi.number()
    .min(1)
    .max(365)
    .required()
    .description(
      "How many days of after closure warning before the issue will be closed."
    ),

  labelToEnable: Joi.alternatives()
    .try(
      Joi.string()
        .required()
        .trim()
        .max(50),
      Joi.boolean().only(false)
    )
    .description(
      "The issue-label issues must have so that they may be auto-closed."
    ),

  warningComment: Joi.alternatives()
    .try(
      Joi.string()
        .trim()
        .max(10000),
      Joi.boolean().only(false)
    )
    .description("The comment to leave to inform of impending closure."),

  closingSoonLabel: Joi.alternatives()
    .try(
      Joi.string()
        .trim()
        .max(50),
      Joi.boolean().only(false)
    )
    .description(
      "The issue-label given when an issue will be closed without more activity."
    ),

  lockComment: Joi.alternatives()
    .try(
      Joi.string()
        .trim()
        .max(10000),
      Joi.boolean().only(false)
    )
    .description("The comment to leave when closing an issue."),

  lockLabel: Joi.alternatives()
    .try(
      Joi.string()
        .trim()
        .max(50),
      Joi.boolean().only(false)
    )
    .description("The label to apply when closing an issue.")
};

const schema = Joi.object().keys({
  daysToWarning: fields.daysToWarning.default(31),
  daysToClose: fields.daysToClose.default(31),
  labelToEnable: fields.labelToEnable,
  warningComment: fields.warningComment,
  closingSoonLabel: fields.closingSoonLabel,
  lockComment: fields.lockComment,
  lockLabel: fields.lockLabel
});

module.exports = schema;
