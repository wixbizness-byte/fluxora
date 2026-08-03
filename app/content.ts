export type GalleryRow = "top" | "middle" | "bottom";

export type CollectionCard = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  button_label: string;
  button_url: string;
  image_url: string;
  is_featured: boolean;
  sort_order: number;
  is_active: boolean;
};

export type GalleryImage = {
  id: string;
  image_url: string;
  target_url: string;
  alt_text: string;
  row_position: GalleryRow;
  sort_order: number;
  is_active: boolean;
};

export type QrResource = {
  id: string;
  image_url: string;
  target_url: string;
  alt_text: string;
  sort_order: number;
  is_active: boolean;
};

export const fallbackCollectionCards: CollectionCard[] = [
  {
    id: "collection-1",
    eyebrow: "COMMUNITY",
    title: "AI Creator Community",
    description: "A practical space for shared experiments, helpful feedback, and creators turning ideas into consistent output.",
    button_label: "Join community",
    button_url: "https://t.me/PHAICommunity",
    image_url: "",
    is_featured: false,
    sort_order: 1,
    is_active: true,
  },
  {
    id: "collection-2",
    eyebrow: "LESSONS",
    title: "AI Workshop",
    description: "Practical lessons, guided workshops, and repeatable creative systems for building stronger AI content.",
    button_label: "Enter workshop",
    button_url: "https://curzzo.com/communities/ai-content-creation-academy",
    image_url: "",
    is_featured: true,
    sort_order: 2,
    is_active: true,
  },
  {
    id: "collection-3",
    eyebrow: "GALLERY",
    title: "Prompt Gallery",
    description: "Discover, study, copy, and adapt the prompts behind standout community visuals.",
    button_label: "Check gallery",
    button_url: "https://fluxora-prompt-gallery.vercel.app/",
    image_url: "",
    is_featured: false,
    sort_order: 3,
    is_active: true,
  },
  {
    id: "collection-4",
    eyebrow: "TOOLS",
    title: "Automation Tools",
    description: "Tools, workflows, and GPTs organized as one evolving creative operating system.",
    button_label: "View tools",
    button_url: "https://tool-directory-ochre.vercel.app/",
    image_url: "",
    is_featured: false,
    sort_order: 4,
    is_active: true,
  },
];

export const fallbackGalleryImages: GalleryImage[] = Array.from({ length: 9 }, (_, index) => ({
  id: `gallery-${index + 1}`,
  image_url: "",
  target_url: "",
  alt_text: `Fluxora gallery image ${index + 1}`,
  row_position: index < 3 ? "top" : index < 6 ? "middle" : "bottom",
  sort_order: (index % 3) + 1,
  is_active: true,
}));

export const fallbackQrResource: QrResource = {
  id: "qr-resource-1",
  image_url: "",
  target_url: "",
  alt_text: "Fluxora additional resource QR code",
  sort_order: 1,
  is_active: true,
};
