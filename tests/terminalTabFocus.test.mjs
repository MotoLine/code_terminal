import assert from "node:assert/strict";
import test from "node:test";
import { getTabIdForProjectFocus } from "../.test-dist/terminalTabFocus.js";

const tabs = [
  { id: "project-b-first", projectId: "project-b" },
  { id: "project-a", projectId: "project-a" },
  { id: "project-b-second", projectId: "project-b" },
];

test("project focus preserves the explicitly active tab for that project", () => {
  assert.equal(
    getTabIdForProjectFocus(tabs, "project-b-second", "project-b"),
    "project-b-second",
  );
});

test("external project focus selects the first tab when the active tab belongs elsewhere", () => {
  assert.equal(
    getTabIdForProjectFocus(tabs, "project-a", "project-b"),
    "project-b-first",
  );
});

test("project focus without an existing tab leaves creation or binding to the caller", () => {
  assert.equal(getTabIdForProjectFocus(tabs, "project-a", "project-c"), null);
  assert.equal(getTabIdForProjectFocus(tabs, "project-a", null), null);
});
