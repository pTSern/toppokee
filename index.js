System.register(["./application.js"], function (_export, _context) {
  "use strict";

  var Application, canvas, $p, bcr, application;
  // Is the loading completed?
  function setLoadingDisplay() {
    console.log('Engine is initialized');
    cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
      console.log('game run over');
      splash.style.display = 'none';
      if (application.timer) {
        clearInterval(application.timer);
      }
    });
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
      application = new Application();
      topLevelImport('cc').then(function (engine) {
        //monitor
        setLoadingDisplay();
        return application.init(engine);
      }).then(function () {
        return application.start();
      })["catch"](function (err) {
        console.error(err);
      });
    }
  };
});