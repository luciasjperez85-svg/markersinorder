import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ArrowRight, Camera, Upload, MousePointer, Download, Eye, ArrowDown } from 'lucide-react';

const StepByStepGuide = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      number: 1,
      title: "Hacer una foto de tu carta",
      description: "Toma una foto clara de todos tus rotuladores",
      action: "Haz clic en el área de subida",
      image: "📱",
      details: [
        "Usa buena iluminación natural",
        "Asegúrate de que todos los colores sean visibles",
        "Los números de los rotuladores deben ser legibles"
      ]
    },
    {
      number: 2,
      title: "Subir la foto a ChromaSort",
      description: "Arrastra tu foto o haz clic para seleccionarla",
      action: "Botón 'Haz clic para subir tu carta de colores'",
      image: "⬆️",
      details: [
        "Acepta PNG, JPG, JPEG",
        "Resolución alta recomendada",
        "La imagen se carga automáticamente"
      ]
    },
    {
      number: 3,
      title: "Elegir método Manual + Zoom",
      description: "Selecciona la pestaña para control preciso",
      action: "Clic en '🎯 Manual + Zoom'",
      image: "🎯",
      details: [
        "Te permite seleccionar colores específicos",
        "Puedes ampliar la imagen",
        "Controlas qué colores incluir"
      ]
    },
    {
      number: 4,
      title: "Ampliar y seleccionar colores",
      description: "Usa zoom y haz clic en cada color",
      action: "Clic en cada color + ingresar número",
      image: "🔍",
      details: [
        "Usa los botones + - para hacer zoom",
        "Arrastra para mover la imagen",
        "Haz clic en cada color que quieras"
      ]
    },
    {
      number: 5,
      title: "Extraer colores seleccionados",
      description: "Procesa los colores que elegiste",
      action: "Botón 'Extraer X Colores'",
      image: "⚡",
      details: [
        "El botón muestra cuántos colores seleccionaste",
        "Procesa automáticamente los colores",
        "Ve la vista previa antes de agregar"
      ]
    },
    {
      number: 6,
      title: "Agregar a tu colección",
      description: "Los colores se ordenan automáticamente",
      action: "Botón 'Agregar a Colección'",
      image: "📥",
      details: [
        "Se ordenan automáticamente por HSL",
        "Se agrupan por matiz, saturación y brillo",
        "Ya están listos para usar"
      ]
    },
    {
      number: 7,
      title: "Ver tus colores ordenados",
      description: "Revisa el resultado final cromático",
      action: "Pestaña 'Colección'",
      image: "🎨",
      details: [
        "Ve todos tus colores ordenados",
        "Diferentes vistas: cuadrícula, lista, paleta",
        "Exporta, busca, y gestiona tu colección"
      ]
    }
  ];

  const nextStep = () => setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
  const prevStep = () => setCurrentStep(Math.max(0, currentStep - 1));
  const goToStep = (step) => setCurrentStep(step);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Guía Paso a Paso: ¿Dónde Hacer Clic?
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sigue estos pasos exactos para ordenar tus rotuladores cromáticamente
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Paso {currentStep + 1} de {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% completado</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                  index <= currentStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Current Step */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-start gap-4">
            <div className="text-4xl">{steps[currentStep].image}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-500">Paso {steps[currentStep].number}</Badge>
                <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
              </div>
              <p className="text-muted-foreground mb-3">{steps[currentStep].description}</p>
              
              <div className="bg-white/80 p-3 rounded-lg border border-blue-200 mb-3">
                <div className="flex items-center gap-2">
                  <MousePointer className="h-4 w-4 text-blue-600" />
                  <strong className="text-blue-800">Dónde hacer clic:</strong>
                </div>
                <p className="text-sm mt-1 font-medium">{steps[currentStep].action}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">💡 Consejos:</p>
                {steps[currentStep].details.map((detail, index) => (
                  <p key={index} className="text-sm text-gray-600">• {detail}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            ← Anterior
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Paso {currentStep + 1}: {steps[currentStep].title}
            </span>
          </div>

          <Button 
            onClick={nextStep}
            disabled={currentStep === steps.length - 1}
            className="flex items-center gap-2"
          >
            Siguiente →
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-3 md:grid-cols-3 pt-4 border-t">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl mb-1">📸</div>
            <p className="text-xs font-medium">Primera vez</p>
            <p className="text-xs text-muted-foreground">Empieza desde el paso 1</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl mb-1">🎯</div>
            <p className="text-xs font-medium">Ya tengo foto</p>
            <p className="text-xs text-muted-foreground">Ve directamente al paso 2</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl mb-1">🎨</div>
            <p className="text-xs font-medium">Ver resultado</p>
            <p className="text-xs text-muted-foreground">Salta al paso 7</p>
          </div>
        </div>

        {/* Visual Cues */}
        {currentStep < 3 && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDown className="h-4 w-4 text-amber-600" />
              <strong className="text-amber-800">¡Mira las pestañas arriba!</strong>
            </div>
            <p className="text-sm text-amber-700">
              Asegúrate de estar en la pestaña <strong>"Carta"</strong> para seguir estos pasos.
            </p>
          </div>
        )}

        {currentStep >= 6 && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-green-600">🎉</div>
              <strong className="text-green-800">¡Casi terminado!</strong>
            </div>
            <p className="text-sm text-green-700">
              Tus colores ya están ordenados cromáticamente. Ve a la pestaña <strong>"Colección"</strong> para verlos.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StepByStepGuide;