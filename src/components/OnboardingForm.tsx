import React, { useState } from 'react';
import { motion } from 'motion/react';
import { getSupabase } from '../lib/supabase';

export const OnboardingForm = ({ onComplete }: { onComplete: (user: any) => void }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'phone' | 'name' | 'welcome'>('phone');
  const [existingUser, setExistingUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const supabase = getSupabase();

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    
    if (!supabase) {
      setStep('name');
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase.from('clientes').select('*').eq('telefono', phone).single();
      if (data) {
        setExistingUser(data);
        setStep('welcome');
      } else {
        setStep('name');
      }
    } catch (err) {
      setStep('name');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    if (!supabase) {
      onComplete({ nombre: name, telefono: phone, historial_pedidos: [] });
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase.from('clientes').insert([{ telefono: phone, nombre: name }]).select().single();
      onComplete(data || { nombre: name, telefono: phone });
    } catch (err) {
      onComplete({ nombre: name, telefono: phone });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {step === 'phone' && (
          <form onSubmit={handleCheck} className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">¡Bienvenido!</h2>
              <p className="text-muted-foreground text-sm">Introduce tu teléfono para comenzar.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-[0.1em] text-muted-foreground mb-2 font-bold">Número de Teléfono</label>
                <input 
                  type="tel" 
                  className="w-full bg-card border border-border p-4 rounded-lg text-white focus:border-primary outline-none transition-colors"
                  placeholder="+34 600 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                />
              </div>
              <button 
                type="submit" 
                disabled={loading || !phone}
                className="w-full bg-primary text-black font-bold p-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Cargando...' : 'Continuar'}
              </button>
            </div>
          </form>
        )}

        {step === 'name' && (
          <form onSubmit={handleRegister} className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">¡Hola!</h2>
              <p className="text-muted-foreground text-sm">Parece que eres nuevo por aquí.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-[0.1em] text-muted-foreground mb-2 font-bold">Nombre Completo</label>
                <input 
                  type="text" 
                  className="w-full bg-card border border-border p-4 rounded-lg text-white focus:border-primary outline-none transition-colors"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <button 
                type="submit" 
                disabled={loading || !name}
                className="w-full bg-primary text-black font-bold p-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Acceder al Menú'}
              </button>
            </div>
          </form>
        )}

        {step === 'welcome' && existingUser && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">¡Hola {existingUser.nombre}!</h2>
              <p className="text-primary text-sm font-bold uppercase tracking-widest">Qué gusto verte de nuevo</p>
            </div>

            <div className="pt-8 border-t border-border">
              <div className="flex justify-between items-center text-[11px] uppercase tracking-widest text-muted-foreground mb-4 font-bold">
                <span>Tu Historial</span>
              </div>
              <div className="space-y-3">
                {existingUser.historial_pedidos?.length > 0 ? (
                  existingUser.historial_pedidos.slice(0, 3).map((pedido: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-200">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <span>{pedido.nombre_plato || pedido.nombre}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground italic">No hay pedidos recientes.</div>
                )}
              </div>
            </div>

            <button 
              onClick={() => onComplete(existingUser)}
              className="w-full bg-primary text-black font-bold p-4 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Ver Menú de Hoy
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
