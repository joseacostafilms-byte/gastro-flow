import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, LogOut, Plus, Minus, ChefHat, Bell } from "lucide-react";
import confetti from "canvas-confetti";
import { OnboardingSlider } from "./components/OnboardingSlider";
import { OnboardingForm } from "./components/OnboardingForm";
import { StaffLogin } from "./components/StaffLogin";
import { StaffDashboard } from "./components/StaffDashboard";

export const INITIAL_INV = [
  { id: 1, nombre: "Arroz Arborio", stock: 50, unidad: "kg", costo: 2.5 },
  { id: 2, nombre: "Setas", stock: 10, unidad: "kg", costo: 8.0 },
  { id: 3, nombre: "Carne de Res", stock: 20, unidad: "kg", costo: 12.0 },
  { id: 4, nombre: "Queso Crema", stock: 15, unidad: "kg", costo: 5.0 },
  { id: 5, nombre: "Pescado (Corvina)", stock: 8, unidad: "kg", costo: 15.0 },
];

export const INITIAL_MENU = [
  {
    id: "1",
    nombre: "Risotto de Setas Silvestres",
    descripcion:
      "Arroz arborio cremoso con mezcla de setas de temporada y trufa negra.",
    precio: 24.5,
    imagen:
      "https://images.unsplash.com/photo-1476124369491-e7addf5db378?auto=format&fit=crop&w=800&q=80",
    categoria: "Principales",
    ingredientes: [{ invId: 1, cantidad: 0.2 }, { invId: 2, cantidad: 0.1 }]
  },
  {
    id: "2",
    nombre: "Solomillo al Pedro Ximénez",
    descripcion:
      "Corte premium con reducción de vino dulce y puré de patata trufado.",
    precio: 32.0,
    imagen:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    categoria: "Principales",
    ingredientes: [{ invId: 3, cantidad: 0.3 }]
  },
  {
    id: "3",
    nombre: "Tarta de Queso Ahumada",
    descripcion:
      "Nuestra famosa tarta de queso fluida con un toque de humo de roble.",
    precio: 12.0,
    imagen:
      "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80",
    categoria: "Postres",
    ingredientes: [{ invId: 4, cantidad: 0.15 }]
  },
  {
    id: "4",
    nombre: "Ceviche de Corvina",
    descripcion:
      "Leche de tigre al ají amarillo, maíz chulpi y boniato glaseado.",
    precio: 19.5,
    imagen:
      "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?auto=format&fit=crop&w=800&q=80",
    categoria: "Entrantes",
    ingredientes: [{ invId: 5, cantidad: 0.2 }]
  },
  {
    id: "5",
    nombre: "Burrata Trufada",
    descripcion:
      "Burrata fresca sobre cama de tomates cherry confitados y pesto de pistacho.",
    precio: 16.0,
    imagen:
      "https://images.unsplash.com/photo-1608897013039-887f214b985c?auto=format&fit=crop&w=800&q=80",
    categoria: "Entrantes",
    ingredientes: []
  },
  {
    id: "6",
    nombre: 'Cóctel de Autor "GastroFlow"',
    descripcion:
      "Ginebra macerada en frutos rojos, cítricos y espuma de violeta.",
    precio: 14.0,
    imagen:
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
    categoria: "Bebidas",
    ingredientes: []
  },
];

