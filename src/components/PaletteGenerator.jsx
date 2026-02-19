import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Palette, Wand2, Download, RefreshCw, Copy } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { 
  findAnalogousColorsFromCollection,
  findComplementaryColorsFromCollection,
  findTriadicColorsFromCollection,
  findMonochromaticColorsFromCollection,
  findSplitComplementaryFromCollection,
  generateSmartPaletteSuggestions 
} from '../utils/colorUtils';

const PaletteGenerator = ({ colors }) => {
  const [selectedPaletteType, setSelectedPaletteType] = useState('analogous');
  const [paletteSize, setPaletteSize] = useState(5);
  const [baseColor, setBaseColor] = useState('');
  const [generatedPalettes, setGeneratedPalettes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const { toast } = useToast();

  const paletteTypes = [
    { value: 'analogous', name: 'Análoga', description: 'Colores cercanos en la rueda cromática' },
    { value: 'complementary', name: 'Complementaria', description: 'Colores opuestos que contrastan' },
    { value: 'triadic', name: 'Triádica', description: 'Tres colores equidistantes' },
    { value: 'monochromatic', name: 'Monocromática', description: 'Variaciones del mismo matiz' },
    { value: 'split', name: 'Complementaria Dividida', description: 'Base + dos adyacentes al complementario' }
  ];

  const generatePalette = () => {
    if (!baseColor) {
      toast({
        title: "Selecciona un color base",
        description: "Elige un color de tu colección para generar la paleta",
        variant: "destructive"
      });
      return;
    }

    let paletteColors = [];
    let paletteName = '';

    switch (selectedPaletteType) {
      case 'analogous':
        paletteColors = findAnalogousColorsFromCollection(colors, baseColor, paletteSize);
        paletteName = 'Paleta Análoga';
        break;
      case 'complementary':
        paletteColors = findComplementaryColorsFromCollection(colors, baseColor, paletteSize);
        paletteName = 'Paleta Complementaria';
        break;
      case 'triadic':
        paletteColors = findTriadicColorsFromCollection(colors, baseColor, paletteSize);
        paletteName = 'Paleta Triádica';
        break;
      case 'monochromatic':
        paletteColors = findMonochromaticColorsFromCollection(colors, baseColor, paletteSize);
        paletteName = 'Paleta Monocromática';
        break;
      case 'split':
        paletteColors = findSplitComplementaryFromCollection(colors, baseColor, paletteSize);
        paletteName = 'Paleta Complementaria Dividida';
        break;
      default:
        return;
    }

    if (paletteColors.length === 0) {
      toast({
        title: "No se encontraron colores",
        description: "No hay suficientes colores en tu colección para este tipo de paleta",
        variant: "destructive"
      });
      return;
    }

    const newPalette = {
      id: Date.now(),
      name: paletteName,
      type: selectedPaletteType,
      colors: paletteColors.map(c => c.hex),
      colorObjects: paletteColors,
      baseColor: baseColor
    };

    setGeneratedPalettes(prev => [newPalette, ...prev.slice(0, 4)]); // Keep last 5 palettes

    toast({
      title: "Paleta generada",
      description: `${paletteName} con ${paletteColors.length} colores de tu colección`,
    });
  };

  const generateSuggestions = () => {
    const paletteSuggestions = generateSmartPaletteSuggestions(colors);
    setSuggestions(paletteSuggestions.slice(0, 6));
    
    toast({
      title: "Sugerencias generadas",
      description: `${paletteSuggestions.length} paletas sugeridas desde tus rotuladores`,
    });
  };

  const copyPalette = (palette) => {
    let colorString = '';
    if (palette.colorObjects) {
      colorString = palette.colorObjects.map(c => `${c.name}: ${c.hex}`).join(', ');
    } else {
      colorString = palette.colors.join(', ');
    }
    navigator.clipboard.writeText(colorString);
    
    toast({
      title: "Paleta copiada",
      description: `${palette.colors.length} colores de tu colección copiados`,
    });
  };

  const exportPalette = (palette) => {
    const data = {
      name: palette.name,
      type: palette.type,
      colors: palette.colors,
      baseColor: palette.baseColor,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${palette.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Paleta exportada",
      description: "Se ha descargado el archivo JSON",
    });
  };

  if (colors.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-24 h-24 rounded-full bg-muted mb-4 flex items-center justify-center">
            <Palette className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No hay colores para paletas</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Primero agrega algunos colores a tu colección para poder generar paletas armónicas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generator Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Generador de Paletas
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Crea paletas armónicas de 3-10 colores basadas en teoría del color
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Color Base</Label>
              <Select value={baseColor} onValueChange={setBaseColor}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige un color" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {colors.slice(0, 20).map((color) => (
                    <SelectItem key={color.id} value={color.hex}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-sm">{color.name}</span>
                        <span className="text-xs text-muted-foreground">{color.hex}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Paleta</Label>
              <Select value={selectedPaletteType} onValueChange={setSelectedPaletteType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paletteTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cantidad de Colores</Label>
              <Select value={paletteSize.toString()} onValueChange={(value) => setPaletteSize(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} colores
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={generatePalette} className="flex-1">
                <Wand2 className="h-4 w-4 mr-2" />
                Generar
              </Button>
              <Button variant="outline" onClick={generateSuggestions}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {baseColor && (
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: baseColor }}
              />
              <div>
                <p className="text-sm font-medium">Color base seleccionado</p>
                <p className="text-xs text-muted-foreground">{baseColor}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Palettes */}
      {generatedPalettes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Paletas Generadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedPalettes.map((palette) => (
              <div key={palette.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{palette.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {palette.colors.length} colores • Base: {palette.baseColor}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyPalette(palette)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportPalette(palette)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  {palette.colors.map((color, index) => {
                    // Find the color object to show name
                    const colorObj = palette.colorObjects && palette.colorObjects[index] 
                      ? palette.colorObjects[index] 
                      : { hex: color, name: `Color ${index + 1}` };
                    
                    return (
                      <div
                        key={index}
                        className="flex-1 h-16 rounded cursor-pointer hover:scale-105 transition-transform relative group"
                        style={{ backgroundColor: color }}
                        title={`${colorObj.name} - ${color}`}
                      >
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded flex items-end p-1">
                          <span className="text-xs text-white/80 bg-black/50 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {colorObj.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-2 flex flex-wrap gap-1">
                  {palette.colors.map((color, index) => {
                    const colorObj = palette.colorObjects && palette.colorObjects[index] 
                      ? palette.colorObjects[index] 
                      : { name: `Color ${index + 1}` };
                    
                    return (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {colorObj.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sugerencias Automáticas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Paletas generadas automáticamente desde tus colores
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-sm">{suggestion.name}</h5>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.type}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-1 mb-2">
                    {suggestion.colors.map((colorObj, colorIndex) => (
                      <div
                        key={colorIndex}
                        className="flex-1 h-8 rounded relative group"
                        style={{ backgroundColor: colorObj.hex }}
                        title={`${colorObj.name} - ${colorObj.hex}`}
                      >
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded flex items-center justify-center">
                          <span className="text-xs text-white/80 bg-black/50 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {colorObj.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs"
                      onClick={() => copyPalette(suggestion)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs"
                      onClick={() => setGeneratedPalettes(prev => [suggestion, ...prev.slice(0, 4)])}
                    >
                      <Wand2 className="h-3 w-3 mr-1" />
                      Usar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaletteGenerator;