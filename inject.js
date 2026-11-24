/*
 * Lógica pura para insertar el widget del Profesor Virtual en el index.html
 * de un curso exportado de Rise. Se usa en el navegador (index.html) y en Node (pruebas).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PV = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULT_SCRIPT_URL =
    'https://pjenl.blackboard.com/bbcswebdav/institution/ECTOTEC/Profesorvirtual/profesorvirtual/script.js';

  // Bloque que ya existiera (con el formato de la herramienta anterior o de esta).
  var EXISTING_BLOCK = /\n  <script>\n    \/\/ Configuración del Profesor Virtual Widget[\s\S]*?<\/script>\n\n  <!-- Incluir el widget del Profesor Virtual[\s\S]*?<\/script>\n/;

  // Evita que un valor escrito por el usuario cierre la etiqueta <script> antes de tiempo.
  function safeForScript(text) {
    return String(text).replace(/<\/(script)/gi, '<\\/$1');
  }

  function buildBlock(opts) {
    var courseId = String(opts.courseId == null ? '' : opts.courseId).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/[\r\n]/g, '');
    var docs = safeForScript(opts.documents == null ? '' : opts.documents);
    var url = String(opts.scriptUrl || DEFAULT_SCRIPT_URL).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/[\r\n]/g, '');
    // Sin contenido: deja el arreglo igual que la herramienta original ("[\n\n    ]").
    var docsBody = docs.trim() === '' ? '\n' : '\n' + docs.replace(/\s+$/, '') + '\n';
    return (
      '\n  <script>\n' +
      '    // Configuración del Profesor Virtual Widget\n' +
      "    GLOBAL_COURSE_ID = '" + courseId + "';\n" +
      '    GLOBAL_DOCUMENTS = [\n' + docsBody + '    ];\n' +
      '  </script>\n' +
      '\n' +
      '  <!-- Incluir el widget del Profesor Virtual (con cache buster) -->\n' +
      '  <script>\n' +
      '    (function(){\n' +
      "      var p='" + url + "';\n" +
      "      var d=new Date(),t=d.getFullYear()+''+(d.getMonth()+1).toString().padStart(2,'0')+d.getDate().toString().padStart(2,'0')+d.getHours().toString().padStart(2,'0')+d.getMinutes().toString().padStart(2,'0')+d.getSeconds().toString().padStart(2,'0');\n" +
      "      var s=document.createElement('script');s.src=p+'?'+t;document.body.appendChild(s);\n" +
      '    })();\n' +
      '  </script>\n'
    );
  }

  /**
   * Devuelve { html, status } donde status es 'added' o 'replaced'.
   * Lanza Error si el HTML no tiene </body>.
   */
  function injectWidget(html, opts) {
    var status = 'added';
    if (EXISTING_BLOCK.test(html)) {
      html = html.replace(EXISTING_BLOCK, '');
      status = 'replaced';
    }
    var idx = html.toLowerCase().lastIndexOf('</body>');
    if (idx === -1) throw new Error('El index.html no contiene la etiqueta </body>.');
    return { html: html.slice(0, idx) + buildBlock(opts) + html.slice(idx), status: status };
  }

  /** Ruta del index.html principal dentro del zip (el menos profundo). */
  function findIndexPath(paths) {
    var found = paths
      .filter(function (p) { return /(^|\/)index\.html$/i.test(p); })
      .sort(function (a, b) { return a.split('/').length - b.split('/').length; });
    return found[0] || null;
  }

  function outputName(name) {
    var base = name.replace(/\.zip$/i, '');
    return base + '-modificado.zip';
  }

  return {
    DEFAULT_SCRIPT_URL: DEFAULT_SCRIPT_URL,
    buildBlock: buildBlock,
    injectWidget: injectWidget,
    findIndexPath: findIndexPath,
    outputName: outputName
  };
});
