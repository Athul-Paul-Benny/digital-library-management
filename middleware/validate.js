const validate = (rules) => {
  return (req, res, next) => {
    const errors = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      if (
        rule.required &&
        (value === undefined ||
          value === null ||
          value === "")
      ) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        if (
          rule.type === "string" &&
          typeof value !== "string"
        ) {
          errors.push(`${rule.field} must be a string`);
        }

        if (
          rule.type === "number" &&
          typeof value !== "number"
        ) {
          errors.push(`${rule.field} must be a number`);
        }

        if (
          rule.min !== undefined &&
          typeof value === "number" &&
          value < rule.min
        ) {
          errors.push(
            `${rule.field} must be at least ${rule.min}`
          );
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errorCode: "VALIDATION_ERROR",
        errors
      });
    }

    next();
  };
};

module.exports = validate;