# Dependency wizard

Run from the repository root:

```sh
bun run deps:check
bun run deps:check --report
bun run deps:check --json
bun run deps:check --registry https://registry.npmjs.org
```

An interactive terminal opens a Nano-inspired screen with a title bar, colored
status counts, and a keyboard-help strip. Arrows navigate, Enter selects,
Space toggles packages, and the version picker uses a scrolling radio selection.
Esc goes back one screen or cancels the current prompt without changing staged
updates. On the main screen it exits, checking for unsaved changes first.
Ctrl+C exits without saving staged changes. The previous terminal screen is restored
on exit. Custom highlights respect `NO_COLOR`. Piped output automatically
uses the report mode; `--json` is suitable for automation.

The Updates screen can stage recommended versions in one step. Review changes
lets you remove individual selections, discard all, or verify patches and save.

The wizard checks only `workspaces.catalog` and `workspaces.catalogs` in the root
`package.json`. The dashboard counts catalog entries, not installed packages.
For exact, caret, and tilde versions, it compares the specified version baseline
with npm's current dist-tags. An available newer version is marked outdated even
when the existing range allows it. RC/beta entries retain their prerelease channel
unless the stable tag is newer. Complex ranges are unknown; versions newer than
registry candidates are marked ahead and never automatically downgraded.

Choose packages, select their published versions, then review and confirm the
staged changes. Saving preserves caret/tilde prefixes and unrelated manifest data.
The wizard rejects stale selections. For patched packages it uses `npm pack
--ignore-scripts` in a temporary directory and `git apply --check` to verify the
existing patch against the selected release. Successful checks appear in the save
preview and add a mapping for the new version using the same patch file. Old
mappings remain available for other workspaces. Conflicting patches block the save
and retain your selections. This check needs `npm`, `tar`, and `git` on PATH.
It writes the manifest atomically. Run `bun install`
after saving to synchronize installed dependencies and the lockfile. It does not
resolve the repository's existing lockfile conflict.

Package details offer short GitHub release excerpts for the staged or recommended
version, with a link to the full release. Notes may be unavailable for packages
without GitHub releases or releases outside the latest 100 entries. Socket links
open the exact package version's report when followed in your browser; the wizard
does not run an authenticated security scan or claim a package is safe.

```text
scripts/
  package.json                  @flowline/scripts workspace
  tsconfig.json
  src/
    check-versions.ts            CLI entry point
    dependencies/
      catalog.ts                npm comparisons and catalog saves
      wizard.ts                 dashboard and interactive workflow
      radio.ts                  scrolling radio picker
      navigation.ts             shared Esc, menu, and selection behavior
      style.ts                  terminal colors and text formatting
      metadata.ts               versions, release notes, Socket links
      patches.ts                verify patches against selected releases
  test/                         registry and persistence tests
```

```sh
bun run --cwd scripts typecheck
bun run --cwd scripts test
```

Effect v4 owns the CLI, prompts, HTTP, validation, and filesystem operations.
[Effect prompts](https://github.com/Effect-TS/effect/blob/main/packages/effect/src/unstable/cli/Prompt.ts)
already provide the required navigation; a small custom prompt supplies radio dots.
[Bombshell's Clack](https://bomb.sh/docs/clack/packages/prompts/) was evaluated,
but an extra prompt library was unnecessary. Local APIs were checked against the
installed Effect RC and `.reference/effect-smol`; the supplied `$EFFECT_REPO` path
was unavailable.
