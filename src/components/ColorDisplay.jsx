import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Trash2, Copy, Download } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const ColorDisplay = ({ colors, onDeleteColor, onClearAll }) => {
  const { toast } = useToast();

  const copyToClipboard = (hex) => {
    navigator.clipboard.writeText(hex);
    toast({
      title: "Color copiado",
      description: `${hex} copiado al portapapeles`,
      duration: 2000,
    });
  };

  const exportColors = () => {
    const colorData = colors.map(color => ({
      hex: color.hex,
      name: color.name,
      source: color.source
    }));
    
    const blob = new Blob([JSON.stringify(colorData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'colores-ordenados.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Colores exportados",
      description: "Se ha descargado el archivo JSON con los colores",
      duration: 2000,
    });
  };

  if (colors.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-24 h-24 rounded-full bg-muted mb-4 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 opacity-30"></div>
          </div>
          <h3 className="text-xl font-semibold mb-2">No hay colores aún</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Agrega algunos colores usando los métodos disponibles arriba. Los colores se ordenarán automáticamente según su orden cromático.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Colores Ordenados</h2>
          <p className="text-muted-foreground">
            {colors.length} {colors.length === 1 ? 'color' : 'colores'} ordenados cromáticamente
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportColors} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button variant="destructive" onClick={onClearAll} className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Limpiar Todo
          </Button>
        </div>
      </div>

      {/* Color palette view */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-8 sm:grid-cols-12 lg:grid-cols-16 gap-1 mb-6">
            {colors.map((color) => (
              <div
                key={color.id}
                className="aspect-square rounded-md cursor-pointer hover:scale-110 transition-transform shadow-sm border border-border"
                style={{ backgroundColor: color.hex }}
                onClick={() => copyToClipboard(color.hex)}
                title={`${color.name} - ${color.hex}`}
              />
            ))}
          </div>
          
          {/* Gradient view */}
          <div 
            className="w-full h-16 rounded-lg border border-border cursor-pointer hover:shadow-md transition-shadow"
            style={{
              background: `linear-gradient(to right, ${colors.map(c => c.hex).join(', ')})`
            }}
            onClick={() => copyToClipboard(colors.map(c => c.hex).join(', '))}
            title="Haz clic para copiar todos los colores"
          />
        </CardContent>
      </Card>

      {/* Individual color cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {colors.map((color, index) => (
          <Card key={color.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className="text-xs">
                  #{index + 1}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteColor(color.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div 
                className="w-full h-20 rounded-lg mb-3 border border-border cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: color.hex }}
                onClick={() => copyToClipboard(color.hex)}
              />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium">{color.hex}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(color.hex)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                
                <div>
                  <p className="text-sm font-medium truncate" title={color.name}>
                    {color.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    Fuente: {color.source}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ColorDisplay;