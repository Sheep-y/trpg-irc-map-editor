/********************** JavaScript Arena, drawing tool code *****************************/

/*
 * arena.tools contain a set of tool functions and tools.
 * Each tool manage their own state, and contains the following manipulation methods:
 *
 *   down() : called when mouse is pressed.
 *   move() : called when mouse is moved.
 *   up()   : called when mouse is released.
 *   key()  : called when certain keys are pressed (e.g. direction key)
 *   cursor() : return suitable cursor for a grid
 *   hint() : return suitable hint for a grid
 *
 * For these methods, evt is the event object, and x & y are grid coordinates.
 * Each tool also contains some common methods:
 *
 *   set() : called when the tool is selected for use. Good time to reset state.
 *   unset() : called when the tool is unselected from use to another.
 *   cancel() : called when a cancel command is issued.
 *   outOfCanvas() : called when mouse is clicked (not moved) outside canvas.
 *
 *
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

arena.tools = {
  list : ['Text','Paint','Erase','Mask','Dropper'], // Tool list

  // Given four corners, genreate a list of all coordinates in the rectangle
  genRectagleCoList : function(x1, y1, x2, y2) {
    var coList = [];
    var maxX = Math.min(arena.map.width-1,  Math.max(x1, x2));
    var maxY = Math.min(arena.map.height-1, Math.max(y1, y2));
    var minX = Math.max(0, Math.min(x1, x2));
    var minY = Math.max(0, Math.min(y1, y2));
    for (var i = minX; i <= maxX; i++) for (var j = minY; j <= maxY; j++)
      coList.push([i,j]);
    return coList;
  },

  // Set a tool as currently in use
  setTool : function(newTool) {
    if (arena.map.tool) {
      arena.map.tool.unset();
    }
    arena.map.tool = newTool;
  }
}

// Text tool, used to draw text.  Most functions shared by Paint and Erase tool. 
arena.tools.Text = {
  	drawing : false,
    down : function(evt, x, y) {
      if (evt.button < 2) {
        this.drawing = true;
        this.draw(evt, x, y);
      }
    },
    move : function(evt, x, y) {
      arena.map.setMarked([[x,y]]);
      if (this.drawing)
        this.draw(evt, x, y);
    },
    up   : function(evt, x, y) {
      if (evt.button < 2)
        this.drawing = false;
    },                        
    draw : function(evt, x, y) {
      if (arena.map.layer) {
      	var coList = !evt.ctrlKey
      	  ? [[x,y]] // No ctrl key, just paint cell
      	  : [[x,y]]; // Ctrl key, fill mode
        var cmd = this.getCommand(evt, coList);
        arena.commands.run(cmd);
      }
    },
    getCommand : function(evt, coList) {
      return !evt.shiftKey
        ? new arena.commands.SetCell(arena.map.text, arena.map.foreground, null, coList, arena.map.layer)
        : new arena.commands.SetCell(arena.map.text, null, arena.map.foreground, coList, arena.map.layer);
    },
    key  : function(evt, x, y) { }, // Do nothing
    cursor : function(evt, x, y) {
      return (evt.ctrlKey) ? 'cell' : 'default';
    },
    hint : function(evt, x, y) {
      return arena.lang.tool.usehint_text;
    },
    set : function(evt) { this.drawing = false; },
    unset : function(evt) { this.drawing = false; },
    cancel : function(evt) { this.drawing = false; },
    outOfCanvas : function(evt) { this.drawing = false; },
  };

arena.tools.Paint = {
    getCommand : function(evt, coList) {
      return !evt.shiftKey
        ? new arena.commands.SetBackground(arena.map.foreground, coList, arena.map.layer)
        : new arena.commands.SetForeground(arena.map.foreground, coList, arena.map.layer);
    },
    hint : function(evt, x, y) {
      return arena.lang.tool.usehint_paint;
    },
  };
for(var i in arena.tools.Text)
  if (!arena.tools.Paint[i])
    arena.tools.Paint[i] = arena.tools.Text[i];

arena.tools.Erase = {
    getCommand : function(evt, coList) {
      return new arena.commands.Erase(coList, arena.map.layer);
    },
    hint : function(evt, x, y) {
      return arena.lang.tool.usehint_erase;
    },
  };
for(var i in arena.tools.Text)
  if (!arena.tools.Erase[i])
    arena.tools.Erase[i] = arena.tools.Text[i];

  /** Grid mask tool */