const PromoSlider = ({ promos }: { promos: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (promos.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [promos]);

  if (promos.length === 0) return null;

  return (
    <div className="w-full h-64 md:h-80 relative overflow-hidden rounded-2xl mb-12">
      <AnimatePresence mode="popLayout">
        <motion.img
          key={currentIndex}
          src={promos[currentIndex]}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
        <h2 className="text-3xl md:text-5xl font-display font-bold text-white">
          Promociones Especiales
        </h2>
      </div>
    </div>
  );
};

const MainApp = ({
  user,
  onLogout,
  menuItems,
  categories,
  promos,
  addOrder,
}: {
  user: any;
  onLogout: () => void;
  menuItems: any[];
  categories: string[];
  promos: string[];
  addOrder: (order: any) => void;
}) => {
  const [cart, setCart] = useState<Array<{ item: any; quantity: number }>>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("Todos");

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.item.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.item.id === item.id ? { ...p, quantity: p.quantity + 1 } : p,
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
    alert(`${item.nombre} añadido al carrito`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((p) => {
          if (p.item.id === id) {
            const newQ = p.quantity + delta;
            return newQ > 0 ? { ...p, quantity: newQ } : p;
          }
          return p;
        })
        .filter((p) => p.quantity > 0),
    );
  };

  const total = cart.reduce((sum, p) => sum + p.item.precio * p.quantity, 0);
  const totalItems = cart.reduce((sum, p) => sum + p.quantity, 0);

  const handleCheckout = () => {
    setIsCartOpen(false);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#F59E0B", "#FFFFFF", "#1A1A1A"],
    });
    alert("¡Pedido enviado a cocina!");
    
    addOrder({
      id: Math.floor(Math.random() * 10000),
      mesa: Math.floor(Math.random() * 10) + 1,
      items: cart.map(p => ({ 
        id: p.item.id,
        nombre: p.item.nombre, 
        qty: p.quantity,
        precio: p.item.precio,
        ingredientes: p.item.ingredientes || []
      })),
      total: total,
      time: 0,
      status: 'pendiente',
      userId: user.nombre
    });

    setCart([]);
  };

  const filteredItems =
    activeCategory === "Todos"
      ? menuItems
      : menuItems.filter((item) => item.categoria === activeCategory);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-display font-bold tracking-tight">
            GASTRO<span className="text-primary">FLOW</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsCartOpen(!isCartOpen)}
            className="relative p-2 hover:bg-card rounded-full transition-colors"
          >
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 bg-primary text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1">
                {totalItems}
              </span>
            )}
          </button>

          <button
            onClick={onLogout}
            className="p-2 hover:bg-card rounded-full transition-colors text-muted-foreground hover:text-white"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {isCartOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-card border-l border-border z-50 p-6 flex flex-col shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white font-display text-2xl">Tu Pedido</h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-muted-foreground hover:text-white"
            >
              Cerrar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6">
            {cart.length === 0 ? (
              <div className="text-center text-muted-foreground mt-20">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Tu carrito está vacío</p>
              </div>
            ) : (
              cart.map((p) => (
                <div key={p.item.id} className="flex gap-4 items-center">
                  <img
                    src={p.item.imagen}
                    alt={p.item.nombre}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{p.item.nombre}</h4>
                    <p className="text-primary font-bold">
                      ${p.item.precio.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-background rounded-lg p-1 border border-border">
                    <button
                      onClick={() => updateQuantity(p.item.id, -1)}
                      className="p-1 hover:text-primary"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold w-4 text-center">
                      {p.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(p.item.id, 1)}
                      className="p-1 hover:text-primary"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="pt-6 border-t border-border space-y-4 mt-auto">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-primary text-black font-bold p-4 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Confirmar Pedido
              </button>
            </div>
          )}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <PromoSlider promos={promos} />

        <div className="space-y-2">
          <h2 className="text-4xl font-display font-bold">
            Hola, {user.nombre}
          </h2>
          <p className="text-muted-foreground">
            Descubre nuestra selección para hoy.
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          <button
            onClick={() => setActiveCategory("Todos")}
            className={`whitespace-nowrap px-6 py-2 rounded-full font-bold transition-colors ${activeCategory === "Todos" ? "bg-primary text-black" : "bg-card border border-border hover:border-primary text-muted-foreground"}`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-6 py-2 rounded-full font-bold transition-colors ${activeCategory === cat ? "bg-primary text-black" : "bg-card border border-border hover:border-primary text-muted-foreground"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-colors flex flex-col"
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={item.imagen}
                  alt={item.nombre}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold text-primary border border-border">
                  ${item.precio.toFixed(2)}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-display font-bold">
                    {item.nombre}
                  </h3>
                </div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest mb-4 block">
                  {item.categoria}
                </span>
                <p className="text-sm text-muted-foreground mb-6 flex-1">
                  {item.descripcion}
                </p>
                <button
                  onClick={() => addToCart(item)}
                  className="w-full bg-background border border-border hover:border-primary hover:text-primary text-white font-bold py-3 rounded-xl transition-all"
                >
                  Añadir al Pedido
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('gastroflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [view, setView] = useState<
    "customer" | "staff_login" | "staff_dashboard"
  >("customer");
  const [staffRole, setStaffRole] = useState<string>("");
  const [menuItems, setMenuItems] = useState<any[]>(INITIAL_MENU);
  const [invItems, setInvItems] = useState<any[]>(INITIAL_INV);

  const [theme, setTheme] = useState({
    primary: "#F59E0B",
    background: "#0A0A0A",
    font: "font-sans",
  });

  const [categories, setCategories] = useState([
    "Entrantes",
    "Principales",
    "Postres",
    "Bebidas",
    "Especiales",
  ]);

  const [promos, setPromos] = useState([
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
  ]);

  const [staff, setStaff] = useState([
    {
      id: "1",
      nombre: "Carlos Mendoza",
      rol: "Gerente",
      pin: "1234",
      estado: "Activo",
    },
    {
      id: "2",
      nombre: "Ana Silva",
      rol: "Mesonero",
      pin: "0000",
      estado: "Activo",
    },
    {
      id: "3",
      nombre: "Chef Mario",
      rol: "Cocina",
      pin: "1111",
      estado: "Activo",
    },
  ]);

  const [orders, setOrders] = useState<any[]>([
    {
      id: 1021,
      mesa: 5,
      items: [
        { id: "1", nombre: "Risotto de Setas", qty: 2, precio: 24.5, ingredientes: [{ invId: 1, cantidad: 0.2 }, { invId: 2, cantidad: 0.1 }] },
        { id: "2", nombre: "Solomillo PX", qty: 1, precio: 32.0, ingredientes: [{ invId: 3, cantidad: 0.3 }] },
      ],
      total: 81.0,
      time: 5,
      status: "pendiente",
    },
    {
      id: 1022,
      mesa: 6,
      items: [{ id: "4", nombre: "Ceviche de Corvina", qty: 1, precio: 19.5, ingredientes: [{ invId: 5, cantidad: 0.2 }] }],
      total: 19.5,
      time: 10,
      status: "en_cocina",
    },
    {
      id: 1023,
      mesa: 7,
      items: [{ id: "3", nombre: "Tarta de Queso", qty: 2, precio: 12.0, ingredientes: [{ invId: 4, cantidad: 0.15 }] }],
      total: 24.0,
      time: 15,
      status: "listo",
    },
  ]);

  const prevOrdersRef = useRef<any[]>(orders);

  useEffect(() => {
    if (user) {
      localStorage.setItem('gastroflow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('gastroflow_user');
    }
  }, [user]);

  // Check for newly ready orders for the current user
  useEffect(() => {
    if (view === 'customer' && user) {
      const prevOrders = prevOrdersRef.current;
      const newlyReady = orders.find(o => 
        o.status === 'listo' && 
        o.userId === user.nombre &&
        !prevOrders.find(po => po.id === o.id && po.status === 'listo')
      );

      if (newlyReady) {
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/dinner_bell_triangle.ogg');
        audio.play().catch(e => console.log("Audio play failed", e));
        
        // Push notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('¡Tu pedido está listo!', {
            body: `El pedido #${newlyReady.id} ya está listo para ser entregado.`,
            icon: '/icon.png'
          });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('¡Tu pedido está listo!', {
                body: `El pedido #${newlyReady.id} ya está listo para ser entregado.`,
              });
            }
          });
        }
        
        alert(`🔔 ¡DING DING! Tu pedido #${newlyReady.id} está listo.`);
      }
    }
    prevOrdersRef.current = orders;
  }, [orders, view, user]);

  return (
    <div
      className={`relative min-h-screen bg-background text-foreground ${theme.font}`}
      style={
        {
          "--color-primary": theme.primary,
          "--color-background": theme.background,
          backgroundColor: theme.background,
        } as React.CSSProperties
      }
    >
      <AnimatePresence mode="wait">
        {view === "customer" && !user && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-[1fr_420px] min-h-screen w-full overflow-hidden"
          >
            <div className="relative hidden lg:block overflow-hidden bg-black">
              <OnboardingSlider />
            </div>
            <div className="flex items-center justify-center bg-background border-l border-border p-12 relative">
              <div className="absolute top-12 left-12 font-display font-extrabold text-2xl tracking-tighter flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-primary" />
                GASTRO<span className="text-primary">FLOW</span>
              </div>
              <OnboardingForm onComplete={(data) => setUser(data)} />
              <button
                onClick={() => setView("staff_login")}
                className="absolute bottom-8 right-12 text-[11px] text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors font-bold"
              >
                ACCESO STAFF →
              </button>
            </div>
          </motion.div>
        )}

        {view === "customer" && user && (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <MainApp
              user={user}
              onLogout={() => setUser(null)}
              menuItems={menuItems}
              categories={categories}
              promos={promos}
              addOrder={(order) => setOrders((prev) => [...prev, order])}
            />
          </motion.div>
        )}

        {view === "staff_login" && (
          <motion.div
            key="staff_login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-[1fr_420px] min-h-screen w-full overflow-hidden"
          >
            <div className="relative hidden lg:block overflow-hidden bg-black">
              <OnboardingSlider />
            </div>
            <div className="flex items-center justify-center bg-background border-l border-border p-12 relative">
              <StaffLogin
                staff={staff}
                onLogin={(role) => {
                  setStaffRole(role);
                  setView("staff_dashboard");
                }}
                onBack={() => setView("customer")}
              />
            </div>
          </motion.div>
        )}

        {view === "staff_dashboard" && (
          <motion.div
            key="staff_dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <StaffDashboard
              role={staffRole}
              onLogout={() => setView("customer")}
              onAddMenuItem={(item) => setMenuItems((prev) => [...prev, item])}
              theme={theme}
              setTheme={setTheme}
              categories={categories}
              setCategories={setCategories}
              promos={promos}
              setPromos={setPromos}
              staff={staff}
              setStaff={setStaff}
              orders={orders}
              setOrders={setOrders}
              invItems={invItems}
              setInvItems={setInvItems}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
