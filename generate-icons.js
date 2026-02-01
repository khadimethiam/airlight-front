const sharp = require('sharp');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  sharp('public/icons/logo-source.png')
    .resize(size, size, { fit: 'contain', background: { r: 26, g: 26, b: 46 } })
    .png()
    .toFile(`public/icons/icon-${size}x${size}.png`)
    .then(() => console.log(`✅ icon-${size}x${size}.png créée`))
    .catch(err => console.error(`❌ Erreur icon-${size}:`, err));
});