// Mock data for development purposes
// This will be replaced with actual API calls later

export const mockColors = [
  {
    id: 1,
    hex: '#FF6B6B',
    name: 'Coral Red',
    source: 'picker'
  },
  {
    id: 2,
    hex: '#4ECDC4',
    name: 'Turquoise',
    source: 'hex'
  },
  {
    id: 3,
    hex: '#45B7D1',
    name: 'Sky Blue',
    source: 'rgb'
  },
  {
    id: 4,
    hex: '#96CEB4',
    name: 'Mint Green',
    source: 'file'
  },
  {
    id: 5,
    hex: '#FFEAA7',
    name: 'Light Yellow',
    source: 'picker'
  },
  {
    id: 6,
    hex: '#DDA0DD',
    name: 'Plum',
    source: 'hex'
  },
  {
    id: 7,
    hex: '#98D8C8',
    name: 'Mint Blue',
    source: 'rgb'
  },
  {
    id: 8,
    hex: '#F06292',
    name: 'Pink',
    source: 'file'
  }
];

// Function to get mock colors (simulates API call)
export const getMockColors = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockColors]);
    }, 500); // Simulate network delay
  });
};

// Function to add mock color (simulates API call)
export const addMockColor = (color) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newColor = {
        ...color,
        id: Date.now() + Math.random() // Ensure unique ID
      };
      resolve(newColor);
    }, 200);
  });
};

// Function to delete mock color (simulates API call)
export const deleteMockColor = (colorId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, deletedId: colorId });
    }, 200);
  });
};

// Popular color palettes for inspiration
export const popularPalettes = [
  {
    name: 'Sunset',
    colors: ['#FF6B6B', '#FF8E53', '#FF6B9D', '#C44569', '#F8B500']
  },
  {
    name: 'Ocean',
    colors: ['#0984e3', '#74b9ff', '#00cec9', '#55efc4', '#81ecec']
  },
  {
    name: 'Forest',
    colors: ['#00b894', '#55a3ff', '#a29bfe', '#fd79a8', '#fdcb6e']
  },
  {
    name: 'Autumn',
    colors: ['#e17055', '#fdcb6e', '#e84393', '#a29bfe', '#fd79a8']
  }
];