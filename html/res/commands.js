/********************** JavaScript Arena, drawing commands *****************************/

/*
 * arena.commmands contain a set of (redoable) commands
 * Each commands contains the following properties and methods:
 *
 *   name   : Name of this command.
 *   desc   : More detailed description of this command.
 *   redo() : Call to redo this action.
 *   undo() : Call to undo this action.
 *   consolidate() : Consolidate next action in queue. Return true if consolidated, return false to leave it untouched.
 *
 */

arena.commands = {
  list : [ 'SetMask', 'SetCell', 'SetText', 'SetForeground', 'SetBackground'
         , 'Erase', 'MoveArea'
         , 'LayerMove', 'LayerDelete', 'LayerAdd', 'LayerShowHide'
         , 'MapRotate'],

  undoStack : [],   // commands are unshifted into it
  undoPosition : -1, // point to next command

  // Setup commands, call once
  initialise : function() {
    var l = this.list.length;
    for (var i = 0; i < l; i++) {
       var name = this.list[i];
       var cmd = this[name];
       cmd.prototype.className = name;
       cmd.prototype.name = arena.lang.command['name_'+name];
    }
  },

  maxUndo : 100, // max undo commands
  consolidateTimespan : 10*1000, // max time to consider same commands, in ms

  // Run a new command
  run : function(command) {
    // Timestamp and prevents double run
    if (command.time) return false;
    command.time = new Date();
    // Clear forward histoy if we're not at latest
    if (this.undoPosition >= 0) {
      this.undoStack.splice(0, this.undoPosition+1);
      this.undoPosition = -1;
    }
    // Run command
    command.redo();
    // Consolidat with last command, failing that then add to command undo stack
    var conso = this.undoStack.length > 0 && (new Date()-this.undoStack[0].time < this.consolidateTimespan);
    if (!conso || !this.undoStack[0].consolidate(command)) {
      this.undoStack.unshift(command);
      // Cleanup if there are too much undo
      if (this.undoStack.length > this.maxUndo+10)
        this.undoStack.splice(this.maxUndo);
    }
    this.setModified(arena.map, command.desc);
  },

  canUndo : function() {
    return this.undoPosition+1 < this.undoStack.length;
  },

  canRedo : function() {
    return this.undoPosition >= 0;
  },

  /** Undo last command, return true if success */
  undo : function() {
    arena.map.tool.cancel();
    if (!this.canUndo()) return false;
    this.undoPosition++;
    var command = this.undoStack[this.undoPosition];
    command.undo();
    arena.map.setMarked([]);
    this.setModified(arena.map, arena.lang.command.undo.replace("%s", command.desc));
    return true;
  },

  /** Redo next command, return true if success */
  redo : function() {
    arena.map.tool.cancel();
    if (!this.canRedo()) return false;
    var command = this.undoStack[this.undoPosition];
    command.redo();
    arena.map.setMarked([]);
    this.undoPosition--;
    this.setModified(arena.map, arena.lang.command.redo.replace("%s", command.desc));
    return true;
  },

  setModified : function(map, status) {
    // If this is new change, set now as auto save compare time
    if (!map.modified)
      map.lastSaveTime = new Date();
    map.setModified( true );
    arena.io.checkAutoSave();
    arena.ui.setStatus(status);
    arena.ui.updateUndoRedo();
  },

  resetUndo : function() {
    this.undoStack = [];
    this.undoPosition = -1;
  },

  SetMask : function(coList) {
    this.desc = "Set Mask";
    this.newMask = coList;
  },

  SetCell : function(text, foreground, background, coList, layer) {
    this.desc = this.name + ' "' + text + '"/' +
                (foreground ? foreground : ' - ') + '/' +
                (background ? background : ' - ');
    this.text = text;
    this.foreground = foreground;
    this.background = background;
    this.coList = coList;
    this.layer = layer;
  },

  SetText : function(text, coList, layer) {
    this.desc = 'Set text "' + text + '"';
    this.text = text;
    this.coList = coList;
    this.layer = layer;
  },

  SetForeground : function(foreground, coList, layer) {
    this.desc = 'Set foreground "' + foreground + '"';
    this.foreground = foreground;
    this.coList = coList;
    this.layer = layer;
  },

  SetBackground : function(background, coList, layer) {
    this.desc = 'Set background "' + background + '"';
    this.background = background;
    this.coList = coList;
    this.layer = layer;
  },

  Erase : function(coList, layer) {
    this.desc = "Erase cells";
    this.coList = coList;
    this.layer = layer;
  },

  MoveArea : function(coList, dx, dy, layer, isCopy, setMask) {
    this.desc = isCopy ? "Copy masked area" : "Move masked area";
    this.coList = coList;
    this.dx = dx;
    this.dy = dy;
    this.layer = layer;
    this.isCopy = isCopy;
    this.setMask = setMask;
  },

  LayerMove : function(fromIndex, toIndex) {
    this.desc = "Move layer " + arena.map.layers[fromIndex];
    this.fromIndex = fromIndex;
    this.toIndex = toIndex;
  },

  LayerDelete : function(target) {
    this.desc = "Delete layer " + target.name;
    this.layer = target;
  },

  LayerAdd : function(name) {
    this.desc = "Create layer " + name;
    this.name = name;
  },

  LayerShowHide : function(layer, visibility) {
    this.desc = "Toogle layer visibility";
    this.layer = layer;
    this.visibility = visibility;
  },

  MapRotate : function(degree) {
    this.desc = "Rotate " + degree + " degree";
    this.degree = degree;
  },
}



