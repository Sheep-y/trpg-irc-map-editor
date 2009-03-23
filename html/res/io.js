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
    var win = window.open('html/popup_copy.html', 'clipboard', 'width=500,height=400');
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
        if (bkgd != lastBackground) {
          result += '\u0003' + (+cMap[frgd]) + ',' + cMap[bkgd];
          lastForeground = frgd;
          lastBackground = bkgd;
        } if (frgd != lastForeground) {
          result += '\u0003' + cMap[frgd];
          lastForeground = frgd;
        }
        var c = cell.getText();
        result += (c == '') ? '  ' : c;
      }
      // Remove end of line empty cell. Background may not show, disabled.
      // result = result.replace(/((\x03?\d+)?\s*)+$/, '');
      result += '\n';
    }
    this.exportToClipboard(result);
  },
}
