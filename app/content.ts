export type MotionDirection = "up-right" | "down-right" | "up-left" | "down-left" | "vertical" | "horizontal";

export type HeroCard = {
  id: string;
  image_url: string;
  target_url: string;
  alt_text: string;
  motion: MotionDirection;
  sort_order: number;
  is_active: boolean;
};

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
  sort_order: number;
  is_active: boolean;
};

export type MethodCard = {
  id: string;
  step_number: string;
  eyebrow: string;
  title: string;
  description: string;
  button_label: string;
  button_url: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
};

export type SiteSettings = {
  id: string;
  follow_page_label: string;
  follow_page_url: string;
};

export const fallbackSettings: SiteSettings = {
  id: "main",
  follow_page_label: "Follow our Page",
  follow_page_url: "https://www.facebook.com/meimeidigitalAI",
};

export const fallbackHeroCards: HeroCard[] = [
  { id: "hero-1", image_url: "", target_url: "", alt_text: "Fluxora visual one", motion: "vertical", sort_order: 1, is_active: true },
  { id: "hero-2", image_url: "", target_url: "", alt_text: "Fluxora visual two", motion: "horizontal", sort_order: 2, is_active: true },
  { id: "hero-3", image_url: "", target_url: "", alt_text: "Fluxora visual three", motion: "horizontal", sort_order: 3, is_active: true },
  { id: "hero-4", image_url: "", target_url: "", alt_text: "Fluxora visual four", motion: "vertical", sort_order: 4, is_active: true },
];

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

export const fallbackGalleryImages: GalleryImage[] = Array.from({ length: 6 }, (_, index) => ({
  id: `gallery-${index + 1}`,
  image_url: "",
  target_url: "",
  alt_text: `Fluxora gallery image ${index + 1}`,
  sort_order: index + 1,
  is_active: true,
}));

export const fallbackMethodCards: MethodCard[] = [
  {
    id: "method-1",
    step_number: "01",
    eyebrow: "DIRECTION",
    title: "Choose your direction",
    description: "Start with the outcome you need: a sharper idea, a faster process, or a finished creative asset.",
    button_label: "Explore the vault",
    button_url: "#products",
    image_url: "",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "method-2",
    step_number: "02",
    eyebrow: "SYSTEM",
    title: "Use the system",
    description: "Follow a practical workflow with the right tool and a focused GPT already mapped to each step.",
    button_label: "View the method",
    button_url: "#gallery",
    image_url: "",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "method-3",
    step_number: "03",
    eyebrow: "IMPROVE",
    title: "Ship and improve",
    description: "Create the first strong version, learn from the response, then reuse the system without rebuilding it.",
    button_label: "Get access",
    button_url: "#pricing",
    image_url: "",
    sort_order: 3,
    is_active: true,
  },
];
