import type { ReactNode, SVGProps } from "react";
type Props = SVGProps<SVGSVGElement> & { size?: number };
function Icon({ size = 18, children, ...props }: Props & { children: ReactNode }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>; }
export const SearchIcon=(p:Props)=><Icon {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></Icon>;
export const PlusIcon=(p:Props)=><Icon {...p}><path d="M5 12h14M12 5v14"/></Icon>;
export const SettingsIcon=(p:Props)=><Icon {...p}><path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/><circle cx="12" cy="12" r="4"/></Icon>;
export const ExternalLinkIcon=(p:Props)=><Icon {...p}><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></Icon>;
export const PencilIcon=(p:Props)=><Icon {...p}><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></Icon>;
export const TrashIcon=(p:Props)=><Icon {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></Icon>;
export const UpIcon=(p:Props)=><Icon {...p}><path d="m18 15-6-6-6 6"/></Icon>;
export const DownIcon=(p:Props)=><Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>;
export const XIcon=(p:Props)=><Icon {...p}><path d="M18 6 6 18M6 6l12 12"/></Icon>;
export const LogOutIcon=(p:Props)=><Icon {...p}><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6"/></Icon>;
export const CheckIcon=(p:Props)=><Icon {...p}><path d="M20 6 9 17l-5-5"/></Icon>;
export const UploadIcon=(p:Props)=><Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></Icon>;
export const RefreshIcon=(p:Props)=><Icon {...p}><path d="M20 11a8 8 0 0 0-15-3M4 4v4h4M4 13a8 8 0 0 0 15 3M20 20v-4h-4"/></Icon>;
