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

  /** Export a string to clipboard */
  exportToClipboard : function(target) {
    var win = window.open('html/popup_copy.html', 'clipboard', 'width=500,height=400,menubar=1,resizable=1,scrollbars=1');
    if (!win) alert(arena.lang.error.CannotOpenWindow);
    else { var doc = win.document;
      doc.writeln("<!DOCTYPE HTML>\n<html><head>\n<title>Copy text</title>\n<meta http-equiv='Content-Type' content='text/html; charset=utf-8'>\n</head><body>");
      doc.writeln("<div>"+arena.lang.io.CopyInstruction+"</div>");
      doc.writeln("<textarea id='result' onkeyup='if(!this.value)window.close();' rows='20', cols='60'>"+target+"</textarea>");
      doc.writeln("<script type='text/javascript'>with(document.getElementById('result')){select();focus();}</script>");
      doc.writeln("</body></html>");
      doc.close();
    }
  },

  /** Export a string as a web page */
  exportAsDoc : function(target) {
    var win = window.open('', 'clipboard', 'width=660,height=500,menubar=1,resizable=1,scrollbars=1');
    if (!win) alert(arena.lang.error.CannotOpenWindow);
    else { var doc = win.document;
      doc.write(target);
      doc.close();
    }
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
        var bkgd = cell.getBackground();
        var frgd = cell.getForeground();
        var txt = cell.getText();
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
    this.exportToClipboard(result);
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
        var frgd = cell.getForeground();
        var txt = cell.getText();
        if (frgd != lastForeground && txt) {
          var trimmed = txt.replace(/^\s+/, '') // kill spaces
          if (trimmed) {
            result += '[/color][color=' + frgd + ']';
            lastForeground = frgd;
          }
        }
        result += cell.getText();
      }
      result += '\n';
    }
    result = result.slice(8,-1); // Removes leading tag and ending line break
    if (result.replace(/^\s+/, '').length > 0) result += '[/color]';
    this.exportToClipboard(result);
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
        result += row[x].getText();
      result += '\n';
    }
    result = result.slice(0, -1); // Kill trailing space
    this.exportToClipboard(result);
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
        result += '<td style="color:'+cell.getForeground()+';background-color:'+cell.getBackground()+'">';
        result += cell.getText() + '</td>';
      }
      result += '</tr>';
    }
    result = result.slice(0, -1); // Kill trailing space
    result += "</table></body></html>";
    this.exportAsDoc(result);
  },
}
