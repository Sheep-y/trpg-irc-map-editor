/********************** JavaScript Arena, user interface code *****************************/

arena.event = {
  lastEventTime  : 0,  // Last repeatable event triggered time, IE event has no details
  lastEventHash  : '', // Last repeatable event's hash, if different then reset
  lastEventCount : 0,  // Count of same repeatable event
  lastForeground : arena.map.foreground, // Last set foreground

  lastKeyEvent : { keyCode: 0 }, // Last key event (object), used to check double tap
  lastMouseEvent : '', // Last mouse event (text), checked only on map double click handler
  lastMouseX : 0, // Last mouse hover position, x
  lastMouseY : 0, // Last mouse hover position, y
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
  
  // Prevent a event from triggering default behaviour
  eatEvent : function(evt, eatSpecial) {
    if (eatSpecial === false) // If don't want to consume special key then check for them
      if (evt.ctrlKey || evt.shiftKey || evt.ctrlKey || evt.metaKey) return;
    if (evt.preventDefault) evt.preventDefault(); else evt.returnValue = false;
  },

  /*********************** Document events ***********************/
  documentMouseUpDown : function(evt) {
    //$('debug').innerHTML += evt.originalTarget+',';
    var target = evt.target || evt.srcElement;
    if (target && target.tagName && target.tagName.toLowerCase() == "body" && arena.map.tool) {
      arena.map.tool.outOfCanvas(evt);
    }
  },

  /*********************** Grid map events ***********************/
  /** When cell is mouse pressed **/
  cellPress : function(evt, x, y) {
    if (!arena.map.layer || !arena.map.layer.visible) return; 
    this.checkRepeat(evt, 'press'+x+','+y);
    this.lastMouseEvent = 'down';
    if (arena.map.tool) {
      arena.map.tool.down(evt, x, y);
      this.updateCursor(evt, x, y);
      arena.ui.setHint(arena.map.tool.hint(evt, x, y));
    }
    if (evt.preventDefault) evt.preventDefault(); else evt.returnValue = false;
  },

  /** When cell is mouse released **/
  cellHover : function(evt, x, y) {
    if (x == this.lastMouseX && y == this.lastMouseY) return;
    if (!arena.map.layer || !arena.map.layer.visible) return; 
    this.lastMouseEvent = 'move';
    if (arena.map.tool) {
      arena.map.tool.move(evt, x, y);
      this.updateCursor(evt, x, y);
      arena.ui.setHint(arena.map.tool.hint(evt, x, y));
    }
    this.lastMouseX = x;
    this.lastMouseY = y;
    var cell = arena.map.cells[y][x];
    $('current_foreground').style.backgroundColor = cell.foreground;
    var back = cell.background;
    $('current_background').style.backgroundColor = back;
    $('current_foreground').style.border = "1px solid "+back;
    x += arena.map.dx;
    y += arena.map.dy;
    arena.ui.setStatusTwoPoint('coordinate_status', 'X', x, 'Y', y);
    //$('dimension_status').innerHTML = '['+arena.toolWidth + 'x' + arena.toolHeight+']';
    //arena.ui.setStatusTwoPoint('dimension_status', 'W', arena.toolWidth, 'H', arena.toolHeight);
  },

  /** When cell is mouse released **/
  cellRelease : function(evt, x, y) {
    if (!arena.map.layer || !arena.map.layer.visible) return; 
    if (!evt.detail && this.lastMouseEvent == 'up' && this.lastMouseX == x && this.lastMouseY == y)
      this.cellPress(evt, x, y); // Recreate IE's missing mousedown event on double click
    this.lastMouseEvent = 'up';
    if (arena.map.tool) {
      arena.map.tool.up(evt, x, y);
      this.updateCursor(evt, x, y);
      arena.ui.setHint(arena.map.tool.hint(evt, x, y));
    }
  },

  /** Set map cursor */
  updateCursor : function(evt, x, y) {
    if (!arena.map.layer || !arena.map.layer.visible) {
      cursor = 'no-drop';
    } else {
      cursor = arena.map.tool.cursor(evt, x, y);
    }
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
    arena.commands.run(new arena.commands.SetForeground(arena.map.foreground, arena.map.masked, arena.map.layer));
  },

  setBackgroundOnClick : function(evt) {
    arena.commands.run(new arena.commands.SetBackground(arena.map.background, arena.map.masked, arena.map.layer));
  },

  mapKeyDown : function(evt) {
    // Record press count of same key
    if (this.lastKeyEvent.keyCode == evt.keyCode && evt.timeStamp-this.lastKeyEvent.timeStamp <= 500)
      evt.pressCount = this.lastKeyEvent.pressCount + 1;
    else
      evt.pressCount = 1;
    switch (evt.keyCode) {
      case 27: // Escape: send cancel command to tool
        if (!this.mapInputMode) {
          if (arena.map.tool && arena.map.tool.cancel) {
            arena.map.tool.cancel();
            this.updateCursor(evt, this.lastMouseX, this.lastMouseY);
          }
        } else {
          $('mapinput').value = this.lastMapInputValue;
          arena.ui.focusBody();
        }
        arena.event.eatEvent(evt);
        break;
      case 13: // Enter: set text
        if (!this.mapInputMode) {
          arena.ui.focusMapInput();
          this.lastMapInputValue = $('mapinput').value;
        } else {
//          this.setTextOnClick(evt);
          arena.map.text = $('mapinput').value;
          arena.ui.focusBody();
        }
        arena.event.eatEvent(evt);
        break;

      case 9: // Tab
        arena.event.eatEvent(evt);
        break;
        
      default: 
        if (!this.mapInputMode)
          switch (evt.keyCode) {

      case 32: // Space
      case 40: // Down
      case 39: // Right
      case 38: // Up
      case 37: // Left
      case 46: // Delete
        arena.map.tool.key(evt);
        arena.event.eatEvent(evt);
        break;

      case 66: // B
        arena.tools.setTool(arena.tools.Paint);
        arena.ui.setHint(arena.map.tool.hint(evt, this.lastMouseX, this.lastMouseY));
        arena.event.eatEvent(evt, false);
        break;
      case 84: // T
        arena.tools.setTool(arena.tools.Text);
        arena.ui.setHint(arena.map.tool.hint(evt, this.lastMouseX, this.lastMouseY));
        arena.event.eatEvent(evt, false);
        break;
      case 69: // E
        arena.tools.setTool(arena.tools.Erase);
        arena.ui.setHint(arena.map.tool.hint(evt, this.lastMouseX, this.lastMouseY));
        arena.event.eatEvent(evt, false);
        break;
      case 82: // R
        arena.tools.setTool(arena.tools.Mask);
        arena.ui.setHint(arena.map.tool.hint(evt, this.lastMouseX, this.lastMouseY));
        arena.event.eatEvent(evt, false);
        break;
      case 68: // D
        arena.tools.setTool(arena.tools.Dropper);
        arena.ui.setHint(arena.map.tool.hint(evt, this.lastMouseX, this.lastMouseY));
        arena.event.eatEvent(evt, false);
        break;

      case 48: // 0
        arena.ui.setForeground( evt.pressCount % 2 != 0 ? "#FFF" : "#CCC");
        arena.event.eatEvent(evt, false);
        break;
      case 49: // 1
        arena.ui.setForeground( evt.pressCount % 2 != 0 ? "#000" : "#666");
        arena.event.eatEvent(evt, false);
        break;
      case 50: // 2
        arena.ui.setForeground( evt.pressCount % 2 != 0 ? "#00F" : "#006");
        arena.event.eatEvent(evt, false);
        break;
      case 51: // 3
        arena.ui.setForeground( evt.pressCount % 2 != 0 ? "#0F0" : "#090");
        arena.event.eatEvent(evt, false);
        break;
      case 52: // 4
        arena.ui.setForeground( evt.pressCount % 2 != 0 ? "#F00" : "#600");
        arena.event.eatEvent(evt, false);
        break;
      case 53: // 5
        arena.ui.setForeground( evt.pressCount % 2 != 0 ? "#FF0" : "#F60");
        arena.event.eatEvent(evt, false);
        break;
      case 54: // 6
        arena.ui.setForeground( evt.pressCount % 2 != 0 ? "#F0F" : "#909");
        arena.event.eatEvent(evt, false);
        break;
      case 55: // 7
        arena.ui.setForeground( evt.pressCount % 2 != 0 ? "#0FF" : "#099");
        arena.event.eatEvent(evt, false);
        break;
      //case 56: // 8
      //case 57: // 9
      
      case 107: // +
        if (evt.shiftKey) {
          // Select higher layer
          var map = arena.map;
          for (var i = 0; i < map.layers.length; i++)
            if (map.layers[i] == map.layer) {
              if (i < map.layers.length-1) {
                map.layer = map.layers[i+1];
                arena.ui.updateLayers();
              }
              break;
            }
          arena.event.eatEvent(evt);
        } else {
          arena.map.tool.key(evt);
        }
        break;
        
      
      case 109: // -
        if (evt.shiftKey) {
          // Select lower layer
          var map = arena.map;
          for (var i = 0; i < map.layers.length; i++)
            if (map.layers[i] == map.layer) {
              if (i > 0) {
                map.layer = map.layers[i-1];
                arena.ui.updateLayers();
              }
              break;
            }
          arena.event.eatEvent(evt);
        } else {
          arena.map.tool.key(evt);
        }
        break;

      default:
        arena.map.tool.key(evt);
        //if (console) console.log(evt.keyCode);
      }
    }
    if (evt.keyCode < 32) // Update cursor for control characters - Shift, Ctrl, Alt, etc.
      this.updateCursor(evt, this.lastMouseX, this.lastMouseY);
    this.lastKeyEvent = evt;
  },

  mapKeyUp : function(evt) {
    if (evt.keyCode < 32) // Update cursor for control characters - Shift, Ctrl, Alt, etc.
      this.updateCursor(evt, this.lastMouseX, this.lastMouseY);
  },

  mapInputKeyDown : function(evt) {
    return;
    if (evt.keyCode == 27 || evt.keyCode == 13) {
      switch (evt.keyCode) {
        case 27: // Escape: cancel text edit
        case 13: // Enter: accept and return
      }
    }
  },

  mapInputKeyUp : function(evt) {
  },
  
  viewLayerOnClick : function(evt) {
    $('layer').style.display = '';
    $('glyph').style.display = 'none';
  },

  viewGlyphOnClick : function(evt) {
    $('layer').style.display = 'none';
    $('glyph').style.display = '';
  },
  
  addLayerOnClick : function(evt) {
    var name = prompt("New layer name?", "New Layer");
    if (name)
      arena.commands.run(new arena.commands.LayerAdd(name));
  },

  delLayerOnClick : function(evt) {
    if (arena.map.layers.length > 1)
      arena.commands.run(new arena.commands.LayerDelete(arena.map.layer));
  },
  
  layerOnClick : function(evt, layer) {
    arena.map.layer = layer;
    arena.ui.updateLayers();
  },

  downLayerOnClick : function(evt) {
    var map = arena.map;
    for (var i = 0; i < map.layers.length; i++)
      if (map.layers[i] == map.layer) {
        if (i > 0) {
          arena.commands.run(new arena.commands.LayerMove(i, i-1));
          break;
        }
      }
  },

  upLayerOnClick : function(evt) {
    // TODO: Make command?
    var map = arena.map;
    for (var i = 0; i < map.layers.length; i++)
      if (map.layers[i] == map.layer) {
        if (i < map.layers.length-1) {
          arena.commands.run(new arena.commands.LayerMove(i, i+1));
          break;
        }
      }
  },

  paletteOnClick : function(evt, colour) {
    this.checkRepeat(evt, 'palette'+colour);
    if (evt.ctrlKey || evt.metaKey) { // Quick set foreground: ctrl+press
      arena.commands.run(new arena.commands.SetForeground(colour, arena.map.masked, arena.map.layer));
    } else if (evt.shiftKey) { // Quick set background: alt+press
      arena.commands.run(new arena.commands.SetBackground(colour, arena.map.masked, arena.map.layer));
    } else if (evt.detail % 2 == 1) {
      this.lastForeground = arena.map.foreground;
      arena.ui.setForeground(colour);
    } else { // Double click: restore foreground and set background instead
      arena.ui.setForeground(this.lastForeground);
      arena.ui.setBackground(colour);
    }
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
    if (evt.ctrlKey || evt.metaKey) // Quick set text: ctrl+press
      arena.commands.run(new arena.commands.SetText(glyph, arena.map.masked, arena.map.layer));
    else {
      arena.map.text = $("mapinput").value = glyph;
      arena.tools.setTool(arena.tools.Text);
    }
  },
}

