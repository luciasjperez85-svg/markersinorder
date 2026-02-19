// Utility functions for color manipulation and sorting

/**
 * Convert hex color to HSL
 * @param {string} hex - Hex color code (e.g., '#FF5733')
 * @returns {object} - Object with h, s, l properties
 */
export function hexToHsl(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / diff + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Get color brightness (perceived luminance)
 * @param {string} hex - Hex color code
 * @returns {number} - Brightness value (0-255)
 */
export function getColorBrightness(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Perceived luminance formula
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

/**
 * Sort colors by hue
 * @param {Array} colors - Array of color objects with hex property
 * @returns {Array} - Sorted array of colors
 */
export function sortColorsByHue(colors) {
  return [...colors].sort((a, b) => {
    const hslA = hexToHsl(a.hex);
    const hslB = hexToHsl(b.hex);
    return hslA.h - hslB.h;
  });
}

/**
 * Sort colors by saturation (most saturated first)
 * @param {Array} colors - Array of color objects with hex property
 * @returns {Array} - Sorted array of colors
 */
export function sortColorsBySaturation(colors) {
  return [...colors].sort((a, b) => {
    const hslA = hexToHsl(a.hex);
    const hslB = hexToHsl(b.hex);
    return hslB.s - hslA.s; // Higher saturation first
  });
}

/**
 * Sort colors by lightness (lightest first)
 * @param {Array} colors - Array of color objects with hex property
 * @returns {Array} - Sorted array of colors
 */
export function sortColorsByLightness(colors) {
  return [...colors].sort((a, b) => {
    const hslA = hexToHsl(a.hex);
    const hslB = hexToHsl(b.hex);
    return hslA.l - hslB.l; // Lighter colors first
  });
}

/**
 * Sort colors chromatically (by hue, then lightness) - kept for compatibility
 * @param {Array} colors - Array of color objects with hex property
 * @returns {Array} - Sorted array of colors
 */
export function sortColorsChromatically(colors) {
  return sortColorsByHue(colors);
}

/**
 * Find analogous colors from existing collection
 * @param {Array} colors - User's color collection
 * @param {string} baseHex - Base hex color
 * @param {number} count - Number of colors to find
 * @returns {Array} - Array of existing colors that are analogous
 */
export function findAnalogousColorsFromCollection(colors, baseHex, count = 5) {
  const baseHsl = hexToHsl(baseHex);
  const analogousColors = [];
  
  // Find colors within 60 degrees of the base hue
  colors.forEach(color => {
    const colorHsl = hexToHsl(color.hex);
    const hueDiff = Math.min(
      Math.abs(colorHsl.h - baseHsl.h),
      360 - Math.abs(colorHsl.h - baseHsl.h)
    );
    
    if (hueDiff <= 60) {
      analogousColors.push({
        ...color,
        hueDiff: hueDiff
      });
    }
  });
  
  // Sort by hue difference and take closest ones
  return analogousColors
    .sort((a, b) => a.hueDiff - b.hueDiff)
    .slice(0, count);
}

/**
 * Find complementary colors from existing collection
 * @param {Array} colors - User's color collection
 * @param {string} baseHex - Base hex color
 * @param {number} count - Number of colors to find
 * @returns {Array} - Array of existing colors that are complementary
 */
export function findComplementaryColorsFromCollection(colors, baseHex, count = 4) {
  const baseHsl = hexToHsl(baseHex);
  const complementaryHue = (baseHsl.h + 180) % 360;
  const complementaryColors = [];
  
  // Add base color first
  const baseColor = colors.find(c => c.hex === baseHex);
  if (baseColor) complementaryColors.push(baseColor);
  
  // Find colors near the complementary hue
  colors.forEach(color => {
    if (color.hex === baseHex) return;
    
    const colorHsl = hexToHsl(color.hex);
    const hueDiff = Math.min(
      Math.abs(colorHsl.h - complementaryHue),
      360 - Math.abs(colorHsl.h - complementaryHue)
    );
    
    if (hueDiff <= 45) {
      complementaryColors.push({
        ...color,
        hueDiff: hueDiff
      });
    }
  });
  
  // Add colors with similar hues to base for variety
  colors.forEach(color => {
    if (color.hex === baseHex) return;
    if (complementaryColors.find(c => c.hex === color.hex)) return;
    
    const colorHsl = hexToHsl(color.hex);
    const hueDiff = Math.min(
      Math.abs(colorHsl.h - baseHsl.h),
      360 - Math.abs(colorHsl.h - baseHsl.h)
    );
    
    if (hueDiff <= 30) {
      complementaryColors.push({
        ...color,
        hueDiff: hueDiff + 1000 // Lower priority
      });
    }
  });
  
  return complementaryColors
    .sort((a, b) => a.hueDiff - b.hueDiff)
    .slice(0, count);
}

/**
 * Find triadic colors from existing collection
 * @param {Array} colors - User's color collection
 * @param {string} baseHex - Base hex color
 * @param {number} count - Number of colors to find
 * @returns {Array} - Array of existing colors that form triadic harmony
 */
export function findTriadicColorsFromCollection(colors, baseHex, count = 6) {
  const baseHsl = hexToHsl(baseHex);
  const triadic1 = (baseHsl.h + 120) % 360;
  const triadic2 = (baseHsl.h + 240) % 360;
  const triadicColors = [];
  
  // Add base color
  const baseColor = colors.find(c => c.hex === baseHex);
  if (baseColor) triadicColors.push(baseColor);
  
  // Find colors near triadic positions
  colors.forEach(color => {
    if (color.hex === baseHex) return;
    
    const colorHsl = hexToHsl(color.hex);
    const diff1 = Math.min(
      Math.abs(colorHsl.h - triadic1),
      360 - Math.abs(colorHsl.h - triadic1)
    );
    const diff2 = Math.min(
      Math.abs(colorHsl.h - triadic2),
      360 - Math.abs(colorHsl.h - triadic2)
    );
    const diff3 = Math.min(
      Math.abs(colorHsl.h - baseHsl.h),
      360 - Math.abs(colorHsl.h - baseHsl.h)
    );
    
    const minDiff = Math.min(diff1, diff2, diff3);
    if (minDiff <= 45) {
      triadicColors.push({
        ...color,
        hueDiff: minDiff
      });
    }
  });
  
  return triadicColors
    .sort((a, b) => a.hueDiff - b.hueDiff)
    .slice(0, count);
}

/**
 * Find monochromatic colors from existing collection
 * @param {Array} colors - User's color collection
 * @param {string} baseHex - Base hex color
 * @param {number} count - Number of colors to find
 * @returns {Array} - Array of existing colors with similar hue
 */
export function findMonochromaticColorsFromCollection(colors, baseHex, count = 5) {
  const baseHsl = hexToHsl(baseHex);
  const monochromaticColors = [];
  
  colors.forEach(color => {
    const colorHsl = hexToHsl(color.hex);
    const hueDiff = Math.min(
      Math.abs(colorHsl.h - baseHsl.h),
      360 - Math.abs(colorHsl.h - baseHsl.h)
    );
    
    if (hueDiff <= 15) { // Very close hues
      monochromaticColors.push({
        ...color,
        lightnessDiff: Math.abs(colorHsl.l - baseHsl.l)
      });
    }
  });
  
  return monochromaticColors
    .sort((a, b) => a.lightnessDiff - b.lightnessDiff)
    .slice(0, count);
}

/**
 * Find split complementary colors from existing collection
 * @param {Array} colors - User's color collection
 * @param {string} baseHex - Base hex color
 * @param {number} count - Number of colors to find
 * @returns {Array} - Array of existing colors that are split complementary
 */
export function findSplitComplementaryFromCollection(colors, baseHex, count = 5) {
  const baseHsl = hexToHsl(baseHex);
  const comp1 = (baseHsl.h + 150) % 360;
  const comp2 = (baseHsl.h + 210) % 360;
  const splitColors = [];
  
  // Add base color
  const baseColor = colors.find(c => c.hex === baseHex);
  if (baseColor) splitColors.push(baseColor);
  
  colors.forEach(color => {
    if (color.hex === baseHex) return;
    
    const colorHsl = hexToHsl(color.hex);
    const diff1 = Math.min(
      Math.abs(colorHsl.h - comp1),
      360 - Math.abs(colorHsl.h - comp1)
    );
    const diff2 = Math.min(
      Math.abs(colorHsl.h - comp2),
      360 - Math.abs(colorHsl.h - comp2)
    );
    const diffBase = Math.min(
      Math.abs(colorHsl.h - baseHsl.h),
      360 - Math.abs(colorHsl.h - baseHsl.h)
    );
    
    const minDiff = Math.min(diff1, diff2, diffBase);
    if (minDiff <= 30) {
      splitColors.push({
        ...color,
        hueDiff: minDiff
      });
    }
  });
  
  return splitColors
    .sort((a, b) => a.hueDiff - b.hueDiff)
    .slice(0, count);
}

/**
 * Get smart palette suggestions from a color collection
 * @param {Array} colors - Array of color objects
 * @returns {Array} - Array of suggested palettes using existing colors
 */
export function generateSmartPaletteSuggestions(colors) {
  if (colors.length < 3) return [];
  
  const suggestions = [];
  
  // Take up to 5 base colors for variety
  const baseColors = colors.slice(0, Math.min(5, colors.length));
  
  baseColors.forEach((baseColor, index) => {
    if (index < 3) {
      suggestions.push({
        name: `Análoga desde ${baseColor.name}`,
        type: 'analogous',
        baseColor: baseColor,
        colors: findAnalogousColorsFromCollection(colors, baseColor.hex, 5)
      });
    }
    
    if (index < 2) {
      suggestions.push({
        name: `Complementaria desde ${baseColor.name}`,
        type: 'complementary',
        baseColor: baseColor,
        colors: findComplementaryColorsFromCollection(colors, baseColor.hex, 4)
      });
    }
    
    if (index < 2) {
      suggestions.push({
        name: `Triádica desde ${baseColor.name}`,
        type: 'triadic',
        baseColor: baseColor,
        colors: findTriadicColorsFromCollection(colors, baseColor.hex, 6)
      });
    }
  });
  
  return suggestions.filter(s => s.colors.length >= 3);
}

/**
 * Convert HSL to hex
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} - Hex color code
 */
export function hslToHex(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (0 <= h && h < 1/6) {
    r = c; g = x; b = 0;
  } else if (1/6 <= h && h < 2/6) {
    r = x; g = c; b = 0;
  } else if (2/6 <= h && h < 3/6) {
    r = 0; g = c; b = x;
  } else if (3/6 <= h && h < 4/6) {
    r = 0; g = x; b = c;
  } else if (4/6 <= h && h < 5/6) {
    r = x; g = 0; b = c;
  } else if (5/6 <= h && h < 1) {
    r = c; g = 0; b = x;
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Get complementary color
 * @param {string} hex - Base hex color
 * @returns {string} - Complementary hex color
 */
export function getComplementaryColor(hex) {
  const hsl = hexToHsl(hex);
  const complementaryHue = (hsl.h + 180) % 360;
  return hslToHex(complementaryHue, hsl.s, hsl.l);
}

// ============================================
// CIELAB Color Space Functions for Chromatic Order
// ============================================

/**
 * Convert hex to RGB (0-255)
 */
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return {
    r: parseInt(hex.substr(0, 2), 16),
    g: parseInt(hex.substr(2, 2), 16),
    b: parseInt(hex.substr(4, 2), 16)
  };
}

/**
 * Convert RGB to XYZ color space
 */
function rgbToXyz(r, g, b) {
  // Normalize to 0-1
  r = r / 255;
  g = g / 255;
  b = b / 255;

  // Apply gamma correction
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // Convert to XYZ using sRGB matrix
  return {
    x: r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    y: r * 0.2126729 + g * 0.7151522 + b * 0.0721750,
    z: r * 0.0193339 + g * 0.1191920 + b * 0.9503041
  };
}

/**
 * Convert XYZ to CIELAB
 */
function xyzToLab(x, y, z) {
  // D65 white point
  const refX = 0.95047;
  const refY = 1.00000;
  const refZ = 1.08883;

  x = x / refX;
  y = y / refY;
  z = z / refZ;

  const epsilon = 0.008856;
  const kappa = 903.3;

  x = x > epsilon ? Math.pow(x, 1/3) : (kappa * x + 16) / 116;
  y = y > epsilon ? Math.pow(y, 1/3) : (kappa * y + 16) / 116;
  z = z > epsilon ? Math.pow(z, 1/3) : (kappa * z + 16) / 116;

  return {
    L: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z)
  };
}

/**
 * Convert hex color to CIELAB
 */
export function hexToLab(hex) {
  const rgb = hexToRgb(hex);
  const xyz = rgbToXyz(rgb.r, rgb.g, rgb.b);
  return xyzToLab(xyz.x, xyz.y, xyz.z);
}

/**
 * Calculate hue, chroma from CIELAB a*, b*
 */
function getLabHueChroma(a, b) {
  const chroma = Math.sqrt(a * a + b * b);
  let hue = Math.atan2(b, a) * (180 / Math.PI);
  if (hue < 0) hue += 360;
  return { hue, chroma };
}

/**
 * Color group definitions for chromatic ordering
 */
const COLOR_GROUPS = {
  YELLOW: 0,
  YELLOW_ORANGE: 1,
  ORANGE: 2,
  RED: 3,
  PINK_MAGENTA: 4,
  VIOLET_PURPLE: 5,
  BLUE: 6,
  TURQUOISE: 7,
  GREEN: 8,
  YELLOW_GREEN: 9,
  BROWN: 10,
  SKIN_TONE: 11,
  WARM_GRAY: 12,
  COOL_GRAY: 13,
  BLACK_NEUTRAL: 14
};

/**
 * Classify a color into its chromatic group
 */
function classifyColor(lab, hue, chroma) {
  const { L, a, b } = lab;
  
  // Threshold for neutral colors (low chroma)
  const NEUTRAL_THRESHOLD = 8;
  const LOW_CHROMA_THRESHOLD = 15;
  
  // Detect neutrals (very low chroma)
  if (chroma < NEUTRAL_THRESHOLD) {
    if (L < 15) return COLOR_GROUPS.BLACK_NEUTRAL;
    // Warm vs cool gray based on a* and b*
    if (a > 0 || b > 0) return COLOR_GROUPS.WARM_GRAY;
    return COLOR_GROUPS.COOL_GRAY;
  }
  
  // Detect skin tones: hue between yellow-orange (20-50°), high L*, medium-low chroma
  if (hue >= 20 && hue <= 50 && L >= 55 && chroma >= 10 && chroma <= 35) {
    return COLOR_GROUPS.SKIN_TONE;
  }
  
  // Detect browns: orange-ish hue, low lightness, medium chroma
  if (hue >= 15 && hue <= 50 && L < 50 && chroma < 40) {
    return COLOR_GROUPS.BROWN;
  }
  
  // Classify by hue angle
  if (hue >= 80 && hue < 105) return COLOR_GROUPS.YELLOW;
  if (hue >= 60 && hue < 80) return COLOR_GROUPS.YELLOW_ORANGE;
  if (hue >= 35 && hue < 60) return COLOR_GROUPS.ORANGE;
  if (hue >= 0 && hue < 35) return COLOR_GROUPS.RED;
  if (hue >= 345 && hue <= 360) return COLOR_GROUPS.RED;
  if (hue >= 310 && hue < 345) return COLOR_GROUPS.PINK_MAGENTA;
  if (hue >= 270 && hue < 310) return COLOR_GROUPS.VIOLET_PURPLE;
  if (hue >= 220 && hue < 270) return COLOR_GROUPS.BLUE;
  if (hue >= 170 && hue < 220) return COLOR_GROUPS.TURQUOISE;
  if (hue >= 130 && hue < 170) return COLOR_GROUPS.GREEN;
  if (hue >= 105 && hue < 130) return COLOR_GROUPS.YELLOW_GREEN;
  
  return COLOR_GROUPS.GREEN; // Default fallback
}

/**
 * Sort colors using advanced chromatic ordering (CIELAB-based)
 * Groups colors by type, then sorts within each group by hue, lightness, chroma
 * @param {Array} colors - Array of color objects with hex property
 * @returns {Array} - Sorted array of colors
 */
export function sortColorsChromatic(colors) {
  // Calculate CIELAB values for each color
  const colorsWithLab = colors.map(color => {
    const lab = hexToLab(color.hex);
    const { hue, chroma } = getLabHueChroma(lab.a, lab.b);
    const group = classifyColor(lab, hue, chroma);
    
    return {
      ...color,
      lab,
      hue,
      chroma,
      group
    };
  });
  
  // Sort by group first, then by hue, lightness (descending), chroma (descending)
  return colorsWithLab.sort((a, b) => {
    // Primary: sort by group
    if (a.group !== b.group) {
      return a.group - b.group;
    }
    
    // Secondary: sort by hue within group
    const hueDiff = a.hue - b.hue;
    if (Math.abs(hueDiff) > 5) {
      return hueDiff;
    }
    
    // Tertiary: sort by lightness (light to dark)
    const lightnessDiff = b.lab.L - a.lab.L;
    if (Math.abs(lightnessDiff) > 3) {
      return lightnessDiff;
    }
    
    // Quaternary: sort by chroma (saturated to muted)
    return b.chroma - a.chroma;
  });
}