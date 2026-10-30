import type { MetadataRoute } from "next";

// Lets hub agents "Add to home screen" on Android; opens straight into the hub.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CashewTrace",
    short_name: "CashewTrace",
    description: "Village quality hubs for Nigerian cashew — prototype, demo data.",
    start_url: "/hub",
    display: "standalone",
    background_color: "#FAF7F2",
    theme_color: "#1F5130",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
