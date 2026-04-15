import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import {
  ChefHat,
  LogOut,
  Users,
  Package,
  ClipboardList,
  TrendingUp,
  UtensilsCrossed,
  Plus,
  Upload,
  Settings,
  Trash2,
  Minus,
  FileText
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const StaffDashboard = ({
  role,
  onLogout,
  onAddMenuItem,
  theme,
  setTheme,
  categories,
  setCategories,
  promos,
  setPromos,
  staff,
  setStaff,
  orders,
  setOrders,
  invItems,
  setInvItems
}: any) => {
  const [activeTab, setActiveTab] = useState("pedidos");

  // Inventario State
  const [newInv, setNewInv] = useState({
    nombre: "",
    stock: "",
    unidad: "kg",
    costo: "",
  });

  // Platos State
  const [platoNombre, setPlatoNombre] = useState("");
  const [platoDesc, setPlatoDesc] = useState("");
  const [platoPrecio, setPlatoPrecio] = useState("");
  const [platoCat, setPlatoCat] = useState(categories[0] || "");
  const [platoImgPreview, setPlatoImgPreview] = useState("");
  const [platoIngredientes, setPlatoIngredientes] = useState<Array<{invId: number, cantidad: number}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Staff State
  const [newStaff, setNewStaff] = useState({
    nombre: "",
    rol: "Mesonero",
    pin: "",
  });

  // Config State
  const [newCat, setNewCat] = useState("");
  const [newPromo, setNewPromo] = useState("");

  const prevOrdersRef = useRef<any[]>(orders);

  useEffect(() => {
    if (role === 'Mesonero' || role === 'Gerente') {
      const prevOrders = prevOrdersRef.current;
      const newlyReady = orders.find((o: any) => 
        o.status === 'listo' && 
        !prevOrders.find((po: any) => po.id === o.id && po.status === 'listo')
      );

      if (newlyReady) {
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/dinner_bell_triangle.ogg');
        audio.play().catch(e => console.log("Audio play failed", e));
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('¡Pedido Listo para Entregar!', {
            body: `El pedido #${newlyReady.id} de la Mesa ${newlyReady.mesa} está listo en cocina.`,
            icon: '/icon.png'
          });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('¡Pedido Listo para Entregar!', {
                body: `El pedido #${newlyReady.id} de la Mesa ${newlyReady.mesa} está listo en cocina.`,
              });
            }
          });
        }
      }
    }
    prevOrdersRef.current = orders;
  }, [orders, role]);

  const handleAddInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInv.nombre || !newInv.stock || !newInv.costo) return;
    setInvItems([
      ...invItems,
      {
        id: Date.now(),
        nombre: newInv.nombre,
        stock: parseFloat(newInv.stock),
        unidad: newInv.unidad,
        costo: parseFloat(newInv.costo),
      },
    ]);
    setNewInv({ nombre: "", stock: "", unidad: "kg", costo: "" });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPlatoImgPreview(URL.createObjectURL(file));
    }
  };

  const handleAddIngrediente = (invId: number) => {
    if (!platoIngredientes.find(i => i.invId === invId)) {
      setPlatoIngredientes([...platoIngredientes, { invId, cantidad: 0.1 }]);
    }
  };

  const updateIngredienteQty = (invId: number, qty: number) => {
    setPlatoIngredientes(platoIngredientes.map(i => i.invId === invId ? { ...i, cantidad: qty } : i));
  };

  const removeIngrediente = (invId: number) => {
    setPlatoIngredientes(platoIngredientes.filter(i => i.invId !== invId));
  };

  const handleAddPlato = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platoNombre || !platoPrecio || !platoImgPreview) return;
    onAddMenuItem({
      id: Date.now().toString(),
      nombre: platoNombre,
      descripcion: platoDesc,
      precio: parseFloat(platoPrecio),
      imagen: platoImgPreview,
      categoria: platoCat,
      ingredientes: platoIngredientes
    });
    setPlatoNombre("");
    setPlatoDesc("");
    setPlatoPrecio("");
    setPlatoImgPreview("");
    setPlatoIngredientes([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    alert("¡Plato añadido al menú principal!");
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.nombre || !newStaff.pin) return;
    setStaff([
      ...staff,
      { id: Date.now().toString(), ...newStaff, estado: "Activo" },
    ]);
    setNewStaff({ nombre: "", rol: "Mesonero", pin: "" });
  };

  const handleUpdateOrderStatus = (id: number, newStatus: string) => {
    const order = orders.find((o: any) => o.id === id);
    if (!order) return;

    // Deduct inventory when order goes to 'en_cocina'
    if (newStatus === 'en_cocina' && order.status === 'pendiente') {
      let updatedInv = [...invItems];
      let canPrepare = true;
      let missingItems: string[] = [];

      // Check and deduct
      order.items.forEach((item: any) => {
        if (item.ingredientes) {
          item.ingredientes.forEach((ing: any) => {
            const invItemIndex = updatedInv.findIndex(i => i.id === ing.invId);
            if (invItemIndex !== -1) {
              const requiredQty = ing.cantidad * item.qty;
              if (updatedInv[invItemIndex].stock < requiredQty) {
                canPrepare = false;
                missingItems.push(updatedInv[invItemIndex].nombre);
              } else {
                updatedInv[invItemIndex].stock -= requiredQty;
              }
            }
          });
        }
      });

      if (!canPrepare) {
        alert(`No hay suficiente inventario para preparar este pedido. Faltan: ${missingItems.join(', ')}`);
        return;
      }
      
      setInvItems(updatedInv);
    }

    setOrders(orders.map((o: any) => o.id === id ? { ...o, status: newStatus } : o));
  };

  const handleCompleteOrder = (id: number) => {
    setOrders(orders.map((o: any) => o.id === id ? { ...o, status: 'entregado' } : o));
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Reporte de Ventas e Inventario - GastroFlow", 14, 20);
    
    doc.setFontSize(14);
    doc.text("Resumen de Ventas", 14, 35);
    
    const completedOrders = orders.filter((o: any) => o.status === 'entregado');
    const totalVentas = completedOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Total de Pedidos Entregados: ${completedOrders.length}`, 14, 45);
    doc.text(`Ingresos Totales: $${totalVentas.toFixed(2)}`, 14, 52);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Estado del Inventario", 14, 70);

    autoTable(doc, {
      startY: 75,
      head: [['Item', 'Stock Actual', 'Unidad', 'Costo Unit.']],
      body: invItems.map((item: any) => [
        item.nombre, 
        item.stock.toFixed(2), 
        item.unidad, 
        `$${item.costo.toFixed(2)}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] } // Primary color
    });

    doc.save("reporte_gastroflow.pdf");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-500/20 text-yellow-500";
      case "en_cocina":
        return "bg-blue-500/20 text-blue-500";
      case "listo":
        return "bg-green-500/20 text-green-500";
      case "entregado":
        return "bg-gray-500/20 text-gray-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendiente":
        return "Pendiente";
      case "en_cocina":
        return "En Cocina";
      case "listo":
        return "Listo";
      case "entregado":
        return "Entregado";
      default:
        return status;
    }
  };

  const NavButton = ({
    id,
    icon: Icon,
    label,
    roles,
  }: {
    id: string;
    icon: any;
    label: string;
    roles?: string[];
  }) => {
    if (roles && !roles.includes(role)) return null;
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`w-auto md:w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-white hover:bg-background"}`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className="whitespace-nowrap">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-display font-bold tracking-tight">
            GASTRO<span className="text-primary">FLOW</span>
          </h1>
        </div>

        <div className="p-4 md:p-6 flex-1 overflow-x-auto md:overflow-y-auto">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 hidden md:block">
            Panel de {role}
          </div>
          <nav className="flex md:flex-col gap-2 min-w-max md:min-w-0">
            <NavButton
              id="pedidos"
              icon={ClipboardList}
              label="Pedidos Activos"
              roles={["Gerente", "Mesonero", "Cocina"]}
            />
            <NavButton id="inventario" icon={Package} label="Inventario" />
            <NavButton
              id="platos"
              icon={UtensilsCrossed}
              label="Nuevos Platos"
              roles={["Gerente"]}
            />
            <NavButton
              id="personal"
              icon={Users}
              label="Personal"
              roles={["Gerente"]}
            />
            <NavButton
              id="reportes"
              icon={TrendingUp}
              label="Reportes"
              roles={["Gerente"]}
            />
            <NavButton
              id="configuracion"
              icon={Settings}
              label="Configuración"
              roles={["Gerente"]}
            />
          </nav>
        </div>

        <div className="p-6 border-t border-border">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-white hover:bg-background rounded-lg font-bold transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto space-y-8"
        >
          {activeTab === "pedidos" && (
            <>
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="text-4xl font-display font-bold mb-2">
                    Pedidos Activos
                  </h2>
                  <p className="text-muted-foreground">
                    Gestiona las comandas en tiempo real.
                  </p>
                </div>
                <div className="text-sm font-bold bg-card border border-border px-4 py-2 rounded-lg">
                  <span className="text-primary mr-2">●</span> {orders.length}{" "}
                  en preparación
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {orders.map((order: any) => (
                  <div
                    key={order.id}
                    className="bg-card border border-border rounded-xl p-6 flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">
                          Mesa {order.mesa}
                        </span>
                        <h3 className="text-lg font-bold mt-1">
                          Pedido #{order.id}
                        </h3>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-muted-foreground">
                          hace {order.time} min
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest ${getStatusColor(order.status)}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 flex-1">
                      {order.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>
                            {item.qty}x {item.nombre}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-border flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          alert(
                            `Detalles del pedido #${order.id}:\nMesa: ${order.mesa}\nTiempo: ${order.time} min\nItems: ${order.items.map((i: any) => `${i.qty}x ${i.nombre}`).join(", ")}`,
                          )
                        }
                        className="flex-1 min-w-[100px] bg-background border border-border hover:border-primary text-white py-2 rounded-lg text-sm font-bold transition-colors"
                      >
                        Detalles
                      </button>

                      {order.status === "pendiente" &&
                        (role === "Cocina" || role === "Gerente") && (
                          <button
                            onClick={() =>
                              handleUpdateOrderStatus(order.id, "en_cocina")
                            }
                            className="flex-1 min-w-[100px] bg-blue-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors"
                          >
                            Preparar
                          </button>
                        )}

                      {order.status === "en_cocina" &&
                        (role === "Cocina" || role === "Gerente") && (
                          <button
                            onClick={() =>
                              handleUpdateOrderStatus(order.id, "listo")
                            }
                            className="flex-1 min-w-[100px] bg-green-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-600 transition-colors"
                          >
                            Listo
                          </button>
                        )}

                      {order.status === "listo" &&
                        (role === "Mesonero" || role === "Gerente") && (
                          <button
                            onClick={() => handleCompleteOrder(order.id)}
                            className="flex-1 min-w-[100px] bg-primary text-black py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
                          >
                            Entregar
                          </button>
                        )}
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    No hay pedidos activos en este momento.
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "inventario" && (
            <div className="space-y-8">
              <header>
                <h2 className="text-4xl font-display font-bold mb-2">
                  Inventario
                </h2>
                <p className="text-muted-foreground">
                  Gestiona el stock de ingredientes.
                </p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[400px]">
                    <thead className="bg-background border-b border-border">
                      <tr>
                        <th className="p-4 font-bold text-muted-foreground">
                          Item
                        </th>
                        <th className="p-4 font-bold text-muted-foreground">
                          Stock
                        </th>
                        <th className="p-4 font-bold text-muted-foreground">
                          Costo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="p-4 font-bold">{item.nombre}</td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-bold ${item.stock < 5 ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}
                            >
                              {item.stock} {item.unidad}
                            </span>
                          </td>
                          <td className="p-4">${item.costo.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 h-fit">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary" /> Agregar Item
                  </h3>
                  <form onSubmit={handleAddInventory} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={newInv.nombre}
                        onChange={(e) =>
                          setNewInv({ ...newInv, nombre: e.target.value })
                        }
                        className="w-full bg-background border border-border p-3 rounded-lg text-white focus:border-primary outline-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                          Stock
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={newInv.stock}
                          onChange={(e) =>
                            setNewInv({ ...newInv, stock: e.target.value })
                          }
                          className="w-full bg-background border border-border p-3 rounded-lg text-white focus:border-primary outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                          Unidad
                        </label>
                        <select
                          value={newInv.unidad}
                          onChange={(e) =>
                            setNewInv({ ...newInv, unidad: e.target.value })
                          }
                          className="w-full bg-background border border-border p-3 rounded-lg text-white focus:border-primary outline-none"
                        >
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="l">L</option>
                          <option value="ml">ml</option>
                          <option value="ud">Unidad</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                        Costo ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newInv.costo}
                        onChange={(e) =>
                          setNewInv({ ...newInv, costo: e.target.value })
                        }
                        className="w-full bg-background border border-border p-3 rounded-lg text-white focus:border-primary outline-none"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-primary text-black font-bold p-3 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Guardar Item
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === "platos" && (
            <div className="space-y-8">
              <header>
                <h2 className="text-4xl font-display font-bold mb-2">
                  Nuevos Platos
                </h2>
                <p className="text-muted-foreground">
                  Añade creaciones al menú principal.
                </p>
              </header>

              <div className="bg-card border border-border rounded-xl p-8 max-w-2xl">
                <form onSubmit={handleAddPlato} className="space-y-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                      Imagen del Plato
                    </label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                      <div
                        className="w-32 h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-background relative group cursor-pointer shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {platoImgPreview ? (
                          <img
                            src={platoImgPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">
                          Sube una imagen apetitosa. Recomendado: 800x600px.
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-background border border-border px-4 py-2 rounded-lg text-sm font-bold hover:border-primary transition-colors"
                        >
                          Seleccionar Archivo
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                        Nombre del Plato
                      </label>
                      <input
                        type="text"
                        value={platoNombre}
                        onChange={(e) => setPlatoNombre(e.target.value)}
                        className="w-full bg-background border border-border p-4 rounded-lg text-white focus:border-primary outline-none"
                        placeholder="Ej. Ceviche de Corvina"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                        Categoría
                      </label>
                      <select
                        value={platoCat}
                        onChange={(e) => setPlatoCat(e.target.value)}
                        className="w-full bg-background border border-border p-4 rounded-lg text-white focus:border-primary outline-none"
                        required
                      >
                        {categories.map((c: string) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                      Descripción
                    </label>
                    <textarea
                      value={platoDesc}
                      onChange={(e) => setPlatoDesc(e.target.value)}
                      className="w-full bg-background border border-border p-4 rounded-lg text-white focus:border-primary outline-none min-h-[100px]"
                      placeholder="Describe los ingredientes y preparación..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                      Precio de Venta ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={platoPrecio}
                      onChange={(e) => setPlatoPrecio(e.target.value)}
                      className="w-full bg-background border border-border p-4 rounded-lg text-white focus:border-primary outline-none"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-4 font-bold">
                      Receta (Descuento de Inventario)
                    </label>
                    <div className="space-y-4 mb-4">
                      {platoIngredientes.map(ing => {
                        const invItem = invItems.find((i: any) => i.id === ing.invId);
                        return (
                          <div key={ing.invId} className="flex items-center gap-4 bg-background p-3 rounded-lg border border-border">
                            <span className="flex-1 text-sm font-bold">{invItem?.nombre}</span>
                            <input 
                              type="number" 
                              step="0.01"
                              value={ing.cantidad}
                              onChange={(e) => updateIngredienteQty(ing.invId, parseFloat(e.target.value))}
                              className="w-24 bg-card border border-border p-2 rounded text-sm text-center"
                            />
                            <span className="text-xs text-muted-foreground w-8">{invItem?.unidad}</span>
                            <button type="button" onClick={() => removeIngrediente(ing.invId)} className="text-destructive hover:text-red-400">
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <select 
                        className="flex-1 bg-background border border-border p-3 rounded-lg text-sm text-white focus:border-primary outline-none"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddIngrediente(parseInt(e.target.value));
                            e.target.value = "";
                          }
                        }}
                      >
                        <option value="">Añadir ingrediente...</option>
                        {invItems.filter((i: any) => !platoIngredientes.find(pi => pi.invId === i.id)).map((item: any) => (
                          <option key={item.id} value={item.id}>{item.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!platoImgPreview}
                    className="w-full bg-primary text-black font-bold p-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 mt-6"
                  >
                    Publicar en el Menú
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "personal" && (
            <div className="space-y-8">
              <header>
                <h2 className="text-4xl font-display font-bold mb-2">
                  Personal
                </h2>
                <p className="text-muted-foreground">
                  Gestión de equipo y accesos.
                </p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[400px]">
                    <thead className="bg-background border-b border-border">
                      <tr>
                        <th className="p-4 font-bold text-muted-foreground">
                          Nombre
                        </th>
                        <th className="p-4 font-bold text-muted-foreground">
                          Rol
                        </th>
                        <th className="p-4 font-bold text-muted-foreground">
                          PIN
                        </th>
                        <th className="p-4 font-bold text-muted-foreground">
                          Estado
                        </th>
                        <th className="p-4 font-bold text-muted-foreground">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map((s: any) => (
                        <tr
                          key={s.id}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="p-4 font-bold">{s.nombre}</td>
                          <td className="p-4">
                            <span
                              className={
                                s.rol === "Gerente"
                                  ? "text-primary font-bold"
                                  : "text-muted-foreground"
                              }
                            >
                              {s.rol}
                            </span>
                          </td>
                          <td className="p-4 tracking-widest">{s.pin}</td>
                          <td className="p-4">
                            <span
                              className={
                                s.estado === "Activo"
                                  ? "text-green-500"
                                  : "text-destructive"
                              }
                            >
                              {s.estado}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() =>
                                setStaff(
                                  staff.filter((x: any) => x.id !== s.id),
                                )
                              }
                              className="text-destructive hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 h-fit">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary" /> Agregar Personal
                  </h3>
                  <form onSubmit={handleAddStaff} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={newStaff.nombre}
                        onChange={(e) =>
                          setNewStaff({ ...newStaff, nombre: e.target.value })
                        }
                        className="w-full bg-background border border-border p-3 rounded-lg text-white focus:border-primary outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                        Rol
                      </label>
                      <select
                        value={newStaff.rol}
                        onChange={(e) =>
                          setNewStaff({ ...newStaff, rol: e.target.value })
                        }
                        className="w-full bg-background border border-border p-3 rounded-lg text-white focus:border-primary outline-none"
                      >
                        <option value="Mesonero">Mesonero</option>
                        <option value="Gerente">Gerente</option>
                        <option value="Cocina">Cocina</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                        PIN de Acceso (4 dígitos)
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={newStaff.pin}
                        onChange={(e) =>
                          setNewStaff({
                            ...newStaff,
                            pin: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        className="w-full bg-background border border-border p-3 rounded-lg text-white focus:border-primary outline-none tracking-widest"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-primary text-black font-bold p-3 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Crear Acceso
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reportes" && (
            <div className="space-y-8">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="text-4xl font-display font-bold mb-2">
                    Reportes
                  </h2>
                  <p className="text-muted-foreground">
                    Análisis de ventas y rendimiento.
                  </p>
                </div>
                <button 
                  onClick={generatePDFReport}
                  className="bg-primary text-black font-bold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Generar PDF
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-widest">
                    Ventas del Día
                  </h3>
                  <p className="text-4xl font-display font-bold text-primary">
                    ${orders.filter((o: any) => o.status === 'entregado').reduce((sum: number, o: any) => sum + (o.total || 0), 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-widest">
                    Pedidos Completados
                  </h3>
                  <p className="text-4xl font-display font-bold">
                    {orders.filter((o: any) => o.status === 'entregado').length}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-widest">
                    Ticket Promedio
                  </h3>
                  <p className="text-4xl font-display font-bold">
                    ${orders.filter((o: any) => o.status === 'entregado').length > 0 ? (orders.filter((o: any) => o.status === 'entregado').reduce((sum: number, o: any) => sum + (o.total || 0), 0) / orders.filter((o: any) => o.status === 'entregado').length).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-8 h-64 flex items-center justify-center">
                <p className="text-muted-foreground">
                  Gráfico de ventas (Simulado)
                </p>
              </div>
            </div>
          )}

          {activeTab === "configuracion" && (
            <div className="space-y-8">
              <header>
                <h2 className="text-4xl font-display font-bold mb-2">
                  Configuración
                </h2>
                <p className="text-muted-foreground">
                  Personaliza la apariencia y contenido de la app.
                </p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Theme Settings */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-bold mb-6 text-xl">Tema Visual</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                        Color Primario
                      </label>
                      <div className="flex gap-4 items-center">
                        <input
                          type="color"
                          value={theme.primary}
                          onChange={(e) =>
                            setTheme({ ...theme, primary: e.target.value })
                          }
                          className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <input
                          type="text"
                          value={theme.primary}
                          onChange={(e) =>
                            setTheme({ ...theme, primary: e.target.value })
                          }
                          className="flex-1 bg-background border border-border p-3 rounded-lg text-white focus:border-primary outline-none uppercase"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                        Color de Fondo
                      </label>
                      <div className="flex gap-4 items-center">
                        <input
                          type="color"
                          value={theme.background}
                          onChange={(e) =>
                            setTheme({ ...theme, background: e.target.value })
                          }
                          className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <input
                          type="text"
                          value={theme.background}
                          onChange={(e) =>
                            setTheme({ ...theme, background: e.target.value })
                          }
                          className="flex-1 bg-background border border-border p-3 rounded-lg text-white focus:border-primary outline-none uppercase"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                        Fuente Principal
                      </label>
                      <select
                        value={theme.font}
                        onChange={(e) =>
                          setTheme({ ...theme, font: e.target.value })
                        }
                        className="w-full bg-background border border-border p-3 rounded-lg text-white focus:border-primary outline-none"
                      >
                        <option value="font-sans">Sans Serif (Moderna)</option>
                        <option value="font-serif">Serif (Clásica)</option>
                        <option value="font-mono">Monospace (Técnica)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Categories Settings */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-bold mb-6 text-xl">
                    Categorías del Menú
                  </h3>
                  <div className="space-y-4 mb-6">
                    {categories.map((cat: string) => (
                      <div
                        key={cat}
                        className="flex justify-between items-center bg-background p-3 rounded-lg border border-border"
                      >
                        <span>{cat}</span>
                        <button
                          onClick={() =>
                            setCategories(
                              categories.filter((c: string) => c !== cat),
                            )
                          }
                          className="text-destructive hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newCat) {
                        setCategories([...categories, newCat]);
                        setNewCat("");
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                      placeholder="Nueva categoría..."
                      className="flex-1 bg-background border border-border p-3 rounded-lg text-white focus:border-primary outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-primary text-black px-4 rounded-lg font-bold hover:bg-primary/90"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </form>
                </div>

                {/* Promos Settings */}
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
                  <h3 className="font-bold mb-6 text-xl">
                    Imágenes del Slider Promocional
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    {promos.map((promo: string, i: number) => (
                      <div
                        key={i}
                        className="relative aspect-video rounded-lg overflow-hidden border border-border group"
                      >
                        <img
                          src={promo}
                          alt={`Promo ${i}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          onClick={() =>
                            setPromos(
                              promos.filter(
                                (_: any, index: number) => index !== i,
                              ),
                            )
                          }
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                        >
                          <Trash2 className="w-8 h-8" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newPromo) {
                        setPromos([...promos, newPromo]);
                        setNewPromo("");
                      }
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="url"
                      value={newPromo}
                      onChange={(e) => setNewPromo(e.target.value)}
                      placeholder="URL de la imagen promocional..."
                      className="flex-1 bg-background border border-border p-3 rounded-lg text-white focus:border-primary outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-primary text-black px-6 py-3 rounded-lg font-bold hover:bg-primary/90 whitespace-nowrap"
                    >
                      Añadir Imagen
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};