arena.tools.Mask = {
    isInuse : false, // True if tool is in use.
    isMoving : false, // True is tool's usage is draggons
    sx : 0, sy : 0, // starting x and starting y

    down : function(evt, x, y) {
      if (evt.button < 2) { // Only care left button. IE not following standards
        if (!evt.ctrldown && this.isInuse) return; // In use and not multi? Ignore as attemp to re-release.
        this.sx = x; this.sy = y; // Set new starting xy
        var map = arena.map;
        if (evt.detail > 1 && evt.detail <= 3) {
          // Double / Triple click
          var newMask = this.selectSimiliar(evt, x, y);
          if (evt.ctrlKey) {
            // Ctrl: Add to exsiting selection
            var l = newMask.length, cells = map.cells;
            // Check marked cell and remove duplicates
            for (var i = l-1; i >= 0; i--) {
              var m = newMask[i];
              var c = cells[m[1]][m[0]];
              if (c.masked)
                  newMask.splice(i, 1);
            }
            newMask = map.masked.concat(newMask);
          }
          arena.commands.run(new arena.commands.SetMask(newMask));
        } else {
          this.isInUse = true;
          map.setMarked([[x,y]]);
          // If shift-click on masked area, moves masked area.
          this.isMoving = !evt.shiftKey && map.cells[y][x].masked;
        }
      }
    },
    move : function(evt, x, y) {
      if (this.isInUse) {
        // Drawing or moving
        var dy = y - this.sy, dx = x - this.sx;
        var marks, map = arena.map;
        if (!this.isMoving) {
          // Re-calc area width/height
//          arena.toolHeight = Math.abs(dy)+1;
//          arena.toolWidth = Math.abs(dx)+1;
          marks = arena.tools.genRectagleCoList(x, y, this.sx, this.sy);
        } else {
          // Show where selection would go
//          arena.toolHeight = dy;
//          arena.toolWidth = dx;
          marks = map.masked.concat([]);
          if (dy != 0 || dx != 0) {
            var l = marks.length;
            for (var i = l-1; i >= 0; i--) {
              var coord = marks[i];
              var cx = coord[0] + dx , cy = coord[1] + dy;
              if (cx < 0 || cx >= map.width || cy < 0 || cy >= map.height)
                marks.splice(i, 1);
              else
                marks[i] = [cx, cy];
            }
          }
        }
        map.setMarked(marks);
      }
    },
    up : function(evt, x, y) {
      if (evt.button < 2 && this.isInUse) {
        this.isInUse = false;
        var map = arena.map;
        map.setMarked([]); // clear tool mark
        var newMask;
        if (this.isMoving) {
          var dy = y - this.sy, dx = x - this.sx;
          if (dy == dx && dy == 0) return; // No need to do anything
          arena.commands.run(
            new arena.commands.MoveMasked(arena.map.masked, dx, dy, arena.map.layer, evt.ctrlKey));
        } else {
          // If not moving, a mask has been dragged.
          newMask = arena.tools.genRectagleCoList(x, y, this.sx, this.sy);
          // Additional processing: multi-select or erase selection
          if (evt.ctrlKey || evt.metaKey || evt.shiftKey) {
            var l = newMask.length, cells = map.cells;
            var currentMask = evt.shiftKey ? map.masked.concat([]) : null;
            // Check marked cell
            for (var i = l-1; i >= 0; i--) {
              var m = newMask[i];
              var c = cells[m[1]][m[0]];
              if ((evt.ctrlKey || evt.metaKey) && c.masked)
                  newMask.splice(i, 1); // Ctrl: Multi; Already masked, remove duplicates
              if (evt.shiftKey && c.masked) // Shift: Unselect; Already masked, remove from mask
                  currentMask.splice(arena.xyInCoList(m[0], m[1], currentMask), 1);
            }
            if (evt.ctrlKey || evt.metaKey)
              newMask = newMask.concat(evt.shiftKey ? currentMask : arena.map.masked);
            else if (evt.shiftKey)
              newMask = currentMask;
          }
          arena.commands.run(new arena.commands.SetMask(newMask));
        }
      }
    },
    outOfCanvas : function (evt) {
      if (!this.isInUse)
        arena.commands.run(new arena.commands.SetMask([]));
      this.cancel();
    },
    key : function (evt) {
      var dx = 0, dy = 0;
      switch (evt.keyCode) {
        case 40: dy = 1; break; // Down
        case 39: dx = 1; break; // Right
        case 38: dy = -1; break; // Up
        case 37: dx = -1; break; // Left
        case 46: // Delete
          if (evt.preventDefault) evt.preventDefault(); else evt.returnValue = false;
          arena.commands.run(new arena.commands.SetText(null, arena.map.masked));
          return;
      }
      // Movement
      if (dx != 0 || dy != 0) {
        if (arena.map.masked.length > 0) {
          var map = arena.map;
          var bounds = arena.coListBounds(arena.map.masked);
          var minX = bounds[0], maxX = bounds[2];
          var minY = bounds[1], maxY = bounds[3];
          if (dx < 0 && minX <= 0 || dx > 0 && maxX >= map.width-1 ||
              dy < 0 && minY <= 0 || dy > 0 && maxY >= map.height-1 )
            return; // Out of bounds, cannot move further
          var newMask = [], l = map.masked.length; // Firefox 3.5 doesn't copy on concat, why?
          for (var i = 0; i < l; i++) { var m = map.masked[i];
            newMask[i] = [m[0]+dx, m[1]+dy];
          }
          arena.commands.run(new arena.commands.SetMask(newMask));
        }
      }
    },

    cursor : function (evt, x, y) {
      if (this.isInUse && this.isMoving) return (evt.ctrlKey) ? 'copy' : 'move';
      var c = arena.map.cells[y][x];
      return (!c.masked || c.marked || (evt && evt.shiftKey) ) ? 'cell' : 'move'
    },
    hint : function (evt, x, y) {
      return (this.isInUse && this.isMoving) || arena.map.cells[y][x].masked
        ? arena.lang.tool.usehint_maskmove
        : arena.lang.tool.usehint_mask;
    },

    set : function() { this.isInUse = this.isMoving = false; },
    unset : function() { this.cancel(); },
    cancel : function() {
      if (this.isInUse) arena.map.setMarked([]);
      this.isInUse = this.isMoving = false;
    },

    /** Select cell with same text that are bordering this cell / all over the map */
    selectSimiliar : function (evt, x, y) {
      var map = arena.map, cells = map.cells;
      // Select similiar
      var newMask = [], txt = cells[y][x].text;
      if (evt.detail == 2) { // Select all similiar text
        // Check left
        --x;
        while (x >= 0 && cells[y][x].text == txt) --x;
        var left = x + 1;
        // Check right
        x = this.sx + 1;
        while (x < map.width && cells[y][x].text == txt) ++x;
        var right = x - 1;
        // Prepare to recur seek bordering text
        var thisrow = [], flaggedCells = [];
        var condition = function(cell) { return cell.text == txt; }
        for (var i = left; i <= right; i++) {
          thisrow.push(i);
          newMask.push([i, y]);
          arena.setCell(flaggedCells, i, y, true);
        }
        this.recurSeek(y-1, map, thisrow, condition, flaggedCells, newMask);
        this.recurSeek(y+1, map, thisrow, condition, flaggedCells, newMask);
      } else if (evt.detail == 3) { // Select all same text on map
        for (y = 0; y < arena.map.height; y++) { var row = cells[y];
          for (x = 0; x < arena.map.width; x++) { var cell = row[x];
            if (cell.text == txt)
              newMask.push([x,y]);
          }
        }
      }
      return newMask;
    },

    /** Recursively seek bordering grid.
     * @param y     Cell row index
     * @param map   Two-dimension cell array
     * @param lastrow   Array of x index of selected last row
     * @param condition A condition function that mark a cell (takes a cell as parameter)
     * @param flaggedCells Two-dimension flag array for quick checking
     * @param flaggedCo    Result flagged coordinate array
     */
    recurSeek : function (y, map, lastrow, condition, flaggedCells, flaggedCo) {
      if (y < 0 || y >= map.height) return;
      var thisrow = [], cells = map.cells;
      var l = lastrow.length;
      // First, find cells neighbouring last cell that fulfills condition
      for (var i = 0; i < l; i++) { var x = lastrow[i];
        if (arena.getCell(flaggedCells, x, y, null) !== null) continue; // Skip checked
        if (condition(cells[y][x])) {
          thisrow.push(x);
          flaggedCo.push([x, y]);
          arena.setCell(flaggedCells, x, y, true);
        } else {
          arena.setCell(flaggedCells, x, y, false);
        }
      }
      l = thisrow.length;
      if (l <= 0) return;
      // Then, for each segment, expand to include horizontally bordering cells
      var done = false, l1 = l-1;
      i = 0;
      while (!done) {
        // Work on next segment. Proceed left first.
        var left = thisrow[i];
        for (var x = left-1; x >= 0; x--) {
          if (arena.getCell(flaggedCells, x, y, null) !== null || !condition(cells[y][x])) break;
          thisrow.push(x);
          flaggedCo.push([x, y]);
          arena.setCell(flaggedCells, x, y, true);
        }
        // Find right end
        if (i < l1) {
          var next = thisrow[++i];
          while (i < l1 && next == left + 1) {
            left = next;
            next = thisrow[++i];
          }
          --i;
        }
        done = (i >= l1); // End of all segments
        // Process right
        var right = left;
        for (var x = right+1; x < map.width; x++) {
          if (arena.getCell(flaggedCells, x, y, null) !== null || !condition(cells[y][x])) break;
          thisrow.push(x);
          flaggedCo.push([x, y]);
          arena.setCell(flaggedCells, x, y, true);
        }
        ++i;
      }
      // Flag cells and seek up & down
      thisrow.sort(sortNumber);
      this.recurSeek(y-1, map, thisrow, condition, flaggedCells, flaggedCo);
      this.recurSeek(y+1, map, thisrow, condition, flaggedCells, flaggedCo);
    },
  };


