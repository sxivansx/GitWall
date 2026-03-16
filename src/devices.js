// iPhone screen resolutions (logical px * 3 for retina)
const DEVICES = {
  iphone14: { width: 1170, height: 2532, name: "iPhone 14" },
  iphone14pro: { width: 1179, height: 2556, name: "iPhone 14 Pro" },
  iphone14promax: { width: 1290, height: 2796, name: "iPhone 14 Pro Max" },
  iphone15: { width: 1179, height: 2556, name: "iPhone 15" },
  iphone15pro: { width: 1179, height: 2556, name: "iPhone 15 Pro" },
  iphone15promax: { width: 1290, height: 2796, name: "iPhone 15 Pro Max" },
  iphone16: { width: 1179, height: 2556, name: "iPhone 16" },
  iphone16pro: { width: 1206, height: 2622, name: "iPhone 16 Pro" },
  iphone16promax: { width: 1320, height: 2868, name: "iPhone 16 Pro Max" },
  preview: { width: 390, height: 844, name: "Preview" },
};

function getDevice(name) {
  return DEVICES[name] || DEVICES.iphone14;
}

module.exports = { DEVICES, getDevice };
