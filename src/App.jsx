import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Zap, 
  Utensils, 
  Moon, 
  Sun, 
  Gamepad2, 
  Coins, 
  Sparkles, 
  AlertCircle,
  Volume2,
  VolumeX,
  X,
  Trophy
} from 'lucide-react';
import { getPetState, savePetState, resetPetState } from './services/db';

export default function App() {
  // Estado principal de Tito
  const [pet, setPet] = useState({
    hunger: 80,
    energy: 85,
    happiness: 90,
    coins: 50,
    isSleeping: false,
    lastUpdated: Date.now()
  });

  const [isLoading, setIsLoading] = useState(true);
  const [offlineReport, setOfflineReport] = useState(null);
  const [floatingEffects, setFloatingEffects] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [titoAction, setTitoAction] = useState('idle'); // idle, eating, happy, sleeping, playing
  const [dialogText, setDialogText] = useState('¡Hola! Soy Tito 🐰');

  // Estado del minijuego
  const [showGame, setShowGame] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [gameTimeLeft, setGameTimeLeft] = useState(15);
  const [activeCarrotIndex, setActiveCarrotIndex] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  // Referencias para auto-guardado
  const petRef = useRef(pet);
  petRef.current = pet;

  // 1. Cargar estado inicial desde IndexedDB con decaimiento offline
  useEffect(() => {
    async function loadInitialData() {
      try {
        const { state, offlineReport } = await getPetState();
        setPet(state);
        if (offlineReport) {
          setOfflineReport(offlineReport);
        }
      } catch (err) {
        console.error('Error al inicializar Tito:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // 2. Loop continuo de decaimiento en tiempo real (cada 4 segundos)
  useEffect(() => {
    if (isLoading) return;

    const interval = setInterval(() => {
      setPet((prev) => {
        let { hunger, energy, happiness, isSleeping, coins } = prev;

        if (isSleeping) {
          // Si duerme: recupera energía, consume menos hambre
          energy = Math.min(100, energy + 1.5);
          hunger = Math.max(0, hunger - 0.2);
          happiness = Math.max(0, happiness - 0.1);

          // Si llega a 100 de energía, se despierta solo
          if (energy >= 100) {
            isSleeping = false;
            triggerDialog('¡Tito descansó y despertó lleno de energía! ☀️');
          }
        } else {
          // Despierto: decaimiento natural
          hunger = Math.max(0, hunger - 0.4);
          energy = Math.max(0, energy - 0.3);
          happiness = Math.max(0, happiness - 0.35);
        }

        const updated = {
          ...prev,
          hunger: Math.round(hunger * 10) / 10,
          energy: Math.round(energy * 10) / 10,
          happiness: Math.round(happiness * 10) / 10,
          isSleeping,
          coins,
          lastUpdated: Date.now()
        };

        // Guardar silenciosamente en segundo plano
        savePetState(updated);
        return updated;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isLoading]);

  // 3. Guardado en cambios de ciclo de vida (cerrar pestaña o minimizar app)
  useEffect(() => {
    const handleVisibilityOrUnload = () => {
      savePetState(petRef.current);
    };

    window.addEventListener('beforeunload', handleVisibilityOrUnload);
    document.addEventListener('visibilitychange', handleVisibilityOrUnload);

    return () => {
      window.removeEventListener('beforeunload', handleVisibilityOrUnload);
      document.removeEventListener('visibilitychange', handleVisibilityOrUnload);
    };
  }, []);

  // Utilidad para emitir textos flotantes/partículas
  const addFloatingEffect = (text, type = 'text') => {
    const id = Date.now() + Math.random();
    setFloatingEffects((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setFloatingEffects((prev) => prev.filter((item) => item.id !== id));
    }, 1200);
  };

  const triggerDialog = (msg) => {
    setDialogText(msg);
  };

  // ACCIÓN 1: Alimentar a Tito
  const handleFeed = () => {
    if (pet.isSleeping) {
      triggerDialog('Tito está durmiendo. ¡Despiértalo primero! 💤');
      return;
    }
    if (pet.hunger >= 98) {
      triggerDialog('¡Tito ya está lleno! Su pancita no aguanta más 🥕');
      return;
    }

    setPet((prev) => {
      const nextHunger = Math.min(100, prev.hunger + 22);
      const nextHappiness = Math.min(100, prev.happiness + 8);
      const updated = {
        ...prev,
        hunger: nextHunger,
        happiness: nextHappiness,
        lastUpdated: Date.now()
      };
      savePetState(updated);
      return updated;
    });

    setTitoAction('eating');
    addFloatingEffect('+25 Hambre 🥕', 'stat');
    triggerDialog('¡Ñam ñam! ¡Zanahoria deliciosa! 🥕✨');

    setTimeout(() => {
      setTitoAction('idle');
    }, 1500);
  };

  // ACCIÓN 2: Dormir o Despertar
  const handleToggleSleep = () => {
    const willSleep = !pet.isSleeping;

    setPet((prev) => {
      const updated = {
        ...prev,
        isSleeping: willSleep,
        lastUpdated: Date.now()
      };
      savePetState(updated);
      return updated;
    });

    if (willSleep) {
      setTitoAction('sleeping');
      triggerDialog('Buenas noches... Zzz 🌙');
      addFloatingEffect('Zzz 💤', 'sleep');
    } else {
      setTitoAction('happy');
      triggerDialog('¡Buenos días! Tito está listo para jugar ☀️');
      setTimeout(() => setTitoAction('idle'), 1500);
    }
  };

  // ACCIÓN 3: Acariciar a Tito al tocarlo
  const handlePetTito = () => {
    if (pet.isSleeping) {
      triggerDialog('Sssh... Tito está durmiendo profundamente 😴');
      return;
    }

    setPet((prev) => {
      const nextHappiness = Math.min(100, prev.happiness + 5);
      const updated = {
        ...prev,
        happiness: nextHappiness,
        lastUpdated: Date.now()
      };
      savePetState(updated);
      return updated;
    });

    setTitoAction('happy');
    addFloatingEffect('❤️ +5 Amor', 'love');
    triggerDialog('¡A Tito le encantan tus cariñitos! 🥰');

    setTimeout(() => {
      setTitoAction('idle');
    }, 1200);
  };

  // ACCIÓN 4: MINIJUEGO DE MONEDAS (Atrapa la Zanahoria Dorada)
  const startMinigame = () => {
    if (pet.isSleeping) {
      triggerDialog('Tito no puede jugar mientras duerme. ¡Despiértalo! 🌙');
      return;
    }
    if (pet.energy < 15) {
      triggerDialog('Tito no tiene suficiente energía para jugar. Déjalo dormir 😴');
      return;
    }

    setShowGame(true);
    setGameScore(0);
    setGameTimeLeft(15);
    setGameOver(false);
  };

  // Loop del minijuego
  useEffect(() => {
    if (!showGame || gameOver) return;

    // Temporizador de 15 segundos
    const timer = setInterval(() => {
      setGameTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Mueve la zanahoria cada 800ms
    const carrotInterval = setInterval(() => {
      const nextIndex = Math.floor(Math.random() * 9);
      setActiveCarrotIndex(nextIndex);
    }, 750);

    return () => {
      clearInterval(timer);
      clearInterval(carrotInterval);
    };
  }, [showGame, gameOver]);

  // Al golpear una zanahoria
  const hitCarrot = (index) => {
    if (index === activeCarrotIndex) {
      setGameScore((s) => s + 1);
      setActiveCarrotIndex(null); // Desaparece inmediatamente
    }
  };

  // Finalizar minijuego y otorgar recompensas a Tito
  const finishMinigame = () => {
    const earnedCoins = gameScore * 5;
    setPet((prev) => {
      const updated = {
        ...prev,
        coins: prev.coins + earnedCoins,
        happiness: Math.min(100, prev.happiness + Math.min(25, gameScore * 3)),
        energy: Math.max(5, prev.energy - 10),
        lastUpdated: Date.now()
      };
      savePetState(updated);
      return updated;
    });

    setShowGame(false);
    triggerDialog(`¡Increíble! Ganaste ${earnedCoins} monedas de oro 🪙🎉`);
    addFloatingEffect(`+${earnedCoins} 🪙`, 'coin');
  };

  // Helpers para barras de estado
  const getStatusColor = (val) => {
    if (val > 60) return 'bg-emerald-500';
    if (val > 25) return 'bg-amber-500';
    return 'bg-rose-500 animate-pulse';
  };

  const getMoodEmoji = () => {
    if (pet.isSleeping) return '😴';
    if (pet.hunger < 25) return '🥺';
    if (pet.energy < 25) return '🥱';
    if (pet.happiness > 80) return '🐰✨';
    return '🐰';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
        <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold">Despertando a Tito...</h2>
        <p className="text-slate-400 text-sm mt-1">Cargando datos locales de IndexedDB</p>
      </div>
    );
  }

  const isNight = pet.isSleeping;

  return (
    <div className={`relative min-h-screen max-w-md mx-auto flex flex-col justify-between overflow-hidden font-sans transition-colors duration-1000 ${
      isNight ? 'bg-slate-950 text-slate-100' : 'bg-gradient-to-b from-sky-200 via-amber-50 to-orange-100 text-slate-800'
    }`}>
      
      {/* 1. BARRA SUPERIOR: Monedas y Controles */}
      <header className="p-4 flex items-center justify-between z-20 backdrop-blur-md bg-white/20 dark:bg-black/20 rounded-b-2xl border-b border-white/20 shadow-sm">
        <div className="flex items-center gap-2 bg-amber-400/90 text-amber-950 font-bold px-3 py-1.5 rounded-full shadow-sm text-sm">
          <Coins className="w-5 h-5 text-amber-900 fill-amber-300" />
          <span>{pet.coins}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-full bg-white/40 dark:bg-slate-800/60 shadow-sm active:scale-95 transition"
            title="Sonido"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
          <button 
            onClick={async () => {
              if (confirm('¿Deseas reiniciar a Tito a su estado inicial?')) {
                const reset = await resetPetState();
                setPet(reset);
                triggerDialog('¡Tito ha renacido como un conejito bebé! 🐣');
              }
            }}
            className="text-xs px-2.5 py-1.5 rounded-full bg-slate-500/20 hover:bg-slate-500/30 transition text-slate-500 dark:text-slate-300"
          >
            Reiniciar
          </button>
        </div>
      </header>

      {/* 2. REPORTE DE TIEMPO OFFLINE (Modal flotante si estuvo ausente) */}
      {offlineReport && (
        <div className="mx-4 my-2 p-3 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/50 rounded-xl shadow-lg flex items-start gap-3 z-30 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs flex-1 text-amber-900 dark:text-amber-200">
            <p className="font-bold">¡Bienvenido de vuelta!</p>
            <p>
              Estuviste fuera <span className="font-bold">{Math.round(offlineReport.elapsedMinutes)} min</span>.
              Tito consumió {offlineReport.hungerLost}% de hambre y {offlineReport.happinessLost}% de felicidad.
            </p>
          </div>
          <button 
            onClick={() => setOfflineReport(null)}
            className="text-amber-800 dark:text-amber-300 hover:text-black p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. BARRAS DE ESTADO EN TIEMPO REAL */}
      <section className="px-5 pt-2 grid grid-cols-3 gap-3 z-10">
        {/* Hambre */}
        <div className="bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-2xl shadow-sm border border-white/50 dark:border-slate-800 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <Utensils className="w-3.5 h-3.5" /> Hambre
            </span>
            <span>{Math.round(pet.hunger)}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${getStatusColor(pet.hunger)}`}
              style={{ width: `${pet.hunger}%` }}
            />
          </div>
        </div>

        {/* Energía */}
        <div className="bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-2xl shadow-sm border border-white/50 dark:border-slate-800 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
              <Zap className="w-3.5 h-3.5" /> Energía
            </span>
            <span>{Math.round(pet.energy)}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${getStatusColor(pet.energy)}`}
              style={{ width: `${pet.energy}%` }}
            />
          </div>
        </div>

        {/* Felicidad */}
        <div className="bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-2xl shadow-sm border border-white/50 dark:border-slate-800 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400">
              <Heart className="w-3.5 h-3.5" /> Ánimo
            </span>
            <span>{Math.round(pet.happiness)}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${getStatusColor(pet.happiness)}`}
              style={{ width: `${pet.happiness}%` }}
            />
          </div>
        </div>
      </section>

      {/* 4. HABITACIÓN Y PERSONAJE TITO */}
      <main className="relative flex-1 flex flex-col items-center justify-center my-auto z-10 px-4">
        
        {/* Globo de diálogo */}
        <div className="mb-4 bg-white/90 dark:bg-slate-800/95 backdrop-blur px-4 py-2 rounded-2xl shadow-md border border-white/40 dark:border-slate-700 text-center text-sm font-medium animate-bounce max-w-[280px]">
          {dialogText}
        </div>

        {/* Efectos flotantes al acariciar / alimentar */}
        <div className="absolute pointer-events-none z-30">
          {floatingEffects.map((item) => (
            <div 
              key={item.id} 
              className="text-base font-extrabold text-amber-500 dark:text-amber-300 animate-out fade-out slide-out-to-top-12 duration-1000 select-none drop-shadow"
            >
              {item.text}
            </div>
          ))}
        </div>

        {/* Avatar Interactivo de Tito */}
        <div 
          onClick={handlePetTito}
          className={`relative cursor-pointer select-none transition-transform active:scale-90 duration-300 ${
            titoAction === 'eating' ? 'animate-bounce' : 
            titoAction === 'happy' ? 'animate-pulse scale-105' : 
            isNight ? 'opacity-90' : 'hover:scale-105'
          }`}
          title="¡Toca a Tito para acariciarlo!"
        >
          {/* Sombra de suelo */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-44 h-8 bg-black/15 dark:bg-black/40 rounded-full blur-md" />

          {/* SVG DE TITO EL CONEJO */}
          <svg className="w-60 h-60 drop-shadow-xl" viewBox="0 0 200 200">
            {/* Oreja Izquierda */}
            <g className={`transition-transform origin-bottom duration-500 ${isNight ? 'rotate-[-10deg]' : 'rotate-[-4deg]'}`}>
              <ellipse cx="75" cy="55" rx="16" ry="46" fill="#F3F4F6" stroke="#4B5563" strokeWidth="3" />
              <ellipse cx="75" cy="55" rx="8" ry="32" fill="#FBCFE8" />
            </g>

            {/* Oreja Derecha */}
            <g className={`transition-transform origin-bottom duration-500 ${isNight ? 'rotate-[10deg]' : 'rotate-[4deg]'}`}>
              <ellipse cx="125" cy="55" rx="16" ry="46" fill="#F3F4F6" stroke="#4B5563" strokeWidth="3" />
              <ellipse cx="125" cy="55" rx="8" ry="32" fill="#FBCFE8" />
            </g>

            {/* Cuerpo */}
            <ellipse cx="100" cy="145" rx="48" ry="42" fill="#F9FAFB" stroke="#4B5563" strokeWidth="3" />
            {/* Pancita suave */}
            <ellipse cx="100" cy="150" rx="30" ry="26" fill="#FFF1F2" />

            {/* Patitas delanteras */}
            <ellipse cx="80" cy="176" rx="14" ry="10" fill="#F3F4F6" stroke="#4B5563" strokeWidth="2.5" />
            <ellipse cx="120" cy="176" rx="14" ry="10" fill="#F3F4F6" stroke="#4B5563" strokeWidth="2.5" />

            {/* Cabeza */}
            <circle cx="100" cy="105" r="44" fill="#FFFFFF" stroke="#4B5563" strokeWidth="3" />

            {/* Mejillas sonrosadas */}
            <circle cx="74" cy="116" r="8" fill="#FDA4AF" opacity="0.6" />
            <circle cx="126" cy="116" r="8" fill="#FDA4AF" opacity="0.6" />

            {/* Nariz */}
            <polygon points="96,112 104,112 100,117" fill="#F43F5E" />

            {/* Ojos dinámicos según estado */}
            {isNight ? (
              // Ojos dormidos: curvas cerradas
              <g stroke="#374151" strokeWidth="3" strokeLinecap="round" fill="none">
                <path d="M78 103 Q85 109 92 103" />
                <path d="M108 103 Q115 109 122 103" />
              </g>
            ) : pet.happiness < 30 ? (
              // Ojos tristes
              <g stroke="#374151" strokeWidth="3" strokeLinecap="round" fill="none">
                <path d="M78 106 Q85 100 92 106" />
                <path d="M108 106 Q115 100 122 106" />
              </g>
            ) : (
              // Ojos alegres despiertos con brillos
              <g>
                <circle cx="85" cy="102" r="6" fill="#1F2937" />
                <circle cx="83" cy="100" r="2" fill="#FFFFFF" />
                <circle cx="115" cy="102" r="6" fill="#1F2937" />
                <circle cx="113" cy="100" r="2" fill="#FFFFFF" />
              </g>
            )}

            {/* Boquita dinámica */}
            {isNight ? (
              <path d="M96 122 Q100 124 104 122" stroke="#4B5563" strokeWidth="2" fill="none" strokeLinecap="round" />
            ) : titoAction === 'eating' ? (
              <circle cx="100" cy="124" r="5" fill="#BE123C" />
            ) : pet.happiness < 30 ? (
              <path d="M96 126 Q100 120 104 126" stroke="#4B5563" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            ) : (
              <path d="M95 120 Q100 127 105 120" stroke="#4B5563" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            )}

            {/* Bigotitos */}
            <g stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round">
              <line x1="62" y1="112" x2="48" y2="110" />
              <line x1="62" y1="117" x2="46" y2="120" />
              <line x1="138" y1="112" x2="152" y2="110" />
              <line x1="138" y1="117" x2="154" y2="120" />
            </g>

            {/* Icono Zzz si duerme */}
            {isNight && (
              <g className="animate-bounce font-bold fill-sky-400 text-lg">
                <text x="145" y="60">Z</text>
                <text x="158" y="45" fontSize="14">z</text>
                <text x="168" y="32" fontSize="10">z</text>
              </g>
            )}
          </svg>
        </div>

        {/* Cama o Alfombra acogedora */}
        <div className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          {isNight ? '💤 Tito está soñando...' : '🐾 Toca a Tito para darle amor'}
        </div>
      </main>

      {/* 5. BOTONES DE ACCIÓN PRINCIPALES */}
      <footer className="p-5 pb-8 bg-white/60 dark:bg-slate-900/80 backdrop-blur-lg border-t border-white/30 dark:border-slate-800 rounded-t-3xl shadow-xl z-20">
        <div className="grid grid-cols-3 gap-3">
          
          {/* Botón Alimentar */}
          <button
            onClick={handleFeed}
            disabled={pet.isSleeping}
            className={`flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl shadow-md font-bold text-sm transition-all active:scale-95 ${
              pet.isSleeping
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-orange-500/25 hover:brightness-105'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1 text-xl">
              🥕
            </div>
            <span>Alimentar</span>
          </button>

          {/* Botón Dormir / Despertar */}
          <button
            onClick={handleToggleSleep}
            className={`flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl shadow-md font-bold text-sm transition-all active:scale-95 ${
              pet.isSleeping
                ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 shadow-amber-400/30'
                : 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-indigo-600/30 hover:brightness-105'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1">
              {pet.isSleeping ? <Sun className="w-6 h-6 text-amber-950" /> : <Moon className="w-6 h-6 text-white" />}
            </div>
            <span>{pet.isSleeping ? 'Despertar' : 'Dormir'}</span>
          </button>

          {/* Botón Minijuego de Monedas */}
          <button
            onClick={startMinigame}
            disabled={pet.isSleeping}
            className={`flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl shadow-md font-bold text-sm transition-all active:scale-95 ${
              pet.isSleeping
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/25 hover:brightness-105'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span>Minijuego</span>
          </button>

        </div>
      </footer>

      {/* 6. MODAL INTERACTIVO: MINIJUEGO "ATRAPA LA ZANAHORIA DORADA" */}
      {showGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-sky-400 to-indigo-600 rounded-3xl p-6 w-full max-w-sm text-white shadow-2xl relative border-4 border-amber-300 flex flex-col items-center">
            
            {/* Cabecera del juego */}
            <div className="w-full flex justify-between items-center mb-4">
              <div className="flex items-center gap-1 bg-black/30 px-3 py-1 rounded-full font-bold text-amber-300">
                <Trophy className="w-4 h-4" /> Puntos: {gameScore}
              </div>
              <div className="bg-rose-500 text-white font-extrabold px-3 py-1 rounded-full text-sm">
                ⏳ {gameTimeLeft}s
              </div>
              <button 
                onClick={() => setShowGame(false)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="font-extrabold text-xl text-center text-amber-200 mb-1">
              ¡Atrapa la Zanahoria!
            </h3>
            <p className="text-xs text-center text-sky-100 mb-5">
              Toca las zanahorias antes de que se escondan en las madrigueras.
            </p>

            {/* Tablero 3x3 */}
            <div className="grid grid-cols-3 gap-3 w-full aspect-square bg-sky-800/40 p-4 rounded-2xl border-2 border-white/20">
              {Array.from({ length: 9 }).map((_, index) => {
                const hasCarrot = activeCarrotIndex === index && !gameOver;
                return (
                  <button
                    key={index}
                    onClick={() => hitCarrot(index)}
                    className="relative bg-amber-900/70 border-4 border-amber-800/90 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner active:scale-90 transition-transform"
                  >
                    {/* Madriguera / Hoyo */}
                    <div className="w-12 h-6 bg-amber-950 rounded-full blur-[2px] absolute bottom-2" />

                    {/* Zanahoria animada saliendo del hoyo */}
                    {hasCarrot && (
                      <span className="text-4xl animate-bounce drop-shadow-md select-none transform transition">
                        🥕
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Pantalla final de victoria */}
            {gameOver && (
              <div className="absolute inset-0 bg-indigo-950/95 rounded-3xl p-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center mb-3 shadow-lg">
                  <Coins className="w-10 h-10 text-amber-950" />
                </div>
                <h4 className="text-2xl font-black text-amber-300">¡Tiempo agotado!</h4>
                <p className="text-slate-300 text-sm mt-1 mb-4">
                  Lograste recolectar <span className="font-bold text-white text-lg">{gameScore}</span> zanahorias.
                </p>
                <div className="bg-amber-400/20 border border-amber-400/40 rounded-xl px-4 py-2 text-amber-200 font-bold mb-6">
                  +{gameScore * 5} Monedas de Oro 🪙
                </div>
                <button
                  onClick={finishMinigame}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 font-black rounded-2xl shadow-lg active:scale-95 transition"
                >
                  Cobrar Recompensa
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
