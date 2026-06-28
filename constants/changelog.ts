// What's New entries. Newest first. Bump `version` and add an entry for every
// ship — the in-app "What's New" modal shows the top entry once after each update
// (keyed off this version string via AsyncStorage, independent of the build number).

export interface Release {
  version: string;
  title: string;
  highlights: string[];
}

export const CHANGELOG: Release[] = [
  {
    version: "1.1.0",
    title: "What's New",
    highlights: [
      "Prayer music keeps playing in a mini-player when you leave the timer.",
      "Attach a photo to any prayer request.",
      "Set a custom background for your prayer list.",
      "Import a whole prayer list from a photo or pasted text.",
      "Export your prayer list as a beautiful PDF.",
    ],
  },
];

export const CURRENT_RELEASE: Release = CHANGELOG[0];
export const WHATS_NEW_STORAGE_KEY = "whatsNewSeenVersion";
