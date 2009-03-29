/********************** JavaScript Arena, user interface code *****************************/

arena.event = {
  lastEventTime  : 0,  // Last repeatable event triggered time, IE event has no details
  lastEventHash  : '', // Last repeatable event's hash, if different then reset
  lastEventCount : 0,  // Count of same repeatable event
  lastForeground : arena.foreground, // Last set foreground

  lastMouseEvent : '', // Last mouse event, checked only on map double click handler
  lastMouseX : -1, // Last mouse hover position, x
  lastMouseY : -1, // Last mouse hover position, y
  lastHint   : '', // Last status bar hint
  lastCursor : '', // Last in use map cursor

  lastMapInputValue : '',
  mapInputMode : false, // True when inputing, false when not inputing

  lastSubmenu: null, // last sub-menu id
  submenuTimer: null, // sub-menu disappear timer

  /*********************** Event helpers ***********************/

  // IE does not count event, so we have to do it ourself.
  checkRepeat : function(evt, hash) {
    if (evt.detail) return; // Modern browsers are good.
    // Well, except Opera limited to 2 clicks, but can't set its event detail. Too bad.
    var time = new Date().getTime(); // IE? Long way to catch up...
    if (hash != this.lastEventHash || time-this.lastEventTime > 500) {
      this.lastEventCount = 0;
      evt.detail = 1;
    } else {
      ++this.lastEventCount;
      evt.detail = this.lastEventCount + 1;
    }
    this.lastEventTime = time;
    this.lastEventHash = hash;
  },

  /*********************** Document events ***********************/
  documentMouseUpDown : function(evt) {
    //$('debug').innerHTML += evt.originalTarget+',';
    //console.log(evt);
    var target = evt.target || evt.srcElement;
    if (target && target.tagName && target.tagName.toLowerCase() == "body" && arena.tool) {
      arena.tool.outOfCanvas(evt);
      arena.ui.focusMapInput();
    }
  },

  /*********************** Grid map events ***********************/
  /** When cell is mouse pressed **/
  cellPress : function(evt, x, y) {
    this.checkRepeat(evt, 'press'+x+','+y);
    this.lastMouseEvent = 'down';
    if (arena.tool) {
      arena.tool.down(evt, x, y);
      this.updateCursor(evt, x, y);
      arena.ui.setHint(arena.tool.hint(evt, x, y));
    }
    if (evt.preventDefault) evt.preventDefault(); else evt.returnValue = false;
    arena.ui.focusMapInput();
  },

  /** When cell is mouse released **/
  cellHover : function(evt, x, y) {
//    arena.ui.clearSelection(); // Clear text selection, already prevented by preventDefault, yes!
    if (x == this.lastMouseX && y == this.lastMouseY) return;
    this.lastMouseEvent = 'move';
    if (arena.tool) {
      arena.tool.move(evt, x, y);
      this.updateCursor(evt, x, y);
      arena.ui.setHint(arena.tool.hint(evt, x, y));
    }
    this.lastMouseX = x;
    this.lastMouseY = y;
    var cell = arena.map.cells[y][x];
    $('current_foreground').style.backgroundColor = cell.getForeground();
    var back = cell.getBackground();
    $('current_background').style.backgroundColor = back;
    $('current_foreground').style.border = "1px solid "+back;
    x += arena.map.dx;
    y += arena.map.dy;
    arena.ui.setStatusTwoPoint('coordinate_status', 'X', x, 'Y', y);
    arena.ui.setStatusTwoPoint('dimension_status', 'W', arena.toolWidth, 'H', arena.toolHeight);
  },

  /** When cell is mouse released **/
  cellRelease : function(evt, x, y) {
    if (!evt.detail && this.lastMouseEvent == 'up' && this.lastMouseX == x && this.lastMouseY == y)
      this.cellPress(evt, x, y); // Recreate IE's missing mousedown event on double click
    this.lastMouseEvent = 'up';
    if (arena.tool) {
      arena.tool.up(evt, x, y);
      this.updateCursor(evt, x, y);
      arena.ui.setHint(arena.tool.hint(evt, x, y));
    }
    arena.ui.focusMapInput();
  },

  /** Set map cursor */
  updateCursor : function(evt, x, y) {
    cursor = arena.tool.cursor(evt, x, y);
    if (cursor != this.lastCursor) {
      this.lastCursor = cursor;
      $('map').style.cursor = cursor;
    }
  },

  /**************************** Toolbox events ****************************/

  newMapOnClick : function(evt) {
    var x, y;
    while (x == undefined) {
      x = prompt("Width of new map (1-99)", arena.map.width);
      if (x == null) return;
      else if (+x != x || +x <= 0 || +x > 99) x = undefined;
    }
    while (y == undefined) {
      y = prompt("Height of new map (1-99)", arena.map.height);
      if (y == null) return;
      else if (+y != y || +y <= 0 || +y > 99) y = undefined;
    }
    arena.map.recreate(+x, +y);
  },

  exportOnClick : function(evt) {
    arena.ui.showDialog('export');
  },

  dlgExportClick : function(evt) {
    arena.ui.hideDialog('export');
    if ($('dlg_ex_txt').checked)
      arena.io.exportToTxt(arena.map, arena.map.masked);
    else if ($('dlg_ex_bbc').checked)
      arena.io.exportToBBC(arena.map, arena.map.masked);
    else if ($('dlg_ex_irc').checked)
      arena.io.exportToIRC(arena.map, arena.map.masked);
    else if ($('dlg_ex_html').checked)
      arena.io.exportToHtml(arena.map, arena.map.masked);
  },

  setForegroundOnClick : function(evt) {
    arena.commands.run(new arena.commands.SetForeground(arena.foreground, arena.map.masked));
    arena.ui.focusMapInput();
  },

  setBackgroundOnClick : function(evt) {
    arena.commands.run(new arena.commands.SetBackground(arena.background, arena.map.masked));
    arena.ui.focusMapInput();
  },

  mapInputKeyDown : function(evt) {
    this.lastMapInputValue = $('mapinput').value;
    switch (evt.keyCode) {
      case 40: // Down
      case 39: // Right
      case 38: // Up
      case 37: // Left
      case 46: // Delete
        if (!this.mapInputMode && arena.tool && arena.tool.key) {
          if (evt.preventDefault) evt.preventDefault(); else evt.returnValue = false;
          arena.tool.key(evt);
          arena.ui.focusMapInput();
        }
        break;

      case 27: // Escape: send cancel command to tool
        if (!this.mapInputMode && arena.tool && arena.tool.cancel) {
          arena.tool.cancel();
          this.updateCursor(evt, this.lastMouseX, this.lastMouseY);
        }
        arena.ui.focusMapInput();
        break;
      case 13: // Enter: set text
        arena.event.setTextOnClick(evt);
        arena.ui.focusMapInput();
        break;

      case 9: // Tab - TODO: Switch to chat input
        if (evt.preventDefault) evt.preventDefault(); else evt.returnValue = false;
        arena.ui.focusMapInput();
        break;
    }
  },

  mapInputKeyUp : function(evt) {
    this.mapInputMode = this.lastMapInputValue != $('mapinput').value;
  },

  setTextOnClick : function(evt) {
    arena.commands.run(new arena.commands.SetText($("mapinput").value, arena.map.masked));
    arena.ui.focusMapInput();
  },

  setAllOnClick : function(evt) {
    arena.commands.run(new arena.commands.SetCell($("mapinput").value, arena.foreground, arena.background, arena.map.masked));
    arena.ui.focusMapInput();
  },

  paletteOnClick : function(evt, colour) {
    this.checkRepeat(evt, 'palette'+colour);
    if (evt.ctrlKey || evt.metaKey) { // Quick set foreground: ctrl+press
      arena.commands.run(new arena.commands.SetForeground(colour, arena.map.masked));
    } else if (evt.altKey) { // Quick set background: alt+press
      arena.commands.run(new arena.commands.SetBackground(colour, arena.map.masked));
    } else if (evt.detail % 2 == 1) {
      this.lastForeground = arena.foreground;
      arena.ui.setForeground(colour);
    } else { // Double click: restore foreground and set background instead
      arena.ui.setForeground(this.lastForeground);
      arena.ui.setBackground(colour);
    }
    arena.ui.focusMapInput();
  },

  hideSubmenu : function() {
    if (!this.lastSubmenu) return;
    $(this.lastSubmenu).style.display = 'none';
    this.lastSubmenu = null;
  },
  submenuOnHover : function(evt, menu) {
    if (this.submenuTimer) {
      if (this.lastSubmenu != menu) this.hideSubmenu();
      clearTimeout(this.submenuTimer);
      this.submenuTimer = null;
    }
    if (!$(menu).style.display || $(menu).style.display == 'none') {
      $(menu).style.display = 'table';
      this.lastSubmenu = menu;
    }
  },
  submenuOnExit : function(evt) {
    if (this.submenuTimer) clearTimeout(this.submenuTimer);
    this.submenuTimer = setTimeout("arena.event.hideSubmenu()", 500);
  },

  glyphOnClick : function(evt, glyph) {
    $("mapinput").value = glyph;
    if (evt.ctrlKey || evt.metaKey) // Quick set text: ctrl+press
      arena.commands.run(new arena.commands.SetText(glyph, arena.map.masked));
    arena.ui.focusMapInput();
  },
}

