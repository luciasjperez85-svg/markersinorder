import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import ColorInput from './components/ColorInput';
import ColorGrid from './components/ColorGrid';
import BulkColorUpload from './components/BulkColorUpload';
import ColorExtractorWithZoom from './components/ColorExtractorWithZoom';
import ChromaticOrderInfo from './components/ChromaticOrderInfo';
import PaletteGenerator from './components/PaletteGenerator';
import { Toaster } from './components/ui/toaster';
import { Card, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Palette, Sparkles, Upload, Grid3X3, Camera } from 'lucide-react';
import { sortColorsByHue, sortColorsBySaturation, sortColorsByLightness, sortColorsChromatic } from './utils/colorUtils';

const ColorSorterApp = () => {
  const [colors, setColors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('hue'); // 'hue', 'saturation', 'lightness'

  // Load colors from localStorage on startup
  useEffect(() => {
    try {
      const savedColors = localStorage.getItem('chromasort-colors');
      const savedSortOrder = localStorage.getItem('chromasort-sortOrder');
      
      if (savedColors) {
        setColors(JSON.parse(savedColors));
      }
      if (savedSortOrder) {
        setSortOrder(savedSortOrder);
      }
    } catch (error) {
      console.error('Error loading saved colors:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save colors to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('chromasort-colors', JSON.stringify(colors));
    }
  }, [colors, isLoading]);

  // Save sort order to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('chromasort-sortOrder', sortOrder);
    }
  }, [sortOrder, isLoading]);

  const applySorting = (colorArray) => {
    switch (sortOrder) {
      case 'saturation':
        return sortColorsBySaturation(colorArray);
      case 'lightness':
        return sortColorsByLightness(colorArray);
      case 'chromatic':
        return sortColorsChromatic(colorArray);
      case 'hue':
      default:
        return sortColorsByHue(colorArray);
    }
  };

  const handleAddColor = (newColor) => {
    const updatedColors = [...colors, newColor];
    const sortedColors = applySorting(updatedColors);
    setColors(sortedColors);
  };

  const handleBulkAdd = (newColors) => {
    const updatedColors = [...colors, ...newColors];
    const sortedColors = applySorting(updatedColors);
    setColors(sortedColors);
  };

  const handleExtractColors = (extractedColors) => {
    const updatedColors = [...colors, ...extractedColors];
    const sortedColors = applySorting(updatedColors);
    setColors(sortedColors);
  };

  const handleSortChange = (newSortOrder) => {
    setSortOrder(newSortOrder);
    const sortedColors = applySorting(colors);
    setColors(sortedColors);
  };

  const handleDeleteColor = (colorId) => {
    const updatedColors = colors.filter(color => color.id !== colorId);
    setColors(updatedColors);
  };

  const handleClearAll = () => {
    setColors([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-64">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-muted-foreground">Preparando extractor...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <Palette className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ChromaSort
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Digitaliza tu carta de colores completa con IA. Extrae automáticamente hasta 300 colores 
            de rotuladores desde una foto y organízalos en orden cromático perfecto.
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
              <Palette className="h-4 w-4" />
              {colors.length} Rotuladores
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
              <Camera className="h-4 w-4" />
              Extracción IA
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
              <Upload className="h-4 w-4" />
              Carga Masiva
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
              <Sparkles className="h-4 w-4" />
              Orden Cromático
            </Badge>
          </div>
        </div>

        {/* Main content with tabs */}
        <div className="space-y-8">
          <Tabs defaultValue="extractor" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto">
              <TabsTrigger value="extractor">Carta</TabsTrigger>
              <TabsTrigger value="bulk">Masiva</TabsTrigger>
              <TabsTrigger value="individual">Individual</TabsTrigger>
              <TabsTrigger value="collection">Colección</TabsTrigger>
            </TabsList>
            
            <TabsContent value="extractor" className="mt-8">
              <div className="flex justify-center">
                <ColorExtractorWithZoom onExtractColors={handleExtractColors} />
              </div>
            </TabsContent>
            
            <TabsContent value="bulk" className="mt-8">
              <div className="flex justify-center">
                <BulkColorUpload onBulkAdd={handleBulkAdd} />
              </div>
            </TabsContent>
            
            <TabsContent value="individual" className="mt-8">
              <div className="flex justify-center">
                <ColorInput onAddColor={handleAddColor} />
              </div>
            </TabsContent>
            
            <TabsContent value="collection" className="mt-8">
              <Tabs defaultValue="colors" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                  <TabsTrigger value="colors">Colores</TabsTrigger>
                  <TabsTrigger value="palettes">Paletas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="colors" className="mt-8">
                  <ColorGrid 
                    colors={colors}
                    onDeleteColor={handleDeleteColor}
                    onClearAll={handleClearAll}
                    sortOrder={sortOrder}
                    onSortChange={handleSortChange}
                  />
                </TabsContent>
                
                <TabsContent value="palettes" className="mt-8">
                  <PaletteGenerator colors={colors} />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chromatic Order Explanation */}
        <ChromaticOrderInfo />

        {/* Quick Instructions */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
          <h3 className="text-xl font-bold mb-4 text-center">¿Cómo digitalizar tu carta de colores?</h3>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium mb-2">1. Fotografía tu carta</h4>
              <p className="text-sm text-muted-foreground">Toma una foto clara y bien iluminada de tu carta de colores completa</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="font-medium mb-2">2. Extracción automática</h4>
              <p className="text-sm text-muted-foreground">La IA identifica y extrae automáticamente todos los colores únicos</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Grid3X3 className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium mb-2">3. Organización cromática</h4>
              <p className="text-sm text-muted-foreground">Los colores se organizan automáticamente por matiz, saturación y brillo</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p className="font-medium">
              ChromaSort - Digitalizador inteligente de cartas de colores
            </p>
            <p>
              Extracción automática con IA • Soporta hasta 300 colores • Ordenamiento cromático HSL
            </p>
            <div className="flex justify-center gap-4 text-xs">
              <span>✓ Extracción IA</span>
              <span>✓ Formato CSV</span>
              <span>✓ Códigos Hex</span>
              <span>✓ RGB Manual</span>
            </div>
          </div>
        </footer>
      </div>
      
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ColorSorterApp />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;