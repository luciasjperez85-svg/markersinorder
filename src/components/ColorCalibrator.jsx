import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Settings, Target, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const ColorCalibrator = ({ selectedImage, onCalibrationApplied, isVisible }) => {
  const [calibrationPoints, setCalibrationPoints] = useState({
    black: null,
    white: null
  });
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationMatrix, setCalibrationMatrix] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const { toast } = useToast();

  // Initialize canvas when image changes
  React.useEffect(() => {
    if (selectedImage && isVisible && canvasRef.current) {
      loadImageToCanvas();
    }
  }, [selectedImage, isVisible]);

  const loadImageToCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size maintaining aspect ratio
      const maxSize = 600;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      imageRef.current = img;
    };
    
    img.src = selectedImage;
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));

    // Get color at clicked position
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(x - 2, y - 2, 5, 5);
    const color = getAverageColor(imageData.data);

    // Ask user what this point should be
    const pointType = prompt('¿Qué representa este punto?\n1. Negro (escribe "negro")\n2. Blanco (escribe "blanco")\n3. Cancelar (cualquier otra cosa)');
    
    if (pointType && (pointType.toLowerCase().includes('negro') || pointType.toLowerCase().includes('blanco'))) {
      const isBlack = pointType.toLowerCase().includes('negro');
      const newPoints = {
        ...calibrationPoints,
        [isBlack ? 'black' : 'white']: {
          x, y, color,
          target: isBlack ? '#000000' : '#FFFFFF'
        }
      };
      
      setCalibrationPoints(newPoints);
      drawCalibrationPoints(newPoints);
      
      toast({
        title: `Punto ${isBlack ? 'negro' : 'blanco'} marcado`,
        description: `Color detectado: ${color}`,
      });
    }
  };

  const getAverageColor = (pixels) => {
    let r = 0, g = 0, b = 0, count = 0;
    
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] > 200) { // Skip transparent
        r += pixels[i];
        g += pixels[i + 1];
        b += pixels[i + 2];
        count++;
      }
    }
    
    if (count === 0) return '#000000';
    
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    
    return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  };

  const drawCalibrationPoints = (points) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext('2d');
    
    // Redraw image
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    
    // Draw calibration points
    Object.entries(points).forEach(([type, point]) => {
      if (!point) return;
      
      const color = type === 'black' ? '#FF0000' : '#0000FF';
      const label = type === 'black' ? 'N' : 'B';
      
      // Draw circle
      ctx.beginPath();
      ctx.arc(point.x, point.y, 12, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, point.x, point.y + 5);
    });
  };

  const calculateCalibrationMatrix = () => {
    if (!calibrationPoints.black || !calibrationPoints.white) {
      toast({
        title: "Faltan puntos de calibración",
        description: "Necesitas marcar tanto el punto negro como el blanco",
        variant: "destructive"
      });
      return;
    }

    const blackDetected = hexToRgb(calibrationPoints.black.color);
    const whiteDetected = hexToRgb(calibrationPoints.white.color);
    const blackTarget = { r: 0, g: 0, b: 0 };
    const whiteTarget = { r: 255, g: 255, b: 255 };

    // Calculate linear transformation matrix
    const matrix = {
      r: {
        scale: (whiteTarget.r - blackTarget.r) / (whiteDetected.r - blackDetected.r),
        offset: blackTarget.r - blackDetected.r * ((whiteTarget.r - blackTarget.r) / (whiteDetected.r - blackDetected.r))
      },
      g: {
        scale: (whiteTarget.g - blackTarget.g) / (whiteDetected.g - blackDetected.g),
        offset: blackTarget.g - blackDetected.g * ((whiteTarget.g - blackTarget.g) / (whiteDetected.g - blackDetected.g))
      },
      b: {
        scale: (whiteTarget.b - blackTarget.b) / (whiteDetected.b - blackDetected.b),
        offset: blackTarget.b - blackDetected.b * ((whiteTarget.b - blackTarget.b) / (whiteDetected.b - blackDetected.b))
      }
    };

    setCalibrationMatrix(matrix);
    setIsCalibrated(true);
    
    toast({
      title: "Calibración calculada",
      description: "Matriz de corrección de color lista para aplicar",
    });
  };

  const applyCalibration = () => {
    if (!calibrationMatrix) {
      toast({
        title: "No hay calibración",
        description: "Primero calcula la matriz de calibración",
        variant: "destructive"
      });
      return;
    }

    onCalibrationApplied(calibrationMatrix);
    
    toast({
      title: "Calibración aplicada",
      description: "Los colores se corregirán automáticamente al extraerlos",
    });
  };

  const resetCalibration = () => {
    setCalibrationPoints({ black: null, white: null });
    setCalibrationMatrix(null);
    setIsCalibrated(false);
    onCalibrationApplied(null);
    
    if (canvasRef.current && imageRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(imageRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    
    toast({
      title: "Calibración reiniciada",
      description: "Puedes marcar nuevos puntos de referencia",
    });
  };

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  if (!isVisible || !selectedImage) {
    return null;
  }

  return (
    <Card className="w-full max-w-4xl mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Calibración de Color
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Marca un punto negro y un punto blanco para corregir la iluminación y balance de color
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Instrucciones
          </h4>
          <div className="text-sm space-y-1">
            <p>1. <strong>Busca un color negro</strong> en tu carta (o el más oscuro disponible)</p>
            <p>2. <strong>Haz clic sobre él</strong> y escribe "negro" cuando te lo pregunte</p>
            <p>3. <strong>Busca un color blanco</strong> en tu carta (o el más claro disponible)</p>
            <p>4. <strong>Haz clic sobre él</strong> y escribe "blanco" cuando te lo pregunte</p>
            <p>5. <strong>Calcula y aplica</strong> la calibración</p>
          </div>
        </div>

        {/* Canvas for point selection */}
        <div className="space-y-4">
          <div className="border border-border rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="w-full cursor-crosshair"
              style={{ maxHeight: '500px', display: 'block' }}
            />
          </div>
          
          {/* Status indicators */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-sm">
                Negro: {calibrationPoints.black ? 
                  <Badge variant="secondary">{calibrationPoints.black.color}</Badge> : 
                  'No marcado'
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-sm">
                Blanco: {calibrationPoints.white ? 
                  <Badge variant="secondary">{calibrationPoints.white.color}</Badge> : 
                  'No marcado'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={calculateCalibrationMatrix}
            disabled={!calibrationPoints.black || !calibrationPoints.white}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Calcular Calibración
          </Button>
          
          <Button 
            onClick={applyCalibration}
            disabled={!isCalibrated}
            variant={isCalibrated ? "default" : "secondary"}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Aplicar Calibración
          </Button>
          
          <Button 
            onClick={resetCalibration}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reiniciar
          </Button>
        </div>

        {/* Calibration status */}
        {isCalibrated && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-800">Calibración Lista</span>
            </div>
            <p className="text-sm text-green-700">
              La matriz de corrección está calculada. Cuando extraigas colores, se aplicará 
              automáticamente la corrección para obtener los colores verdaderos.
            </p>
          </div>
        )}

        {(!calibrationPoints.black || !calibrationPoints.white) && (
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="font-semibold text-amber-800">Marca los Puntos de Referencia</span>
            </div>
            <p className="text-sm text-amber-700">
              Para calibrar correctamente, necesitas marcar tanto un punto negro como un punto blanco 
              en tu carta de colores. Estos servirán de referencia para corregir toda la imagen.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Function to apply calibration to a color
export const applyCalibratedColor = (hex, calibrationMatrix) => {
  if (!calibrationMatrix) return hex;
  
  const rgb = hexToRgb(hex);
  
  const correctedR = Math.max(0, Math.min(255, Math.round(rgb.r * calibrationMatrix.r.scale + calibrationMatrix.r.offset)));
  const correctedG = Math.max(0, Math.min(255, Math.round(rgb.g * calibrationMatrix.g.scale + calibrationMatrix.g.offset)));
  const correctedB = Math.max(0, Math.min(255, Math.round(rgb.b * calibrationMatrix.b.scale + calibrationMatrix.b.offset)));
  
  return `#${[correctedR, correctedG, correctedB].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
};

const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

export default ColorCalibrator;