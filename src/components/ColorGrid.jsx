import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Grid3X3, List, Palette, Download, Trash2, Copy, ArrowUpDown } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const ColorGrid = ({ colors, onDeleteColor, onClearAll, sortOrder, onSortChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid, list, palette
  const [sortBy, setSortBy] = useState('chromatic'); // chromatic, name, source
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  // Filtrar y buscar colores
  const filteredColors = useMemo(() => {
    return colors.filter(color => 
      color.hex.toLowerCase().includes(searchTerm.toLowerCase()) ||
      color.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      color.source.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [colors, searchTerm]);

  // Paginación
  const paginatedColors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredColors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredColors, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredColors.length / itemsPerPage);

  const copyToClipboard = (hex) => {
    navigator.clipboard.writeText(hex);
    toast({
      title: "Color copiado",
      description: `${hex} copiado al portapapeles`,
      duration: 2000,
    });
  };

  const exportColors = () => {
    const colorData = filteredColors.map(color => ({
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
    a.download = `rotuladores-${filteredColors.length}-colores.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Colores exportados",
      description: `Se exportaron ${filteredColors.length} colores`,
      duration: 2000,
    });
  };

  if (colors.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-24 h-24 rounded-full bg-muted mb-4 flex items-center justify-center">
            <Palette className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No hay rotuladores aún</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Usa la carga masiva para agregar hasta 300 colores de rotuladores de una vez.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header con controles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Colección de Rotuladores
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {filteredColors.length} de {colors.length} rotuladores
                {searchTerm && ` (filtrado por "${searchTerm}")`}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
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
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Controles de búsqueda y vista */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por color, nombre o fuente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={sortOrder} onValueChange={onSortChange}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chromatic">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Orden Cromático
                    </div>
                  </SelectItem>
                  <SelectItem value="hue">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Por Matiz
                    </div>
                  </SelectItem>
                  <SelectItem value="saturation">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Por Saturación
                    </div>
                  </SelectItem>
                  <SelectItem value="lightness">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Por Luminosidad
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">
                    <div className="flex items-center gap-2">
                      <Grid3X3 className="h-4 w-4" />
                      Cuadrícula
                    </div>
                  </SelectItem>
                  <SelectItem value="list">
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      Lista
                    </div>
                  </SelectItem>
                  <SelectItem value="palette">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Paleta
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="300">Todo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vista de paleta completa */}
          {viewMode === 'palette' && (
            <div className="space-y-4">
              <div className="grid grid-cols-10 sm:grid-cols-15 lg:grid-cols-20 gap-1">
                {paginatedColors.map((color) => (
                  <div
                    key={color.id}
                    className="aspect-square rounded cursor-pointer hover:scale-110 transition-transform shadow-sm border border-border"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => copyToClipboard(color.hex)}
                    title={`${color.name} - ${color.hex}`}
                  />
                ))}
              </div>
              
              {/* Gradient view with chromatic order indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Gradiente Cromático</Label>
                  <Badge variant="outline" className="text-xs">
                    Ordenado por HSL
                  </Badge>
                </div>
                <div 
                  className="w-full h-20 rounded-lg border border-border cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden"
                  style={{
                    background: `linear-gradient(to right, ${paginatedColors.map(c => c.hex).join(', ')})`
                  }}
                  onClick={() => copyToClipboard(paginatedColors.map(c => c.hex).join(', '))}
                  title="Haz clic para copiar gradiente completo"
                >
                  {/* Order indicators */}
                  <div className="absolute bottom-1 left-2 text-xs text-white/80 bg-black/30 px-2 py-1 rounded">
                    Ordenado por: {
                      sortOrder === 'hue' ? 'Matiz' :
                      sortOrder === 'saturation' ? 'Saturación' :
                      'Luminosidad'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contenido principal según modo de vista */}
      {viewMode === 'grid' && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {paginatedColors.map((color, index) => (
            <Card key={color.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">
                    #{((currentPage - 1) * itemsPerPage) + index + 1}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteColor(color.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                
                <div 
                  className="w-full h-16 rounded-md mb-2 border border-border cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => copyToClipboard(color.hex)}
                />
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium">{color.hex}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(color.hex)}
                      className="h-5 w-5 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs font-medium truncate" title={color.name}>
                    {color.name}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {paginatedColors.map((color, index) => (
                <div key={color.id} className="flex items-center gap-4 p-4 hover:bg-accent transition-colors">
                  <Badge variant="outline" className="min-w-[3rem]">
                    #{((currentPage - 1) * itemsPerPage) + index + 1}
                  </Badge>
                  
                  <div 
                    className="w-12 h-12 rounded border border-border cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => copyToClipboard(color.hex)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-medium">{color.hex}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(color.hex)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{color.name}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {color.source}
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorGrid;