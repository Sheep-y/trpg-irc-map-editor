/********************** JavaScript Arena, drawing commands *****************************/

/*
 * arena.commmands contain a set of (redoable) commands
 * Each commands contains the following properties and methods:
 *
 *   name   : Name of this command.
 *   desc   : More detailed description of this command.
 *   redo() : Call to redo this action.
 *   undo() : Call to undo this action.
 *   repeat() : Call to repeat this action. (Optional, only if it make sense to repeat)
 *   consolidate() : Consolidate next action in queue. Return true if consolidated, return false to leave it untouched.  
 *
 */

arena.commands = {
  list : [ 'SetMask', 'SetCell', 'SetText', 'SetForeground', 'SetBackground'
         , 'Erase', 'MoveMasked'
         , 'LayerMove', 'LayerDelete', 'LayerAdd', 'LayerShowHide'
         , 'MapRotate'],

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

  // Run a new command
  run : function(command) {
    command.redo();
    arena.ui.setStatus(command.desc);
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
    this.desc = "Erase cell";
    this.coList = coList;
    this.layer = layer;
  },
  
  MoveMasked : function(coList, dx, dy, layer, isCopy) {
    this.desc = isCopy ? "Copy masked area" : "Move masked area";
    this.coList = coList;
    this.dx = dx;
    this.dy = dy;
    this.layer = layer;
    this.isCopy = isCopy;
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
  consoliadte : function(newCmd) { 
    if (newCmd.className != this.className) return false;
    this.newMask = newCmd.newMask;
    return true;
  },
}

arena.commands.SetCell.prototype = {
  redo : function() {
    var l = this.coList.length;
    for (var i = 0; i < l; i++) {
      var m = this.coList[i];
      var c = this.layer.createCell(m[0], m[1]);
      if (this.text) {
        c.text = this.text;
      }
      if (this.foreground) {
        c.foreground = this.foreground;
      }
      if (this.background) {
        c.background = this.background;
      }
    }
    arena.map.repaint(this.coList);
  },
  undo : function() { },
  consoliadte : function(newCmd) { 
    if (newCmd.className != this.className
       || newCmd.text != this.text
       || newCmd.foreground != this.foreground
       || newCmd.background != this.background )
      return false;
    this.coList = this.coList.concat(newCmd.coList);
    return true;
  },
}

arena.commands.SetText.prototype = {
  redo : arena.commands.SetCell.prototype.redo,
  undo : arena.commands.SetCell.prototype.undo,
  consoliadte : arena.commands.SetCell.prototype.consolidate
}

arena.commands.SetForeground.prototype = {
  redo : arena.commands.SetCell.prototype.redo,
  undo : arena.commands.SetCell.prototype.undo,
  consoliadte : arena.commands.SetCell.prototype.consolidate
}

arena.commands.SetBackground.prototype = {
  redo : arena.commands.SetCell.prototype.redo,
  undo : arena.commands.SetCell.prototype.undo,
  consoliadte : arena.commands.SetCell.prototype.consolidate
}

arena.commands.Erase.prototype = {
  redo : function() {
    var l = this.coList.length;
    for (var i = 0; i < l; i++) {
      var m = this.coList[i];
      this.layer.set(m[0], m[1], null);
    }
    arena.map.repaint(this.coList);
  },
  undo : arena.commands.SetCell.prototype.undo,
  consoliadte : arena.commands.SetCell.prototype.consolidate
}

arena.commands.MoveMasked.prototype = {
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
    newMask = [];
    // Get starting x, ending x, and dx from move direction, and the same for y
    var sx, ex, xd, sy, ey, yd;
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
    // Move cells, fill on old space with current foreground/background
    for (y = sy; y != ey; y += yd) {
      var cy = y + dy;
      if (cy >= 0 && cy < map.height) {
        for (x = sx; x != ex; x += xd) {
          var cell = layer.get(x,y);
          var cx = x + dx;
          if (cx >= 0 && cx < map.width) {
            newMask.push([cx, cy]);
            if (!cell || !map.cells[y][x].masked) continue;
            var cell2 = layer.createCell(cx, cy);
            cell2.text = cell.text;
            cell2.foreground = cell.foreground;
            cell2.background = cell.background;
            if (!this.isCopy)
              layer.set(x,y,null);
          }
        }
      }
    }
    layer.trim();
    arena.map.repaint(coList);
    arena.map.repaint(newMask);
    arena.commands.run(new arena.commands.SetMask(newMask));
  },
  undo : function() { },
  consoliadte : function(newCmd) {
    return false; // TODO: Consolidate
  }
}

arena.commands.LayerMove.prototype = {
  redo : function() {
    var map = arena.map;
    var layer = map.layers.splice(this.fromIndex, 1)[0];
    map.layers.splice(this.toIndex, 0, layer);
    arena.ui.updateLayers();
    map.repaint();
  },
  undo : function() { },
  consoliadte : function(newCmd) {
    if (newCmd.className != this.className) return false;
    if (newCmd.fromIndex != newCmd.toIndex) return false;
    this.toIndex = newCmd.toIndex;
    return true;
  }
}

arena.commands.LayerDelete.prototype = {
  redo : function() {
    this.layer.remove();
    arena.ui.updateLayers();
    arena.map.repaint();
  },
  undo : function() {},
  consoliadte : function(newCmd) { return false; }
}

arena.commands.LayerAdd.prototype = {
  redo : function() {
    new arena.Layer(arena.map, this.name);
    arena.ui.updateLayers();
    arena.map.repaint();
  },
  undo : function() {},
  consoliadte : function(newCmd) { return false; }
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
    arena.map.repaint();
  },
  consoliadte : function(newCmd) {
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
    } else if (degree == 0) {
      // 0 degree = no rotate
      return;
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
  consoliadte : function(newCmd) {
    if (newCmd.className != this.className) return false;
    this.degree += newCmd.degree;
    return true;
  }
}

arena.commands.initialise();