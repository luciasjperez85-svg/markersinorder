import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const BulkColorUpload = ({ onBulkAdd }) => {
  const [csvData, setCsvData] = useState('');
  const [textData, setTextData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Función para validar si un string es un color hex válido
  const isValidHex = (hex) => {
    return /^#?[0-9A-Fa-f]{6}$/.test(hex);
  };

  // Procesar archivo CSV
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvData(event.target.result);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Procesar CSV data
  const processCsvData = () => {
    if (!csvData.trim()) {
      toast({
        title: "Error",
        description: "Por favor, sube un archivo CSV o pega los datos",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    const colors = [];
    const lines = csvData.split('\n');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      const parts = trimmedLine.split(',');
      let hex = '';
      let name = '';

      if (parts.length === 1) {
        // Solo código hex
        hex = parts[0].trim();
        name = `Rotulador ${index + 1}`;
      } else if (parts.length >= 2) {
        // Hex y nombre
        hex = parts[0].trim();
        name = parts[1].trim() || `Rotulador ${index + 1}`;
      }

      // Limpiar y validar hex
      if (hex.startsWith('#')) {
        hex = hex;
      } else if (hex.length === 6) {
        hex = '#' + hex;
      } else {
        return; // Skip invalid hex
      }

      if (isValidHex(hex)) {
        colors.push({
          id: Date.now() + index,
          hex: hex.toUpperCase(),
          name: name || `Rotulador ${index + 1}`,
          source: 'csv'
        });
      }
    });

    if (colors.length > 0) {
      onBulkAdd(colors);
      setCsvData('');
      toast({
        title: "¡Éxito!",
        description: `Se agregaron ${colors.length} colores de rotuladores`,
      });
    } else {
      toast({
        title: "Error",
        description: "No se encontraron colores válidos en el archivo",
        variant: "destructive"
      });
    }
    
    setIsProcessing(false);
  };

  // Procesar texto plano
  const processTextData = () => {
    if (!textData.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa códigos de colores",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    const colors = [];
    const lines = textData.split(/[\n,\s]+/);
    
    lines.forEach((line, index) => {
      let hex = line.trim();
      if (!hex) return;

      // Limpiar y validar hex
      if (hex.startsWith('#')) {
        hex = hex;
      } else if (hex.length === 6) {
        hex = '#' + hex;
      } else {
        return; // Skip invalid hex
      }

      if (isValidHex(hex)) {
        colors.push({
          id: Date.now() + index + Math.random(),
          hex: hex.toUpperCase(),
          name: `Rotulador ${colors.length + 1}`,
          source: 'bulk'
        });
      }
    });

    if (colors.length > 0) {
      onBulkAdd(colors);
      setTextData('');
      toast({
        title: "¡Éxito!",
        description: `Se agregaron ${colors.length} colores de rotuladores`,
      });
    } else {
      toast({
        title: "Error",
        description: "No se encontraron códigos de colores válidos",
        variant: "destructive"
      });
    }
    
    setIsProcessing(false);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Carga Masiva de Rotuladores
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sube hasta 300 colores de rotuladores desde archivo CSV o texto plano
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formato CSV */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <Label className="text-base font-medium">Archivo CSV</Label>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="csv-upload">Subir archivo CSV</Label>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv,.txt"
                onChange={handleCSVUpload}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Formato: hex,nombre (ej: #FF5733,Rojo Coral)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="csv-data">O pega los datos CSV</Label>
              <Textarea
                id="csv-data"
                placeholder="#FF5733,Rojo Coral&#10;#4ECDC4,Turquesa&#10;#45B7D1,Azul Cielo"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
            </div>
          </div>

          <Button 
            onClick={processCsvData} 
            disabled={!csvData.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Procesando...' : 'Procesar CSV'}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">O</span>
          </div>
        </div>

        {/* Formato texto plano */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <Label className="text-base font-medium">Códigos de Colores</Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="text-data">Lista de códigos hex</Label>
            <Textarea
              id="text-data"
              placeholder="#FF5733&#10;#4ECDC4&#10;#45B7D1&#10;FF6B6B&#10;96CEB4&#10;FFEAA7"
              value={textData}
              onChange={(e) => setTextData(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Un código por línea. Acepta formato #RRGGBB o RRGGBB
            </p>
          </div>

          <Button 
            onClick={processTextData} 
            disabled={!textData.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Procesando...' : 'Agregar Colores'}
          </Button>
        </div>

        {/* Ejemplo de formato */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-medium">Formatos soportados:</p>
              <div className="space-y-1 text-muted-foreground">
                <p><strong>CSV:</strong> #FF5733,Rojo Coral</p>
                <p><strong>Texto:</strong> #FF5733 o FF5733</p>
                <p><strong>Lista:</strong> Un color por línea</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkColorUpload;