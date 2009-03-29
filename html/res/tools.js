/********************** JavaScript Arena, drawing tool code *****************************/

/*
 * arena.tools contain a set of tool functions and tools.
 * Each tool manage their own state, and contains the following manipulation methods:
 *
 *   down() : called when mouse is pressed.
 *   move() : called when mouse is move.
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
 *   cancel() : called when a cancel command is issued
 *   outOfCanvas() : called when mouse is clicked (not moved) outside canvas
 *
 *
 * arena.commmands contain a set of (redoable) commands
 * Each commands contains the following properties and methods:
 *
 *   name   : name of this command.
 *   desc   : more detailed description of this command.
 *   redo() : call to redo this action.
 *   undo() : call to undo this action.
 *   repeat() : call to repeat this action. (Optional, only if it make sense to repeat)
 *
 */

arena.tools = {
  list : ['Mask'], // Tool list

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
    if (arena.tool) {
      arena.tools.unset();
    }
    arena.tool = newTool;
  },

  /** Grid mask tool */
  Mask : {
    isInuse : false, // True if tool is in use.
    isMoving : false, // True is tool's usage is draggons
    sx : 0, sy : 0, // starting x and starting y

    down : function(evt, x, y) {
      if (evt.button < 2) { // Only care left button. God damn IE for not following standards
        if (!evt.ctrldown && this.isInuse) return; // In use and not multi? Ignore as attemp to re-release.
        this.sx = x; this.sy = y; // Set new starting xy
        var map = arena.map;
        if (evt.detail > 1 && evt.detail <= 3) {
          // TODO: undo last select
          var newMask = this.selectSimiliar(evt, x, y);
          if (evt.ctrlKey) {
            var l = newMask.length, cells = map.cells;
            // Check marked cell
            for (var i = l-1; i >= 0; i--) {
              var m = newMask[i];
              var c = cells[m[1]][m[0]];
              if (c.masked)
                  newMask.splice(i, 1); // Ctrl: Multi; Already masked, remove duplicates
            }
            newMask = map.masked.concat(newMask);
          }
          arena.commands.run(new arena.commands.SetMask(newMask));
        } else {
          this.isInUse = true;
          map.toolHeight = map.toolWidth = 1;
          map.setMarked([[x,y]]);
          this.isMoving = !evt.shiftKey && map.cells[y][x].masked;
        }
      }
    },
    move : function(evt, x, y) {
      if (this.isInUse) {
        var dy = y - this.sy, dx = x - this.sx;
        var marks, map = arena.map;
        if (!this.isMoving) {
          // Re-calc area width/height
          arena.toolHeight = Math.abs(dy)+1;
          arena.toolWidth = Math.abs(dx)+1;
          marks = arena.tools.genRectagleCoList(x, y, this.sx, this.sy);
        } else {
          // Show where selection would go
          arena.toolHeight = dy;
          arena.toolWidth = dx;
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
          // TODO: Move to command
          var dy = y - this.sy, dx = x - this.sx;
          if (dy == dx && dy == 0) return; // No need to do anything
          // Determin movement scope and direction
          var bounds = arena.coListBounds(map.masked);
          var minX = bounds[0], minY = bounds[1], maxX = bounds[2], maxY = bounds[3];
          newMask = [];
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
            var row = map.cells[y], cy = y + dy;
            if (cy >= 0 && cy < map.height) { var row2 = map.cells[cy];
              for (x = sx; x != ex; x += xd) { var cell = row[x];
                if (!cell.masked) continue; // Skip non-masked cells
                var cx = x + dx;
                if (cx >= 0 && cx < map.width) { var cell2 = row2[cx];
                  newMask.push([cx, cy]);
                  cell2.text = cell.text;
                  cell2.foreground = cell.foreground;
                  cell2.background = cell.background;
                  cell2.repaintCellContent();
                  if (!evt.ctrlKey) {
                    cell.text = null;
                    cell.background = arena.background;
                    cell.foreground = arena.foreground;
                    cell.repaintCellContent();
                  }
                }
              }
            }
          }
        } else {
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
        }
        arena.commands.run(new arena.commands.SetMask(newMask));
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
      var newMask = [], txt = cells[y][x].getText();
      if (evt.detail == 2) { // Select all similiar text
        // Check left
        --x;
        while (x >= 0 && cells[y][x].getText() == txt) --x;
        var left = x + 1;
        // Check right
        x = this.sx + 1;
        while (x < map.width && cells[y][x].getText() == txt) ++x;
        var right = x - 1;
        // Prepare to recur seek bordering text
        var thisrow = [], flaggedCells = [];
        var condition = function(cell) { return cell.getText() == txt; }
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
            if (cell.getText() == txt)
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
  },
}

arena.commands = {
  list : ['SetMask', 'SetCell', 'SetText', 'SetForeground', 'SetBackground'],

  // Setup commands, call once
  initialise : function() {
    var l = this.list.length;
    for (var i = 0; i < l; i++) { var name = this.list[i];
       var cmd = this[name];
       cmd.prototype.name = arena.lang.command['name_'+name];
    }
  },

  // Run a new command
  run : function(command) {
    command.redo();
    arena.ui.setStatus(command.desc);
  },

  SetMask : function(coList) {
    this.newMask = coList;
    this.desc = this.name + ' (x' + coList.length + ')';
  },

  SetCell : function(text, foreground, background, coList) {
    this.text = text;
    this.foreground = foreground;
    this.background = background;
    this.coList = coList;
    this.desc = this.name + ' "' + text + '"/' + foreground + '/' + background;
  },

  SetText : function(text, coList) {
    this.text = text;
    this.coList = coList;
    this.desc = this.name + ' "' + text + '"';
  },

  SetForeground : function(foreground, coList) {
    this.foreground = foreground;
    this.coList = coList;
    this.desc = this.name + ' "' + foreground + '"';
  },

  SetBackground : function(background, coList) {
    this.background = background;
    this.coList = coList;
    this.desc = this.name + ' "' + background + '"';
  },
}

arena.commands.SetMask.prototype = {
  redo : function() {
    if (!this.originalMask) this.originalMask = arena.map.masked.concat([]);
    arena.map.setMasked(this.newMask);
  },
  undo : function() { arena.map.setMasked(this.originalMask); }
}

arena.commands.SetCell.prototype = {
  redo : function() {
    var l = this.coList.length;
    for (var i = 0; i < l; i++) {
      var m = this.coList[i];
      var c = arena.map.cells[m[1]][m[0]];
      if (this.text !== undefined) {
        c.text = this.text;
        c.repaintCellText();
      }
      if (this.foreground !== undefined) {
        c.foreground = this.foreground;
        if (this.background === undefined) c.repaintCellStyle();
      }
      if (this.background !== undefined) {
        c.background = this.background;
        c.repaintCellStyle();
      }
    }
  },
  undo : function() { },
}

arena.commands.SetText.prototype = {
  redo : arena.commands.SetCell.prototype.redo,
  undo : arena.commands.SetCell.prototype.undo,
}

arena.commands.SetForeground.prototype = {
  redo : arena.commands.SetCell.prototype.redo,
  undo : arena.commands.SetCell.prototype.undo,
}

arena.commands.SetBackground.prototype = {
  redo : arena.commands.SetCell.prototype.redo,
  undo : arena.commands.SetCell.prototype.undo,
}

arena.commands.initialise();