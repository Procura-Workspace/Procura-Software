export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New features
        "fix", // Bug fixes
        "infra", // Infrastructure & Docker config (Arix zone)
        "sec", // Security fixes or policies (Arix zone)
        "docs", // Documentation updates
        "style", // Code style changes (formatting)
        "refactor", // Refactoring code
        "test", // Adding/updating tests
        "chore", // Build process/dependencies changes
        "perf", // Performance improvements
      ],
    ],
  },
};
