# 🐰 Tito el Conejo - Mascota Virtual Interactiva

Una aplicación web progresiva y móvil híbrida estilo **Tamagotchi** moderna, desarrollada con **React 18**, **Vite**, **Tailwind CSS** y **Capacitor**. Cuenta con un conejo virtual interactivo llamado **Tito**, con animaciones expresivas en tiempo real, persistencia de datos local offline con **IndexedDB**, decaimiento temporal inteligente fuera de línea, minijuegos y soporte nativo para **Android**.

---

## 🌟 Características Principales

- **🐰 Mascota Virtual Interactiva:**
  - Expresiones faciales y corporales dinámicas (ojos animados, orejas reactivas, bigotes y mejillas sonrosadas).
  - Estados anímicos y visuales según el nivel de cuidado (feliz, hambriento, somnoliento, descansando).
  - Interacciones táctiles directas: ¡puedes acariciar a Tito tocando su cuerpo para subir su nivel de afecto!

- **📊 Estadísticas en Tiempo Real:**
  - **🥕 Hambre:** Disminuye con el tiempo; aliméntalo con deliciosas zanahorias para mantenerlo satisfecho.
  - **⚡ Energía:** Consume energía al estar despierto y jugando; recupera energía al dormir.
  - **❤️ Ánimo / Felicidad:** Sube al acariciarlo o al ganar en el minijuego; baja gradualmente por descuido.
  - Indicadores con código de color dinámico y animaciones de alerta por nivel crítico.

- **🌙 Ciclo Día / Noche y Sueño Inteligente:**
  - Modo dormir con transición ambiental suave a tema oscuro / noche estrellada.
  - Durante el sueño, la energía se recupera a ritmo acelerado y el hambre se reduce más lentamente.
  - Tito despierta automáticamente cuando su energía alcanza el 100%.

- **💾 Persistencia Offline Completa (IndexedDB):**
  - Motor de almacenamiento nativo en el cliente (`TitoElConejoDB`) sin necesidad de servidores externos.
  - **Cálculo de Decaimiento Offline:** Al reabrir la app tras minutos u horas de ausencia, un algoritmo calcula el tiempo transcurrido y ajusta con precisión el hambre, energía y felicidad.
  - **Reporte de Bienvenida:** Muestra un resumen informativo de lo ocurrido durante tu ausencia.
  - Guardado en segundo plano continuo y captura de eventos `visibilitychange` y `beforeunload`.

- **🎮 Minijuego: "Atrapa las Zanahorias":**
  - Minijuego estilo *Whack-a-Mole* en un tablero de 9 casillas con temporizador de 15 segundos.
  - Atrapa tantas zanahorias doradas como puedas antes de que expire el tiempo.
  - Recompensas en **monedas de oro 🪙** y bonificación instantánea de felicidad.
  - Efectos visuales de victoria con lluvia de confeti (`canvas-confetti`).

- **📱 Preparado para Dispositivos Móviles (Android):**
  - Empaquetado y configurado con **Capacitor 6** para ejecución nativa en Android.
  - Interfaz responsiva diseñada para pantallas móviles, con diseño libre de scroll y controles táctiles optimizados.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend Core** | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **Estilos & Diseño** | [Tailwind CSS](https://tailwindcss.com/) + [PostCSS](https://postcss.org/) |
| **Íconos** | [Lucide React](https://lucide.dev/) |
| **Efectos & Animaciones** | [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) + Animaciones SVG nativas |
| **Persistencia de Datos** | [IndexedDB API](https://developer.mozilla.org/es/docs/Web/API/IndexedDB_API) Nativo |
| **Plataforma Móvil** | [@capacitor/core](https://capacitorjs.com/) + [@capacitor/android](https://capacitorjs.com/) |

---

## 📁 Estructura del Proyecto

```text
tito/
├── android/                   # Proyecto nativo de Android generado por Capacitor
│   ├── app/
│   ├── build.gradle
│   └── ...
├── src/
│   ├── services/
│   │   └── db.js              # Manejo de IndexedDB y lógica de decaimiento offline
│   ├── App.jsx                # Componente principal, avatar SVG, minijuego y estados
│   ├── index.css              # Estilos base y directivas de Tailwind CSS
│   └── main.jsx               # Punto de entrada de React
├── resources/                 # Íconos y recursos gráficos para plataformas nativas
├── capacitor.config.json      # Configuración de Capacitor (App ID, nombre, webDir)
├── package.json               # Dependencias y scripts de ejecución
├── tailwind.config.js         # Configuración de temas y plugins Tailwind
└── vite.config.js             # Configuración de compilación Vite
```

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos

- **Node.js** (versión 18 o superior recomendada)
- **npm** o gestor de paquetes de su preferencia
- *(Opcional para Android)*: **Android Studio** con SDK configurado

### 1. Clonar el Repositorio

```bash
git clone git@github.com:dynamicbytes-dev/mascotatito.git
cd mascotatito
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Ejecutar en Modo Desarrollo (Navegador)

```bash
npm run dev
```

Abre tu navegador en `http://localhost:5173` para empezar a jugar con Tito.

---

## 📱 Compilación y Despliegue en Android (Capacitor)

Para compilar la aplicación y desplegarla en un emulador o dispositivo Android físico:

```bash
# 1. Generar la compilación web para producción
npm run build

# 2. Sincronizar los archivos compilados con el proyecto Android
npm run cap:sync

# 3. Abrir el proyecto en Android Studio
npm run cap:open:android
```

Desde Android Studio, puedes presionar **Run** para instalar y ejecutar el APK en tu dispositivo o emulador.

---

## ⚙️ Scripts Disponibles

En el directorio del proyecto puedes ejecutar:

- `npm run dev`: Inicia el servidor de desarrollo local con recarga rápida (HMR).
- `npm run build`: Compila el código para producción en el directorio `dist/`.
- `npm run preview`: Previsualiza localmente el build de producción.
- `npm run cap:sync`: Sincroniza la carpeta web compilada con la plataforma nativa de Android.
- `npm run cap:open:android`: Abre el proyecto nativo en Android Studio.

---

## 🧠 Arquitectura de Datos y Decaimiento Offline

El archivo [`src/services/db.js`](src/services/db.js) implementa un modelo de vida continua:

1. **Tasas de Consumo Activas:** Cada 4 segundos, el estado disminuye de forma sutil mientras la aplicación permanece abierta.
2. **Cálculo Desconectado (Offline):** Al suspender o cerrar la app, se guarda el `lastUpdated` (timestamp en ms). Al reiniciar, se evalúan los minutos transcurridos (`elapsedMinutes`):
   - **Despierto:** Pierde ~1.2% de hambre/min, ~0.8% de energía/min y ~1.0% de felicidad/min.
   - **Durmiendo:** Recupera +2.5% de energía/min y ralentiza la pérdida de hambre a 0.4%/min.
3. Si durante el sueño la energía alcanza el 100%, Tito se despierta automáticamente para esperarte con energía.

---

## 📄 Licencia

Este proyecto es privado y propiedad de **Dynamic Bytes Dev**. Todos los derechos reservados.
