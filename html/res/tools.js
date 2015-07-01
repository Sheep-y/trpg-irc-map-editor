/********************** JavaScript Arena, drawing tool code *****************************/

/*
 * arena.tools contain a set of tool functions and tools.
 * Each tool manage their own state, and contains the following manipulation methods:
 *
 *   down() : called when mouse is pressed.
 *   move() : called when mouse is moved.
 *   up()   : called when mouse is released.
 *   key()  : called when certain keys are pressed (e.g. direction key).
 *   brush(): set brush, x may be 1, 2, or 3.
 *   cursor(): return suitable cursor for a grid.
 *   hint()  : return suitable hint for a grid.
 *
 * For these methods, evt is the event object, and x & y are grid coordinates.
 * Each tool also contains some common methods:
 *
 *   set() : called when the tool is selected for use. Good time to reset state.
 *   unset() : called when the tool is unselected from use to another.
 *   cancel() : called when a cancel command is issued.
 *   outOfCanvas() : called when mouse is clicked (not moved) outside canvas.
 *
 */

(function(){

arena.tools = {
  list : ['Text','Brush','Eraser','Mask','Move','Dropper','Crop'], // Tool list

  sortNumber : function(a,b) { return a - b; },

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

  getTopLayerAt : function(x, y, attr) {
    var layers = arena.map.layers;
    for (var i = layers.length-1; i >= 0; i--)
      if (layers[i].visible && layers[i].getA(x, y, attr))
        return layers[i];
    return null;
  },

  // Set a tool as currently in use
  setTool : function(newTool, evt) {
    if (arena.map.tool) {
      arena.map.tool.unsetTool();
    }
    arena.map.tool = newTool;
    if ( newTool ) {
      newTool.setTool();
      if (evt)
        arena.ui.setHint(newTool.hint(evt, arena.event.lastMouseX, arena.event.lastMouseY));
    }
    arena.map.setMarked([]);
    arena.ui.updateButtons();
  },

  /** Select cell with same text that are bordering this cell / all over the map */
  selectSimiliar : function (layer, x, y, selectAll) {
    var map = arena.map
      , sx = x
      , sy = y
      , newMask = []
      , txt = layer.getA(x,y,'text')
      , clr = layer.getA(x,y,'foreground');
    if (!selectAll) { // Select all similiar text
      // Check left
      --x;
      while (x >= 0 && layer.getA(x,y,'text') === txt && layer.getA(x,y,'foreground') === clr ) --x;
      var left = x + 1;
      // Check right
      x = sx + 1;
      while (x < map.width && layer.getA(x, y, 'text') === txt && layer.getA(x,y,'foreground') === clr ) ++x;
      var right = x - 1;
      // Prepare to recur seek bordering text
      var thisrow = [], flaggedCells = [];
      var condition = function(cell) { return cell === txt || (cell && cell.text === txt); }
      for (var i = left; i <= right; i++) {
        thisrow.push(i);
        newMask.push([i, y]);
        arena.setCell(flaggedCells, i, y, true);
      }
      arena.tools.recurSeek(y-1, map, layer, thisrow, condition, flaggedCells, newMask);
      arena.tools.recurSeek(y+1, map, layer, thisrow, condition, flaggedCells, newMask);
    } else { // Select all same text on layer
      for (y = 0; y < map.height; y++) {
        for (x = 0; x < map.width; x++) {
          if (layer.getA(x, y, 'text') === txt && layer.getA(x,y,'foreground') === clr)
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
  recurSeek : function (y, map, layer, lastrow, condition, flaggedCells, flaggedCo) {
    if (y < 0 || y >= map.height) return;
    var thisrow = [];
    var l = lastrow.length;
    // First, find cells neighbouring last cell that fulfills condition
    for (var i = 0; i < l; i++) { var x = lastrow[i];
      if (arena.getCell(flaggedCells, x, y, null) !== null) continue; // Skip checked
      if (condition(layer.get(x, y))) {
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
        if (arena.getCell(flaggedCells, x, y, null) !== null || !condition(layer.get(x,y))) break;
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
        if (arena.getCell(flaggedCells, x, y, null) !== null || !condition(layer.get(x,y))) break;
        thisrow.push(x);
        flaggedCo.push([x, y]);
        arena.setCell(flaggedCells, x, y, true);
      }
      ++i;
    }
    // Flag cells and seek up & down
    thisrow.sort(arena.tools.sortNumber);
    arena.tools.recurSeek(y-1, map, layer, thisrow, condition, flaggedCells, flaggedCo);
    arena.tools.recurSeek(y+1, map, layer, thisrow, condition, flaggedCells, flaggedCo);
  },
}

// Text tool, used to draw text.  Most functions shared by Brush and Eraser tool.
arena.tools.Text = {
  	drawing : false,
  	brushSize : 1,
  	lastBrushCo : undefined,
    down : function(evt, x, y) {
      if (evt.button < 2) {
        this.drawing = true;
        this.draw(evt, x, y);
      }
    },
    move : function(evt, x, y) {
      arena.map.setMarked(this.getBrushCoList(x,y));
      if (this.drawing)
        this.draw(evt, x, y);
    },
    up   : function(evt, x, y) {
      if (evt.button < 2) {
        this.drawing = false;
        this.lastBrushCo = undefined;
      }
    },
    draw : function(evt, x, y) {
      if (arena.map.layer) {
        var coList;
        if (!evt.ctrlKey) {
          // No ctrl key, just paint cell. First check whether we are adjacent to last paint point
          if (!this.lastBrushCo || ( Math.abs(this.lastBrushCo[0]-x) <= 1 && Math.abs(this.lastBrushCo[1]-y) <= 1 ) )
      	    coList = this.getBrushCoList(x,y);
      	  else {
      	    // The coordinate jumped; draw a line
      	    var dx = this.lastBrushCo[0]-x, dy = this.lastBrushCo[1]-y;
            var d = Math.max(Math.abs(dx), Math.abs(dy));
            coList = [];
            for (var i = d; i >= 0; i--)
              coList = coList.concat( this.getBrushCoList( x + Math.round(dx*i/d), y + Math.round(dy*i/d) ) );
            coList = arena.uniqueCoList(coList);
          }
      	} else {
      	  coList = [[x,y]]; // Ctrl key, fill mode
      	}
      	this.lastBrushCo = [x,y];
        if (arena.map.masked.length) {
          var mask = arena.map.masked;
          for (var i = coList.length-1; i >= 0; i--) {
            if (arena.xyInCoList(coList[i][0], coList[i][1], mask) < 0)
              coList.splice(i, 1);
          }
          if (coList.length < 0) return;
        }
        var cmd = this.getCommand(evt, coList);
        arena.commands.run(cmd);
      }
    },
    getCommand : function(evt, coList) {
      var text = arena.map.text;
      if ( !text ) text = null;
      return !evt.shiftKey
        ? new arena.commands.SetCell(text, arena.map.foreground, null, coList, arena.map.layer)
        : new arena.commands.SetCell(text, null, arena.map.foreground, coList, arena.map.layer);
    },
    dbclick: arena.empty,
    key  : function(evt) {
      if (evt.keyCode == 107 && !evt.ctrlKey  && this.brushSize < 100) { // +
        ++this.brushSize;
        this.move(evt, arena.event.lastMouseX, arena.event.lastMouseY);
        arena.event.eatEvent(evt);
      } else if (evt.keyCode == 109 && !evt.ctrlKey  && this.brushSize > 1) { // -
        --this.brushSize;
        this.move(evt, arena.event.lastMouseX, arena.event.lastMouseY);
        arena.event.eatEvent(evt);
      }
    },
    brush  : function(evt, size) {
      if (size < 1) size = 1;
      this.brushSize = size*2-1;
      this.move(evt, arena.event.lastMouseX, arena.event.lastMouseY);
    },
    getBrushCoList : function(x, y) {
      if (this.brushSize == 1) return [[x,y]];
      var sx = Math.max( Math.ceil(-this.brushSize/2)+x, 0);
      var ex = Math.min( Math.floor((this.brushSize-1)/2)+x, arena.map.width-1);
      var sy = Math.max( Math.ceil(-this.brushSize/2)+y, 0);
      var ey = Math.min( Math.floor((this.brushSize-1)/2)+y, arena.map.height-1);
      var result = [];
      for (var dx = sx; dx <= ex; dx++)
        for (var dy = sy; dy <= ey; dy++) {
          result.push([dx, dy]);
        }
      return result;
    },
    cursor : function(evt, x, y) {
      return (evt.ctrlKey) ? 'cell' : 'default';
    },
    hint : function(evt, x, y) {
      return arena.lang.tool.usehint_text;
    },
    setTool : function(evt) { this.drawing = false; this.lastBrushCo = undefined; },
    unsetTool : function(evt) { this.drawing = false; this.lastBrushCo = undefined; },
    cancel : function(evt) { this.drawing = false; this.lastBrushCo = undefined; },
    outOfCanvas : function(evt) {
      if ( arena.map.masked.length > 0 ) arena.commands.run(new arena.commands.SetMask([]));
      this.cancel(evt);
    },
  };

arena.tools.Brush = {
  	drawing : false,
  	brushSize : 1,
  	lastBrushCo : undefined,
    down : arena.tools.Text.down,
    move : arena.tools.Text.move,
    up   : arena.tools.Text.up,
    draw : arena.tools.Text.draw,
    getCommand : function(evt, coList) {
      return !evt.shiftKey
        ? new arena.commands.SetBackground(arena.map.foreground, coList, arena.map.layer)
        : new arena.commands.SetForeground(arena.map.foreground, coList, arena.map.layer);
    },
    dbclick: arena.empty,
    key  : arena.tools.Text.key,
    brush  : arena.tools.Text.brush,
    getBrushCoList : arena.tools.Text.getBrushCoList,
    cursor : function(evt, x, y) {
      return (evt.ctrlKey) ? 'default' : 'cell';
    },
    hint : function(evt, x, y) {
      return arena.lang.tool.usehint_brush;
    },
    setTool : arena.tools.Text.setTool,
    unsetTool : arena.tools.Text.unsetTool,
    cancel : arena.tools.Text.cancel,
    outOfCanvas : arena.tools.Text.outOfCanvas,
  };


arena.tools.Eraser = {
  	drawing : false,
  	brushSize : 1,
  	lastBrushCo : undefined,
    down : arena.tools.Text.down,
    move : arena.tools.Text.move,
    up   : arena.tools.Text.up,
    draw : arena.tools.Text.draw,
    getCommand : function(evt, coList) {
      return new arena.commands.Erase(coList, arena.map.layer);
    },
    dbclick: arena.empty,
    key  : arena.tools.Text.key,
    brush  : arena.tools.Text.brush,
    getBrushCoList : arena.tools.Text.getBrushCoList,
    cursor : function(evt, x, y) {
      return (evt.ctrlKey) ? 'default' : 'cell';
    },
    hint : function(evt, x, y) {
      return arena.lang.tool.usehint_eraser;
    },
    setTool : arena.tools.Text.setTool,
    unsetTool : arena.tools.Text.unsetTool,
    cancel : arena.tools.Text.cancel,
    outOfCanvas : arena.tools.Text.outOfCanvas,
  };


/** Grid mask tool */
arena.tools.Mask = {
    isInuse : false, // True if tool is in use.
    isMoving : false, // True is tool's usage is draggons
    sx : 0, sy : 0, // starting x and starting y
    reduceCount : 0,  // Level of reduction by double click

    down : function(evt, x, y) {
      if (evt.button < 2) { // Only care left button. IE not following standards
        if (!evt.ctrldown && this.isInuse) return; // In use and not multi? Ignore as attemp to re-release.
        this.sx = x; this.sy = y; // Set new starting xy
        var map = arena.map;
        if (evt.detail > 1 && evt.detail <= 3) {
          // Double / Triple click
          var newMask = arena.tools.selectSimiliar(map, x, y, evt.detail != 2);
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
          if (dy == dx && dy == 0) {
            // Never moved. Consider this a single click.
            if (map.masked.length == 1 && map.masked[0][0] == x && map.masked[0][1] == y )
              arena.commands.run(new arena.commands.SetMask([]));
            else
              arena.commands.run(new arena.commands.SetMask([[x,y]]));
          } else
            arena.commands.run(
              new arena.commands.MoveArea(arena.map.masked, dx, dy, arena.map.layer, evt.ctrlKey, true));
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
      this.reduceCount = 0;
    },
    dbclick : function (evt) {
      // Mask only function: select half of current mask
      arena.map.setMarked([]);
      var mask = arena.map.masked, len = mask.length;
      if (!mask || mask.length <= 0 || this.reduceCount >= 4) {
        arena.map.setMasked(arena.map.layer.getCoList());
        this.reduceCount = 0;
        return;
      }
      var newMask = [];
      var func = null;
      ++this.reduceCount;
      switch (this.reduceCount) {
        case 2:
          func = function(co) { return co[1] % 2 == 0 && (co[0]+co[1]) %2 == 0; }; break;
        case 3:
          func = function(co) { return (co[0]+co[1]) %4 == 0; }; break;
        case 4:
          func = function(co) { return co[1] % 4 == 0 && (co[0]+co[1]) %8 == 0; }; break;
        default:
          func = function(co) { return (co[0]+co[1]) %2 == 0; }; break;
      }
      for (var i = 0; i < len; i++)
        if (func(mask[i]))
          newMask.push(mask[i]);
      arena.map.setMasked(newMask);
    },
    outOfCanvas : function (evt) {
      if ( !this.isInUse && arena.map.masked.length > 0 )
        arena.commands.run(new arena.commands.SetMask([]));
      else
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
          arena.commands.run(new arena.commands.Erase(arena.map.masked, arena.map.layer));
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
    brush  : arena.empty,
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

    setTool : function() { this.isInUse = this.isMoving = false; this.reduceCount = 0; },
    unsetTool : function() { this.cancel(); },
    cancel : function() {
      if ( this.isInUse && arena.map.masked.length > 0 ) arena.map.setMarked([]);
      this.isInUse = this.isMoving = false;
    },
  };


// Move tool, used to move stuffs.
arena.tools.Move = {
    movingArea : null,
    useExistingMask : false,
    //clearMask : false,
    movingMask : null,
    startX : 0,
    startY : 0,
    down : function(evt, x, y) {
      if (evt.button < 2) {
        this.layer = arena.tools.getTopLayerAt(x, y, 'text');
        this.movingArea = this.getMoveArea(x, y);
        if (this.movingArea.length) {
          this.startX = x;
          this.startY = y;
          //arena.commands.run(new arena.commands.SetMask(this.movingArea));
          //this.clearMask = !this.usingExistingMask;
        } else {
          this.movingArea = null;
        }
      } else {
      }
    },
    move : function(evt, x, y) {
      if (this.movingArea) {
        // Moving something. Move highlight and show it
        var dx = x - this.startX, dy = y - this.startY;
        var w = arena.map.width, h = arena.map.height;
        var mark = this.movingArea.concat([]);
        for (var i = mark.length-1; i >= 0; i--) {
          mark[i] = [mark[i][0]+dx, mark[i][1]+dy];
          if (mark[i][0] < 0 || mark[i][0] >= w || mark[i][1] < 0 || mark[i][1] >= h)
            mark.splice(i, 1);
        }
        arena.map.setMarked(mark);
      } else {
        this.layer = arena.tools.getTopLayerAt(x, y, 'text');
        // Just hoving around, mark highlight if there is something
        if (this.layer && this.layer.getA(x, y, 'text')) {
          arena.map.setMarked(this.getMoveArea(x, y));
        } else
          arena.map.setMarked([]);
      }
    },
    getMoveArea : function(x, y) {
      if (!this.layer) this.layer = arena.map.layer;
      this.useExistingMask = false;
      if (arena.map.cells[y][x].masked) {
        this.useExistingMask = true;
        return arena.map.masked;
      } else
        if (!this.layer.getA(x, y, 'text'))
          return [];
      else
        return arena.tools.selectSimiliar(this.layer, x, y);
    },
    up     : function(evt, x, y) {
      if (this.movingArea) {
        if (x !== this.startX || y !== this.startY) {
          arena.commands.run(
            new arena.commands.MoveArea(this.movingArea, x-this.startX, y-this.startY, this.layer, evt.ctrlKey, this.useExistingMask));
        }
        arena.map.setMarked([]);
        this.movingArea = null;
        this.useExistingMask = false;
      }
    },
    dbclick: arena.empty,
    key    : arena.empty,
    brush  : arena.empty,
    cursor : function(evt, x, y) {
      var topLayer = arena.tools.getTopLayerAt(x, y, 'text');
      if (!topLayer) return 'default';
      var cell = arena.map.layer.get(x, y, 'text');
      return (this.movingArea || cell )? (evt.ctrlKey ? 'copy' : 'move') : 'default';
    },
    hint   : function(evt, x, y) { return arena.lang.tool.usehint_move; },
    setTool    : function(){ this.reset(); },
    unsetTool  : function(){ this.reset(); },
    cancel : function(){ this.reset(); },
    outOfCanvas : function() {
      if ( arena.map.masked.length > 0 ) arena.map.setMasked([]);
      arena.map.setMarked([]);
    },
    reset : function () {
      this.movingArea = null;
      arena.map.setMarked([]);
      //if (this.clearMask)
      //  arena.map.setMasked([]);
    },
  };



// Text tool, used to draw text.  Most functions shared by Paint and Erase tool.
arena.tools.Dropper = {
    down : function(evt, x, y) {
      var cell = arena.map.layer.get(x,y);
      arena.ui.setText( cell && cell.text ? cell.text : arena.map.background_fill.text );
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
    brush  : arena.empty,
    cursor : function(evt, x, y) { return 'cell'; },
    hint   : function(evt, x, y) { return arena.lang.tool.usehint_dropper; },
    setTool  : arena.empty,
    unsetTool: arena.empty,
    cancel   : arena.empty,
    outOfCanvas : arena.empty,
  };

// Crop tool, used to select a rectangular area without affecting mask.
arena.tools.Crop = {
    sx : null,
    sy : null,
    ex : null,
    ey : null,
    mx : null,
    my : null,
    movingArea : '',
    lastTool : null,
    lastMask : [],
    callback : null,
    activate : function( callback ) {
      arena.tools.Crop.lastTool = arena.map.tool;
      arena.tools.Crop.callback = callback;
      arena.tools.setTool(arena.tools.Crop);
    },
    /** Check whether given coordinate is inside, at border, or outside current area */
    checkBorder : function(x,y) {
      if ( x < this.sx || x > this.ex || y < this.sy || y > this.ey ) return '';
      var border = '';
      if ( y === this.sy ) {
        border += 'top';
      } else if ( y === this.ey ) {
        border += 'bottom';
      }
      if ( x === this.sx ) {
        border += 'left';
      } else if ( x === this.ex ) {
        border += 'right';
      }
      return border ? border : 'area';
    },
    down : function(evt, x, y) {
      if ( evt.detail < 2 ) {
        if ( this.movingArea == '' ) {
          var border = this.checkBorder(x,y);
          if ( border === 'area' ) {
            /* move area */
            this.mx = x;
            this.my = y;
          } else if ( border == '' ) {
            /* reset area */
            this.sx = this.ex = x;
            this.sy = this.ey = y;
            border = 'bottomright';
          }
          this.movingArea = border;
          this.draw(evt, x, y);
        }
      } else {
        this.apply(evt);
      }
    },
    move : function(evt, x, y) {
      this.draw(evt, x, y);
    },
    up   : function(evt, x, y) {
      if ( this.movingArea ) {
        switch ( this.movingArea ) {
          case 'topleft'    : this.sx = x;
          case 'top'        : this.sy = y; break;
          case 'topright'   : this.sy = y;
          case 'right'      : this.ex = x; break;
          case 'bottomright': this.ex = x;
          case 'bottom'     : this.ey = y; break;
          case 'bottomleft' : this.ey = y;
          case 'left'       : this.sx = x; break;
          case 'area' :
            var dx  = x - this.mx,
                dy = y - this.my;
            this.sx += dx;
            this.ex += dx;
            this.sy += dy;
            this.ey += dy;
        }
        this.movingArea = '';
        this.draw(evt, x, y);
      }
    },
    /** Update mask / mark */
    draw : function(evt, x, y) {
      // Set initial dimension
      if ( this.sx === null ) {
        this.sx = this.sy = 2;
        this.ex = arena.map.width-3;
        this.ey = arena.map.height-3;
      } else {
        // Make sure dimensions is correct
        if ( this.sx > this.ex ) {
          var tmp = this.sx;
          this.sx = this.ex;
          this.ex = tmp;
          if ( this.movingArea.match(/right/) )
             this.movingArea = this.movingArea.replace(/right/, 'left');
          else if ( this.movingArea.match(/left/) )
             this.movingArea = this.movingArea.replace(/left/, 'right');
        }
        if ( this.sy > this.ey ) {
          var tmp = this.sy;
          this.sy = this.ey;
          this.ey = tmp;
          if ( this.movingArea.match(/top/) )
             this.movingArea = this.movingArea.replace(/top/, 'bottom');
          else if ( this.movingArea.match(/bottom/) )
             this.movingArea = this.movingArea.replace(/bottom/, 'top');
        }
        if ( this.sx < 0 ) this.sx = 0;
        if ( this.sy < 0 ) this.sy = 0;
        if ( this.ex >= arena.map.width )
          this.ex = arena.map.width-1;
        if ( this.ey >= arena.map.height )
          this.ey = arena.map.height-1;
      }
      // Set mask
      arena.map.setMasked( arena.tools.genRectagleCoList( this.sx, this.sy, this.ex, this.ey ));
      if ( this.movingArea == '' ) {
        // Not moving, highlight borders that you can move
        switch ( this.checkBorder(x,y) ) {
          case 'topleft'    : arena.map.setMarked( arena.tools.genRectagleCoList( this.sx, this.sy, this.ex, this.sy ).concat(arena.tools.genRectagleCoList( this.sx, this.sy, this.sx, this.ey ) ) ); break;
          case 'top'        : arena.map.setMarked( arena.tools.genRectagleCoList( this.sx, this.sy, this.ex, this.sy ) ); break;
          case 'topright'   : arena.map.setMarked( arena.tools.genRectagleCoList( this.sx, this.sy, this.ex, this.sy ).concat(arena.tools.genRectagleCoList( this.ex, this.sy, this.ex, this.ey ) ) ); break;
          case 'right'      : arena.map.setMarked( arena.tools.genRectagleCoList( this.ex, this.sy, this.ex, this.ey ) ); break;
          case 'bottomright': arena.map.setMarked( arena.tools.genRectagleCoList( this.sx, this.ey, this.ex, this.ey ).concat(arena.tools.genRectagleCoList( this.ex, this.sy, this.ex, this.ey ) ) ); break;
          case 'bottom'     : arena.map.setMarked( arena.tools.genRectagleCoList( this.sx, this.ey, this.ex, this.ey ) ); break;
          case 'bottomleft' : arena.map.setMarked( arena.tools.genRectagleCoList( this.sx, this.ey, this.ex, this.ey ).concat(arena.tools.genRectagleCoList( this.sx, this.sy, this.sx, this.ey ) ) ); break;
          case 'left'       : arena.map.setMarked( arena.tools.genRectagleCoList( this.sx, this.sy, this.sx, this.ey ) ); break;
          case 'area' :
            arena.map.setMarked( arena.tools.genRectagleCoList( this.sx, this.sy, this.ex, this.ey ) ); break;
          default : arena.map.setMarked( [[x, y]] );
        }
      } else {
        // Highlight new area
        var sx = this.sx, ex = this.ex, sy = this.sy, ey = this.ey;
        switch ( this.movingArea ) {
          case 'topleft'    : sx = x;
          case 'top'        : sy = y; break;
          case 'topright'   : sy = y;
          case 'right'      : ex = x; break;
          case 'bottomright': ex = x;
          case 'bottom'     : ey = y; break;
          case 'bottomleft' : ey = y;
          case 'left'       : sx = x; break;
          case 'area' :
            var dx = x - this.mx,
                dy = y - this.my;
            sx += dx;
            sy += dy;
            ex += dx;
            ey += dy;
        }
        if ( sx < 0 ) sx = 0;
        if ( sy < 0 ) sy = 0;
        if ( ex >= arena.map.width ) ex = arena.map.width-1;
        if ( ey >= arena.map.height ) ey = arena.map.height-1;
        arena.map.setMarked( arena.tools.genRectagleCoList( sx, sy, ex, ey ) );
      }
    },
    /** Apply this area */
    apply : function(evt) {
      if ( this.callback ) this.callback(evt);
      arena.tools.setTool( this.lastTool );
    },
    dbclick: arena.empty,
    key  : function(evt) {
      if ( evt.keyCode == 107 && !evt.ctrlKey ) { // +
        this.sx--;
        this.ex++;
        this.sy--;
        this.ey++;
        this.draw(evt);
        return arena.event.eatEvent(evt);

      } else if ( evt.keyCode == 109 && !evt.ctrlKey ) { // -
        if (this.sx < this.ex-2 ) {
          this.sx++;
          this.ex--;
        }
        if (this.sy < this.ey-2 ) {
          this.sy++;
          this.ey--;
        }
        this.draw(evt);
        return arena.event.eatEvent(evt);

      //} else if ( evt.keyCode == 27 ) { // Escape
      } else if ( evt.keyCode == 13 ) { // Enter
        this.apply(evt);
        return arena.event.eatEvent(evt, undefined, true);
      }
    },
    cursor : function(evt, x, y) {
      var type = this.movingArea ? this.movingArea : this.checkBorder(x,y);
      switch ( type ) {
        case 'topleft'    : return 'nw-resize';
        case 'top'        : return 'n-resize';
        case 'topright'   : return 'ne-resize';
        case 'right'      : return 'e-resize';
        case 'bottomright': return 'se-resize';
        case 'bottom'     : return 's-resize';
        case 'bottomleft' : return 'sw-resize';
        case 'left'       : return 'w-resize';
        case 'area' : return 'move';
        default : return 'default';
      };
    },
    hint : function(evt, x, y) {
      return arena.lang.tool.usehint_crop;
    },
    setTool : function(evt) {
      $('#toolbox').hide();
      this.lastMask = arena.map.masked.concat();
      this.movingArea = '';
      this.draw();
    },
    unsetTool : function(evt) {
      arena.map.setMarked( [] )
      arena.map.setMasked( this.lastMask );
      $('#toolbox').show();
    },
    cancel : function(evt) {
      if ( this.movingArea ) {
        // Cancel move area
        //this.outOfCanvas(evt);
        this.movingArea = '';
        this.mx = this.my = 0;
        this.draw(evt);
      } else {
        // Unset tool. this.unset() called by map.setTool()
        arena.tools.setTool( this.lastTool );
      }
    },
    outOfCanvas : function(evt) {
      this.cancel(evt);
    },
  };

})();