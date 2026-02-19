import React, { useState, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Camera, Upload, Zap, Settings, Download, MousePointer, Grid3X3, Hash } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const ColorExtractorFixed = ({ onExtractColors }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedColors, setExtractedColors] = useState([]);
  const [colorCount, setColorCount] = useState([50]);
  const [tolerance, setTolerance] = useState([15]);
  const [extractionMode, setExtractionMode] = useState('auto');
  const [selectedPoints, setSelectedPoints] = useState([]);
  const canvasRef = useRef(null);
  const displayCanvasRef = useRef(null);
  const { toast } = useToast();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen válida",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target.result);
      setExtractedColors([]);
      setSelectedPoints([]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
  };

  const colorDistance = (hex1, hex2) => {
    const r1 = parseInt(hex1.slice(1, 3), 16);
    const g1 = parseInt(hex1.slice(3, 5), 16);
    const b1 = parseInt(hex1.slice(5, 7), 16);
    
    const r2 = parseInt(hex2.slice(1, 3), 16);
    const g2 = parseInt(hex2.slice(3, 5), 16);
    const b2 = parseInt(hex2.slice(5, 7), 16);
    
    return Math.sqrt(
      Math.pow(r2 - r1, 2) + 
      Math.pow(g2 - g1, 2) + 
      Math.pow(b2 - b1, 2)
    );
  };

  const extractColorsAuto = (canvas, ctx) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const colorMap = new Map();

    // Sample pixels in a grid pattern
    const step = Math.max(4, Math.floor(Math.sqrt(canvas.width * canvas.height / 10000)));
    
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const i = (y * canvas.width + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        if (a < 200) continue; // Skip transparent

        const brightness = (r + g + b) / 3;
        if (brightness < 40 || brightness > 220) continue; // Skip too dark/light

        // Calculate saturation
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        
        if (saturation < 0.3) continue; // Skip low saturation

        const hex = rgbToHex(r, g, b);
        
        // Group similar colors
        let foundSimilar = false;
        for (const [existingHex, count] of colorMap) {
          if (colorDistance(hex, existingHex) < tolerance[0]) {
            colorMap.set(existingHex, count + 1);
            foundSimilar = true;
            break;
          }
        }
        
        if (!foundSimilar) {
          colorMap.set(hex, 1);
        }
      }
    }

    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, colorCount[0])
      .map(([hex, count], index) => ({
        id: Date.now() + index + Math.random(),
        hex: hex,
        name: `Rotulador ${String(index + 1).padStart(3, '0')}`,
        source: 'auto',
        frequency: count
      }));
  };

  const extractColorsGrid = (canvas, ctx) => {
    const colors = [];
    const gridCols = Math.ceil(Math.sqrt(colorCount[0]));
    const gridRows = Math.ceil(colorCount[0] / gridCols);
    const cellWidth = canvas.width / gridCols;
    const cellHeight = canvas.height / gridRows;

    for (let row = 0; row < gridRows && colors.length < colorCount[0]; row++) {
      for (let col = 0; col < gridCols && colors.length < colorCount[0]; col++) {
        const centerX = Math.floor(col * cellWidth + cellWidth / 2);
        const centerY = Math.floor(row * cellHeight + cellHeight / 2);
        
        // Sample a small area around the center
        const sampleSize = Math.min(cellWidth, cellHeight) / 6;
        const color = getAverageColorInArea(ctx, centerX, centerY, sampleSize);
        
        if (color) {
          colors.push({
            id: Date.now() + colors.length + Math.random(),
            hex: color,
            name: `Rotulador ${String(colors.length + 1).padStart(3, '0')}`,
            source: 'grid',
            position: { row: row + 1, col: col + 1 }
          });
        }
      }
    }

    return colors;
  };

  const getAverageColorInArea = (ctx, centerX, centerY, radius) => {
    try {
      const size = Math.floor(radius * 2);
      const startX = Math.max(0, centerX - radius);
      const startY = Math.max(0, centerY - radius);
      
      const imageData = ctx.getImageData(startX, startY, size, size);
      const pixels = imageData.data;
      
      let totalR = 0, totalG = 0, totalB = 0, count = 0;

      for (let i = 0; i < pixels.length; i += 4) {
        const a = pixels[i + 3];
        if (a > 200) {
          totalR += pixels[i];
          totalG += pixels[i + 1];
          totalB += pixels[i + 2];
          count++;
        }
      }

      if (count === 0) return null;

      const avgR = Math.round(totalR / count);
      const avgG = Math.round(totalG / count);
      const avgB = Math.round(totalB / count);

      // Validate color
      const brightness = (avgR + avgG + avgB) / 3;
      if (brightness < 30 || brightness > 230) return null;

      return rgbToHex(avgR, avgG, avgB);
    } catch (error) {
      console.error('Error getting color:', error);
      return null;
    }
  };

  const handleCanvasClick = useCallback((e) => {
    if (extractionMode !== 'manual' || !displayCanvasRef.current) return;

    const canvas = displayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    const colorNumber = prompt('Ingresa el número del rotulador:');
    
    if (colorNumber && colorNumber.trim()) {
      const ctx = canvas.getContext('2d');
      const color = getAverageColorInArea(ctx, x, y, 8);
      
      if (color) {
        const newPoint = {
          x,
          y,
          number: colorNumber.trim(),
          hex: color
        };
        
        setSelectedPoints(prev => [...prev, newPoint]);
        
        // Redraw canvas with new point
        drawCanvasWithPoints();
      } else {
        toast({
          title: "Error",
          description: "No se pudo obtener el color en esa posición",
          variant: "destructive"
        });
      }
    }
  }, [extractionMode, toast]);

  const drawCanvasWithPoints = useCallback(() => {
    if (!selectedImage || !displayCanvasRef.current) return;

    const canvas = displayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate canvas size maintaining aspect ratio
      const maxSize = 500;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw points
      selectedPoints.forEach((point) => {
        const displayX = (point.x / img.width) * canvas.width;
        const displayY = (point.y / img.height) * canvas.height;

        // Draw circle
        ctx.beginPath();
        ctx.arc(displayX, displayY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw number
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(point.number, displayX, displayY + 3);
      });
    };

    img.src = selectedImage;
  }, [selectedImage, selectedPoints]);

  React.useEffect(() => {
    if (extractionMode === 'manual' && selectedImage) {
      drawCanvasWithPoints();
    }
  }, [extractionMode, selectedImage, selectedPoints, drawCanvasWithPoints]);

  const extractColorsFromImage = async () => {
    if (!selectedImage) return;
    if (extractionMode === 'manual' && selectedPoints.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un color haciendo clic en la imagen",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        let colors = [];

        if (extractionMode === 'auto') {
          colors = extractColorsAuto(canvas, ctx);
        } else if (extractionMode === 'grid') {
          colors = extractColorsGrid(canvas, ctx);
        } else if (extractionMode === 'manual') {
          colors = selectedPoints.map((point, index) => ({
            id: Date.now() + index + Math.random(),
            hex: point.hex,
            name: `Rotulador ${point.number}`,
            source: 'manual',
            position: point
          }));
        }

        setExtractedColors(colors);
        setIsProcessing(false);

        toast({
          title: "¡Extracción completada!",
          description: `Se extrajeron ${colors.length} colores`,
        });
      };

      img.src = selectedImage;
    } catch (error) {
      console.error('Error extracting colors:', error);
      toast({
        title: "Error",
        description: "Error al extraer colores de la imagen",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const addExtractedColors = () => {
    if (extractedColors.length > 0) {
      onExtractColors(extractedColors);
      toast({
        title: "Colores agregados",
        description: `Se agregaron ${extractedColors.length} colores a tu colección`,
      });
      
      setExtractedColors([]);
      setSelectedPoints([]);
      setSelectedImage(null);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Extractor de Colores de Carta (Mejorado)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sube tu carta de colores y extrae los colores con sus números identificadores
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Image Upload */}
        <div className="space-y-4">
          <Label htmlFor="image-upload" className="text-base font-medium flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Subir Carta de Colores
          </Label>
          
          <div className="flex items-center justify-center w-full">
            <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Haz clic para subir</span> tu carta de colores
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, JPEG (MAX. 10MB)</p>
              </div>
              <input
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </div>

        {/* Extraction Mode Selection */}
        {selectedImage && (
          <div className="space-y-4">
            <Label className="text-base font-medium">Método de Extracción</Label>
            <Tabs value={extractionMode} onValueChange={setExtractionMode} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="auto">🔄 Automático</TabsTrigger>
                <TabsTrigger value="grid">📊 Cuadrícula</TabsTrigger>
                <TabsTrigger value="manual">🎯 Manual</TabsTrigger>
              </TabsList>
              
              <TabsContent value="auto" className="mt-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Extracción Automática</p>
                  <p className="text-xs text-muted-foreground">
                    Detecta automáticamente los colores más saturados evitando fondos y sombras.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="grid" className="mt-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Extracción por Cuadrícula</p>
                  <p className="text-xs text-muted-foreground">
                    Divide la imagen en celdas y extrae un color del centro de cada una. Ideal para cartas organizadas.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="manual" className="mt-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Selección Manual</p>
                  <p className="text-xs text-muted-foreground">
                    Haz clic directamente sobre cada color e ingresa su número identificador.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Image Preview and Settings */}
        {selectedImage && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Vista Previa</Label>
                {extractionMode === 'manual' && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MousePointer className="h-3 w-3" />
                    Haz clic en colores
                  </Badge>
                )}
              </div>
              
              <div className="border border-border rounded-lg overflow-hidden bg-white">
                {extractionMode === 'manual' ? (
                  <canvas
                    ref={displayCanvasRef}
                    onClick={handleCanvasClick}
                    className="w-full cursor-crosshair"
                    style={{ maxHeight: '400px', display: 'block' }}
                  />
                ) : (
                  <img
                    src={selectedImage}
                    alt="Carta de colores"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                )}
              </div>
              
              {extractionMode === 'manual' && selectedPoints.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Colores Seleccionados: {selectedPoints.length}
                  </Label>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {selectedPoints.map((point, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{point.number}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPoints([])}
                    className="w-full"
                  >
                    Limpiar Selecciones
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {extractionMode !== 'manual' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <Label className="text-base font-medium">Configuración</Label>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">
                        Número de colores: <Badge variant="secondary">{colorCount[0]}</Badge>
                      </Label>
                      <Slider
                        value={colorCount}
                        onValueChange={setColorCount}
                        max={300}
                        min={10}
                        step={10}
                        className="w-full"
                      />
                    </div>

                    {extractionMode === 'auto' && (
                      <div className="space-y-2">
                        <Label className="text-sm">
                          Tolerancia: <Badge variant="secondary">{tolerance[0]}</Badge>
                        </Label>
                        <Slider
                          value={tolerance}
                          onValueChange={setTolerance}
                          max={50}
                          min={5}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={extractColorsFromImage}
                disabled={isProcessing || (extractionMode === 'manual' && selectedPoints.length === 0)}
                className="w-full flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {isProcessing ? 'Extrayendo...' : 
                 extractionMode === 'manual' ? `Extraer ${selectedPoints.length} Colores` : 
                 'Extraer Colores'}
              </Button>
              
              {extractionMode === 'manual' && selectedPoints.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Haz clic en la imagen para seleccionar colores
                </p>
              )}
            </div>
          </div>
        )}

        {/* Canvas for processing (hidden) */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Extracted Colors Preview */}
        {extractedColors.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">
                Colores Extraídos ({extractedColors.length})
              </Label>
              <Button
                onClick={addExtractedColors}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Agregar a Colección
              </Button>
            </div>

            {/* Color grid preview */}
            <div className="grid grid-cols-8 sm:grid-cols-12 lg:grid-cols-16 gap-2">
              {extractedColors.map((color) => (
                <div
                  key={color.id}
                  className="aspect-square rounded cursor-pointer hover:scale-110 transition-transform shadow-sm border border-border"
                  style={{ backgroundColor: color.hex }}
                  title={`${color.name} - ${color.hex}`}
                />
              ))}
            </div>

            {/* Color list */}
            <div className="max-h-40 overflow-y-auto space-y-1">
              {extractedColors.map((color, index) => (
                <div key={color.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                  <div 
                    className="w-6 h-6 rounded border" 
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="font-mono">{color.hex}</span>
                  <span className="font-medium">{color.name}</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {color.source}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ColorExtractorFixed;