import type { MetadataRoute } from "next";

// "Add to home screen" on phones
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Guins · The colony",
    short_name: "Guins",
    description: "The most unbothered little penguins on-chain.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0a12",
    theme_color: "#0b0a12",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
