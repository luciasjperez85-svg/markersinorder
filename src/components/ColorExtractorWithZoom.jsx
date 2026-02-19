import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Camera, Upload, Zap, Download, ZoomIn, ZoomOut, RotateCcw, Trash2, Sliders, CheckCircle, RefreshCw, Target } from 'lucide-react';
import { applyCalibratedColor } from './ColorCalibrator';
import { useToast } from '../hooks/use-toast';

const ColorExtractorWithZoom = ({ onExtractColors }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedColors, setExtractedColors] = useState([]);
  const extractionMode = 'manual'; // Always manual mode
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageReady, setImageReady] = useState(false); // Track if image loaded successfully
  const [isCalibrating, setIsCalibrating] = useState(false); // CALIBRATION MODE
  const [calibrationMatrix, setCalibrationMatrix] = useState(null);
  
  // Calibration points - integrated into main component
  const [calibrationPoints, setCalibrationPoints] = useState({
    black: null,
    white: null
  });
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imageObj = useRef(null);
  const { toast } = useToast();

  // Store image display info for coordinate conversion
  const [imageDisplayInfo, setImageDisplayInfo] = useState(null);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj.current || !imageObj.current.complete) return;
    
    const ctx = canvas.getContext('2d');
    const img = imageObj.current;
    
    try {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate image dimensions to fit canvas while maintaining aspect ratio
      const canvasAspect = canvas.width / canvas.height;
      const imgAspect = img.width / img.height;
      
      let baseWidth, baseHeight;
      if (imgAspect > canvasAspect) {
        baseWidth = canvas.width;
        baseHeight = canvas.width / imgAspect;
      } else {
        baseWidth = canvas.height * imgAspect;
        baseHeight = canvas.height;
      }
      
      // Apply zoom
      const drawWidth = baseWidth * zoom;
      const drawHeight = baseHeight * zoom;
      
      // Calculate position with pan
      const x = (canvas.width - drawWidth) / 2 + pan.x;
      const y = (canvas.height - drawHeight) / 2 + pan.y;
      
      // Store display info for coordinate conversion
      setImageDisplayInfo({
        x,
        y,
        width: drawWidth,
        height: drawHeight,
        originalWidth: img.width,
        originalHeight: img.height
      });
      
      // Draw image
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      
      // Draw selected color points (only in normal mode)
      if (extractionMode === 'manual' && !isCalibrating) {
        selectedPoints.forEach((point) => {
          const canvasX = x + (point.x / img.width) * drawWidth;
          const canvasY = y + (point.y / img.height) * drawHeight;
          
          ctx.beginPath();
          ctx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(point.number, canvasX, canvasY + 4);
        });
      }
      
      // Draw calibration points (always visible when they exist)
      if (calibrationPoints.black) {
        const canvasX = x + (calibrationPoints.black.x / img.width) * drawWidth;
        const canvasY = y + (calibrationPoints.black.y / img.height) * drawHeight;
        
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 12, 0, 2 * Math.PI);
        ctx.fillStyle = '#FF0000';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('N', canvasX, canvasY + 5);
      }
      
      if (calibrationPoints.white) {
        const canvasX = x + (calibrationPoints.white.x / img.width) * drawWidth;
        const canvasY = y + (calibrationPoints.white.y / img.height) * drawHeight;
        
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 12, 0, 2 * Math.PI);
        ctx.fillStyle = '#0000FF';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('B', canvasX, canvasY + 5);
      }
    } catch (error) {
      console.error('Error drawing canvas:', error);
    }
  }, [zoom, pan, selectedPoints, extractionMode, isCalibrating, calibrationPoints]);

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (!canvas || !container || !selectedImage) return;
    
    setImageLoading(true);
    setImageReady(false);
    setImageDisplayInfo(null);
    
    // Get container dimensions for responsive canvas
    const containerRect = container.getBoundingClientRect();
    const containerWidth = Math.min(containerRect.width, 1200);
    const containerHeight = Math.min(containerRect.height || 600, 600);
    
    // Set canvas dimensions based on container (maintain 4:3 aspect ratio as default)
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    // Create and load image
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      console.log(`Image loaded: ${img.width} x ${img.height}`);
      imageObj.current = img;
      setImageLoading(false);
      setImageReady(true);
      
      // Force immediate draw after state update
      requestAnimationFrame(() => {
        drawCanvas();
      });
    };
    
    img.onerror = (error) => {
      console.error('Failed to load image:', error);
      setImageLoading(false);
      setImageReady(false);
      toast({
        title: "Error de carga",
        description: "No se pudo cargar la imagen. Intenta subirla de nuevo.",
        variant: "destructive"
      });
    };
    
    // Start loading
    img.src = selectedImage;
  }, [selectedImage, toast, drawCanvas]);

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
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Initialize canvas and image
  useEffect(() => {
    if (selectedImage && extractionMode === 'manual') {
      initializeCanvas();
    }
  }, [selectedImage, extractionMode, initializeCanvas]);

  // Redraw canvas when zoom, pan, or points change
  useEffect(() => {
    if (imageObj.current && imageObj.current.complete && extractionMode === 'manual') {
      drawCanvas();
    }
  }, [zoom, pan, selectedPoints, extractionMode, drawCanvas, calibrationPoints, isCalibrating]);

  // Mobile-friendly color picker dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [dialogColor, setDialogColor] = useState('');
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
  const [inputNumber, setInputNumber] = useState('');

  const showColorPickerDialog = (color, x, y) => {
    setDialogColor(color);
    setDialogPosition({ x, y });
    setInputNumber('');
    setShowDialog(true);
  };

  const handleCanvasClick = (e) => {
    if (extractionMode !== 'manual' || isDragging || !imageDisplayInfo) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    if (!canvas || !imageObj.current) return;
    
    // Get coordinates from touch or mouse event
    let clickX, clickY;
    if (e.touches && e.touches.length > 0) {
      clickX = e.touches[0].clientX - rect.left;
      clickY = e.touches[0].clientY - rect.top;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clickX = e.changedTouches[0].clientX - rect.left;
      clickY = e.changedTouches[0].clientY - rect.top;
    } else {
      clickX = e.clientX - rect.left;
      clickY = e.clientY - rect.top;
    }
    
    // Scale click coordinates to canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = clickX * scaleX;
    const canvasY = clickY * scaleY;
    
    // Check if click is within image bounds using stored display info
    const { x: imgX, y: imgY, width: imgWidth, height: imgHeight } = imageDisplayInfo;
    
    if (canvasX < imgX || canvasX > imgX + imgWidth || canvasY < imgY || canvasY > imgY + imgHeight) {
      toast({
        title: "Fuera de la imagen",
        description: isCalibrating ? "Haz clic dentro de la imagen para calibrar" : "Haz clic dentro de la imagen para seleccionar un color",
        variant: "destructive"
      });
      return;
    }
    
    // Convert canvas coordinates to original image coordinates
    const imageX = Math.round(((canvasX - imgX) / imgWidth) * imageDisplayInfo.originalWidth);
    const imageY = Math.round(((canvasY - imgY) / imgHeight) * imageDisplayInfo.originalHeight);
    
    // Ensure coordinates are within bounds
    const finalImageX = Math.max(0, Math.min(imageDisplayInfo.originalWidth - 1, imageX));
    const finalImageY = Math.max(0, Math.min(imageDisplayInfo.originalHeight - 1, imageY));
    
    // Get color at this position
    let color = getColorAtPosition(finalImageX, finalImageY);
    if (!color) {
      toast({
        title: "Error",
        description: "No se pudo obtener el color en esa posición",
        variant: "destructive"
      });
      return;
    }
    
    // ============ CALIBRATION MODE ============
    if (isCalibrating) {
      // Ask user what this point represents
      const pointType = prompt('¿Qué representa este punto?\n\nEscribe exactamente:\n- "negro" para el punto más oscuro\n- "blanco" para el punto más claro\n- cualquier otra cosa para cancelar');
      
      if (pointType && (pointType.toLowerCase().trim() === 'negro' || pointType.toLowerCase().trim() === 'blanco')) {
        const isBlack = pointType.toLowerCase().trim() === 'negro';
        
        setCalibrationPoints(prev => ({
          ...prev,
          [isBlack ? 'black' : 'white']: {
            x: finalImageX,
            y: finalImageY,
            color: color,
            target: isBlack ? '#000000' : '#FFFFFF'
          }
        }));
        
        toast({
          title: `Punto ${isBlack ? 'negro' : 'blanco'} marcado`,
          description: `Color detectado: ${color}`,
        });
      }
      return;
    }
    
    // ============ NORMAL COLOR SELECTION MODE ============
    // Apply calibration if available
    if (calibrationMatrix) {
      const originalColor = color;
      color = applyCalibratedColor(color, calibrationMatrix);
      console.log(`Color calibrado: ${originalColor} → ${color}`);
    }
    
    // Show color picker dialog (mobile-friendly)
    showColorPickerDialog(color, finalImageX, finalImageY);
  };

  const getColorAtPosition = (x, y) => {
    if (!imageObj.current) return null;
    
    // Create a temporary canvas with the original image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const img = imageObj.current;
    
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    
    try {
      // Draw the original image at full resolution
      tempCtx.drawImage(img, 0, 0);
      
      // Sample area size (3x3 for better accuracy)
      const sampleSize = 3;
      const halfSize = Math.floor(sampleSize / 2);
      
      // Ensure sampling area is within image bounds
      const startX = Math.max(0, x - halfSize);
      const startY = Math.max(0, y - halfSize);
      const endX = Math.min(img.width, x + halfSize + 1);
      const endY = Math.min(img.height, y + halfSize + 1);
      const actualWidth = endX - startX;
      const actualHeight = endY - startY;
      
      if (actualWidth <= 0 || actualHeight <= 0) return null;
      
      // Get image data for the sampling area
      const imageData = tempCtx.getImageData(startX, startY, actualWidth, actualHeight);
      const data = imageData.data;
      
      let totalR = 0, totalG = 0, totalB = 0, count = 0;
      
      // Average the colors in the sampling area
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 128) { // Only count non-transparent pixels
          totalR += data[i];
          totalG += data[i + 1];
          totalB += data[i + 2];
          count++;
        }
      }
      
      if (count === 0) return null;
      
      const avgR = Math.round(totalR / count);
      const avgG = Math.round(totalG / count);
      const avgB = Math.round(totalB / count);
      
      // Convert to hex
      const hex = `#${[avgR, avgG, avgB].map(channel => {
        const hexValue = channel.toString(16);
        return hexValue.length === 1 ? '0' + hexValue : hexValue;
      }).join('').toUpperCase()}`;
      
      console.log(`Color at (${x}, ${y}): RGB(${avgR}, ${avgG}, ${avgB}) = ${hex}`);
      
      return hex;
    } catch (error) {
      console.error('Error getting color at position:', error);
      return null;
    }
  };

  // Mouse and Touch event handlers
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [touchStartTime, setTouchStartTime] = useState(0);

  const getEventPosition = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = (e) => {
    if (extractionMode !== 'manual') return;
    
    e.preventDefault();
    setTouchStartTime(Date.now());
    
    if (e.touches && e.touches.length === 2) {
      // Two finger touch - prepare for pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setLastTouchDistance(distance);
    } else {
      // Single touch/click
      const pos = getEventPosition(e);
      setIsDragging(false);
      setDragStart({ x: pos.x - pan.x, y: pos.y - pan.y });
    }
  };

  const handlePointerMove = (e) => {
    if (extractionMode !== 'manual') return;
    
    e.preventDefault();
    
    if (e.touches && e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (lastTouchDistance > 0) {
        const scale = distance / lastTouchDistance;
        setZoom(prev => Math.max(0.5, Math.min(5, prev * scale)));
      }
      setLastTouchDistance(distance);
    } else if (e.touches && e.touches.length === 1) {
      // Single touch pan
      const pos = getEventPosition(e);
      const newPan = {
        x: pos.x - dragStart.x,
        y: pos.y - dragStart.y
      };
      setPan(newPan);
      setIsDragging(true);
    } else if (e.buttons === 1) {
      // Mouse drag
      const pos = getEventPosition(e);
      const newPan = {
        x: pos.x - dragStart.x,
        y: pos.y - dragStart.y
      };
      setPan(newPan);
      setIsDragging(true);
    }
  };

  const handlePointerUp = (e) => {
    if (extractionMode !== 'manual') return;
    
    const now = Date.now();
    const touchDuration = now - touchStartTime;
    setLastTouchDistance(0);
    
    // Small delay to distinguish between tap and drag
    const wasDragging = isDragging;
    setTimeout(() => {
      if (touchDuration < 500 && !wasDragging) {
        // It was a quick tap/click, not a drag
        handleCanvasClick(e);
      }
      setIsDragging(false);
    }, 50);
  };

  const handleWheel = (e) => {
    if (extractionMode === 'manual') {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.5, Math.min(5, prev + delta)));
    }
  };

  const confirmColorSelection = () => {
    if (inputNumber.trim()) {
      const newPoint = {
        x: dialogPosition.x,
        y: dialogPosition.y,
        number: inputNumber.trim(),
        hex: dialogColor
      };
      
      setSelectedPoints(prev => [...prev, newPoint]);
      setShowDialog(false);
      
      toast({
        title: "Color agregado",
        description: `Rotulador #${inputNumber.trim()} - ${dialogColor}`,
      });
    }
  };

  const removeSelectedPoint = (indexToRemove) => {
    setSelectedPoints(prev => prev.filter((_, index) => index !== indexToRemove));
    toast({
      title: "Color eliminado",
      description: "Color removido de la selección",
    });
  };

  const zoomIn = () => setZoom(prev => Math.min(5, prev + 0.2));
  const zoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.2));
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Calibration functions
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
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
        scale: (whiteTarget.r - blackTarget.r) / Math.max(1, (whiteDetected.r - blackDetected.r)),
        offset: blackTarget.r - blackDetected.r * ((whiteTarget.r - blackTarget.r) / Math.max(1, (whiteDetected.r - blackDetected.r)))
      },
      g: {
        scale: (whiteTarget.g - blackTarget.g) / Math.max(1, (whiteDetected.g - blackDetected.g)),
        offset: blackTarget.g - blackDetected.g * ((whiteTarget.g - blackTarget.g) / Math.max(1, (whiteDetected.g - blackDetected.g)))
      },
      b: {
        scale: (whiteTarget.b - blackTarget.b) / Math.max(1, (whiteDetected.b - blackDetected.b)),
        offset: blackTarget.b - blackDetected.b * ((whiteTarget.b - blackTarget.b) / Math.max(1, (whiteDetected.b - blackDetected.b)))
      }
    };

    setCalibrationMatrix(matrix);
    setIsCalibrating(false);
    
    toast({
      title: "Calibración aplicada",
      description: "Los colores se corregirán automáticamente al extraerlos",
    });
  };

  const resetCalibration = () => {
    setCalibrationPoints({ black: null, white: null });
    setCalibrationMatrix(null);
    setIsCalibrating(false);
    
    toast({
      title: "Calibración reiniciada",
      description: "Puedes marcar nuevos puntos de referencia",
    });
  };

  const forceReloadImage = () => {
    if (selectedImage && extractionMode === 'manual') {
      setImageLoading(true);
      setImageReady(false);
      // Force reload by adding timestamp
      const img = new Image();
      img.onload = () => {
        imageObj.current = img;
        setImageLoading(false);
        setImageReady(true);
        drawCanvas();
      };
      img.onerror = () => {
        setImageLoading(false);
        setImageReady(false);
        toast({
          title: "Error",
          description: "No se pudo recargar la imagen",
          variant: "destructive"
        });
      };
      img.src = selectedImage + '?t=' + Date.now();
    }
  };

  const extractColorsFromImage = async () => {
    if (!selectedImage || selectedPoints.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un color haciendo clic en la imagen",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const colors = selectedPoints.map((point, index) => ({
        id: Date.now() + index + Math.random(),
        hex: point.hex,
        name: `Rotulador ${point.number}`,
        source: 'manual',
        position: point
      }));

      setExtractedColors(colors);
      setIsProcessing(false);

      toast({
        title: "¡Extracción completada!",
        description: `Se extrajeron ${colors.length} colores`,
      });
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
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Extractor de Colores con Zoom
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sube tu carta, amplía la imagen y selecciona cada color con su número
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
                <p className="text-xs text-muted-foreground">PNG, JPG, JPEG - Resolución alta recomendada</p>
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

        {/* Manual Mode Info */}
        {selectedImage && (
          <div className="space-y-4">
            {/* Mode indicator */}
            {isCalibrating ? (
              <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-400">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-800">Modo Calibración Activo</h4>
                </div>
                <p className="text-sm text-purple-700 mb-3">
                  Haz clic en la imagen para marcar los puntos de referencia negro y blanco.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={calibrationPoints.black ? "default" : "outline"} className={calibrationPoints.black ? "bg-red-500" : ""}>
                    Negro: {calibrationPoints.black ? calibrationPoints.black.color : 'Sin marcar'}
                  </Badge>
                  <Badge variant={calibrationPoints.white ? "default" : "outline"} className={calibrationPoints.white ? "bg-blue-500" : ""}>
                    Blanco: {calibrationPoints.white ? calibrationPoints.white.color : 'Sin marcar'}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold">Modo Selección de Color</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Haz clic en la imagen para seleccionar colores. Usa zoom y pan para mayor precisión.
                </p>
              </div>
            )}
            
            {/* Calibration controls */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      <Sliders className="h-4 w-4" />
                      Calibración de Color
                      {calibrationMatrix && <Badge className="bg-green-500 text-white">Activa</Badge>}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {calibrationMatrix ? 
                        'Los colores se corrigen automáticamente' : 
                        'Corrige iluminación marcando negro y blanco'
                      }
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={isCalibrating ? "default" : "outline"}
                      onClick={() => setIsCalibrating(!isCalibrating)}
                      className="flex items-center gap-2"
                      size="sm"
                    >
                      <Target className="h-4 w-4" />
                      {isCalibrating ? 'Cancelar' : 'Marcar Puntos'}
                    </Button>
                    {calibrationPoints.black && calibrationPoints.white && !calibrationMatrix && (
                      <Button
                        onClick={calculateCalibrationMatrix}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Aplicar
                      </Button>
                    )}
                    {(calibrationMatrix || calibrationPoints.black || calibrationPoints.white) && (
                      <Button
                        variant="outline"
                        onClick={resetCalibration}
                        className="flex items-center gap-2"
                        size="sm"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Reiniciar
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Instructions when calibrating */}
                {isCalibrating && (
                  <div className="text-sm bg-white/50 p-3 rounded">
                    <p className="font-medium mb-1">Instrucciones:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Haz clic en el color más <strong>oscuro</strong> (negro) de tu carta</li>
                      <li>Escribe &quot;negro&quot; cuando te lo pregunte</li>
                      <li>Haz clic en el color más <strong>claro</strong> (blanco) de tu carta</li>
                      <li>Escribe &quot;blanco&quot; cuando te lo pregunte</li>
                      <li>Pulsa &quot;Aplicar&quot; para activar la calibración</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {selectedImage && (
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* Image Display with Zoom Controls */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  {extractionMode === 'manual' ? 'Selección con Zoom' : 'Vista Previa'}
                </Label>
                
                {extractionMode === 'manual' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">Zoom: {Math.round(zoom * 100)}%</Badge>
                    <Button variant="outline" size="sm" onClick={zoomOut}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={zoomIn}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetZoom}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    {imageLoading && (
                      <Badge variant="secondary" className="animate-pulse">
                        Cargando...
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              <div 
                ref={containerRef}
                className="border border-border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center"
                style={{ height: '600px', position: 'relative' }}
              >
                {extractionMode === 'manual' ? (
                  <>
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">Cargando imagen para modo manual...</p>
                        </div>
                      </div>
                    )}
                    <canvas
                      ref={canvasRef}
                      onTouchStart={handlePointerDown}
                      onTouchMove={handlePointerMove}
                      onTouchEnd={handlePointerUp}
                      onMouseDown={handlePointerDown}
                      onMouseMove={handlePointerMove}
                      onMouseUp={handlePointerUp}
                      onWheel={handleWheel}
                      className={`touch-none ${isCalibrating ? 'cursor-cell' : 'cursor-crosshair'}`}
                      style={{ 
                        display: imageLoading ? 'none' : 'block', 
                        touchAction: 'none',
                        border: isCalibrating ? '3px solid #9333ea' : 'none',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </>
                ) : (
                  <img
                    src={selectedImage}
                    alt="Carta de colores"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              
              {extractionMode === 'manual' && (
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg text-sm">
                    <p className="font-medium mb-1">Controles:</p>
                    <p>• <strong>Toque/Clic:</strong> {isCalibrating ? 'Marcar punto de calibración' : 'Seleccionar color'}</p>
                    <p>• <strong>Arrastrar:</strong> Mover imagen</p>
                    <p>• <strong>Pellizcar:</strong> Zoom (móvil)</p>
                    <p>• <strong>Scroll:</strong> Zoom (escritorio)</p>
                    <p>• <strong>Botones:</strong> Zoom y reset</p>
                  </div>
                  
                  {!imageLoading && !imageReady && (
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 mb-2">¿No se ve la imagen?</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={forceReloadImage}
                        className="text-amber-700 border-amber-300"
                      >
                        Recargar Imagen
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controls and Selected Colors */}
            <div className="space-y-6">
              
              {/* Manual Selection Info */}
              {extractionMode === 'manual' && (
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Colores Seleccionados ({selectedPoints.length})
                  </Label>
                  
                  {selectedPoints.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedPoints.map((point, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                          <div 
                            className="w-6 h-6 rounded border flex-shrink-0" 
                            style={{ backgroundColor: point.hex }}
                          />
                          <span className="font-mono text-xs">{point.hex}</span>
                          <span className="font-medium">#{point.number}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSelectedPoint(index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 ml-auto"
                            title="Eliminar color"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Haz clic en la imagen para seleccionar colores
                    </p>
                  )}
                  
                  {selectedPoints.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPoints([])}
                      className="w-full"
                    >
                      Limpiar Selecciones
                    </Button>
                  )}
                </div>
              )}

              {/* Extract Button */}
              <Button
                onClick={extractColorsFromImage}
                disabled={isProcessing || (extractionMode === 'manual' && selectedPoints.length === 0) || isCalibrating}
                className="w-full flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {isProcessing ? 'Extrayendo...' : 
                 extractionMode === 'manual' ? `Extraer ${selectedPoints.length} Colores` : 
                 'Extraer Colores'}
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Color Picker Dialog */}
        {showDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold mb-4">Agregar Color</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded border-2 border-gray-300"
                    style={{ backgroundColor: dialogColor }}
                  />
                  <div>
                    <p className="font-mono text-sm">{dialogColor}</p>
                    <p className="text-xs text-gray-500">Color detectado</p>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="rotulador-number" className="block text-sm font-medium mb-2">
                    Número del Rotulador
                  </Label>
                  <input
                    id="rotulador-number"
                    type="text"
                    placeholder="Ej: 247, R05, etc."
                    value={inputNumber}
                    onChange={(e) => setInputNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmColorSelection}
                  disabled={!inputNumber.trim()}
                  className="flex-1"
                >
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        )}

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

            {/* Color grid */}
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
            <div className="max-h-32 overflow-y-auto space-y-1">
              {extractedColors.map((color) => (
                <div key={color.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                  <div 
                    className="w-6 h-6 rounded border flex-shrink-0" 
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="font-mono text-xs">{color.hex}</span>
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

export default ColorExtractorWithZoom;