// Text tool, used to draw text.  Most functions shared by Paint and Erase tool. 
arena.tools.Dropper = {
    down : function(evt, x, y) {
      var cell = arena.map.layer.get(x,y);
      arena.map.text = $('mapinput').value = cell && cell.text ? cell.text : arena.map.background_fill.text;
      var foreground = cell && cell.foreground ? cell.foreground : arena.map.background_fill.foreground ;
      var background = cell && cell.background ? cell.background : arena.map.background_fill.background ;
      arena.ui.setForeground( evt.shiftKey ? background : foreground );
      arena.ui.setBackground( evt.shiftKey ? foreground : background );
    },
    move : function(evt, x, y) {
      arena.map.setMarked([[x,y]]);
    },
    up     : arena.empty,
    key    : arena.empty,
    cursor : function(evt, x, y) { return 'cell'; },
    hint   : function(evt, x, y) { return arena.lang.tool.usehint_dropper; },
    set    : arena.empty,
    unset  : arena.empty,
    cancel : arena.empty,
    outOfCanvas : arena.empty,
  };


arena.commands = {
  list : ['SetMask', 'SetCell', 'SetText', 'SetForeground', 'SetBackground', 'Erase', 'MoveMasked' 
         ,'LayerMove', 'LayerDelete', 'LayerAdd'],

  // Setup commands, call once
  initialise : function() {
    var l = this.list.length;
    for (var i = 0; i < l; i++) { var name = this.list[i];
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
    this.coList = coList;0
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
      if (this.text !== undefined) {
        c.text = this.text;
      }
      if (this.foreground !== undefined) {
        c.foreground = this.foreground;
      }
      if (this.background !== undefined) {
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
          if (!cell || !map.cells[y][x].masked) continue;
          var cx = x + dx;
          if (cx >= 0 && cx < map.width) {
            var cell2 = layer.createCell(cx, cy);
            cell2.text = cell.text;
            cell2.foreground = cell.foreground;
            cell2.background = cell.background;
            if (!this.isCopy)
              layer.set(x,y,null);
            newMask.push([cx, cy]);
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

arena.commands.initialise();