arena.ui = {
  /*********************** Toolbox functions ***********************/
  createColourPalette : function() {
    var p = $('palette');
    var palette = arena.lang.palette;
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

  updateLayers : function() {
    var btn, e = $('layer');
    var list = e.getElementsByClassName('layer');
    for (var i = list.length-1; i >= 0; i--) {
      list[i].parentNode.removeChild(list[i]);
    }
    list = arena.map.layers;
    for (var i = list.length-1; i >= 0; i--) {
      btn = document.createElement('div');
      btn.setAttribute('onclick', 'arena.event.layerOnClick(event,arena.map.layers['+i+'])');
      btn.setAttribute('onmouseover', 'arena.ui.hint("tool|barhint_Layer")');
      btn.setAttribute('class', (list[i] == arena.map.layer) ? 'layer active' : 'layer');
      btn.innerHTML = list[i].name;
      e.appendChild(btn);
    }
  },

  createGlyphs : function() {
    var glyph = arena.lang.glyph;
    var btn, g = $('glyph');
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
    arena.map.foreground = colour;
    $('cmd_Foreground').style.backgroundColor = colour;
  },

  setBackground : function (colour) {
    arena.map.background = colour;
    $('cmd_Background').style.backgroundColor = colour;
    $('cmd_Foreground').style.border = '2px solid '+colour;
  },

  focusMapInput : function() {
    $('mapinput').disabled = false;
    $('mapinput').focus();
    $('mapinput').select();
    arena.event.mapInputMode = true;
  },
  
  focusBody : function() {
    arena.event.mapInputMode = false;
    $('hideFocus').focus();
    $('mapinput').disabled = true;
    //setTimeout(document.body.focus, 10);
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