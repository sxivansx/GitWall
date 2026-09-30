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

export function getDevice(name: string): Device {
  return DEVICES[name] || DEVICES.iphone14;
}