arena.commands.SetMask.prototype = {
  redo : function() {
    if (!this.originalMask) this.originalMask = arena.map.masked.concat([]);
    arena.map.setMasked(this.newMask);
  },
  undo : function() {
    arena.map.setMasked(this.originalMask);
  },
  consolidate : function(newCmd) {
    if (newCmd.className != this.className) return false;
    this.newMask = newCmd.newMask;
    return true;
  },
}

arena.commands.SetCell.prototype = {
  text: undefined,
  foreground: undefined,
  background: undefined,
  lastText: undefined,
  redo : function() {
    var text = this.text, txt;
    if ( text && ( txt = text.match( /^.*?([a-zA-Z0-9]+).*?\+\+$/ ) ) ) {
      txt = txt[1];
      var overflow = false;
      function incChar( chr ) {
         overflow = true;
         if ( chr === '9' ) return '0';
         if ( chr === 'z' ) return 'a';
         if ( chr === 'Z' ) return 'A';
         overflow = false;
         return String.fromCharCode( chr.charCodeAt(0) + 1 );
      }
      var newTxt = txt.split("");
      var pos = txt.length-1;
      // Increase alpha from the end, cascading to front
      newTxt[pos] = incChar( newTxt[pos] );
      while ( overflow && pos > 0 ) {
        --pos;
        newTxt[pos] = incChar( newTxt[pos] );
      }
      // If overflowing from one character to two, allow it
      if ( overflow && text.length === 3 )
        newTxt.unshift( newTxt[0] === '0' ? '1' : ( newTxt[0] === 'A' ? 'A' : 'a' ) );
      // Update text
      arena.ui.setText( text.replace( txt, newTxt.join("") ) );
      this.lastText = text;
      text = text.replace( /\+\+$/, '' );
    }

    var l = this.coList.length;
    var undoData = this.undoData ? null : [];
    for (var i = 0; i < l; i++) {
      // Get coordinate list and undo data
      var m = this.coList[i];
      var orig = this.layer.get(m[0], m[1]);
      if (undoData)
        undoData.push( orig ? orig.clone({}) : null );
      // Get and set cell
      var c = orig ? orig : this.layer.createCell(m[0], m[1]);
      c.setIf( text, this.foreground, this.background );
      // Process text
    }
    if (undoData) // Don't double set because consolidated coordinate list may overlap
      this.undoData = undoData;
    arena.map.repaint(this.coList);
  },
  undo : function() {
    var l = this.coList.length;
    var undoData = this.undoData;
    for (var i = l-1; i >= 0; i--) { // Do consolidated coordinate list in reverse
      var m = this.coList[i];
      var orig = undoData[i];
      if (!orig) {
        this.layer.set(m[0], m[1], null)
      } else {
        this.layer.createCell(m[0], m[1]).setIf(orig);
      }
    }
    arena.map.repaint(this.coList);
    if ( this.lastText ) arena.ui.setText( this.lastText );
  },
  consolidate : function(newCmd) {
    if (newCmd.className != this.className
       || newCmd.layer != this.layer
       || newCmd.text != this.text
       || newCmd.foreground != this.foreground
       || newCmd.background != this.background )
      return false;
    this.coList = this.coList.concat(newCmd.coList);
    this.undoData = this.undoData.concat(newCmd.undoData);
    return true;
  },
}

arena.commands.SetText.prototype = {
  redo : arena.commands.SetCell.prototype.redo,
  undo : arena.commands.SetCell.prototype.undo,
  consolidate : arena.commands.SetCell.prototype.consolidate
}

arena.commands.SetForeground.prototype = {
  redo : arena.commands.SetCell.prototype.redo,
  undo : arena.commands.SetCell.prototype.undo,
  consolidate : arena.commands.SetCell.prototype.consolidate
}

