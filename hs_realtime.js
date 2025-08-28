
/**
 * hs_realtime.js
 * Local-first storage with optional Firebase Realtime Database.
 * - Without Firebase: writes to localStorage and broadcasts across tabs.
 * - With Firebase: writes/reads a shared collection for realtime across devices.
 */

let firebaseApp = null;
let rtdb = null;
let bc = null;

function getLocalAll() {
  try {
    return JSON.parse(localStorage.getItem('hs_submissions') || '[]');
  } catch { return []; }
}
function setLocalAll(arr) {
  localStorage.setItem('hs_submissions', JSON.stringify(arr));
}
function pushLocal(doc) {
  const all = getLocalAll();
  all.push(doc);
  setLocalAll(all);
  // notify other tabs
  if (bc) bc.postMessage({ type: 'add', payload: doc });
}

export async function initRealtime({ ENABLE_FIREBASE, FIREBASE_CONFIG }) {
  bc = ('BroadcastChannel' in self) ? new BroadcastChannel('hs_submissions') : null;
  const state = { mode: 'local', onChange: () => {} };

  if (bc) {
    bc.onmessage = (ev) => {
      if (ev?.data?.type === 'add' && state.onChange) state.onChange(ev.data.payload);
    };
  }

  if (ENABLE_FIREBASE && FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey) {
    try {
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
      const { getDatabase, ref, push, onChildAdded, query, orderByChild, startAt } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js');
      firebaseApp = initializeApp(FIREBASE_CONFIG);
      rtdb = getDatabase(firebaseApp);
      state.mode = 'firebase';

      state.submit = async (data) => {
        await push(ref(rtdb, 'hs_submissions'), data);
      };

      // wire a listener that caller can register via bindSession
      state.bindSession = (sessionId, cb) => {
        state.onChange = cb;
        const baseRef = ref(rtdb, 'hs_submissions');
        // simple listing; client filters by sessionId in callback
        onChildAdded(baseRef, (snap) => {
          const val = snap.val();
          cb(val);
        });
      };

      // Also provide a local snapshot load for convenience
      state.loadAll = async () => ({ items: [] }); // Firebase stream handles it

      return state;
    } catch (e) {
      console.warn('Firebase unavailable, falling back to local mode', e);
    }
  }

  // Local mode implementation
  state.submit = async (data) => pushLocal(data);
  state.bindSession = (sessionId, cb) => {
    state.onChange = (doc) => { if (!sessionId || doc.session_id === sessionId) cb(doc); };
    // seed existing local data for the session
    const all = getLocalAll().filter(d => !sessionId || d.session_id === sessionId);
    setTimeout(() => { all.forEach(cb); }, 0);
    // storage event (different tabs, same origin) as a backup
    window.addEventListener('storage', (evt) => {
      if (evt.key === 'hs_submissions') {
        const now = getLocalAll().filter(d => !sessionId || d.session_id === sessionId);
        // naive sync: send last item
        const last = now[now.length - 1];
        if (last) cb(last);
      }
    });
  };
  state.loadAll = async () => ({ items: getLocalAll() });
  return state;
}

export async function submitHS(realtime, data) {
  return realtime.submit(data);
}
