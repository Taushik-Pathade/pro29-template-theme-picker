const form = document.querySelector('form');
const root = document.documentElement;

const luminanceCoefficients = [.2126, .7152, .0722];

const linearizeSRGB = colorChannel => {
  colorChannel /= 255;
  if (colorChannel <= .04045) {
    return colorChannel / 12.92;
  } else {
    return Math.pow((colorChannel + .055) / 1.055, 2.4);
  }
};

const getLuminance = color => {
  var cv = color.map(v => linearizeSRGB(v));
  return cv[0] * luminanceCoefficients[0] +
  cv[1] * luminanceCoefficients[1] +
  cv[2] * luminanceCoefficients[2];
};

const RGBtoHSL = color => {
  let r = color[0];
  let g = color[1];
  let b = color[2];


  r /= 255;
  g /= 255;
  b /= 255;

  const l = Math.max(r, g, b);
  const s = l - Math.min(r, g, b);
  const h = s ?
  l === r ?
  (g - b) / s :
  l === g ?
  2 + (b - r) / s :
  4 + (r - g) / s :
  0;

  return [
  60 * h < 0 ? 60 * h + 360 : 60 * h,
  100 * (s ? l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s)) : 0),
  100 * (2 * l - s) / 2];

};

const HEXtoHSL = hex => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  var r = parseInt(result[1], 16);
  var g = parseInt(result[2], 16);
  var b = parseInt(result[3], 16);

  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b),min = Math.min(r, g, b);
  var h,s,l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:h = (g - b) / d + (g < b ? 6 : 0);break;
      case g:h = (b - r) / d + 2;break;
      case b:h = (r - g) / d + 4;break;}


    h /= 6;
  }

  s = s * 100;
  s = Math.round(s);
  l = l * 100;
  l = Math.round(l);
  h = Math.round(360 * h);

  return [h, s, l];
};

const componentToHex = c => {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
};

const RGBtoHEX = rgb => {
  return "#" + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
};

const HEXtoRGB = hex => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
  parseInt(result[1], 16),
  parseInt(result[2], 16),
  parseInt(result[3], 16)] :
  null;
};



const getColorFromLogo = logo => {
  const colorThief = new ColorThief();
  const img = new Image();
  img.src = logo;
  img.crossOrigin = "Anonymous";

  // Make sure image is finished loading
  img.addEventListener('load', function () {
    applyColor(colorThief.getColor(img), 'rgb', true);
    // console.log(colorThief.getPalette(img, 3));
  });
};

const applyBrand = deets => {
  root.style.setProperty('--logo', `url(${deets.logo})`);
  root.style.setProperty('--name', `'${deets.name}'`);
  root.style.setProperty('--url', `'${deets.name.toLowerCase().replace(/[^a-zA-Z ]/g, "").replace(/\s/g, '-')}'`);
};

const applyColor = async (color, format, update = false) => {
  const hsl = format === 'rgb' ? RGBtoHSL(color) : HEXtoHSL(color);
  const rgb = format === 'rgb' ? color : HEXtoRGB(color);

  // console.log("HSL", hsl);

  if (getLuminance(rgb) > 0.5) {
    root.style.setProperty('--l-c', 'currentColor');
  } else {
    root.style.setProperty('--l-c', 'white');
  }

  root.style.setProperty('--c-h', hsl[0]);
  root.style.setProperty('--c-s', `${hsl[1]}%`);
  root.style.setProperty('--c-l', `${hsl[2]}%`);

  if (update) {
    // console.log("HEX", color, RGBtoHEX(color));
    document.getElementById('c').value = RGBtoHEX(color);
  }
};

const findCompanyDeets = async search => {
  const deets = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${search}`).
  then(response => response.json()).
  then(response => {
    return response[0];
  });

  // console.log("DEETS", deets);
  applyBrand(deets);
  getColorFromLogo(deets.logo);
};

const updateStyles = e => {
  const target = e.target;
  const val = target.value;

  if (target.type === 'checkbox') {// Corners + Shadow
    // console.log(target.checked);
    root.style.setProperty(`--${target.id}`, `${target.checked ? 1 : 0}`);
  } else if (target.id === 'd') {// Company Deets
    // console.log(val);
    findCompanyDeets(val);
  } else if (target.id === 's') {// Spacing
    if (val === 'large') {
      root.style.setProperty('--s', 1.25);
    } else if (val === 'small') {
      root.style.setProperty('--s', 0.75);
    } else {
      root.style.setProperty('--s', 1);
    }
  } else {// Everything else
    // console.log(val);
    root.style.setProperty(`--${target.id}`, val);

    if (target.id === 'c') {
      applyColor(val, 'hex');
    }
  }
};

form.addEventListener('submit', e => e.preventDefault());
form.addEventListener('change', updateStyles);