arena.commands.SetBackground.prototype = {
  redo : arena.commands.SetCell.prototype.redo,
  undo : arena.commands.SetCell.prototype.undo,
  consolidate : arena.commands.SetCell.prototype.consolidate
}

arena.commands.Erase.prototype = {
  redo : function() {
    var l = this.coList.length;
    var undoData = [];
    for (var i = 0; i < l; i++) {
      var m = this.coList[i];
      var orig = this.layer.get(m[0], m[1]);
      this.layer.set(m[0], m[1], null);
      undoData.push(orig);
    }
    this.undoData = undoData;
    arena.map.repaint(this.coList);
  },
  undo : arena.commands.SetCell.prototype.undo,
  consolidate : arena.commands.SetCell.prototype.consolidate
}

arena.commands.MoveArea.prototype = {
  redo : function() {
    var coList = this.coList;
    var dy = this.dy;
    var dx = this.dx;
    var layer = this.layer;
    var isCopy = this.isCopy;
    // Determin movement scope and direction
    var bounds = arena.coListBounds(coList);
    var map = arena.map;
    var minX = bounds[0], minY = bounds[1], maxX = bounds[2], maxY = bounds[3];
    var newMask = [];
    // Get starting x, ending x, and dx from move direction, and the same for y
    var x, y, cx, cy, sx, ex, xd, sy, ey, yd;
    if (dx <= 0) { // Moved left, copy from left to right
      sx = minX; ex = maxX+1; xd = +1;
    } else if (dx > 0) { // Moved right, copy from right to left
      sx = maxX; ex = minX-1; xd = -1;
    }
    if (dy <= 0) { // Moved up, copy from top to bottom
      sy = minY; ey = maxY+1; yd = +1;
    } else if (dy > 0) { // Moved down, copy from bottom to top
      sy = maxY; ey = minY-1; yd = -1;
    }
    var undoData = this.undoData ? null : {
      sx : sx, sy : sy,
      ex : ex, ey : ey,
      xd : xd, yd : yd,
      mask : map.masked.concat([]),
      newMask : null,
      data: []
    };
    // Move cells, fill on old space with current foreground/background
    for (y = sy; y != ey; y += yd) {
      cy = y + dy;
      if (cy >= 0 && cy < map.height) {
        for (x = sx; x != ex; x += xd) {
          var cell = layer.get(x,y);
          cx = x + dx;
          if (cx >= 0 && cx < map.width) {
            if (!cell || arena.xyInCoList(x, y, coList) < 0) {
              if (undoData) {
                undoData.data.push(false);
                undoData.data.push(false);
              }
              continue;
            }
            newMask.push([cx, cy]);
            if (undoData) {
              var tmp = layer.get(cx,cy);
              undoData.data.push(tmp ? tmp.clone() : null);
              undoData.data.push(cell.clone());
            }
            var cell2 = layer.createCell(cx, cy);
            cell2.set(cell);
            if (!this.isCopy)
              layer.set(x,y,null);
          }
        }
      }
    }
    layer.trim();
    arena.map.repaint(coList);
    arena.map.repaint(newMask);
    if (this.setMask)
      arena.map.setMasked(newMask);
    if (undoData) {
      undoData.newMask = newMask;
      this.undoData = undoData;
    }
  },
  undo : function() {
    var coList = this.coList;
    var data = this.undoData;
    var dy = this.dy;
    var dx = this.dx;
    var layer = this.layer;
    /*
    var undoData = this.undoData ? null : {
      sx : sx, sy : sy,
      ex : ex, ey : ey,
      xd : xd, yd : yd,
      mask : map.masked.concat([]),
    };
    */
    var i = data.data.length-1;
    var map = arena.map;
    var newMask = [];
    for (y = data.ey-data.yd; y != data.sy-data.yd; y -= data.yd) {
      var cy = y + dy;
      if (cy >= 0 && cy < map.height) {
        for (x = data.ex-data.xd; x != data.sx-data.xd; x -= data.xd) {
          var cx = x + dx;
          if (cx >= 0 && cx < map.width) {
            var source = data.data[i--];
            var target = data.data[i--];
            newMask.push([cx, cy]);
            if (!source) continue;
            if (source)
              layer.createCell(cx, cy).set(target);
            else
              layer.set(cx, cy, null);
            layer.set(x, y, source);
          }
        }
      }
    }
    arena.map.repaint(coList);
    arena.map.repaint(data.newMask);
    arena.map.repaint(data.mask);
    if (this.setMask)
      arena.map.setMasked(data.mask);
  },
  consolidate : function(newCmd) {
    return false;
  }
}

