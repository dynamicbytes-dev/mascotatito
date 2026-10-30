/**
 * Servicio de Persistencia Offline y Cálculo de Decaimiento con IndexedDB Nativo
 * Aplicación: "Tito el Conejo"
 */

const DB_NAME = 'TitoElConejoDB';
const DB_VERSION = 1;
const STORE_NAME = 'pet_state';
const STATE_KEY = 'tito_current_state';

// Estado por defecto al iniciar por primera vez
export const DEFAULT_STATE = {
  hunger: 80,       // 0 (muerto de hambre) a 100 (lleno)
  energy: 85,       // 0 (agotado) a 100 (con energía)
  happiness: 90,    // 0 (triste) a 100 (muy feliz)
  coins: 50,        // Monedas del usuario
  isSleeping: false,// Estado de sueño
  lastUpdated: Date.now(), // Marca de tiempo en ms
  totalFeedCount: 0,
  minigamesPlayed: 0
};

// Tasas de decaimiento por minuto (60 segundos)
const DECAY_RATES = {
  AWAKE: {
    hunger: 1.2,     // Pierde ~1.2% por minuto despierto
    energy: 0.8,     // Pierde ~0.8% por minuto despierto
    happiness: 1.0   // Pierde ~1.0% por minuto despierto
  },
  SLEEPING: {
    hunger: 0.4,     // Digestión más lenta al dormir
    energy: -2.5,    // RECUPERA 2.5% de energía por minuto
    happiness: 0.2   // Pérdida mínima de felicidad al dormir
  }
};

/**
 * Abre o inicializa la base de datos IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB no está soportado en este entorno.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('Error al abrir IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Calcula el decaimiento de las estadísticas en función del tiempo transcurrido fuera de la app
 * @param {Object} state - Estado previo guardado
 * @returns {{ state: Object, elapsedMinutes: number, offlineSummary: Object }}
 */
export function calculateOfflineDecay(state) {
  const now = Date.now();
  const lastUpdated = state.lastUpdated || now;
  const elapsedMs = Math.max(0, now - lastUpdated);
  const elapsedMinutes = elapsedMs / (1000 * 60);

  // Si pasaron menos de 3 segundos, no hace falta recalcular
  if (elapsedMinutes < 0.05) {
    return {
      state: { ...state, lastUpdated: now },
      elapsedMinutes: 0,
      offlineSummary: { hungerLost: 0, energyDelta: 0, happinessLost: 0 }
    };
  }

  const rates = state.isSleeping ? DECAY_RATES.SLEEPING : DECAY_RATES.AWAKE;

  const hungerDelta = elapsedMinutes * rates.hunger;
  const energyDelta = elapsedMinutes * rates.energy; // Negativo si recupera
  const happinessDelta = elapsedMinutes * rates.happiness;

  const clamp = (val) => Math.round(Math.min(100, Math.max(0, val)));

  const newHunger = clamp(state.hunger - hungerDelta);
  const newEnergy = clamp(state.energy - energyDelta);
  const newHappiness = clamp(state.happiness - happinessDelta);

  // Si estaba durmiendo y ya recuperó el 100% de energía, Tito se despierta automáticamente
  let newSleeping = state.isSleeping;
  if (state.isSleeping && newEnergy >= 100) {
    newSleeping = false;
  }

  const updatedState = {
    ...state,
    hunger: newHunger,
    energy: newEnergy,
    happiness: newHappiness,
    isSleeping: newSleeping,
    lastUpdated: now
  };

  return {
    state: updatedState,
    elapsedMinutes,
    offlineSummary: {
      hungerLost: Math.round(hungerDelta),
      energyDelta: Math.round(-energyDelta), // positivo = ganado, negativo = perdido
      happinessLost: Math.round(happinessDelta)
    }
  };
}

/**
 * Obtiene el estado actual de Tito, procesando automáticamente el tiempo offline
 * @returns {Promise<{ state: Object, offlineReport: Object|null }>}
 */
export async function getPetState() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(STATE_KEY);

    request.onsuccess = async () => {
      let rawState = request.result ? request.result.data : null;

      if (!rawState) {
        // Primera vez: guardar el estado por defecto
        const initialState = { ...DEFAULT_STATE, lastUpdated: Date.now() };
        await savePetState(initialState);
        resolve({ state: initialState, offlineReport: null });
        return;
      }

      // Aplicar decaimiento por paso del tiempo offline
      const { state: decayedState, elapsedMinutes, offlineSummary } = calculateOfflineDecay(rawState);

      // Guardar el estado recién calculado
      await savePetState(decayedState);

      resolve({
        state: decayedState,
        offlineReport: elapsedMinutes >= 1 ? { elapsedMinutes, ...offlineSummary } : null
      });
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

/**
 * Guarda el estado actual de Tito en IndexedDB
 * @param {Object} state
 * @returns {Promise<boolean>}
 */
export async function savePetState(state) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const payload = {
      id: STATE_KEY,
      data: {
        ...state,
        lastUpdated: Date.now()
      }
    };

    const request = store.put(payload);

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Reinicia el estado de Tito a sus valores por defecto
 * @returns {Promise<Object>}
 */
export async function resetPetState() {
  const freshState = { ...DEFAULT_STATE, lastUpdated: Date.now() };
  await savePetState(freshState);
  return freshState;
}
