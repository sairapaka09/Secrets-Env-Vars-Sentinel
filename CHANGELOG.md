# Change Log

All notable changes to the "secrets-env-scanner" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.0.2]

- Fixed false positives in undefined environment variable detection: variable names
  documented in `.env.example`/`.sample`/`.template`/`.dist` files are now recognized as
  defined, since real `.env` files are typically gitignored and absent from a workspace.
- `secretsEnvScanner.disabledPatterns` can now disable the `undefined-env-var` check.

## [0.0.1]

- Initial release