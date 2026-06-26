export interface Device {
  width: number;
  height: number;
  name: string;
}

// iPhone screen resolutions (logical px * 3 for retina)
export const DEVICES: Record<string, Device> = {
  iphone14: { width: 1170, height: 2532, name: "iPhone 14" },
  iphone14pro: { width: 1179, height: 2556, name: "iPhone 14 Pro" },
  iphone14promax: { width: 1290, height: 2796, name: "iPhone 14 Pro Max" },
  iphone15: { width: 1179, height: 2556, name: "iPhone 15" },
  iphone15pro: { width: 1179, height: 2556, name: "iPhone 15 Pro" },
  iphone15promax: { width: 1290, height: 2796, name: "iPhone 15 Pro Max" },
  iphone16: { width: 1179, height: 2556, name: "iPhone 16" },
  iphone16pro: { width: 1206, height: 2622, name: "iPhone 16 Pro" },
  iphone16promax: { width: 1320, height: 2868, name: "iPhone 16 Pro Max" },
  iphoneair: { width: 1260, height: 2736, name: "iPhone Air" },
  iphone17: { width: 1206, height: 2622, name: "iPhone 17" },
  iphone17pro: { width: 1206, height: 2622, name: "iPhone 17 Pro" },
  iphone17promax: { width: 1320, height: 2868, name: "iPhone 17 Pro Max" },
  preview: { width: 390, height: 844, name: "Preview" },
};

export interface AndroidDevice {
  id: string;
  name: string;
  brand: string;
  width: number;
  height: number;
}

