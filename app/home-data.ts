export type GalleryRow = "top" | "middle" | "bottom";

export type HomeGalleryImage = {
  id: string;
  image_url: string;
  target_url: string;
  alt_text: string;
  row_position: GalleryRow;
  sort_order: number;
  is_active: boolean;
};

export type HomeToolPreview = {
  id: string;
  badge: string;
  title: string;
  description: string;
  image_url: string;
  button_label: string;
  button_url: string;
  sort_order: number;
  is_active: boolean;
};

export type HomeFaq = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

const fallbackImages: HomeGalleryImage[] = [
  ["top",1,"Skincare Handheld Lifestyle Photo","https://media.fluxora.wiki/community/87ed2fd0-7499-4be9-94ee-750d45c08407/preview/0b916188-ffb4-46cf-ab8f-9cd3a2261188.png","/prompts/prompt/skincare-handheld-lifestyle-photo"],
  ["top",2,"Mirror Shot Bag","https://media.fluxora.wiki/community/87ed2fd0-7499-4be9-94ee-750d45c08407/preview/0c8cc85f-68f0-4115-b7d5-479462e1304c.png","/prompts/prompt/mirror-shot-bag"],
  ["top",3,"Item Tabletop","https://media.fluxora.wiki/community/87ed2fd0-7499-4be9-94ee-750d45c08407/preview/d046bf69-88ba-4c41-a478-3ef56191b622.png","/prompts/prompt/item-tabletop"],
  ["top",4,"Hanger Hand","https://media.fluxora.wiki/community/87ed2fd0-7499-4be9-94ee-750d45c08407/preview/96a83bb0-30b0-4761-8e58-1fff99dbc18e.png","/prompts/prompt/hanger-hand"],
  ["top",5,"High Angle","https://media.fluxora.wiki/community/87ed2fd0-7499-4be9-94ee-750d45c08407/preview/e74b1032-6a59-48f8-8123-a598a514aa5d.png","/prompts/prompt/high-angle"],
  ["top",6,"Scarf","https://media.fluxora.wiki/community/1dcc276f-0437-43be-b92a-6d9861fc0422/preview/baf02b5a-8976-4fa3-b489-c9d644b082df.jpg","/prompts/prompt/scarf-495059fa"],
  ["middle",1,"Shirt","https://media.fluxora.wiki/community/f1c9dd50-71a0-4731-a64c-91cf3ad6558c/preview/fc3b70e8-048d-4de6-b120-b61ada7d0927.jpg","/prompts/prompt/shirt-c7305e03"],
  ["middle",2,"Cotton Underwear","https://media.fluxora.wiki/community/574ddc01-c892-4e2d-9945-817bb3bb4a7a/preview/daebee5b-784a-4018-88a3-b1306949e866.jpg","/prompts/prompt/cute-printed-girls-cotton-underwear-26039f97"],
  ["middle",3,"Skincare","https://media.fluxora.wiki/community/87ed2fd0-7499-4be9-94ee-750d45c08407/preview/0b916188-ffb4-46cf-ab8f-9cd3a2261188.png","/prompts/prompt/skincare-handheld-lifestyle-photo"],
  ["middle",4,"Mirror Shot Bag","https://media.fluxora.wiki/community/87ed2fd0-7499-4be9-94ee-750d45c08407/preview/0c8cc85f-68f0-4115-b7d5-479462e1304c.png","/prompts/prompt/mirror-shot-bag"],
  ["middle",5,"Item Tabletop","https://media.fluxora.wiki/community/87ed2fd0-7499-4be9-94ee-750d45c08407/preview/d046bf69-88ba-4c41-a478-3ef56191b622.png","/prompts/prompt/item-tabletop"],
  ["middle",6,"High Angle","https://media.fluxora.wiki/community/87ed2fd0-7499-4be9-94ee-750d45c08407/preview/e74b1032-6a59-48f8-8123-a598a514aa5d.png","/prompts/prompt/high-angle"],
  ["bottom",1,"Hanger Hand","https://media.fluxora.wiki/community/87ed2fd0-7499-4be9-94ee-750d45c08407/preview/96a83bb0-30b0-4761-8e58-1fff99dbc18e.png","/prompts/prompt/hanger-hand"],
  ["bottom",2,"Scarf","https://media.fluxora.wiki/community/1dcc276f-0437-43be-b92a-6d9861fc0422/preview/baf02b5a-8976-4fa3-b489-c9d644b082df.jpg","/prompts/prompt/scarf-495059fa"],
  ["bottom",3,"Shirt","https://media.fluxora.wiki/community/f1c9dd50-71a0-4731-a64c-91cf3ad6558c/preview/fc3b70e8-048d-4de6-b120-b61ada7d0927.jpg","/prompts/prompt/shirt-c7305e03"],
  ["bottom",4,"Cotton Underwear","https://media.fluxora.wiki/community/574ddc01-c892-4e2d-9945-817bb3bb4a7a/preview/daebee5b-784a-4018-88a3-b1306949e866.jpg","/prompts/prompt/cute-printed-girls-cotton-underwear-26039f97"],
  ["bottom",5,"Skincare","https://media.fluxora.wiki/community/87ed2fd0-7499-4be9-94ee-750d45c08407/preview/0b916188-ffb4-46cf-ab8f-9cd3a2261188.png","/prompts/prompt/skincare-handheld-lifestyle-photo"],
  ["bottom",6,"Item Tabletop","https://media.fluxora.wiki/community/87ed2fd0-7499-4be9-94ee-750d45c08407/preview/d046bf69-88ba-4c41-a478-3ef56191b622.png","/prompts/prompt/item-tabletop"],
].map(([row, order, alt, image, target], index) => ({
  id: `fallback-${index + 1}`,
  row_position: row as GalleryRow,
  sort_order: order as number,
  alt_text: alt as string,
  image_url: image as string,
  target_url: target as string,
  is_active: true,
}));

