'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OpportunityFormProps {
  onAnalyze: (payload: { productText: string; imageBase64: string; imageMimeType: string; baseCost: number }) => void;
  isLoading: boolean;
}

export function OpportunityForm({ onAnalyze, isLoading }: OpportunityFormProps) {
  const { toast } = useToast();
  const [productText, setProductText] = React.useState('');
  const [baseCost, setBaseCost] = React.useState('');
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [imageFile, setImageFile] = React.useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(baseCost);

    if (isNaN(cost) || cost <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Ingresa un costo base válido (mayor a 0).' });
      return;
    }

    if (!imagePreview && !productText.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes ingresar un nombre de producto o subir una foto de la propuesta.' });
      return;
    }

    let base64Data = '';
    let mimeType = '';

    if (imagePreview) {
      // Split "data:image/jpeg;base64,..."
      const parts = imagePreview.split(',');
      const match = parts[0].match(/:(.*?);/);
      mimeType = match ? match[1] : 'image/jpeg';
      base64Data = parts[1];
    }

    onAnalyze({
      productText,
      imageBase64: base64Data,
      imageMimeType: mimeType,
      baseCost: cost
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b bg-slate-50/50">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
          Nueva Oportunidad de Compra
        </CardTitle>
        <CardDescription className="text-xs">
          Carga la propuesta para que la IA haga el benchmark de mercado.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Producto / Modelo (Opcional si subes foto)</Label>
              <Input 
                placeholder="Ej: Lavarropas Codini AIAS4507BC" 
                value={productText}
                onChange={e => setProductText(e.target.value)}
                className="h-9"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 font-semibold text-blue-700">Costo Base (IVA Incluido) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <Input 
                  type="number" 
                  step="0.01" 
                  required
                  placeholder="0.00" 
                  value={baseCost}
                  onChange={e => setBaseCost(e.target.value)}
                  className="pl-7 h-9 border-blue-200"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-slate-500">Foto del Catálogo o Propuesta</Label>
            <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${imagePreview ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
              
              {imagePreview ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-32 h-32 rounded-md overflow-hidden border shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setImagePreview(null); setImageFile(null); }} className="text-xs text-red-500 h-7">
                    Quitar imagen
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer py-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium text-slate-600">Subir imagen o captura</div>
                  <div className="text-xs text-slate-400">PNG, JPG hasta 5MB</div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}

            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-slate-800 hover:bg-slate-900 text-white shadow-md">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analizando propuesta y rastreando precios en la zona...
              </>
            ) : (
              'Analizar Oportunidad Comercial'
            )}
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}