arena.ui = {
  /*********************** Toolbox functions ***********************/
  createColourPalette : function() {
    var p = $('palette');
    var palette = arena.lang.static.palette;
    var i = 0, td, tr, tbody = $('palette').firstChild;
    for (var c in palette) { var colour = palette[c];
      if (i % 2 == 0) tr = document.createElement('tr');
      if (i == 0) this.setForeground(colour);
      if (i == 1) this.setBackground(colour);
      td = document.createElement('td');
      td.setAttribute('onclick', 'arena.event.paletteOnClick(event,"'+colour+'")');
      td.setAttribute('ondblclick', 'if(!event.detail)arena.event.paletteOnClick(event,"'+colour+'")');
      td.setAttribute('onmouseover', 'arena.event.submenuOnHover(event,"palette");arena.ui.hint("tool|barhint_Colour")');
      td.setAttribute('onmouseout', 'arena.event.submenuOnExit(event);');
      td.setAttribute('style', 'background-color:'+colour);
      td.setAttribute('title', c);
      td.setAttribute('class', 'palette');
      tr.appendChild(td);
      if (i++ % 2 != 0) tbody.appendChild(tr);
    }
  },

  createGlyph : function() {
    var glyph = arena.lang.static.glyph;
    var i = 0, btn, g = $('glyph');
    for (var i = 0; i < glyph.length; i++) {
      btn = document.createElement('div');
      btn.setAttribute('onclick', 'arena.event.glyphOnClick(event,"'+glyph[i]+'")');
      btn.setAttribute('onmouseover', 'arena.ui.hint("tool|barhint_Glyph")');
      btn.setAttribute('class', 'tool glyph');
      btn.innerHTML = glyph[i];
      g.appendChild(btn);
      if (i+1 % 3 == 0) g.appendChild(document.createElement('br'));
    }
  },

  setForeground : function (colour) {
    arena.foreground = colour;
    $('cmd_Foreground').style.backgroundColor = colour;
  },

  setBackground : function (colour) {
    arena.background = colour;
    $('cmd_Background').style.backgroundColor = colour;
    $('cmd_Foreground').style.border = '2px solid '+colour;
  },

  focusMapInput : function() {
    $('mapinput').focus();
    $('mapinput').select();
    arena.event.mapInputMode = false;
  },

  /*********************** Status bar functions ***********************/
  setHint : function(hint) {
    if (hint == this.lastHint) return;
    $('hint').innerHTML = hint;
    this.lastHint = hint;
  },
  setStatus : function(status) {
    $('status').innerHTML = status;
  },

  setStatusTwoPoint : function(id, xlabel, x, ylabel, y) {
    var status = xlabel + ':';
    if (x < 10) status += '&nbsp;';
    status += x + ' ' + ylabel + ':';
    if (y < 10) status += '&nbsp;';
    status += y;
    $(id).innerHTML = status;
  },

  /*********************** Dialog functions ***********************/
  showDialog : function (id) {
    if (!$('dialog_'+id)) return;
    $('mask').style.display = 'block';
    $('dialog_'+id).style.display = 'block';
    $('dialog_container').style.display = 'table';
  },

  hideDialog : function (id) {
    if (!$('dialog_'+id)) return;
    $('dialog_container').style.display = 'none';
    $('dialog_'+id).style.display = 'none';
    $('mask').style.display = 'none';
  },

  /*********************** Other ui functions ***********************/
  // Set hint.  Hint may be a language resource
  hint : function(hint) {
    hint = hint.split('|');
    var result = arena.lang;
    while (hint.length) result = result[hint.shift()];
    this.setHint(result);
  },

  // Remove text selection.
  // Copied from http://bytes.com/groups/javascript/635488-prevent-text-selection-after-double-click
  clearSelection : function() {
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
//      var sel = window.getSelection();
//      if(sel && sel.rangeCount == 0 && sel.removeAllRanges) sel.removeAllRanges();
    } else if (document.selection && document.selection.empty) {
      if (document.selection.collapse) document.selection.collapse();
      else if (document.selection.empty) document.selection.empty();
    }
  },
}

arena.ui.createColourPalette();
arena.ui.createGlyph();