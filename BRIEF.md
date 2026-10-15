# Brief: plataforma "Martha"

Crea una plataforma web llamada "Martha" para que un emprendedor de ecommerce pueda:
1. Registrar todos los costos de crear, importar, producir y vender un producto.
2. Calcular automáticamente el costo unitario real, el landed cost y el margen estimado.
3. Comparar el costo estimado vs. el costo real por producto, lote o proveedor.
4. Llevar un historial completo de cada producto: cuánto le ha costado crearlo, mejorarlo, producirlo y ponerlo a la venta.

## Contexto del negocio
El usuario vende productos físicos, principalmente moda y fajas, en Colombia.
Puede comprar a proveedores nacionales o internacionales.
Necesita calcular costos en COP y, si aplica, convertir desde USD, EUR u otras monedas.
Quiere conocer el precio mínimo de venta, precio sugerido y utilidad por unidad.

## Objetivo principal
Aplicación web responsive, intuitiva y orientada a decisiones comerciales, donde el usuario vea en segundos:
- Cuánto cuesta realmente cada unidad.
- Cuánto ha invertido en total en cada producto.
- Cuál es su margen bruto y neto.
- Qué precio necesita vender para alcanzar una utilidad objetivo.
- Qué costos están afectando más su rentabilidad.

## Módulos requeridos

### 1. Productos y variantes
- Productos con: nombre, SKU, categoría, descripción, imagen, proveedor, país de origen, moneda base y estado.
- Variantes: talla, color, material, presentación u otras. Cada variante con su propio costo, precio y margen.
- Duplicar productos para crear versiones o mejoras.
- Costo total acumulado invertido por producto y por variante.

### 2. Estructura de costos
Costos directos e indirectos: materia prima/costo del producto; mano de obra; diseño, muestras, desarrollo y prototipos; empaque primario y secundario; etiquetas, hangtags, certificados y material de autenticidad; fotografía, contenido y producción creativa; flete internacional o nacional; seguro de carga; aranceles, impuestos de importación y gastos aduaneros; agente de aduanas o brokerage; almacenamiento y logística; comisiones de canal (marketplace, pasarela de pago, publicidad, distribución); otros personalizables.

Para cada costo: nombre; tipo (fijo, variable, único, recurrente); moneda; valor total o valor unitario; cantidad de unidades del lote; fecha; proveedor o responsable; comprobante/factura/nota opcional; estado (estimado, pendiente, pagado, ajustado).

### 3. Cálculo automático
Calcular y mostrar: costo directo unitario; costos logísticos e importación por unidad; costo unitario de producción o adquisición; landed cost; costos fijos asignados por unidad según unidades estimadas o producidas; costo total por unidad; costo total acumulado del producto; margen bruto; margen neto (con comisiones, publicidad, envío al cliente y otros costos de venta); punto de equilibrio por unidad y por lote; precio mínimo recomendado según margen mínimo; precio sugerido según margen objetivo (30%, 40%, 50% o personalizado).

Fórmulas claras y visibles:
- Costo unitario = suma de todos los costos asignados / unidades del lote.
- Landed cost = costo del producto + flete + aduana + seguros + manejo + otros costos de llegada.
- Margen bruto = (precio de venta - costo unitario) / precio de venta.
- Margen neto = (precio de venta - costo unitario - costos de venta) / precio de venta.

### 4. Lotes y compras
Crear lotes de producción o compra; asociar costos a un lote; registrar unidades producidas o compradas; comparar costo estimado vs. real del lote; marcar diferencias y explicar causa (flete, impuestos, cambio de proveedor, merma, reproceso); ajustar el costo final cuando lleguen facturas reales.

### 5. Simulador de precios
Ingresar precio y ver margen, utilidad y punto de equilibrio; ingresar margen objetivo y ver precio mínimo; simular escenarios (flete, proveedor, tasa de cambio, volumen, descuentos, comisiones, publicidad); comparar hasta 3 escenarios por producto; alertas si el margen queda por debajo del mínimo.

### 6. Historial y control
Línea de tiempo por producto (creación, muestras, ajustes, compras, importación, lanzamiento, cambios de precio); registro de todas las inversiones; comparación versión anterior vs. actual; historial de cambios de costo y precio; exportar reportes en PDF y Excel.

### 7. Dashboard
Inversión total acumulada; costo promedio por unidad; productos más costosos; mejor y peor margen; costos por categoría; estimado vs. real; productos con margen bajo o pérdida; evolución del costo por mes; filtros por producto, proveedor, lote, categoría y fecha.

## Experiencia de usuario
Diseño limpio, moderno y profesional. Claridad: entender sin ser contador. Tarjetas, tablas, gráficos simples y colores semafóricos (verde saludable, amarillo bajo, rojo pérdida). Formulario paso a paso para crear producto. Calculadora visible en tiempo real mientras se agregan costos. Mensajes explicativos, ej. "Este costo aumenta tu costo unitario en $X". Móvil, tablet y escritorio. Español. Formato COP y multimoneda.

## Tecnología sugerida
Frontend: Next.js + Tailwind CSS. Backend: Supabase (Postgres, Auth, Storage). Tablas: usuarios, productos, variantes, proveedores, costos, lotes, precios, monedas, configuraciones. Auth solo con Supabase Auth por correo y contraseña (sin Google ni otros proveedores OAuth). Roles: administrador y colaborador. API lista para integraciones (Shopify, WooCommerce, Excel, Google Sheets, contables). Almacenamiento de imágenes y comprobantes.

## Entregables
1. Arquitectura de la plataforma.
2. Modelo de base de datos con relaciones.
3. Wireframes o diseño de las pantallas principales.
4. Flujo de usuario para crear un producto y calcular su costo.
5. Código inicial funcional.
6. Dashboard con métricas principales.
7. Instrucciones para desplegar.

Empieza mostrando: 1) arquitectura, 2) modelo de datos, 3) pantallas principales, 4) flujo para registrar un producto desde cero. Luego genera el código inicial.

## Usuarios y acceso (cambio de requisito)
- Sin registro público: el login solo tiene correo, contraseña y "Olvidé mi contraseña".
- El administrador crea los usuarios desde la sección "Usuarios" del dashboard (solo admin): crear, listar, cambiar rol, desactivar.
- La creación se hace en el servidor con la service role key, validando que quien llama es admin.
- organizacion_id y rol van en app_metadata. El primer admin se crea con un script de bootstrap.
- En Supabase Auth se desactiva "Allow new users to sign up".

## Base de datos aislada (cambio de requisito)
- La base de Supabase ya tiene otras apps: todo Martha va en el schema `martha`, nada en `public`.
- Triggers en auth.users, buckets y políticas de storage con prefijo `martha_`; el trigger ignora usuarios sin app_metadata.app = 'martha'.
- Clientes supabase-js con db.schema = 'martha'; agregar 'martha' en Exposed schemas del Data API.
