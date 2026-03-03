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
// Ordenamiento Cromático - Degradado Suave
// ============================================

/**
 * Convert hex to HSL
 */
function hexToHslValues(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
      default: break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Ordenamiento de rotuladores en degradado suave
 * Como una línea de rotuladores donde no hay saltos entre tonos
 */
export function sortColorsChromatic(colors) {
  if (!Array.isArray(colors) || colors.length === 0) return [];
  
  return [...colors].map((color, index) => {
    const hsl = hexToHslValues(color.hex);
    
    // Es gris/neutro si la saturación es muy baja
    const isGray = hsl.s < 12;
    
    // Rotar el hue para que amarillo (60°) sea el inicio (0)
    let sortHue = (hsl.h - 60 + 360) % 360;
    
    // Dividir en bandas de 20° para agrupar tonos similares
    let hueBand = Math.floor(sortHue / 20);
    
    return { 
      ...color, 
      _hue: sortHue,
      _hueBand: hueBand,
      _light: hsl.l,
      _isGray: isGray,
      _originalIndex: index,
      _hex: color.hex // Para desempate consistente
    };
  }).sort((a, b) => {
    // Grises van al final
    if (a._isGray && !b._isGray) return 1;
    if (!a._isGray && b._isGray) return -1;
    
    // Grises: ordenar de claro a oscuro
    if (a._isGray && b._isGray) {
      if (a._light !== b._light) return b._light - a._light;
      return a._hex.localeCompare(b._hex); // Desempate
    }
    
    // Colores cromáticos: primero por banda de tono
    if (a._hueBand !== b._hueBand) {
      return a._hueBand - b._hueBand;
    }
    
    // Dentro de la misma banda: de CLARO a OSCURO
    if (a._light !== b._light) {
      return b._light - a._light;
    }
    
    // Desempate final por hex para consistencia
    return a._hex.localeCompare(b._hex);
  });
}