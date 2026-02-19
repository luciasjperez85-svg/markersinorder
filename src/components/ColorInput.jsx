import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Upload, Palette, Hash } from 'lucide-react';

const ColorInput = ({ onAddColor }) => {
  const [hexValue, setHexValue] = useState('#000000');
  const [rgbValues, setRgbValues] = useState({ r: 0, g: 0, b: 0 });

  const handleHexSubmit = () => {
    if (hexValue.match(/^#[0-9A-Fa-f]{6}$/)) {
      onAddColor({
        id: Date.now(),
        hex: hexValue.toUpperCase(),
        name: `Color ${Date.now()}`,
        source: 'hex'
      });
      setHexValue('#000000');
    }
  };

  const handleRgbSubmit = () => {
    const { r, g, b } = rgbValues;
    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
      onAddColor({
        id: Date.now(),
        hex: hex.toUpperCase(),
        name: `RGB(${r}, ${g}, ${b})`,
        source: 'rgb'
      });
      setRgbValues({ r: 0, g: 0, b: 0 });
    }
  };

  const handleColorPicker = (e) => {
    const color = e.target.value;
    onAddColor({
      id: Date.now(),
      hex: color.toUpperCase(),
      name: `Picked Color`,
      source: 'picker'
    });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        // Mock: In real app, this would extract colors from image
        const mockColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        const randomColor = mockColors[Math.floor(Math.random() * mockColors.length)];
        onAddColor({
          id: Date.now() + Math.random(),
          hex: randomColor,
          name: `From ${file.name}`,
          source: 'file'
        });
      }
    });
    e.target.value = '';
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Agregar Colores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="picker" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="picker">Selector</TabsTrigger>
            <TabsTrigger value="hex">Hex</TabsTrigger>
            <TabsTrigger value="rgb">RGB</TabsTrigger>
            <TabsTrigger value="upload">Imagen</TabsTrigger>
          </TabsList>
          
          <TabsContent value="picker" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="color-picker">Selecciona un color</Label>
              <div className="flex items-center gap-4">
                <input
                  id="color-picker"
                  type="color"
                  onChange={handleColorPicker}
                  className="w-20 h-12 rounded-lg border-2 border-border cursor-pointer"
                />
                <p className="text-sm text-muted-foreground">
                  Haz clic para abrir el selector de colores
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="hex" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hex-input">Código Hex</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="hex-input"
                    type="text"
                    placeholder="#FF5733"
                    value={hexValue}
                    onChange={(e) => setHexValue(e.target.value)}
                    className="pl-10"
                    maxLength={7}
                  />
                </div>
                <Button onClick={handleHexSubmit}>Agregar</Button>
              </div>
              <div 
                className="w-full h-8 rounded-lg border-2 border-border"
                style={{ backgroundColor: hexValue }}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="rgb" className="space-y-4">
            <div className="space-y-2">
              <Label>Valores RGB</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="r-value" className="text-xs">R (0-255)</Label>
                  <Input
                    id="r-value"
                    type="number"
                    min="0"
                    max="255"
                    value={rgbValues.r}
                    onChange={(e) => setRgbValues({...rgbValues, r: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="g-value" className="text-xs">G (0-255)</Label>
                  <Input
                    id="g-value"
                    type="number"
                    min="0"
                    max="255"
                    value={rgbValues.g}
                    onChange={(e) => setRgbValues({...rgbValues, g: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="b-value" className="text-xs">B (0-255)</Label>
                  <Input
                    id="b-value"
                    type="number"
                    min="0"
                    max="255"
                    value={rgbValues.b}
                    onChange={(e) => setRgbValues({...rgbValues, b: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <Button onClick={handleRgbSubmit} className="w-full">Agregar RGB</Button>
              <div 
                className="w-full h-8 rounded-lg border-2 border-border"
                style={{ backgroundColor: `rgb(${rgbValues.r}, ${rgbValues.g}, ${rgbValues.b})` }}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Subir Imagen</Label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Haz clic para subir</span> una imagen
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 10MB)</p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ColorInput;