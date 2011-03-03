/********************** JavaScript Arena, I/O code *****************************/
arena.io = {

  /** Acquire export boundary */
  getExportArea : function(map, area) {
    if (area && area.length > 0) {
      return arena.coListBounds(area);
    } else {
      minX = minY = 0;
      maxX = map.width-1;
      maxY = map.height-1;
      return [minX, minY, maxX, maxY];
    }
  },

  /** Export a string to clipboard *
  exportToClipboard : function(target) {
    var win = window.open('html/popup_copy.html', 'clipboard', 'width=500,height=400,menubar=1,resizable=1,scrollbars=1');
    if (!win) alert(arena.lang.error.CannotOpenWindow);
    else { var doc = win.document;
      doc.writeln("<!DOCTYPE HTML>\n<html><head>\n<title>Copy text</title>\n<meta http-equiv='Content-Type' content='text/html; charset=utf-8'>\n</head><body>");
      doc.writeln("<div>"+arena.lang.io.CopyInstruction+"</div>");
      doc.writeln("<textarea id='result' onkeyup='if(!this.value)window.close();' rows='20' cols='60'>"+target+"</textarea>");
      doc.writeln("<script type='text/javascript'>with(document.getElementById('result')){select();focus();}</script>");
      doc.writeln("</body></html>");
      doc.close();
    }
  },/
  
  /** Export a string as a web page */
  exportAsDoc : function(target) {
    var win = window.open('', 'clipboard', 'width=660,height=500,menubar=1,resizable=1,scrollbars=1');
    if (!win) alert(arena.lang.error.CannotOpenWindow);
    else { var doc = win.document;
      doc.write(target);
      doc.close();
    }
  },

  /** Get save data of this map */
  getSaveData : function(map) {
    return {
      id: 'sheepy.arena.20101025.', // data structure version, shouldn't change unless structure change.
      data: {
        maps: [{
          name: map.name,
          width: map.width,
          height: map.height,
          background : map.background_fill,
          masked: map.masked,
          layers: map.layers,
        }]
      }
    };
  },
  
  
  /************************ Previous builds *****************************
     
  { "build" : 20101018,
    "format" : "json.zip.base64", // Or "json", or "json.zip"
    "maps" : Base64(Deflate(Base64( [{
        name: map.name,
        width: map.width,
        height: map.height,
        background : map.background_fill,
        masked: map.masked,  
        layers: map.layers
      }] ))) }
      
  { "id" : "sheepy.arena.20101025.json-zip-base64", // Or "json", or "json-zip"
    "data" : Base64(Deflate(Base64( { maps : [{
        name: map.name,
        width: map.width,
        height: map.height,
        background : map.background_fill,
        masked: map.masked,  
        layers: map.layers
      }] } ))) }
  
  /************************ Save / Load ********************************/

  /** List saved map */  
  listSaves : function(server) {
    if (server == 'local') {
      var list = localStorage['sheepy.arena.saveList'];
      if (!list || !list.length) return [];
      else return JSON.parse(list);
    }
  }, 

  /** Save current map */  
  saveMap : function(name, server) {
    if (server == 'local') {
      var list = this.listSaves(server);
      // Add name
      list.push(name);
      // Remove name if exists
      for (var i = list.length-2; i >= 0; i--)
        if (list[i] == name) {
          list.splice(list.length-1, 1);
          break;
        }
      // Save and update save list
      localStorage['sheepy.arena.save.'+name] = this.exportToJSON(arena.map, null, 'zip');
      localStorage['sheepy.arena.saveList'] = JSON.stringify(list);
    }
  }, 

  /** Load a map */
  loadMap : function(name, server) {
    if (server == 'local') {
      // Get data
      var data = localStorage['sheepy.arena.save.'+name];
      if (!data) {
        return arena.lang.error.SaveNotFound;
      }
      // And import
      return this.importFromJSON(data);
    }
  },

  /** Delete a saved map */  
  deleteSave : function(name, server) {
    if (server == 'local') {
      // Delete item
      localStorage.deleteItem('sheepy.arena.save.'+name);
      // And update save list
      var list = this.listSaves(server);
      for (var i = list.length; i >= 0; i--)
        if (list[i] == name) {
          list.splice(i, 1);
          localStorage['sheepy.arena.saveList'] = JSON.stringify(list);
          break;
        }
    }
  },
  
  /************************** Import **********************************/

  /** Import map from json format */  
  importFromJSON : function(data) {
    var cleanup = false;
    var result = arena.lang.error.CannotRestore;
    
    try {
      // Zip library from http://github.com/dankogai/js-deflate
      var restore = JSON.parse(data);
    } catch (err) {
    }
    
    // Basic checkings and version normalisation
    if (restore && !restore.id && restore.build && restore.build <= 20101018 && restore.maps) {
      restore.id = 'sheepy.arena.'+restore.build+'.'+restore.format.replace(/\./g,'-');
      restore.data = restore.maps;
      delete restore.maps;
    } else if (!restore || !restore.id   || typeof(restore.id)  != "string"
                        || !restore.data ) {
      return arena.lang.error.MalformedSave;
    }

    var spec = restore.id.match(/^sheepy\.arena\.(\d{8})\.([\w-]+)$/);
    
    if (!spec || spec.length != 3) return arena.lang.error.MalformedSave;
    
    var build = restore.build = +spec[1];
    var format = restore.format = spec[2];

    // Parse map data
    var maps = null;
    if (format.match(/-zip/) && !RawDeflate.inflate) {
      alert(arena.map.err_NoDeflate);
    } else {
      if (format == 'json-zip-base64')
        //data = JSON.parse(RawDeflate.Base64.decode(RawDeflate.inflate(RawDeflate.Base64.decode(restore.data))));
        data = JSON.parse(RawDeflate.Base64.decode(RawDeflate.inflate(RawDeflate.Base64.decode(restore.data))));
      else if (format == 'json-zip')
        data = JSON.parse(RawDeflate.Base64.decode(RawDeflate.inflate(restore.data)));
      else if (format == 'json')
        data = restore.data;
      else
        return arena.lang.error.MalformedSave;
    }
    if (build <= 20101018) data = { maps: data };
    if (data) {
      try {
        cleanup = true; // Map is erased below this point, mark cleaup on failure
        arena.io.restoreMaps(data);
        // Refresh and reset
        arena.ui.updateLayers();
        arena.map.repaint();
        result = true;
        cleanup = false;
      } catch (err) {
        if (console && console.error) console.error(err);
        result = arena.lang.error.CannotRestore;
      }
    } else {
      result = arena.lang.error.MalformedSave;
    }
    
    // Reset if we got unknown error
    if (cleanup) {
      arena.reset();
    }
    return result;
  },

  /** Given map data, try to restore maps */  
  restoreMaps : function(data) {
    var maps = data.maps;
    arena.commands.resetUndo();
    arena.map.layer = null;
    arena.map.layers = [];
    var map = maps[0];
    
    if (map.width != arena.map.width || map.height != arena.map.height)
      arena.map.recreate(map.width, map.height);
    arena.map.name = map.name;
    arena.map.background_fill = map.background;
    
    for (var i = 0; i < map.layers.length; i++) {
      // Do each layer
      var l = map.layers[i];
      var nl = new arena.Layer(arena.map, l.name);
      nl.visible = l.visible;
      
      for (var y = l.cells.length-1; y >= 0; y--)
        // Do each row
        if (l.cells[y]) {
          var row = l.cells[y];
          var newRow = []; 
          nl.cells[y] = newRow;
          
          for (var x = row.length-1; x >= 0; x--)
            if (row[x]) {
              // Restore cell
              var c = row[x];
              var newc = new arena.Cell(x, y)
              newRow[x] = newc;
              newc.text = c.text;
              newc.background = c.background;
              newc.foreground = c.foreground;
            }
        } 
    }
    arena.map.setMasked(map.masked);
  },


  /************************** Export **********************************/
  
  /** Export whole map in compressed JSON format */
  exportToJSON : function(map, area, type) {
    if (!JSON.stringify)
      return arena.lang.err_NoJSON;
    var data = this.getSaveData(map); 
    data.id += 'json';
    // Zip library from http://github.com/dankogai/js-deflate
    if (RawDeflate.deflate && (type=='zip'||type=='zip-base64') ) {
      // Encode non-ascii, then zip
      var json = JSON.stringify(data.data);
      var zipped = RawDeflate.deflate(RawDeflate.Base64.encode(json));
      if (type=='zip-base64')
         zipped = RawDeflate.Base64.encode(zipped);
      if (zipped.length < json.length) {
        data.id += '-zip'
        if (type=='zip-base64')
          data.id += '-base64';
        data.data = zipped;
      }
    }
    var result = JSON.stringify(data);
    //this.exportToClipboard(result);
    return result;
  },

  /** Export in IRC syntax **/
  exportToIRC : function(map, area) {
    var bounds = this.getExportArea(map, area);
    var minX = bounds[0], maxX = bounds[2];
    var minY = bounds[1], maxY = bounds[3];
    // Export part
    var lastForeground, lastBackground, result = '';
    var cMap = { // mIRC colour map
      '#FFF':'00', '#000':'01', '#006':'02', '#090':'03',
      '#F00':'04', '#600':'05', '#909':'06', '#F60':'07',
      '#FF0':'08', '#0F0':'09', '#099':'10', '#0FF':'11',
      '#00F':'12', '#F0F':'13', '#666':'14', '#CCC':'15'
    };
    var cells = map.cells;
    for (var y = minY; y <= maxY; y++) { var row = cells[y];
      lastForeground = lastBackground = undefined;
      for (var x = minX; x <= maxX; x++) { var cell = row[x];
        var bkgd = cell.background;
        var frgd = cell.foreground;
        var txt = cell.text;
        if (bkgd != lastBackground) {
          result += '\u0003' + (+cMap[frgd]) + ',' + cMap[bkgd];
          lastForeground = frgd;
          lastBackground = bkgd;
        } else if (frgd != lastForeground && txt) {
          var trimmed = txt.replace(/^\s+/, ''); // kill spaces
          if (trimmed) {
            result += '\u0003' + cMap[frgd];
            lastForeground = frgd;
          }
        }
        result += txt;
      }
      // Remove end of line empty cell. Background may not show, disabled.
      // result = result.replace(/((\x03?\d+)?\s*)+$/, '');
      result += '\n';
    }
    result = result.slice(0, -1); // Kill trailing space
    //this.exportToClipboard(result);
    return result;
  },


  /** Export in BBCode syntax, foreground only **/
  exportToBBC : function(map, area) {
    var bounds = this.getExportArea(map, area);
    var minX = bounds[0], maxX = bounds[2];
    var minY = bounds[1], maxY = bounds[3];
    // Export part
    var lastForeground, result = '';
    var cells = map.cells;
    for (var y = minY; y <= maxY; y++) { var row = cells[y];
      for (var x = minX; x <= maxX; x++) { var cell = row[x];
        var frgd = cell.foreground;
        var txt = cell.text;
        if (frgd != lastForeground && txt) {
          var trimmed = txt.replace(/^\s+/, '') // kill spaces
          if (trimmed) {
            result += '[/color][color=' + frgd + ']';
            lastForeground = frgd;
          }
        }
        result += cell.text;
      }
      result += '\n';
    }
    result = result.slice(8,-1); // Removes leading tag and ending line break
    if (result.replace(/^\s+/, '').length > 0) result += '[/color]';
    //this.exportToClipboard(result);
    return result;
  },

  /** Export in plain text **/
  exportToTxt : function(map, area) {
    var bounds = this.getExportArea(map, area);
    var minX = bounds[0], maxX = bounds[2];
    var minY = bounds[1], maxY = bounds[3];
    // Export part
    var result = '', cells = map.cells;
    for (var y = minY; y <= maxY; y++) { var row = cells[y];
      for (var x = minX; x <= maxX; x++)
        result += row[x].text;
      result += '\n';
    }
    result = result.slice(0, -1); // Kill trailing space
    //this.exportToClipboard(result);
    return result;
  },

  /** Export in html **/
  exportToHtml : function(map, area) {
    var bounds = this.getExportArea(map, area);
    var minX = bounds[0], maxX = bounds[2];
    var minY = bounds[1], maxY = bounds[3];
    // Export part
    var result = '', cells = map.cells;
    result = "<!DOCTYPE HTML>\n<html><head>\n<title>" + map.title.replace('<', '&lt;').replace('&','&amp;');
    result += "</title>\n<meta http-equiv='Content-Type' content='text/html; charset=utf-8'>\n";
    result += "<style type='text/css'>\n";
    result += " body {margin:1ex;margin:1em;background-color:#888;}\n";
    result += " table {border-spacing:0 0;empty-cells:show;}\n";
    result += " table, table td, table tr {	margin:0;padding:0;}\n";
    result += " #map {background-color:#FFF;border:4px ridge #888;border-collapse:separate;cursor:crosshair;font-family:monospace;}\n";
    result += " #map td {margin:0;min-height:20px;height:20px;max-height:20px;min-width:18px;width:18px;max-width:18px;overflow:hidden;text-align:center;vertical-align:middle;border:1px solid black;}\n";
    result += "</style>\n</head><body><h1>" + map.title.replace('<', '&lt;').replace('&','&amp;') + "</h1><table id='map'>";
    for (var y = minY; y <= maxY; y++) { var row = cells[y];
      result += '<tr>';
      for (var x = minX; x <= maxX; x++) { var cell = row[x]; 
        result += '<td style="color:'+cell.foreground+';background-color:'+cell.background+'">';
        result += cell.text + '</td>';
      }
      result += '</tr>';
    }
    result = result.slice(0, -1); // Kill trailing space
    result += "</table></body></html>";
    this.exportAsDoc(result);
  },
  
}
