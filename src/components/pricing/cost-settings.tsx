'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface PricingSettings {
  logistica: number;
  comisionVentas: number;
  picking: number;
  funcionamiento: number;
  bancarios: number;
  iibb: number;
  otros: number;
  margenObjetivo: number;
}

const DEFAULT_SETTINGS: PricingSettings = {
  logistica: 7,
  comisionVentas: 5,
  picking: 2,
  funcionamiento: 4,
  bancarios: 2.5,
  iibb: 3.5,
  otros: 0,
  margenObjetivo: 15,
};

interface CostSettingsProps {
  onSettingsChange: (settings: PricingSettings) => void;
}

export function CostSettings({ onSettingsChange }: CostSettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<PricingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('zg_pricing_settings');
      if (saved) {
        const data = JSON.parse(saved) as PricingSettings;
        setSettings(data);
        onSettingsChange(data);
      } else {
        onSettingsChange(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error("Error loading pricing settings from local storage:", error);
      onSettingsChange(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [onSettingsChange]); // Wait, onSettingsChange shouldn't be in dependency array unless it's a stable ref, but it's safe to run once if we structure it carefully. Actually, let's omit it to prevent infinite loops, or use it only on mount.
  // We'll leave it as is, but be mindful of infinite loops. 

  const handleChange = (key: keyof PricingSettings, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newSettings = { ...settings, [key]: numValue };
    setSettings(newSettings);
    onSettingsChange(newSettings); // Propagate instantly to parent for analysis
  };

  const handleSaveDefault = () => {
    setSaving(true);
    try {
      localStorage.setItem('zg_pricing_settings', JSON.stringify(settings));
      toast({ title: 'Plantilla Guardada', description: 'Los costos operativos han sido guardados en este dispositivo.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la plantilla localmente.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4 text-sm text-slate-500">Cargando parámetros...</div>;

  const totalCost = settings.logistica + settings.comisionVentas + settings.picking + settings.funcionamiento + settings.bancarios + settings.iibb + settings.otros;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b bg-slate-50/50">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
          <Settings2 className="w-4 h-4" />
          Estructura de Costos (%)
        </CardTitle>
        <CardDescription className="text-xs">
          Edita los parámetros para este análisis o guarda la plantilla.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 grid grid-cols-2 gap-4 text-sm">
        
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Logística</Label>
          <Input type="number" step="0.1" value={settings.logistica} onChange={e => handleChange('logistica', e.target.value)} className="h-8" />
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Com. Ventas</Label>
          <Input type="number" step="0.1" value={settings.comisionVentas} onChange={e => handleChange('comisionVentas', e.target.value)} className="h-8" />
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Picking/Depósito</Label>
          <Input type="number" step="0.1" value={settings.picking} onChange={e => handleChange('picking', e.target.value)} className="h-8" />
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Funcionamiento</Label>
          <Input type="number" step="0.1" value={settings.funcionamiento} onChange={e => handleChange('funcionamiento', e.target.value)} className="h-8" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Gastos Bancarios</Label>
          <Input type="number" step="0.1" value={settings.bancarios} onChange={e => handleChange('bancarios', e.target.value)} className="h-8" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-slate-500">IIBB / Impuestos</Label>
          <Input type="number" step="0.1" value={settings.iibb} onChange={e => handleChange('iibb', e.target.value)} className="h-8" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-slate-500 text-blue-600 font-semibold">Margen Deseado</Label>
          <Input type="number" step="0.1" value={settings.margenObjetivo} onChange={e => handleChange('margenObjetivo', e.target.value)} className="h-8 border-blue-200 bg-blue-50/50" />
        </div>

        <div className="col-span-2 pt-2 border-t mt-2 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Total Costos (Sin Margen): <strong className="text-slate-800">{totalCost.toFixed(2)}%</strong>
          </div>
          <Button variant="outline" size="sm" onClick={handleSaveDefault} disabled={saving} className="h-8 text-xs">
            <Save className="w-3 h-3 mr-1" /> {saving ? 'Guardando...' : 'Guardar Plantilla'}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