const fallbackTools: HomeToolPreview[] = [
  { id: "fallback-tool-1", badge: "POPULAR TOOL", title: "Fashion Catalog Generator", description: "Create polished, consistent apparel visuals from product references.", image_url: "https://fluxora-tool-directory-media.ppopsoda3.workers.dev/media/directory/cards/e0ccc43a-53f8-4003-b9a9-dd996eb7f6da.png", button_label: "Open tool", button_url: "/tools", sort_order: 1, is_active: true },
  { id: "fallback-tool-2", badge: "AFFILIATE", title: "Product Affiliate", description: "Turn product references into creator-ready campaign assets.", image_url: "https://fluxora-tool-directory-media.ppopsoda3.workers.dev/media/directory/cards/fd787537-8c10-48da-aefb-ab27fbee74d1.png", button_label: "Open tool", button_url: "/tools", sort_order: 2, is_active: true },
  { id: "fallback-tool-3", badge: "VIDEO", title: "3D Animation [Photo]", description: "Build visual directions for product-focused animation and video.", image_url: "https://fluxora-tool-directory-media.ppopsoda3.workers.dev/media/directory/cards/65c6bf2b-1059-41e8-94a0-4b38ef58f66d.png", button_label: "Open tool", button_url: "/tools", sort_order: 3, is_active: true },
];

const fallbackFaqs: HomeFaq[] = [
  { id:"faq-1", question:"What is Fluxora mainly for?", answer:"Fluxora is mainly a creator-tool platform. Start with the tools, then use prompts, learning resources, and community support when they help you get a better result.", sort_order:1, is_active:true },
  { id:"faq-2", question:"Are prompts the main product?", answer:"No. Prompts support the experience, but Fluxora Tools are the main offer.", sort_order:2, is_active:true },
  { id:"faq-3", question:"Can I preview what Fluxora can make?", answer:"Yes. The moving image rows on the homepage show visual examples, and each image can be opened for a larger preview.", sort_order:3, is_active:true },
  { id:"faq-4", question:"Where should a new user start?", answer:"Start with Explore Tools if you already know what you want to make. Use the homepage destination cards when you want to jump somewhere specific.", sort_order:4, is_active:true },
  { id:"faq-5", question:"Do I need to learn every part of Fluxora first?", answer:"No. Fluxora is designed so you can start from the outcome you want and use only the parts that are useful for that task.", sort_order:5, is_active:true },
];

export function groupGalleryRows(images: HomeGalleryImage[]) {
  const clean = images.filter((item) => item.is_active && item.image_url);
  const take = (row: GalleryRow) => clean.filter((item) => item.row_position === row).sort((a, b) => a.sort_order - b.sort_order).slice(0, 6);
  return { top: take("top"), middle: take("middle"), bottom: take("bottom") };
}

export function normalizeHomepageContent(input: { gallery?: HomeGalleryImage[] | null; tools?: HomeToolPreview[] | null; faqs?: HomeFaq[] | null }) {
  const galleryRows = groupGalleryRows(input.gallery?.length ? input.gallery : fallbackImages);
  const hasAllRows = galleryRows.top.length && galleryRows.middle.length && galleryRows.bottom.length;
  const tools = input.tools?.filter((item) => item.is_active).sort((a,b) => a.sort_order-b.sort_order).slice(0,3) || [];
  const faqs = input.faqs?.filter((item) => item.is_active).sort((a,b) => a.sort_order-b.sort_order).slice(0,5) || [];
  return { gallery: hasAllRows ? galleryRows : groupGalleryRows(fallbackImages), tools: tools.length ? tools : fallbackTools, faqs: faqs.length ? faqs : fallbackFaqs };
}