arena.commands.LayerMove.prototype = {
  redo : function() {
    this.move(this.fromIndex, this.toIndex);
  },
  undo : function() {
    this.move(this.toIndex, this.fromIndex);
  },
  move : function(fromIndex, toIndex) {
    var map = arena.map;
    var layer = map.layers.splice(fromIndex, 1)[0];
    map.layers.splice(toIndex, 0, layer);
    arena.ui.updateLayers();
    map.repaint();
  },
  consolidate : function(newCmd) {
    if (newCmd.className != this.className) return false;
    if (newCmd.fromIndex != this.toIndex) return false;
    this.toIndex = newCmd.toIndex;
    return true;
  }
}

arena.commands.LayerDelete.prototype = {
  redo : function() {
    this.layerIndex = arena.map.removeLayer(this.layer);
    arena.ui.updateLayers();
    arena.map.repaint();
  },
  undo : function() {
    arena.map.addLayer(this.layer, this.layerIndex);
    arena.ui.updateLayers();
    arena.map.repaint();
  },
  consolidate : function(newCmd) { return false; }
}

arena.commands.LayerAdd.prototype = {
  redo : function() {
    if (!this.layer)
      this.layer = new arena.Layer(this.name);
    arena.map.addLayer(this.layer);
    arena.ui.updateLayers();
    arena.map.repaint();
  },
  undo : function() {
    arena.map.removeLayer(this.layer);
    arena.ui.updateLayers();
    arena.map.repaint();
  },
  consolidate : function(newCmd) { return false; }
}

arena.commands.LayerShowHide.prototype = {
  redo : function() {
    this.lastVisibility = this.layer.visible;
    this.setVisibility(this.visibility);
  },
  undo : function() {
    this.setVisibility(this.lastVisibility);
  },
  setVisibility : function(visibility) {
    if (visibility == this.layer.visible) return;
    this.layer.visible = visibility;
    arena.ui.updateLayers();
    arena.map.repaint();
  },
  consolidate : function(newCmd) {
    if (newCmd.className != this.className) return false;
    if (newCmd.layer != this.layer) return false;
    this.visibility = newCmd.visibility;
    return true;
  }
}

arena.commands.MapRotate.prototype = {
  redo : function() {
    this.rotate(this.degree);
  },
  undo : function() {
    this.rotate(360-this.degree);
  },
  rotate: function(degree) {
    degree = degree % 360;
    if (degree < 0) degree = 360-degree;
    if (degree == 0) return;
    /*
    var rad = degree * Math.PI/180;
    var c = Math.cos(rad); // x = x * c + y * s
    var s = Math.sin(rad); // y = x * s + y * c
    */
    var rotate = null;
    var map = arena.map;
    var mask = map.masked;
    var glyphMap = [];
    if (degree == 90) {
      // 90 *** [0,0] -> [width, 0] -> [width, height] -> [0, height]
      rotate = function(x, y, w, h) { return [w-y, x]; };
      glyphMap = arena.lang.mapping.rotateClock;
      map.recreate(map.height, map.width);
    } else if (degree == 180) {
      // 180 *** [0,0] -> [width,height] -> 0,0 *** [width,0] -> [0, height] -> [width, 0]
      rotate = function(x, y, w, h) { return [w-x, h-y]; };
      glyphMap = arena.lang.mapping.rotateHalf;
    } else if (degree == 270) {
      // 270 *** [0,0] -> [0, height] -> [width, height] -> [width, 0]
      rotate = function(x, y, w, h) { return [y, h-x]; };
      glyphMap = arena.lang.mapping.rotateAntiClock;
      map.recreate(map.height, map.width);
    } else {
      // TODO: flexible rotate
      return;
    }
    var newH = map.height-1;
    var newW = map.width-1;
    for (var i = map.layers.length-1; i >= 0; i--) {
      var l = map.layers[i];
      var c = l.cells;
      if (c.length > 0) {
        l.cells = [];
        var newCells = [];
        for (var y = c.length-1; y >= 0; y--)
          if (c[y]) {
            var row = c[y];
            for (var x = row.length-1; x >= 0; x--) if (row[x]) {
              var cell = row[x];
              var newCo = rotate(x, y, newW, newH);
              if (cell && cell.text && glyphMap[cell.text]) cell.text = glyphMap[cell.text];
              l.set(newCo[0], newCo[1], cell);
            };
          }
      }
    }
    var newMask = [];
    for (var i = mask.length-1; i >= 0; i--) {
      var newCo = rotate(mask[i][0], mask[i][1], newW, newH);
      newMask.push([newCo[0], newCo[1]]);
    }
    map.setMasked(newMask);
    map.repaint();
  },
  consolidate : function(newCmd) {
    if (newCmd.className != this.className) return false;
    this.degree += newCmd.degree;
    return true;
  }
}

arena.commands.initialise();