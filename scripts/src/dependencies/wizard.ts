import { Console, Effect, Predicate } from "effect";

import { checkVersions, saveUpdates, type VersionRow } from "./catalog";
import { getPackageDetails, getReleaseNotes, socketUrl } from "./metadata";
import * as Prompt from "./navigation";
import { preparePatchMigrations } from "./patches";
import { radioSelect } from "./radio";
import { paint, plain, rule } from "./style";

const key = (row: VersionRow) =>
  `${row.isDefault}\0${row.catalog}\0${row.name}`;
const versionRange = (row: VersionRow, version: string) =>
  `${/^[~^]/.exec(row.configured)?.[0] ?? ""}${version}`;
const statusTone = (status: VersionRow["status"]) =>
  status === "current" ? "good" : status === "error" ? "error" : "warning";
const pageSize = () =>
  Math.max(3, Math.min(8, (process.stdout.rows || 24) - 14));

export const dashboard = (
  rows: readonly VersionRow[],
  staged: number,
): string => {
  const count = (status: VersionRow["status"]) =>
    rows.filter((row) => row.status === status).length;
  const items = [
    paint("good", `${count("current")} current`),
    paint("warning", `${count("outdated")} updates`),
    paint("accent", `${staged} staged`),
  ];
  const other = ["ahead", "unknown", "error"] as const;
  for (const status of other)
    if (count(status))
      items.push(paint(statusTone(status), `${count(status)} ${status}`));
  return items.join(paint("muted", "  /  "));
};

type PackageDetails = Effect.Success<ReturnType<typeof getPackageDetails>>;

