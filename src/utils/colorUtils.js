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
  r = r / 255;
  g = g / 255;
  b = b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

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
 * Calculate hue and chroma from CIELAB a*, b*
 * CIELAB hue: 0° = red (+a), 90° = yellow (+b), 180° = green (-a), 270° = blue (-b)
 */
function getLabHueChroma(a, b) {
  const chroma = Math.sqrt(a * a + b * b);
  let hue = Math.atan2(b, a) * (180 / Math.PI);
  if (hue < 0) hue += 360;
  return { hue, chroma };
}

/**
 * Classify a color into its chromatic group
 * Order: Amarillos → Amarillos-naranja → Naranjas → Rojos → Rosas/Magentas → 
 *        Violetas → Azules → Turquesas → Verdes → Amarillos-verdes → 
 *        Marrones → Tonos piel → Grises cálidos → Grises fríos → Negros/neutros
 */
function classifyColor(lab, hue, chroma) {
  const { L, a, b: labB } = lab;
  
  // ===== NEUTRALS (very low chroma) =====
  if (chroma < 5) {
    if (L < 20) return 14; // Negro/neutros extremos
    if (a > 0 || labB > 0) return 12; // Grises cálidos
    return 13; // Grises fríos
  }
  
  // ===== LOW CHROMA SPECIAL CASES =====
  if (chroma < 20) {
    // Grises con algo de color
    if (L < 25) return 14; // Muy oscuro = negro
    if (L > 75 && chroma < 10) {
      if (a > 0 || labB > 0) return 12; // Gris cálido claro
      return 13; // Gris frío claro
    }
  }
  
  // ===== BROWNS: orange-red hue, low-medium L, low-medium chroma =====
  if (hue >= 30 && hue <= 70 && L < 55 && L > 15 && chroma < 50) {
    return 10; // Marrones
  }
  
  // ===== SKIN TONES: orange-yellow hue, high L, low-medium chroma =====
  if (hue >= 40 && hue <= 80 && L >= 60 && L <= 85 && chroma >= 15 && chroma <= 40) {
    return 11; // Tonos piel
  }
  
  // ===== CHROMATIC COLORS BY HUE =====
  // CIELAB hue wheel: 0°=red, 90°=yellow, 180°=green, 270°=blue
  
  // Amarillos (85° - 100°)
  if (hue >= 85 && hue < 100) return 0;
  
  // Amarillos-naranja (70° - 85°)
  if (hue >= 70 && hue < 85) return 1;
  
  // Naranjas (45° - 70°)
  if (hue >= 45 && hue < 70) return 2;
  
  // Rojos (0° - 45° y 345° - 360°)
  if ((hue >= 0 && hue < 45) || (hue >= 345 && hue <= 360)) return 3;
  
  // Rosas / Magentas (310° - 345°)
  if (hue >= 310 && hue < 345) return 4;
  
  // Violetas / Púrpuras (270° - 310°)
  if (hue >= 270 && hue < 310) return 5;
  
  // Azules (220° - 270°)
  if (hue >= 220 && hue < 270) return 6;
  
  // Turquesas (170° - 220°)
  if (hue >= 170 && hue < 220) return 7;
  
  // Verdes (130° - 170°)
  if (hue >= 130 && hue < 170) return 8;
  
  // Amarillos-verdes (100° - 130°)
  if (hue >= 100 && hue < 130) return 9;
  
  return 8; // Default: verde
}

/**
 * Sort colors using CIELAB chromatic ordering
 * Groups by color family, then sorts within each group by:
 * 1. Hue (tono)
 * 2. Lightness (L*) - claro a oscuro
 * 3. Chroma (C*) - saturado a apagado
 */
export function sortColorsChromatic(colors) {
  if (!Array.isArray(colors) || colors.length === 0) return [];
  
  const colorsWithData = colors.map(color => {
    try {
      const lab = hexToLab(color.hex);
      const { hue, chroma } = getLabHueChroma(lab.a, lab.b);
      const group = classifyColor(lab, hue, chroma);
      
      return {
        ...color,
        _lab: lab,
        _hue: hue,
        _chroma: chroma,
        _group: group
      };
    } catch (e) {
      return { ...color, _lab: { L: 50, a: 0, b: 0 }, _hue: 0, _chroma: 0, _group: 14 };
    }
  });
  
  return colorsWithData.sort((a, b) => {
    // 1. Por grupo
    if (a._group !== b._group) {
      return a._group - b._group;
    }
    
    // 2. Por tono (hue) dentro del grupo
    const hueDiff = a._hue - b._hue;
    if (Math.abs(hueDiff) > 3) {
      return hueDiff;
    }
    
    // 3. Por claridad (L*): de claro a oscuro
    const lightDiff = b._lab.L - a._lab.L;
    if (Math.abs(lightDiff) > 2) {
      return lightDiff;
    }
    
    // 4. Por saturación (chroma): de más saturado a más apagado
    return b._chroma - a._chroma;
  });
}