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

export type AccessPlan = {
  id: "tool" | "premium" | "creator" | string;
  badge: string;
  title: string;
  description: string;
  features: string;
  button_label: string;
  button_url: string;
  variant: "tool" | "premium" | "creator";
  sort_order: number;
  is_active: boolean;
  price_php?: number | null;
  member_tier?: "Tool" | "Premium" | "Creator" | null;
  duration_days?: number | null;
  checkout_enabled?: boolean;
  show_description?: boolean;
};

export type PricingResource = {
  slug: string;
  title: string;
  short_description: string | null;
  image_url: string | null;
  access_level: "All" | "Premium" | "Creator";
  tool_type: "Tool" | "CustomGPT" | "Workflow";
  sort_order: number;
};

export type PricingFaq = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

export type PricingPageSettings = {
  id: string;
  faq_enabled: boolean;
};

export type PaymentSettings = {
  id: string;
  eyebrow: string;
  heading: string;
  description: string;
  payment_label: string;
  payment_number: string;
  qr_image_url: string;
  qr_target_url: string;
  qr_alt_text: string;
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

export const fallbackGalleryImages: GalleryImage[] = (["top", "middle", "bottom"] as GalleryRow[]).flatMap((row) =>
  Array.from({ length: 6 }, (_, index) => ({
    id: `${row}-${index + 1}`,
    image_url: "",
    target_url: "",
    alt_text: `${row.charAt(0).toUpperCase() + row.slice(1)} visual archive image ${index + 1}`,
    row_position: row,
    sort_order: index + 1,
    is_active: true,
  })),
);

export const fallbackAccessPlans: AccessPlan[] = [
  {
    id: "tool",
    badge: "Tools",
    title: "Tool",
    description: "Tool members can access:\n• Tools only",
    features: "Tools only",
    button_label: "Buy for ₱249",
    button_url: "/checkout?plan=tool",
    variant: "tool",
    sort_order: 1,
    is_active: true,
    price_php: 249,
    member_tier: "Tool",
    duration_days: null,
    checkout_enabled: true,
    show_description: true,
  },
  {
    id: "premium",
    badge: "Starter",
    title: "Premium (₱599)",
    description: "Premium access. Fit for aspiring creators.",
    features: "Prompts\nTools\nCustom GPTs\nCourses\nWeb Access",
    button_label: "Choose Premium",
    button_url: "/checkout?plan=premium",
    variant: "premium",
    sort_order: 2,
    is_active: true,
    price_php: 599,
    member_tier: "Premium",
    duration_days: null,
    checkout_enabled: true,
    show_description: true,
  },
  {
    id: "creator",
    badge: "Endgame",
    title: "Creator (₱1999)",
    description: "The full vault for building from idea to finished result.",
    features: "Prompts+\nTools+\nCustom GPTs+\nCourses+\nWorkflows\nWeb Access+\nSecret Methods",
    button_label: "Choose Creator",
    button_url: "/checkout?plan=creator",
    variant: "creator",
    sort_order: 3,
    is_active: true,
    price_php: 1999,
    member_tier: "Creator",
    duration_days: null,
    checkout_enabled: true,
    show_description: true,
  },
];

export const fallbackPricingFaqs: PricingFaq[] = [
  {
    id: "pricing-faq-1",
    question: "What is included in each access plan?",
    answer: "Tool includes the Fluxora tools catalog. Premium adds eligible CustomGPTs. Creator unlocks the full catalog including Workflows, CustomGPTs, and Tools.",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "pricing-faq-2",
    question: "Who is behind Fluxora?",
    answer: "Meimei Digitals is the owner of Fluxora.",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "pricing-faq-3",
    question: "Do I need technical experience?",
    answer: "No. Fluxora is structured around clear outcomes and guided steps rather than technical complexity.",
    sort_order: 3,
    is_active: true,
  },
  {
    id: "pricing-faq-4",
    question: "Can the library keep growing?",
    answer: "Yes. The Fluxora library continues to grow as new resources are released.",
    sort_order: 4,
    is_active: true,
  },
  {
    id: "pricing-faq-5",
    question: "Where does the community live?",
    answer: "The Fluxora creator community is currently hosted on Telegram.",
    sort_order: 5,
    is_active: true,
  },
];

export const fallbackPricingPageSettings: PricingPageSettings = {
  id: "main",
  faq_enabled: true,
};

export const fallbackPaymentSettings: PaymentSettings = {
  id: "main",
  eyebrow: "Easy payments",
  heading: "Pay conveniently through GCash.",
  description: "",
  payment_label: "GCash payment only",
  payment_number: "09163211558",
  qr_image_url: "",
  qr_target_url: "",
  qr_alt_text: "Fluxora GCash payment QR code",
  is_active: true,
};
