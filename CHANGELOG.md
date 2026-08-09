# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The package is now published to the public npmjs.org registry on every tagged release, so any Vite app can add it as a normal dependency (`npm install @openkakutou/web-ui-kit`) and resolve it via a standard semver range — no extra build configuration needed.

## [0.1.0] - 2026-08-09

### Added

- Design tokens for color (with a light/dark pair), spacing, and typography, importable from the package's single CSS entrypoint. Dark mode is switched by setting `data-theme="dark"` on the page.

[Unreleased]: https://github.com/openkakutou/web-ui-kit/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/openkakutou/web-ui-kit/releases/tag/v0.1.0
