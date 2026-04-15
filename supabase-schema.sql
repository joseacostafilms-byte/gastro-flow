-- Esquema de Base de Datos para GastroPro PWA

-- 1. Clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telefono TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    historial_pedidos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inventario
CREATE TABLE inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_item TEXT NOT NULL,
    stock_actual DECIMAL NOT NULL DEFAULT 0,
    unidad_medida TEXT NOT NULL, -- 'kg', 'unidades', 'litros', etc.
    precio_costo DECIMAL NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Platos
CREATE TABLE platos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio_venta DECIMAL NOT NULL,
    imagen_url TEXT,
    categoria TEXT, -- 'Entradas', 'Fuertes', 'Bebidas', etc.
    receta JSONB NOT NULL, -- Ejemplo: [{"item_id": "uuid", "cantidad": 0.5}]
    estado TEXT DEFAULT 'Disponible', -- 'Disponible', 'Agotado'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Usuarios Staff
CREATE TABLE usuarios_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_auth UUID REFERENCES auth.users(id),
    rol TEXT CHECK (rol IN ('Gerente', 'Mesonero', 'Caja')),
    nombre TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Pedidos (Para el trigger)
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id),
    items JSONB NOT NULL, -- [{"plato_id": "uuid", "cantidad": 1}]
    total DECIMAL NOT NULL,
    estado TEXT DEFAULT 'Pendiente', -- 'Pendiente', 'En Cocina', 'Entregado', 'Pagado'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Función de Descuento Automático de Inventario
CREATE OR REPLACE FUNCTION procesar_descuento_inventario()
RETURNS TRIGGER AS $$
DECLARE
    pedido_item RECORD;
    receta_item RECORD;
    plato_receta JSONB;
    item_stock DECIMAL;
BEGIN
    -- Iterar sobre cada item del pedido
    FOR pedido_item IN SELECT * FROM jsonb_to_recordset(NEW.items) AS x(plato_id UUID, cantidad INT)
    LOOP
        -- Obtener la receta del plato
        SELECT receta INTO plato_receta FROM platos WHERE id = pedido_item.plato_id;
        
        -- Iterar sobre los ingredientes de la receta
        FOR receta_item IN SELECT * FROM jsonb_to_recordset(plato_receta) AS r(item_id UUID, cantidad DECIMAL)
        LOOP
            -- Descontar del inventario
            UPDATE inventario 
            SET stock_actual = stock_actual - (receta_item.cantidad * pedido_item.cantidad)
            WHERE id = receta_item.item_id;
            
            -- Verificar si algún plato queda agotado
            -- (Esto se podría hacer de forma más eficiente con otro trigger o vista, 
            -- pero aquí lo simplificamos marcando platos que usen este item)
            UPDATE platos
            SET estado = 'Agotado'
            WHERE id IN (
                SELECT p.id 
                FROM platos p, jsonb_to_recordset(p.receta) AS r(item_id UUID, cantidad DECIMAL)
                JOIN inventario i ON i.id = r.item_id
                WHERE i.stock_actual < r.cantidad
            );
        END LOOP;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar la función al insertar un pedido
CREATE TRIGGER trigger_descuento_inventario
AFTER INSERT ON pedidos
FOR EACH ROW
EXECUTE FUNCTION procesar_descuento_inventario();
