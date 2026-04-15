import React, { useState } from "react";
import { motion } from "motion/react";
import { ChefHat, Lock, ArrowLeft } from "lucide-react";

export const StaffLogin = ({
  staff,
  onLogin,
  onBack,
}: {
  staff: any[];
  onLogin: (role: string) => void;
  onBack: () => void;
}) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = staff.find((s) => s.pin === pin && s.estado === "Activo");
    if (user) {
      onLogin(user.rol);
    } else {
      setError("PIN incorrecto o usuario inactivo.");
      setPin("");
    }
  };

  return (
    <div className="w-full max-w-md">
      <button
        onClick={onBack}
        className="absolute top-12 left-12 text-muted-foreground hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <form onSubmit={handleLogin} className="space-y-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-card border border-border mb-6">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Acceso Staff</h2>
            <p className="text-muted-foreground text-sm">
              Introduce tu PIN de acceso.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="password"
                className="w-full bg-card border border-border p-4 rounded-lg text-white text-center text-2xl tracking-[0.5em] focus:border-primary outline-none transition-colors"
                placeholder="••••"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError("");
                }}
                autoFocus
              />
              {error && (
                <p className="text-destructive text-sm mt-2 text-center">
                  {error}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={pin.length < 4}
              className="w-full bg-primary text-black font-bold p-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Acceder
            </button>
          </div>
          <div className="text-xs text-muted-foreground mt-8 text-center">
            <p>Demo PINs:</p>
            <p>Gerente: 1234 | Mesonero: 0000 | Cocina: 1111 | Diseño: 1010</p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
