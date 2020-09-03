/*
* src/init.vite.js
*
* The entry point for development mode.
*
* There are a couple of reasons for this separate layer between 'index.html' and 'main.js'.
*   - Firebase initialization is crucially different for the 'dev:local' mode vs. 'dev:online' and production.
*   - allows easy differentiation/experiments between Rollup and Vite approaches
*/
//import * as firebase from 'firebase/app'    // DOES NOT WORK (in Vite, dev mode) but is according to npm firebase instructions
import firebase from 'firebase/app'     // works (but does not allow firebaseui from npm :( )
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/functions'

/*
* Don't want to add dependency on 'assert' module.
*/
function assert(cond, msgOpt) {
  if (!cond) {
    if (msgOpt) {
      console.assert(msgOpt);
    }
    throw new Error(`Assertion failed: ${msgOpt || '(no message)'}`);
  }
}

assert(firebase.initializeApp, "Firebase initialization failed");

// As long as loading Firebase via 'import' is shaky (at least with Vite 1.0.0-rc.8 in dev mode), let's place it
// as a global.
//
window.firebase = firebase;
window.assert = assert;

const LOCAL = import.meta.env.MODE === "dev_local";
window.LOCAL = LOCAL;    // inform the UI

// ES note: Seems 'import.meta.env' must be read at the root.
const _MODE = import.meta.env.MODE;

// import.meta.env.MODE:
//    - "dev_local": dev:local
//    - "development": dev:online
//    - ("production": npx vite build) ???
//
//console.debug("import.meta.env.MODE:", import.meta.env.MODE);   // chokes 'vite build'

// Vite does not support top level await (1.0.0.-rc.4) so we need this.
//
async function initFirebase() {   // () => Promise of ()

  // For 'dev:local', we only need authentication information and "any" project will do for that. This allows us to
  // let people try out the repo, before creating a project in Firebase console.
  //
  if (LOCAL) {
    console.info("Initializing for LOCAL EMULATION");

    // Settings to an existing cloud project, used by 'dev:local'
    //
    const justAuthOptions = {
      apiKey: 'AIzaSyD29Hgpv8-D0-06TZJQurkZNHeOh8nKrsk',
      projectId: 'app',     // <-- must match that in 'package.json'
      authDomain: 'vue-rollup-example.firebaseapp.com'
    };

    // Minimum fields, needed for auth. Using a known-to-exist project.
    //
    // Note: project id needs to match that in 'package.json' (carrying it past Vite from 'GCLOUD_PROJECT' was difficult)
    //
    firebase.initializeApp(justAuthOptions);

    // Set up local emulation. Needs to be before any 'firebase.firestore()' use.
    //
    // Note: Would LOVE two things to happen:
    //    - emulation to be a configuration thing for Firebase. Set up there, not here!!
    //    - the 'firebase' object to expose (e.g. 'firebase.emulated: [...]' whether parts are emulated or not)
    //        OR: to have a REST API that exposes these details
    //
    const DEV_FUNCTIONS_URL = "http://localhost:5001";
    const FIRESTORE_HOST = "localhost:6767";    // Could pass this from 'firebase.json' as 'import.meta...' #maybe

    // As instructed -> https://firebase.google.com/docs/emulator-suite/connect_functions#web
    //
    // Note: source code states "change this [functions] instance". But it seems that another 'firebase.functions()'
    //    later must return the same instance, since this works. #firebase #docs #unsure
    //
    firebase.functions().useFunctionsEmulator(DEV_FUNCTIONS_URL);

    firebase.firestore().settings({   // affects all subsequent use (and can be done only once)
      host: FIRESTORE_HOST,
      ssl: false
    });
  } else if (_MODE === "development") {    // dev:online
    console.info("Initializing for cloud back-end; watched local front-end.");

    const mod = await import('../__.js');   // not needed for 'dev:local'
    const {apiKey, authDomain, projectId} = mod.__;

    firebase.initializeApp({
      apiKey,
      projectId,
      authDomain
    });
  } else {      // 'npx vite build' - just TESTING for comparison with Rollup - quality rot warning!!! 💩
    console.warn("Initializing for Vite PRODUCTION (experimental!!!)");

    assert(_MODE === "production");

    // Hack '__' here (allows this to work with any hosting) 🤪
    //
    const json = {
      "apiKey": 'AIzaSyD29Hgpv8-D0-06TZJQurkZNHeOh8nKrsk',
      "projectId": 'vue-rollup-example',
      "authDomain": 'vue-rollup-example.firebaseapp.com'
    };

    firebase.initializeApp(json);
  }
}

(async _ => {
  await initFirebase();
  import('./app.js');
})();