// Android devices — searchable by model name, keyed for lookup
// Resolutions sourced from GSMArena (physical pixels)
export const ANDROID_DEVICES: AndroidDevice[] = [
  // ── Samsung Galaxy S Series ──────────────────────────────────────────
  { id: "galaxy-s25-ultra", name: "Samsung Galaxy S25 Ultra", brand: "Samsung", width: 1440, height: 3120 },
  { id: "galaxy-s25-plus", name: "Samsung Galaxy S25+", brand: "Samsung", width: 1440, height: 3120 },
  { id: "galaxy-s25", name: "Samsung Galaxy S25", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-s24-ultra", name: "Samsung Galaxy S24 Ultra", brand: "Samsung", width: 1440, height: 3120 },
  { id: "galaxy-s24-plus", name: "Samsung Galaxy S24+", brand: "Samsung", width: 1440, height: 3120 },
  { id: "galaxy-s24", name: "Samsung Galaxy S24", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-s23-ultra", name: "Samsung Galaxy S23 Ultra", brand: "Samsung", width: 1440, height: 3088 },
  { id: "galaxy-s23-plus", name: "Samsung Galaxy S23+", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-s23", name: "Samsung Galaxy S23", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-s22-ultra", name: "Samsung Galaxy S22 Ultra", brand: "Samsung", width: 1440, height: 3088 },
  { id: "galaxy-s22-plus", name: "Samsung Galaxy S22+", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-s22", name: "Samsung Galaxy S22", brand: "Samsung", width: 1080, height: 2340 },
  // ── Samsung Galaxy S FE (Fan Edition) ────────────────────────────────
  { id: "galaxy-s24-fe", name: "Samsung Galaxy S24 FE", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-s23-fe", name: "Samsung Galaxy S23 FE", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-s21-fe", name: "Samsung Galaxy S21 FE", brand: "Samsung", width: 1080, height: 2400 },
  { id: "galaxy-s20-fe", name: "Samsung Galaxy S20 FE", brand: "Samsung", width: 1080, height: 2400 },
  // ── Samsung Galaxy Z Fold ─────────────────────────────────────────────
  { id: "galaxy-z-fold-6", name: "Samsung Galaxy Z Fold 6", brand: "Samsung", width: 968, height: 2376 },
  { id: "galaxy-z-fold-5", name: "Samsung Galaxy Z Fold 5", brand: "Samsung", width: 904, height: 2316 },
  // ── Samsung Galaxy Z Flip ─────────────────────────────────────────────
  { id: "galaxy-z-flip-6", name: "Samsung Galaxy Z Flip 6", brand: "Samsung", width: 1080, height: 2640 },
  { id: "galaxy-z-flip-5", name: "Samsung Galaxy Z Flip 5", brand: "Samsung", width: 1080, height: 2640 },
  // ── Samsung Galaxy A Series ──────────────────────────────────────────
  { id: "galaxy-a56", name: "Samsung Galaxy A56", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-a55", name: "Samsung Galaxy A55", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-a54", name: "Samsung Galaxy A54", brand: "Samsung", width: 1080, height: 2408 },
  { id: "galaxy-a53", name: "Samsung Galaxy A53", brand: "Samsung", width: 1080, height: 2408 },
  { id: "galaxy-a36", name: "Samsung Galaxy A36", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-a35", name: "Samsung Galaxy A35", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-a25", name: "Samsung Galaxy A25", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-a16", name: "Samsung Galaxy A16", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-a15", name: "Samsung Galaxy A15", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-a14", name: "Samsung Galaxy A14", brand: "Samsung", width: 1080, height: 2408 },
  // ── Google Pixel ─────────────────────────────────────────────────────
  { id: "pixel-9-pro-xl", name: "Google Pixel 9 Pro XL", brand: "Google", width: 1344, height: 2992 },
  { id: "pixel-9-pro", name: "Google Pixel 9 Pro", brand: "Google", width: 1280, height: 2856 },
  { id: "pixel-9", name: "Google Pixel 9", brand: "Google", width: 1080, height: 2424 },
  { id: "pixel-8-pro", name: "Google Pixel 8 Pro", brand: "Google", width: 1344, height: 2992 },
  { id: "pixel-8", name: "Google Pixel 8", brand: "Google", width: 1080, height: 2400 },
  { id: "pixel-8a", name: "Google Pixel 8a", brand: "Google", width: 1080, height: 2400 },
  { id: "pixel-7-pro", name: "Google Pixel 7 Pro", brand: "Google", width: 1440, height: 3120 },
  { id: "pixel-7", name: "Google Pixel 7", brand: "Google", width: 1080, height: 2400 },
  { id: "pixel-7a", name: "Google Pixel 7a", brand: "Google", width: 1080, height: 2310 },
  { id: "pixel-6-pro", name: "Google Pixel 6 Pro", brand: "Google", width: 1440, height: 3120 },
  { id: "pixel-6", name: "Google Pixel 6", brand: "Google", width: 1080, height: 2400 },
  // ── OnePlus ──────────────────────────────────────────────────────────
  { id: "oneplus-13", name: "OnePlus 13", brand: "OnePlus", width: 1440, height: 3168 },
  { id: "oneplus-12", name: "OnePlus 12", brand: "OnePlus", width: 1440, height: 3168 },
  { id: "oneplus-11", name: "OnePlus 11", brand: "OnePlus", width: 1440, height: 3216 },
  { id: "oneplus-open", name: "OnePlus Open", brand: "OnePlus", width: 1440, height: 3168 },
  { id: "oneplus-nord-4", name: "OnePlus Nord 4", brand: "OnePlus", width: 1240, height: 2772 },
  { id: "oneplus-nord-ce4", name: "OnePlus Nord CE 4", brand: "OnePlus", width: 1080, height: 2360 },
  // ── Xiaomi ───────────────────────────────────────────────────────────
  { id: "xiaomi-15-pro", name: "Xiaomi 15 Pro", brand: "Xiaomi", width: 1440, height: 3200 },
  { id: "xiaomi-15", name: "Xiaomi 15", brand: "Xiaomi", width: 1200, height: 2670 },
  { id: "xiaomi-14-ultra", name: "Xiaomi 14 Ultra", brand: "Xiaomi", width: 1440, height: 3200 },
  { id: "xiaomi-14-pro", name: "Xiaomi 14 Pro", brand: "Xiaomi", width: 1440, height: 3200 },
  { id: "xiaomi-14", name: "Xiaomi 14", brand: "Xiaomi", width: 1200, height: 2670 },
  { id: "redmi-note-13-pro", name: "Redmi Note 13 Pro", brand: "Xiaomi", width: 1220, height: 2712 },
  { id: "redmi-note-13", name: "Redmi Note 13", brand: "Xiaomi", width: 1080, height: 2400 },
  // ── Nothing ──────────────────────────────────────────────────────────
  { id: "nothing-phone-3", name: "Nothing Phone (3)", brand: "Nothing", width: 1260, height: 2800 },
  { id: "nothing-phone-2a-plus", name: "Nothing Phone (2a) Plus", brand: "Nothing", width: 1080, height: 2412 },
  { id: "nothing-phone-2a", name: "Nothing Phone (2a)", brand: "Nothing", width: 1080, height: 2412 },
  { id: "nothing-phone-2", name: "Nothing Phone (2)", brand: "Nothing", width: 1080, height: 2412 },
  { id: "nothing-phone-1", name: "Nothing Phone (1)", brand: "Nothing", width: 1080, height: 2400 },
  // ── Motorola ─────────────────────────────────────────────────────────
  { id: "moto-edge-50-ultra", name: "Motorola Edge 50 Ultra", brand: "Motorola", width: 1220, height: 2712 },
  { id: "moto-edge-50-pro", name: "Motorola Edge 50 Pro", brand: "Motorola", width: 1220, height: 2712 },
  { id: "moto-edge-50", name: "Motorola Edge 50", brand: "Motorola", width: 1220, height: 2712 },
  { id: "moto-edge-40-neo", name: "Motorola Edge 40 Neo", brand: "Motorola", width: 1080, height: 2400 },
  { id: "moto-g85", name: "Motorola Moto G85", brand: "Motorola", width: 1080, height: 2400 },
  { id: "moto-g54", name: "Motorola Moto G54", brand: "Motorola", width: 1080, height: 2400 },
  // ── Sony ─────────────────────────────────────────────────────────────
  { id: "xperia-1-vi", name: "Sony Xperia 1 VI", brand: "Sony", width: 1080, height: 2340 },
  { id: "xperia-5-v", name: "Sony Xperia 5 V", brand: "Sony", width: 1080, height: 2520 },
  { id: "xperia-10-vi", name: "Sony Xperia 10 VI", brand: "Sony", width: 1080, height: 2340 },
  // ── ASUS ─────────────────────────────────────────────────────────────
  { id: "zenfone-11-ultra", name: "ASUS Zenfone 11 Ultra", brand: "ASUS", width: 1080, height: 2400 },
  { id: "rog-phone-8-pro", name: "ASUS ROG Phone 8 Pro", brand: "ASUS", width: 1080, height: 2400 },
  // ── Oppo ─────────────────────────────────────────────────────────────
  { id: "oppo-find-x8-pro", name: "OPPO Find X8 Pro", brand: "OPPO", width: 1264, height: 2780 },
  { id: "oppo-find-x8", name: "OPPO Find X8", brand: "OPPO", width: 1256, height: 2760 },
  { id: "oppo-reno-12-pro", name: "OPPO Reno 12 Pro", brand: "OPPO", width: 1080, height: 2412 },
  // ── Vivo ─────────────────────────────────────────────────────────────
  { id: "vivo-x200-pro", name: "vivo X200 Pro", brand: "vivo", width: 1260, height: 2800 },
  { id: "vivo-x200", name: "vivo X200", brand: "vivo", width: 1260, height: 2800 },
  { id: "vivo-v30-pro", name: "vivo V30 Pro", brand: "vivo", width: 1080, height: 2376 },
  // ── Realme ───────────────────────────────────────────────────────────
  { id: "realme-gt-7-pro", name: "Realme GT 7 Pro", brand: "Realme", width: 1264, height: 2780 },
  { id: "realme-13-pro-plus", name: "Realme 13 Pro+", brand: "Realme", width: 1080, height: 2412 },
  { id: "realme-12-pro-plus", name: "Realme 12 Pro+", brand: "Realme", width: 1080, height: 2412 },
  // ── Honor ────────────────────────────────────────────────────────────
  { id: "honor-magic-7-pro", name: "Honor Magic 7 Pro", brand: "Honor", width: 1280, height: 2800 },
  { id: "honor-200-pro", name: "Honor 200 Pro", brand: "Honor", width: 1200, height: 2664 },
  { id: "honor-200", name: "Honor 200", brand: "Honor", width: 1080, height: 2376 },
];

export function getDevice(name: string): Device {
  return DEVICES[name] || DEVICES.iphone14;
}

export function getAndroidDevice(id: string): AndroidDevice | null {
  return ANDROID_DEVICES.find((d) => d.id === id) || null;
}
