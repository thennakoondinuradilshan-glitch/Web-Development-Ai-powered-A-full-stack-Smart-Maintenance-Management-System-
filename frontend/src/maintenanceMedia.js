const IMAGE_ENDPOINT = 'https://dummyjson.com/image/640x360';
const FALLBACK_IMAGE = '/images/industrial-maintenance.jpg';

function getEquipmentLabel(name = 'Maintenance equipment') {
  const cleanName = String(name)
    .replace(/[^a-z0-9 .-]/gi, '')
    .trim()
    .slice(0, 34);

  return cleanName || 'Maintenance equipment';
}

// DummyJSON's image endpoint creates a deterministic placeholder image from
// the real equipment name, so unrelated product photos are never shown.
export function getEquipmentImage(name) {
  const label = getEquipmentLabel(name);
  const text = encodeURIComponent(label);

  return `${IMAGE_ENDPOINT}/0b1f36/ffffff?text=${text}&fontSize=22`;
}

export { FALLBACK_IMAGE };
