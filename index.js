System.register(["./application.js"], function (_export, _context) {
  "use strict";

  var Application, canvas, $p, bcr, engineInitialized, gameStarted, application, splash;
  // Is the loading completed?
  function setLoadingDisplay() {
    console.log('Engine is initialized');
    engineInitialized = true;

    // Listen for when the first scene is actually launched
    cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
      console.log('First scene launched, hiding splash');
      gameStarted = true;
      hideSplash();
    });

    // Also listen for when the game is ready to run
    cc.director.once(cc.Director.EVENT_BEFORE_SCENE_LAUNCH, function () {
      console.log('Scene about to launch, updating progress to 100%');
      if (window.onProgress) {
        window.onProgress(100);
      }
    });
  }
  function hideSplash() {
    var splash = document.getElementById('splash');
    var gameDiv = document.getElementById('GameDiv');
    console.log("[EJS]", splash, gameDiv);
    if (splash) {
      // Add fade out animation
      splash.style.transition = 'opacity 0.5s ease-out';
      splash.style.opacity = '255';

      // Show game div
      if (gameDiv) {
        gameDiv.classList.add('game-ready');
      }
      setTimeout(function () {
        splash.style.display = 'none';
        console.log('Splash screen hidden');
      }, 500);
    }

    // Clear any remaining timers
    if (window.application && window.application.timer) {
      clearInterval(window.application.timer);
    }
  }
  function topLevelImport(url) {
    return System["import"](url);
  }
  return {
    setters: [function (_applicationJs) {
      Application = _applicationJs.Application;
    }],
    execute: function () {
      canvas = document.getElementById('GameCanvas');
      $p = canvas.parentElement;
      bcr = $p.getBoundingClientRect();
      canvas.width = bcr.width;
      canvas.height = bcr.height;

      // Global variables for splash management
      engineInitialized = false;
      gameStarted = false;
      application = new Application();
      window.application = application; // Make it globally accessible

      // Ensure splash is visible initially
      splash = document.getElementById('splash');
      if (splash) {
        splash.style.display = 'block';
        splash.style.opacity = '1';
      }
      topLevelImport('cc').then(function (engine) {
        console.log('Cocos engine loaded, initializing...');
        application.init(engine);
        setLoadingDisplay();
        return application.start();
      }).then(function () {
        console.log('Application started successfully');
      })["catch"](function (err) {
        console.error('Error loading game:', err);
        // Hide splash on error too
        hideSplash();
      });
    }
  };
});