export const wizard = Effect.fn("dependencyWizard")(function* (
  path: string,
  registry: string,
) {
  yield* Console.log(paint("muted", "Checking npm…"));
  let rows = yield* checkVersions(path, registry);
  const staged = new Map<string, { entry: VersionRow; version: string }>();
  const cache = new Map<string, PackageDetails>();
  let notice = "";

  const screen = (title: string, subtitle = "", multiple = false) => {
    const width = Math.max(12, (process.stdout.columns || 80) - 1);
    const height = process.stdout.rows || 24;
    const clip = (value: string) => plain(value).slice(0, width);
    const toggle = multiple ? `${paint("inverse", " Space ")} Toggle   ` : "";
    const footer = `${toggle}${paint("inverse", " Esc ")} Back   ${paint("inverse", " ↑↓ ")} Move   ${paint("inverse", " Enter ")} Select   ${paint("inverse", " ^C ")} Quit`;
    return Console.log(
      `\x1b[H\x1b[2J\x1b[${height};1H${width >= (multiple ? 76 : 60) ? footer : clip(multiple ? "Esc Back  Space Toggle  Enter Select  ^C Quit" : "Esc Back  Arrows Move  Enter Select  ^C Quit")}\x1b[H` +
        [
          paint(
            "inverse",
            clip(
              " FLOWLINE                                      Workspace catalogs ",
            ).padEnd(width),
          ),
          dashboard(rows, staged.size),
          rule(),
          paint("bold", clip(title)),
          subtitle ? paint("muted", clip(subtitle)) : "",
          notice ? `${paint("accent", clip(notice))}\n` : "",
        ]
          .filter(Boolean)
          .join("\n") +
        "\n",
    );
  };

  const details = (name: string) =>
    Effect.gen(function* () {
      const existing = cache.get(name);
      if (existing) return existing;
      yield* Console.log(paint("muted", "Loading published versions…"));
      const value = yield* getPackageDetails(name, registry);
      cache.set(name, value);
      return value;
    });

  const title = (row: VersionRow) =>
    `${staged.has(key(row)) ? "* " : "  "}${plain(row.name)}`;
  const description = (row: VersionRow) =>
    `${plain(row.catalog)} · ${plain(row.configured)} → ${plain(staged.get(key(row))?.version ?? row.target ?? "unavailable")} · ${row.status}`;

  while (true) {
    yield* screen("Workspace catalogs", "Root package.json");
    const action = yield* Prompt.select({
      message: "Choose an action",
      maxPerPage: 7,
      choices: [
        {
          title: `Updates (${rows.filter((row) => row.status === "outdated").length})`,
          value: "outdated",
          description:
            "Browse updates, choose versions, or stage recommendations.",
        },
        {
          title: "All packages",
          value: "all",
          description: "Versions, release notes, and Socket reports.",
        },
        {
          title: "Choose multiple packages",
          value: "select",
          description: "Choose packages and set their versions together.",
        },
        {
          title: `Review changes (${staged.size})`,
          value: "review",
          description: "Inspect, remove, or save your staged changes.",
        },
        { title: "Refresh", value: "refresh" },
        { title: "Exit", value: "exit" },
      ],
    });
    notice = "";
    if (action === null || action === "exit") {
      if (
        !staged.size ||
        (yield* Prompt.confirm({
          message: "Discard unsaved changes and exit?",
          initial: false,
        }))
      )
        return;
      continue;
    }
    if (action === "refresh") {
      yield* screen("Refreshing", "Checking npm…");
      cache.clear();
      rows = yield* checkVersions(path, registry);
      continue;
    }
    if (action === "review") {
      yield* review();
      continue;
    }
    if (action === "select") {
      yield* screen("Choose packages", "", true);
      const eligible = rows.filter((row) => !row.error);
      if (!eligible.length) {
        notice = "No packages available. Refresh to retry.";
        continue;
      }
      const selected = yield* Prompt.multiSelect({
        message: "Packages",
        choices: eligible.map((row) => ({
          title: title(row),
          description: description(row),
          value: row,
        })),
        maxPerPage: pageSize(),
      });
      for (const row of selected) {
        const chosen = yield* chooseVersion(row).pipe(
          Effect.catch((error) =>
            Predicate.isTagged("QuitError")(error)
              ? Effect.fail(error)
              : Effect.sync(() => {
                  notice = String(error);
                }),
          ),
        );
        if (!chosen) break;
      }
      continue;
    }
    while (true) {
      const visible =
        action === "outdated"
          ? rows.filter((row) => row.status === "outdated")
          : rows;
      yield* screen(
        action === "outdated" ? "Available updates" : "All packages",
        "* marks staged changes.",
      );
      const index = yield* Prompt.select({
        message: "Packages",
        maxPerPage: pageSize(),
        choices: [
          ...(action === "outdated" && visible.length
            ? [
                {
                  title: `Stage ${visible.length} recommended versions`,
                  value: -2,
                  description:
                    "Adds recommendations to review; nothing is saved yet.",
                },
              ]
            : []),
          ...visible.map((row, index) => ({
            title: title(row),
            description: description(row),
            value: index,
          })),
        ],
      });
      notice = "";
      if (index === null) break;
      if (index === -2) {
        for (const row of visible)
          if (row.target && !staged.has(key(row)))
            staged.set(key(row), { entry: row, version: row.target });
        notice = "Recommendations staged. Existing version choices were kept.";
        continue;
      }
      yield* inspect(visible[index]).pipe(
        Effect.catch((error) =>
          Predicate.isTagged("QuitError")(error)
            ? Effect.fail(error)
            : Effect.sync(() => {
                notice = String(error);
              }),
        ),
      );
    }
  }

  function chooseVersion(row: VersionRow) {
    return Effect.gen(function* () {
      yield* screen(
        plain(row.name),
        `Choose version / currently ${plain(row.configured)}`,
      );
      const metadata = yield* details(row.name);
      const preferred = staged.get(key(row))?.version ?? row.target;
      const versions = [...metadata.versions];
      if (preferred && versions.includes(preferred)) {
        versions.splice(versions.indexOf(preferred), 1);
        versions.unshift(preferred);
      }
      const version = yield* radioSelect(
        "Published versions",
        versions.map((version) => ({
          title: `${version}${Object.entries(metadata.tags)
            .filter(([, v]) => v === version)
            .map(([tag]) => `  ${tag}`)
            .join("")}${metadata.deprecated[version] ? "  deprecated" : ""}`,
          value: version,
        })),
        preferred ?? "",
      );
      if (!version) return false;
      if (metadata.deprecated[version]) {
        yield* Console.log(
          paint(
            "warning",
            `Deprecated: ${plain(metadata.deprecated[version])}`,
          ),
        );
        if (
          !(yield* Prompt.confirm({
            message: "Stage this deprecated version?",
            initial: false,
          }))
        )
          return;
      }
      if (versionRange(row, version) === row.configured)
        staged.delete(key(row));
      else staged.set(key(row), { entry: row, version });
      notice = `${row.name} → ${version}`;
      return true;
    });
  }

  function inspect(row: VersionRow) {
    return Effect.gen(function* () {
      while (true) {
        yield* screen(plain(row.name), plain(row.catalog));
        yield* Console.log(
          `${paint("muted", "Current")}  ${plain(row.configured)}\n${paint(statusTone(row.status), "Target ")}  ${plain(row.target ?? "—")}\n${paint("accent", "Staged ")}  ${plain(staged.get(key(row))?.version ?? "—")}\n`,
        );
        if (row.error) yield* Console.log(paint("error", plain(row.error)));
        const action = yield* Prompt.select({
          message: "Package",
          choices: [
            {
              title: "Choose version",
              value: "version",
              disabled: !!row.error,
            },
            { title: "Release notes", value: "notes", disabled: !!row.error },
            {
              title: "Socket report",
              value: "security",
              disabled: !!row.error,
            },
            {
              title: "Remove staged change",
              value: "remove",
              disabled: !staged.has(key(row)),
            },
          ],
        });
        notice = "";
        if (action === null) return;
        if (action === "remove") {
          staged.delete(key(row));
          continue;
        }
        if (action === "version") {
          yield* chooseVersion(row);
          continue;
        }
        const version = staged.get(key(row))?.version ?? row.target;
        if (!version) {
          notice = "Choose a version first.";
          continue;
        }
        yield* screen(
          plain(row.name),
          `${action === "notes" ? "Release notes" : "Socket report"} · ${version}`,
        );
        if (action === "security")
          yield* Console.log(
            `${paint("accent", socketUrl(row.name, version))}\n\n${paint("muted", "Open in your browser. No security scan was run here.")}\n`,
          );
        else {
          const metadata = yield* details(row.name);
          const notes = yield* getReleaseNotes(
            row.name,
            version,
            metadata.repository,
          );
          yield* Console.log(
            `${notes.text
              .split("\n")
              .slice(0, Math.max(3, (process.stdout.rows || 24) - 14))
              .join("\n")}\n\n${paint("accent", notes.url ?? "")}\n`,
          );
        }
        yield* Prompt.select({
          message: "",
          choices: [],
        });
      }
    });
  }

  function review() {
    return Effect.gen(function* () {
      while (true) {
        yield* screen(
          "Review changes",
          "Changes stay local until you confirm a save.",
        );
        if (!staged.size) {
          notice = "No changes staged.";
          return;
        }
        const values = [...staged.values()];
        const selected = yield* Prompt.select({
          message: "Select a change to remove it",
          maxPerPage: pageSize(),
          choices: [
            { title: `Save ${staged.size} changes`, value: -2 },

            ...values.map(({ entry, version }, index) => ({
              title: plain(entry.name),
              description: `${plain(entry.catalog)} · ${plain(entry.configured)} → ${versionRange(entry, version)}`,
              value: index,
            })),
            { title: "Discard all", value: -3 },
          ],
        });
        if (selected === null) return;
        if (selected === -3) {
          if (
            yield* Prompt.confirm({
              message: "Discard all staged changes?",
              initial: false,
            })
          ) {
            staged.clear();
            return;
          }
          continue;
        }
        if (selected >= 0) {
          staged.delete(key(values[selected].entry));
          continue;
        }
        yield* screen("Save changes", "Verifying version-specific patches…");
        const migrations = yield* preparePatchMigrations(
          path,
          values,
          registry,
        ).pipe(
          Effect.catch((error) =>
            Effect.sync(() => {
              notice = `Patch verification failed: ${String(error)}. Nothing saved.`;
              return null;
            }),
          ),
        );
        if (migrations === null) continue;
        for (const { entry, version } of values.slice(
          0,
          Math.max(1, (process.stdout.rows || 24) - 15),
        ))
          yield* Console.log(
            `${paint("bold", plain(entry.name))}  ${paint("muted", plain(entry.configured))} → ${paint("accent", versionRange(entry, version))}`,
          );
        yield* Console.log(
          paint(
            "muted",
            `\n${values.length} changes total. Full list is available in Review.`,
          ),
        );
        if (migrations.length)
          yield* Console.log(
            paint("good", `\n${migrations.length} patch mappings verified.`),
          );
        if (
          !(yield* Prompt.confirm({
            message: "Save to root package.json?",
            initial: false,
          }))
        )
          continue;
        const saved = yield* saveUpdates(path, values, migrations).pipe(
          Effect.as(true),
          Effect.catch((error) =>
            Effect.sync(() => {
              notice = `Save failed: ${String(error)}`;
              return false;
            }),
          ),
        );
        if (saved) {
          staged.clear();
          rows = yield* checkVersions(path, registry);
          notice = "Saved. Run bun install to synchronize dependencies.";
          return;
        }
      }
    });
  }
});
