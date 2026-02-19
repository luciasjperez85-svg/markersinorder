import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Info, Palette, ArrowRight, Eye } from 'lucide-react';
import { hexToHsl } from '../utils/colorUtils';

const ChromaticOrderInfo = () => {
  const [showDemo, setShowDemo] = useState(false);

  // Colores de ejemplo para demostrar el ordenamiento
  const exampleColors = [
    { hex: '#FF0000', name: 'Rojo' },
    { hex: '#FF8000', name: 'Naranja' },
    { hex: '#FFFF00', name: 'Amarillo' },
    { hex: '#80FF00', name: 'Lima' },
    { hex: '#00FF00', name: 'Verde' },
    { hex: '#00FF80', name: 'Verde Agua' },
    { hex: '#00FFFF', name: 'Cian' },
    { hex: '#0080FF', name: 'Azul Cielo' },
    { hex: '#0000FF', name: 'Azul' },
    { hex: '#8000FF', name: 'Violeta' },
    { hex: '#FF00FF', name: 'Magenta' },
    { hex: '#FF0080', name: 'Rosa' }
  ];

  const getColorInfo = (hex) => {
    const hsl = hexToHsl(hex);
    return {
      hue: hsl.h,
      saturation: hsl.s,
      lightness: hsl.l
    };
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          ¿Cómo Funciona el Orden Cromático?
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          ChromaSort ordena tus colores usando el sistema HSL para crear armonía visual perfecta
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Explicación HSL */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-blue-500 rounded-full"></div>
              <h4 className="font-semibold">Matiz (Hue)</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              El color base en la rueda de colores: rojo (0°), verde (120°), azul (240°), etc.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-gradient-to-r from-gray-300 to-red-500 rounded-full"></div>
              <h4 className="font-semibold">Saturación</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              La intensidad del color: 0% = gris, 100% = color puro y vibrante.
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-gradient-to-r from-black via-blue-500 to-white rounded-full"></div>
              <h4 className="font-semibold">Luminosidad</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              El brillo: 0% = negro, 50% = color puro, 100% = blanco.
            </p>
          </div>
        </div>

        {/* Orden de Prioridad */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Orden de Prioridad ChromaSort
          </h4>
          <div className="grid gap-3 md:grid-cols-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-800">1º</Badge>
              <span className="text-sm"><strong>Matiz:</strong> Rojo → Naranja → Amarillo → Verde → Azul → Violeta</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">2º</Badge>
              <span className="text-sm"><strong>Luminosidad:</strong> Más claros primero</span>
            </div>
          </div>
        </div>

        {/* Demostración Interactiva */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Demostración Visual
            </h4>
            <Button 
              variant={showDemo ? "secondary" : "default"}
              size="sm" 
              onClick={() => setShowDemo(!showDemo)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showDemo ? 'Ocultar Demo' : 'Ver Ejemplo'}
            </Button>
          </div>

          {showDemo && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Aquí tienes un ejemplo de cómo ChromaSort ordena los colores automáticamente:
              </p>
              
              {/* Colores Desordenados */}
              <div>
                <h5 className="text-sm font-medium mb-2">❌ Antes (colores aleatorios):</h5>
                <div className="flex flex-wrap gap-2">
                  {[...exampleColors].sort(() => Math.random() - 0.5).slice(0, 8).map((color, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="w-12 h-12 rounded-lg border border-gray-300"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-xs mt-1">{color.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colores Ordenados */}
              <div>
                <h5 className="text-sm font-medium mb-2">✅ Después (orden cromático):</h5>
                <div className="flex flex-wrap gap-2">
                  {exampleColors.slice(0, 8).map((color, index) => {
                    const colorInfo = getColorInfo(color.hex);
                    return (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="w-12 h-12 rounded-lg border border-gray-300 shadow-sm"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-xs mt-1">{color.name}</span>
                        <div className="text-xs text-muted-foreground">
                          H:{colorInfo.hue}°
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gradiente Final */}
              <div>
                <h5 className="text-sm font-medium mb-2">🌈 Gradiente resultante:</h5>
                <div 
                  className="w-full h-8 rounded-lg border border-gray-300"
                  style={{
                    background: `linear-gradient(to right, ${exampleColors.slice(0, 8).map(c => c.hex).join(', ')})`
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Beneficios */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-green-800">¿Por qué es útil el orden cromático?</h4>
          <ul className="space-y-1 text-sm text-green-700">
            <li>• <strong>Fácil localización:</strong> Encuentra rápidamente el color que buscas</li>
            <li>• <strong>Combinaciones armoniosas:</strong> Los colores vecinos se ven bien juntos</li>
            <li>• <strong>Gradientes naturales:</strong> Crea transiciones suaves entre colores</li>
            <li>• <strong>Organización profesional:</strong> Como en tiendas de arte y estudios de diseño</li>
            <li>• <strong>Orden por matiz y luminosidad:</strong> Primero por color, luego por claridad</li>
          </ul>
        </div>

        {/* Tip Personal */}
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
          <p className="text-sm">
            <strong>💡 Tip:</strong> Una vez que tus rotuladores estén ordenados por matiz y luminosidad, 
            podrás crear paletas de colores más armoniosas y encontrar el tono exacto que necesitas 
            sin buscar entre todos tus rotuladores. Los colores similares estarán juntos, y dentro de cada 
            grupo de color, verás primero los más claros.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChromaticOrderInfo;