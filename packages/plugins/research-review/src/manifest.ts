import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";
import {
  EXPORT_NAMES,
  JOB_KEYS,
  PAGE_ROUTE,
  PLUGIN_ID,
  PLUGIN_VERSION,
  SLOT_IDS,
  WEBHOOK_KEYS,
} from "./constants.js";

const manifest: PaperclipPluginManifestV1 = {
  id: PLUGIN_ID,
  apiVersion: 1,
  version: PLUGIN_VERSION,
  displayName: "Research Review",
  description:
    "Tinder-style card swipe UI for reviewing research findings. Cairo submits research cards, Mario swipes to approve/reject/dig-deeper and scores them to train the agent.",
  author: "Paperclip",
  categories: ["ui", "automation"],
  capabilities: [
    "plugin.state.read",
    "plugin.state.write",
    "events.subscribe",
    "jobs.schedule",
    "webhooks.receive",
    "ui.page.register",
    "ui.sidebar.register",
    "ui.dashboardWidget.register",
    "http.outbound",
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
  jobs: [
    {
      jobKey: JOB_KEYS.weeklyPrune,
      displayName: "Weekly Prune",
      description:
        "Prunes research cards scored ≤ 2 or unreviewed after 14 days.",
      schedule: "0 3 * * 0",
    },
  ],
  webhooks: [
    {
      endpointKey: WEBHOOK_KEYS.submitCard,
      displayName: "Submit Research Card",
      description:
        "Cairo POSTs research findings here to create pending review cards.",
    },
  ],
  ui: {
    slots: [
      {
        type: "page",
        id: SLOT_IDS.page,
        displayName: "Research Review",
        exportName: EXPORT_NAMES.page,
        routePath: PAGE_ROUTE,
      },
      {
        type: "dashboardWidget",
        id: SLOT_IDS.dashboardWidget,
        displayName: "Research Review",
        exportName: EXPORT_NAMES.dashboardWidget,
      },
      {
        type: "sidebar",
        id: SLOT_IDS.sidebar,
        displayName: "Research Review",
        exportName: EXPORT_NAMES.sidebar,
      },
    ],
  },
};

export default manifest;
