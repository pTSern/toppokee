System.register([], function (_export, _context) {
  "use strict";

  var cc, percentJd, timer, Application;
  function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
  function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
  function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
  function onProgress(percent) {
    if (percent > percentJd) {
      percentJd = percent;
    }
    var splash = document.getElementById('splash');
    if (splash) {
      var progressBar = splash.querySelector('.progress-bar span');
      if (progressBar) {
        progressBar.style.width = "".concat(percent, "%");
        console.log("Loading progress: ".concat(percent, "%"));
      }
    }
  }

  // Make onProgress globally accessible

  // Start a slower, more realistic progress simulation
  function startProgressSimulation() {
    if (timer) {
      clearInterval(timer);
    }
    timer = setInterval(function () {
      if (percentJd < 85) {
        // Stop at 85% to wait for actual game loading
        percentJd += Math.random() * 3 + 1; // Random increment between 1-4%
        onProgress(Math.min(percentJd, 85));
      } else {
        clearInterval(timer);
        timer = null;
      }
    }, 200); // Faster updates for smoother animation
  }

  //------------End: updata Progress-----------------
  return {
    setters: [],
    execute: function () {
      //--------------- Start: updata Progress--------------
      percentJd = 0;
      timer = null;
      window.onProgress = onProgress;
      _export("Application", Application = /*#__PURE__*/function () {
        function Application() {
          _classCallCheck(this, Application);
          this.settingsPath = 'src/settings.c881d.json';
          this.showFPS = true;
          this.timer = null;
        }
        _createClass(Application, [{
          key: "init",
          value: function init(engine) {
            cc = engine;
            cc.game.onPostBaseInitDelegate.add(this.onPostInitBase.bind(this));
            cc.game.onPostSubsystemInitDelegate.add(this.onPostSystemInit.bind(this));

            // Start progress simulation when engine is initialized
            startProgressSimulation();
            this.timer = timer; // Store reference for cleanup
          }
        }, {
          key: "onPostInitBase",
          value: function onPostInitBase() {
            // cc.settings.overrideSettings('assets', 'server', '');
            // Update progress when base is initialized
            onProgress(60);
          }
        }, {
          key: "onPostSystemInit",
          value: function onPostSystemInit() {
            // Update progress when subsystems are initialized
            onProgress(75);
          }
        }, {
          key: "start",
          value: function start() {
            console.log('Starting Cocos game...');
            onProgress(80);
            return cc.game.init({
              debugMode: true ? cc.DebugMode.INFO : cc.DebugMode.ERROR,
              settingsPath: this.settingsPath,
              overrideSettings: {
                // assets: {
                //      preloadBundles: [{ bundle: 'main', version: 'xxx' }],
                // }
                profiling: {
                  showFPS: this.showFPS
                }
              }
            }).then(function () {
              console.log('Game initialized, starting to run...');
              onProgress(90);
              return cc.game.run();
            }).then(function () {
              console.log('Game is running');
              onProgress(95);
            });
          }
        }]);
        return Application;
      }());
    }
  };
});