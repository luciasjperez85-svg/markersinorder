import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Camera, Upload, Zap, Settings, Download, MousePointer, Grid3X3, Hash } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const ColorExtractor = ({ onExtractColors }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedColors, setExtractedColors] = useState([]);
  const [colorCount, setColorCount] = useState([50]); // Slider value as array
  const [tolerance, setTolerance] = useState([15]); // Color similarity tolerance
  const [extractionMode, setExtractionMode] = useState('auto'); // auto, manual, grid
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [showImageCanvas, setShowImageCanvas] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
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
      setShowImageCanvas(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle canvas clicks for manual selection
  const handleCanvasClick = (e) => {
    if (extractionMode !== 'manual') return;

    const canvas = displayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Prompt for color number
    const colorNumber = prompt(`Ingresa el número del rotulador en esta posición:`);
    
    if (colorNumber) {
      const newPoint = {
        x: Math.round(x),
        y: Math.round(y),
        number: colorNumber.trim()
      };
      
      setSelectedPoints(prev => [...prev, newPoint]);
    }
  };

  // Draw the image and selection points on display canvas
  const drawImageWithPoints = () => {
    if (!selectedImage || !displayCanvasRef.current) return;

    const canvas = displayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Set canvas size
      const maxDisplaySize = 600;
      const ratio = Math.min(maxDisplaySize / img.width, maxDisplaySize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw selection points
      selectedPoints.forEach((point, index) => {
        const displayX = (point.x / img.width) * canvas.width;
        const displayY = (point.y / img.height) * canvas.height;

        // Draw circle
        ctx.beginPath();
        ctx.arc(displayX, displayY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw number
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(point.number || (index + 1), displayX, displayY + 4);
      });
    };

    img.src = selectedImage;
  };

  // Update display when points change
  React.useEffect(() => {
    if (showImageCanvas) {
      drawImageWithPoints();
    }
  }, [selectedPoints, showImageCanvas, selectedImage]);

  const clearSelections = () => {
    setSelectedPoints([]);
  };

  const extractColorsFromImage = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set canvas size to maintain aspect ratio
        const maxSize = 1200;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        let colors = [];
        
        if (extractionMode === 'auto') {
          // Improved automatic extraction
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          colors = extractColorsImproved(imageData.data, canvas.width, canvas.height, colorCount[0], tolerance[0]);
        } else if (extractionMode === 'grid') {
          // Grid-based extraction for organized color charts
          colors = extractColorsGrid(ctx, canvas.width, canvas.height, colorCount[0]);
        } else if (extractionMode === 'manual' && selectedPoints.length > 0) {
          // Manual point-based extraction
          colors = extractColorsFromPoints(ctx, selectedPoints);
        }
        
        setExtractedColors(colors);
        setIsProcessing(false);
        
        toast({
          title: "¡Extracción completada!",
          description: `Se extrajeron ${colors.length} colores de la carta`,
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

  // Improved color extraction algorithm
  const extractColorsImproved = (pixels, width, height, numColors, toleranceValue) => {
    const colorMap = new Map();
    const saturationThreshold = 0.3; // Filter out desaturated colors
    const brightnessMin = 40;
    const brightnessMax = 220;

    // Sample in a grid pattern for better coverage
    const stepSize = Math.max(4, Math.floor(Math.sqrt((width * height) / (numColors * 50))));
    
    for (let y = 0; y < height; y += stepSize) {
      for (let x = 0; x < width; x += stepSize) {
        const i = (y * width + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        // Skip transparent pixels
        if (a < 200) continue;

        const brightness = (r + g + b) / 3;
        if (brightness < brightnessMin || brightness > brightnessMax) continue;

        // Calculate saturation
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        
        // Skip low saturation colors (grays, whites, etc.)
        if (saturation < saturationThreshold) continue;

        const hex = rgbToHex(r, g, b);
        
        // Group similar colors
        let foundSimilar = false;
        for (const [existingHex, data] of colorMap) {
          if (colorDistance(hex, existingHex) < toleranceValue) {
            data.count++;
            foundSimilar = true;
            break;
          }
        }
        
        if (!foundSimilar) {
          colorMap.set(hex, { count: 1, saturation, brightness });
        }
      }
    }

    // Sort by count and saturation, prefer more saturated colors
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => {
        const scoreA = a[1].count * (1 + a[1].saturation);
        const scoreB = b[1].count * (1 + b[1].saturation);
        return scoreB - scoreA;
      })
      .slice(0, numColors)
      .map(([hex, data], index) => ({
        id: Date.now() + index + Math.random(),
        hex: hex,
        name: `Rotulador ${String(index + 1).padStart(3, '0')}`,
        source: 'extracted',
        frequency: data.count,
        saturation: Math.round(data.saturation * 100)
      }));

    return sortedColors;
  };

  // Grid-based extraction for organized color charts
  const extractColorsGrid = (ctx, width, height, numColors) => {
    const colors = [];
    const gridSize = Math.ceil(Math.sqrt(numColors));
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;

    for (let row = 0; row < gridSize && colors.length < numColors; row++) {
      for (let col = 0; col < gridSize && colors.length < numColors; col++) {
        // Sample from center of each grid cell
        const x = Math.floor(col * cellWidth + cellWidth / 2);
        const y = Math.floor(row * cellHeight + cellHeight / 2);
        
        // Average colors in a small area around the center point
        const sampleSize = Math.min(cellWidth, cellHeight) / 4;
        const color = getAverageColorInArea(ctx, x, y, sampleSize);
        
        if (color && isValidColor(color)) {
          colors.push({
            id: Date.now() + colors.length + Math.random(),
            hex: color,
            name: `Rotulador ${String(colors.length + 1).padStart(3, '0')}`,
            source: 'grid',
            position: { row, col }
          });
        }
      }
    }

    return colors;
  };

  // Extract colors from manually selected points
  const extractColorsFromPoints = (ctx, points) => {
    return points.map((point, index) => {
      const color = getAverageColorInArea(ctx, point.x, point.y, 10);
      return {
        id: Date.now() + index + Math.random(),
        hex: color,
        name: point.number || `Rotulador ${String(index + 1).padStart(3, '0')}`,
        source: 'manual',
        position: point
      };
    }).filter(color => isValidColor(color.hex));
  };

  // Get average color in a circular area
  const getAverageColorInArea = (ctx, centerX, centerY, radius) => {
    const imageData = ctx.getImageData(
      Math.max(0, centerX - radius),
      Math.max(0, centerY - radius),
      radius * 2,
      radius * 2
    );

    let totalR = 0, totalG = 0, totalB = 0, count = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
      const a = imageData.data[i + 3];
      if (a > 200) { // Skip transparent pixels
        totalR += imageData.data[i];
        totalG += imageData.data[i + 1];
        totalB += imageData.data[i + 2];
        count++;
      }
    }

    if (count === 0) return null;

    const avgR = Math.round(totalR / count);
    const avgG = Math.round(totalG / count);
    const avgB = Math.round(totalB / count);

    return rgbToHex(avgR, avgG, avgB);
  };

  // Validate if color is suitable (not too dark, light, or desaturated)
  const isValidColor = (hex) => {
    if (!hex) return false;
    
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const brightness = (r + g + b) / 3;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    
    return brightness > 30 && brightness < 230 && saturation > 0.2;
  };

  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
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

  const addExtractedColors = () => {
    if (extractedColors.length > 0) {
      onExtractColors(extractedColors);
      toast({
        title: "Colores agregados",
        description: `Se agregaron ${extractedColors.length} colores a tu colección`,
      });
      
      // Reset state
      setExtractedColors([]);
      setSelectedImage(null);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Extractor de Colores de Carta
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sube una foto de tu carta de colores y extrae automáticamente hasta 300 colores de rotuladores
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
            <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-border border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-4 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Haz clic para subir</span> tu carta de colores
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, JPEG (MAX. 10MB) - Asegúrate de que los números sean legibles</p>
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
                <TabsTrigger value="auto">Automático</TabsTrigger>
                <TabsTrigger value="grid">Cuadrícula</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>
              
              <TabsContent value="auto" className="mt-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Automático:</strong> Detecta automáticamente los colores más saturados y prominentes de la carta.
                    Ideal para cartas con colores bien separados.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="grid" className="mt-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Cuadrícula:</strong> Divide la imagen en una cuadrícula y extrae un color de cada celda.
                    Perfecto para cartas organizadas en filas y columnas regulares.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="manual" className="mt-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Manual:</strong> Haz clic directamente sobre cada color para seleccionarlo.
                    Te permitirá ingresar el número identificador de cada rotulador.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Image Preview and Settings */}
        {selectedImage && showImageCanvas && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Vista Previa</Label>
                {extractionMode === 'manual' && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MousePointer className="h-3 w-3" />
                    Haz clic en los colores
                  </Badge>
                )}
              </div>
              <div className="border border-border rounded-lg overflow-hidden bg-white">
                {extractionMode === 'manual' ? (
                  <canvas
                    ref={displayCanvasRef}
                    onClick={handleCanvasClick}
                    className="w-full cursor-crosshair"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                  />
                ) : (
                  <img
                    ref={imageRef}
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
                  <div className="flex flex-wrap gap-1">
                    {selectedPoints.map((point, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{point.number}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelections}
                    className="w-full"
                  >
                    Limpiar Selecciones
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-6">
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
                    <p className="text-xs text-muted-foreground">
                      Cuántos colores extraer (10-300)
                    </p>
                  </div>

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
                    <p className="text-xs text-muted-foreground">
                      Sensibilidad para agrupar colores similares
                    </p>
                  </div>
                </div>

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
          </div>
        )}

        {/* Canvas for image processing (hidden) */}
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
                  title={`${color.hex} (freq: ${color.frequency})`}
                />
              ))}
            </div>

            {/* Gradient preview */}
            <div 
              className="w-full h-12 rounded-lg border border-border"
              style={{
                background: `linear-gradient(to right, ${extractedColors.map(c => c.hex).join(', ')})`
              }}
            />

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Tip:</strong> Los colores se extraen automáticamente de tu carta. 
                Ajusta la tolerancia si ves colores muy similares duplicados, o aumenta 
                el número de colores si faltan algunos de tu carta.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ColorExtractor;