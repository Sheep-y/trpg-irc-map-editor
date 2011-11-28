/********************** JavaScript Arena, user interface code *****************************/

arena.event = {
  lastEventTime  : 0,  // Last repeatable event triggered time, IE event has no details
  lastEventHash  : '', // Last repeatable event's hash, if different then reset
  lastEventCount : 0,  // Count of same repeatable event
  //lastForeground : arena.map.foreground, // Last set foreground

  lastKeyEvent : { keyCode: 0 }, // Last key event (object), used to check double tap
  lastMouseEvent : '', // Last mouse event (text), checked only on map double click handler
  lastMouseX : 0, // Last mouse hover position, x
  lastMouseY : 0, // Last mouse hover position, y
  lastHint   : '', // Last status bar hint
  lastCursor : '', // Last in use map cursor

  lastMapInputValue : '',
  mapInputMode : false, // True when inputing, false when not inputing
  mapDialogMode : false, // True when in dialog, false when not in dialog

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
    if (evt.altKey) return; // Alt is used for menu access, shortcut bar, etc.
    if (eatSpecial === false) // If don't want to consume special key then check for them
      if (evt.shiftKey || evt.ctrlKey || evt.metaKey) return;
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
    var back = cell.background;
    $('#current_foreground').css('background-color', cell.foreground)
                            .css('border', "1px solid "+back);
    $('#current_background').css('background-color', back);
    x += arena.map.dx;
    y += arena.map.dy;
    arena.ui.setStatusTwoPoint('coordinate_status', 'X', x, 'Y', y);
    arena.io.checkAutoSave();
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
    arena.ui.focusBody(); // clear selection
    arena.io.checkAutoSave();
  },

  /** Set map cursor */
  updateCursor : function(evt, x, y) {
    var cursor = 'default';
    if (!arena.map.layer || !arena.map.layer.visible) {
      cursor = 'no-drop';
    } else {
      cursor = arena.map.tool.cursor(evt, x, y);
    }
    if (cursor != this.lastCursor) {
      this.lastCursor = cursor;
      $('#map').css('cursor', cursor);
    }
  },

  /**************************** Dialogs *********************************/

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
    arena.map.width = +x;
    arena.map.height = +y;
    arena.reset();
  },

  exportOnClick : function(evt) {
    arena.ui.showDialog('export');
  },
  
  dlgExportClick : function(evt) {
    arena.ui.hideDialog('export');
    // Default to export
    $('#text_instruction').html(arena.lang.io.CopyInstruction);
    var textarea = $('#text_data')[0];
    textarea.value = arena.lang.io.PleaseWait;
    arena.ui.showDialog('text');

    if ($('#dlg_ex_url')[0].checked)
      textarea.value = arena.io.exportToURL(arena.map, arena.map.masked);
    else if ($('#dlg_ex_txt')[0].checked)
      textarea.value = arena.io.exportToTxt(arena.map, arena.map.masked);
    else if ($('#dlg_ex_bbc')[0].checked)
      textarea.value = arena.io.exportToBBC(arena.map, arena.map.masked);
    else if ($('#dlg_ex_bbctable')[0].checked)
      textarea.value = arena.io.exportToBBCTable(arena.map, arena.map.masked);
    else if ($('#dlg_ex_irc')[0].checked)
      textarea.value = arena.io.exportToIRC(arena.map, arena.map.masked);
    else if ($('#dlg_ex_json_zip')[0].checked)
      textarea.value = arena.io.exportToJSON(arena.map, arena.map.masked, 'zip-base64');
    else if ($('#dlg_ex_json')[0].checked)
      textarea.value = arena.io.exportToJSON(arena.map, arena.map.masked);
      
    else if ($('#dlg_ex_html')[0].checked) {
      // Special export, open in new doc
      arena.ui.hideDialog('text');
      arena.io.exportToHtml(arena.map, arena.map.masked);
      
    } else if ($('#dlg_in_json')[0].checked) {
      // Ok, we are importing
      $('#text_instruction').html(arena.lang.io.ImportInstruction);
      textarea.value = '';
    }
    
    textarea.select();
    textarea.focus();
  },
  
  dlgTextChanged : function(evt, txt) {
    if ($('#dlg_in_json')[0].checked) {
      // Importing, process data
      if (txt) {
        var result = arena.io.importFromJSON(txt);
        if (result == true)
          arena.ui.hideDialog('text');
        else
          $('#text_instruction').html(result);
      }      
    } else {
      // We're exporting, clear on empty
      if (!txt) arena.ui.hideDialog('text'); 
    }
  },

  saveLoadOnClick : function(evt) {
    /*if (!location.host || location.host.length <= 0) {
      alert(arena.lang.error.NoHost);
    } else */
    if (!localStorage) {
      alert(arena.lang.error.NoLocalStorage);
    } else {
      var html = '';
      var saves = arena.io.listSaves('local');
      for (var i = 0; i < saves.length; i++) {
        var esc = saves[i].replace(/</g,'&lt;').replace(/'/g, '&apos;').replace(/"/g, '&quot;');
        html += "<label class='save'><input type='radio' id='save"+i+"' onclick='$(\"#saveInput\").val(\""+esc+"\")'>"
              + esc + "</label><br>";
      } 
      $('#saveList').html(html);
      arena.ui.showDialog('saveload');
      $('#saveInput')[0].select();
      $('#saveInput')[0].focus();
    }
  },
  
  btnSaveMapClick : function(evt) {
    arena.io.saveMap($('#saveInput').val(), 'local');
    arena.ui.hideDialog("saveload");
  },
  
  btnLoadMapClick : function(evt) {
    var saves = arena.io.listSaves('local');
    for (var i = 0; i < saves.length; i++)
      if ($('#save'+i)[0].checked) {
        var result = arena.io.loadMap(saves[i], 'local');
        if (result !== true)
          alert(result);
        break;
      }
    arena.ui.hideDialog("saveload");
  },
  
  btnDeleteSaveClick : function(evt) {
    var saves = arena.io.listSaves('local');
    for (var i = 0; i < saves.length; i++)
      if ($('#save'+i)[0].checked) {
        arena.io.deleteSave(saves[i].value, 'local');
        break;
      }
    arena.ui.hideDialog("saveload");
  },
  
  /************************ Toolbox pattle/text *********************************/

  setForegroundOnClick : function(evt) {
    //arena.commands.run(new arena.commands.SetForeground(arena.map.foreground, arena.map.masked, arena.map.layer));
  },

  setBackgroundOnClick : function(evt) {
    //arena.commands.run(new arena.commands.SetBackground(arena.map.background, arena.map.masked, arena.map.layer));
  },

  mapKeyDown : function(evt) {
    if (this.mapDialogMode) return;
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
          $('#mapinput').val(this.lastMapInputValue);
          arena.ui.focusBody();
        }
        arena.event.eatEvent(evt);
        break;
      case 13: // Enter: set text
        if (!this.mapInputMode) {
          arena.ui.focusMapInput();
          this.lastMapInputValue = $('#mapinput').val();
        } else {
//          this.setTextOnClick(evt);
          arena.map.text = $('#mapinput').val();
          arena.tools.setTool(arena.tools.Text);
          arena.ui.focusBody();
        }
        arena.event.eatEvent(evt);
        break;

      case 9: // Tab
        arena.event.eatEvent(evt);
        break;
        
      default: 
        if (!this.mapInputMode) {
      arena.ui.focusBody(); // clear selection
          switch (evt.keyCode) {

      case 32: // Space
      case 40: // Down
      case 39: // Right
      case 38: // Up
      case 37: // Left
        arena.map.tool.key(evt);
        arena.event.eatEvent(evt);
        break;

      case 46: // Delete
        if (arena.map.masked.length > 0)
          arena.commands.run(new arena.commands.Erase(arena.map.masked, arena.map.layer));
        arena.event.eatEvent(evt);
        break;

      //case 65: // A
      case 66: // B
        arena.tools.setTool(arena.tools.Brush, evt);
        arena.event.eatEvent(evt, false);
        break;
      case 84: // T
        arena.tools.setTool(arena.tools.Text, evt);
        arena.event.eatEvent(evt, false);
        arena.ui.focusMapInput();
        break;
      case 69: // E
        arena.tools.setTool(arena.tools.Eraser, evt);
        arena.event.eatEvent(evt, false);
        break;
      case 77: // M
        arena.tools.setTool(arena.tools.Move, evt);
        arena.event.eatEvent(evt, false);
        break;
      case 79: // O
        arena.tools.setTool(arena.tools.Dropper, evt);
        arena.event.eatEvent(evt, false);
        break;
      case 82: // R
        arena.tools.setTool(arena.tools.Mask, evt);
        arena.event.eatEvent(evt, false);
        break;
      case 89: // Y
        if (evt.ctrldown) {
          arena.command.redo();
          arena.event.eatEvent(evt, false);
        }
        break;
      case 90: // Z
        if (evt.ctrldown) {
          arena.command.undo();
          arena.event.eatEvent(evt, false);
        }
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
                map.setMarked(map.layer.getCoList());
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
                map.setMarked(map.layer.getCoList());
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
    }
    if (evt.keyCode < 32) // Update cursor for control characters - Shift, Ctrl, Alt, etc.
      this.updateCursor(evt, this.lastMouseX, this.lastMouseY);
    this.lastKeyEvent = evt;
  },

  mapKeyUp : function(evt) {
    if (this.mapDialogMode) return;
    if (evt.keyCode < 32) // Update cursor for control characters - Shift, Ctrl, Alt, etc.
      this.updateCursor(evt, this.lastMouseX, this.lastMouseY);
  },

  /*
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
  */
  
  documentClose : function(evt) {
    if (arena.map.modified)
      return arena.lang.io.notSaved;
  },
  
  /************************ Toolbox tab *********************************/

  undoOnClick : function(evt) {
    arena.commands.undo();
  },
  
  redoOnClick : function(evt) {
    arena.commands.redo();
  },

  viewLayerOnClick : function(evt) {
    $('#layer').show();
    $('#glyph').hide();
    arena.ui.updateButtons();
  },

  viewGlyphOnClick : function(evt) {
    $('#layer').hide();
    $('#glyph').show();
    arena.ui.updateButtons();
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
    if (evt.detail > 1 && evt.detail <= 3) {
      arena.commands.run(new arena.commands.LayerShowHide(arena.map.layer, !arena.map.layer.visible));
    } else {
      arena.map.layer = layer;
    }
    arena.ui.updateLayers();
  },

  downLayerOnClick : function(evt) {
    var map = arena.map;
    for (var i = 0; i < map.layers.length; i++)
      if (map.layers[i] == map.layer) {
        if (i > 0) {
          arena.commands.run(new arena.commands.LayerMove(i, i-1));
          map.setMarked(map.layer.getCoList());
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
          map.setMarked(map.layer.getCoList());
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
    } else //if (evt.detail % 2 == 1) {
      //this.lastForeground = arena.map.foreground;
      arena.ui.setForeground(colour);
    /*} else { // Double click: restore foreground and set background instead
      arena.ui.setForeground(this.lastForeground);
      arena.ui.setBackground(colour);
    }*/
  },

  hideSubmenu : function() {
    if (!this.lastSubmenu) return;
    $('#'+this.lastSubmenu).hide();
    this.lastSubmenu = null;
  },
  submenuOnHover : function(evt, menu) {
    if (this.submenuTimer) {
      if (this.lastSubmenu != menu) this.hideSubmenu();
      clearTimeout(this.submenuTimer);
      this.submenuTimer = null;
    }
    if (!$('#'+menu)[0].style.display || $('#'+menu)[0].style.display == 'none') {
      $('#'+menu)[0].style.display = 'table';
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
      arena.map.text = $("#mapinput")[0].value = glyph;
      arena.tools.setTool(arena.tools.Text);
    }
  },
}

arena.ui = {
  /*********************** Toolbox functions ***********************/
  createColourPalette : function() {
    var p = $('#palette')[0];
    var palette = arena.lang.palette;
    var i = 0, td, tr, tbody = $('#palette')[0].firstChild;
    for (var c in palette) { var colour = palette[c];
      if (i % 8 == 0) tr = document.createElement('tr');
      td = document.createElement('td');
      td.setAttribute('onclick', 'arena.event.paletteOnClick(event,"'+colour+'")');
      td.setAttribute('ondblclick', 'if(!event.detail)arena.event.paletteOnClick(event,"'+colour+'")');
      td.setAttribute('onmouseover', 'arena.event.submenuOnHover(event,"palette");arena.ui.hint("tool|barhint_Colour")');
      td.setAttribute('onmouseout', 'arena.event.submenuOnExit(event);');
      td.setAttribute('style', 'background-color:'+colour);
      //td.setAttribute('title', c);
      td.setAttribute('class', 'palette');
      td.innerHTML = c;
      tr.appendChild(td);
      if (i++ % 2 != 0) tbody.appendChild(tr);
    }
  },
  
  updateButtons : function() {
    $('.tool[id]').removeClass('active');
    arena.tools.list.forEach(function(name){
      if (arena.tools[name] == arena.map.tool) {
        $('#cmd_Tool'+name).addClass('active');
      }
    });
    if ($('#layer').css('display') != 'none')
      $('#cmd_ViewLayer').addClass('active');
    else
      $('#cmd_ViewGlyph').addClass('active');
    arena.ui.updateUndoRedo();
  },
  
  updateUndoRedo : function() {
    if (!arena.commands.canUndo())
      $('#cmd_Undo').addClass('disabled');
    else
      $('#cmd_Undo').removeClass('disabled');
    if (!arena.commands.canRedo())
      $('#cmd_Redo').addClass('disabled');
    else
      $('#cmd_Redo').removeClass('disabled');
  },

  updateLayers : function() {
    var btn, e = $('#layer')[0];
    var list = $('#layer .layer');
    for (var i = list.length-1; i >= 0; i--) {
      list[i].parentNode.removeChild(list[i]);
    }
    list = arena.map.layers;
    for (var i = list.length-1; i >= 0; i--) {
      btn = document.createElement('div');
      btn.setAttribute('onclick', 'arena.event.layerOnClick(event,arena.map.layers['+i+'])');
      btn.setAttribute('onmouseover', 'arena.ui.hint("tool|barhint_Layer");arena.map.setMarked(arena.map.layers['+i+'].getCoList());');
      var className = 'layer';
      if (list[i] == arena.map.layer) className += ' active';
      if (!list[i].visible) className += ' hidden';
      btn.setAttribute('class', className);
      btn.innerHTML = list[i].name;
      e.appendChild(btn);
    }
  },

  createGlyphs : function() {
    var glyph = arena.lang.glyph;
    var btn, g = $('#glyph')[0];
    for (var i = 0; i < glyph.length; i++) {
      btn = document.createElement('div');
      btn.setAttribute('onclick', 'arena.event.glyphOnClick(event,"'+glyph[i]+'")');
      btn.setAttribute('onmouseover', 'arena.ui.hint("tool|barhint_Glyph")');
      btn.setAttribute('class', 'tool glyph');
      btn.innerHTML = glyph[i];
      g.appendChild(btn);
      //if (i+1 % 3 == 0) g.appendChild(document.createElement('br'));
    }
  },

  setText : function (text) {
    $('#mapinput').val(arena.map.text = text);
  },

  setForeground : function (colour) {
    $('#cmd_Foreground').css('background-color', arena.map.foreground = colour);
  },

  setBackground : function (colour) {
    $('#cmd_Background').css('background-color', arena.map.background = colour);
    $('#cmd_Foreground').css('border', '2px solid '+colour);
  },

  focusMapInput : function() {
    var i = $('#mapinput')[0];
    i.disabled = false;
    i.focus();
    i.select();
    arena.event.mapInputMode = true;
  },
  
  focusBody : function() {
    arena.event.mapInputMode = false;
    var i = $('#hideFocus')[0]
    i.focus();
    i.select();
    i.disabled = true;
    //setTimeout(document.body.focus, 10);
  },

  /*********************** Status bar functions ***********************/
  setHint : function(hint) {
    if (hint == this.lastHint) return;
    $('#hint').html(hint);
    this.lastHint = hint;
  },
  setStatus : function(status) {
    $('#status').html(status);
  },

  setStatusTwoPoint : function(id, xlabel, x, ylabel, y) {
    var status = xlabel + ':';
    if (x < 10) status += '&nbsp;';
    status += x + ' ' + ylabel + ':';
    if (y < 10) status += '&nbsp;';
    status += y;
    $('#'+id).html(status);
  },

  /*********************** Dialog functions ***********************/
  showDialog : function (id) {
    if ($('#dialog_'+id).length <= 0) return;
    $('#masqk').css('display', 'block');
    $('#dialog_'+id).css('display', 'block');
    $('#dialog_container').css('display', 'table');
    arena.event.mapDialogMode = true;
    arena.io.pauseAutoSave = true;
  },

  hideDialog : function (id) {
    arena.io.pauseAutoSave = false;
    if ($('#dialog_'+id).length <= 0) return;
    arena.event.mapDialogMode = false;
    $('#dialog_container, #dialog_'+id+', #mask').hide();
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