/********************** JavaScript Arena, model code *****************************/
/* Mostly code that manage the map and its objects, relied by the tools.
 * Because the map is created and managed here, code that controla map display
 * are also found here.
 */


//function $(eid) { return document.getElementById(eid); }
function sortNumber(a,b) { return a - b; }

//arena.toolWidth  = '--';   // Displayed tool-related width
//arena.toolHeight = '--';   // Displayed tool-related height


/************************* General functions ******************************/

// Empty, do nothing functions
arena.empty = function() {}

// Find a given xy coordinate in coordinate list. Return -1 if not found, index of coordinate if found
arena.xyInCoList = function(x, y, ary) {
  var l = ary.length;
  for (var i = 0; i < l; i++) { var a = ary[i]; if (a[0] == x && a[1] == y) return i; }
  return -1;
}

// Given a coordinate list, return one with no duplicate coordinates
arena.uniqueCoList = function(ary) {
  var map = [], l = ary.length, result = [];
  for (var i = 0; i < l; i++) {
    var a = ary[i];
    var x = a[0], y = a[1];
    if (!map[y]) map[y] = [];
    if (!map[y][x]) result.push(a);
    map[y][x] = true;
  }
  return result;
}

// Find the four boundareis in coordinate list. Return [minX, minY, maxX, maxY]. Return null if empty.
// The four corners are [0,0] (top left), [0,3] (bottom left), [2,1] (top right) and [2,3] (bottom right)
// var minX = bounds[0], minY = bounds[1], maxX = bounds[2], maxY = bounds[3];
arena.coListBounds = function(ary) {
  var l = ary.length, a, nx, ny, xx, xy; // minX, minY, maxX and maxY
  if (l <= 0) return null;
  nx = xx = ary[0][0];
  ny = xy = ary[0][1];
  for (var i = 0; i < l; i++) {
    a = ary[i];
    if (a[0] > xx) xx = a[0]; else if (a[0] < nx) nx = a[0];
    if (a[1] > xy) xy = a[1]; else if (a[1] < ny) ny = a[1];
  }
  return [nx, ny, xx, xy];
}

// Set two-dimension cell array
arena.setCell = function(cells, x, y, item) {
  if (!cells[y] && item != null) cells[y] = [];
  cells[y][x] = item;
}

/* Get two-dimension cell array */
arena.getCell = function(cells, x, y, ifNotFound) {
  if (!cells[y]) return ifNotFound;
  var row = cells[y];
  return row[x] ? row[x] : ifNotFound;
}

/** Reset map */
arena.reset = function() {
  arena.tools.setTool(arena.tools.Brush);
  var w = (arena.map.width <= 0) ? 36 : arena.map.width;
  var h = (arena.map.height <= 0) ? 24 : arena.map.height;
  // Clear data
  arena.map.layers = [];
  arena.map.layer = null;
  //for (var l = map.layers.length-1; l >= 0; l--)
  //  map.layers[l].cells = [];
  arena.map.recreate(w, h);
  arena.map.addLayer(new arena.Layer('Terrain' ));
  arena.map.addLayer(new arena.Layer('Effect'  ));
  arena.map.addLayer(new arena.Layer('Object'  ));
  arena.map.addLayer(new arena.Layer('Creature'));
  arena.map.addLayer(new arena.Layer('Overlay' ));
  arena.ui.updateLayers();
  arena.ui.setText(arena.map.background_fill.text);
  arena.ui.setForeground(arena.map.background_fill.foreground);
  arena.ui.setBackground(arena.map.background_fill.background);
  arena.commands.resetUndo();
}

/************************* Map objects *********************************/


arena.Layer = function(name) { // Use arena.map.createLayer instead!
  this.name = name;
  this.visible = true;
  this.cells = [];
}
arena.Layer.prototype = {
  name : null,
  visible : true,
  cells : null,
  // Remove this layer
  has : function(x,y) {
    var c = this.cells;
    return c[y] && c[y][x];
  },
  get : function(x,y) {
    var c = this.cells;
    if (!c[y]) return null;
    c = c[y];
    return c[x] ? c[x] : null;
  },
  set : function(x,y,value) {
    var c = this.cells;
    if (value) {
      if (!c[y])
        c[y] = [];
      c[y][x] = value;
    } else {
      if (!c[y]) return;
      delete c[y][x];
      if (!c[y]) delete c[y];
    }
  },
  createCell : function (x,y) { // Create cell if not exist, and return the cell
    var c = this.get(x,y);
    if (!c) {
      c = new arena.LayerCell();
      this.set(x, y, c);
    }
    return c;
  },
  getCoList : function() {
    var result = [];
    var cells = this.cells;
    var h = cells.length;
    if (h <= 0) return result;
    for (var y = 0; y < h; y++)
      if (cells[y] && cells[y].length > 0) {
        var row = cells[y];
        var w = row.length;
        for (var x = 0; x < w; x++)
          if (row[x])
            result.push([x,y]);
      }
    return result;
  },
  trim : function () { // Removes empty cells and rows
    var cells = this.cells;
    var h = cells.length;
    if (h <= 0) return;
    for (var y = 0; y < h; y++)
      if (cells[y]) {
        var row = cells[y];
        if (!row.length) delete cells[y];
        else {
          var count = 0, w = row.length;
          for (var x = 0; x < w; x++)
            if (row[x]) {
              var c = row[x];
              if (c === null || (c.background === c.foreground === c.text === null) )
                delete row[x];
              else
                count++;
            }
          if (count <= 0) delete cells[y];
        }
      }
  },
}

arena.map = { /** Map object. Store background, size, name, etc. */
  name : 'Map 1',
  cells : [],    // Canvas, array of array of Cell. Top left is 0, 0. This array is y then x.
  masked : [],   // Array of cells that are currently masked.
  marked : [],   // Array of cells that are currently marked by tools, always temporary.

  layer : null,  // Current layer.
  tool : null,   // Currently selected map tool
  text : '  ',   // Currently paint text
  foreground : '#000', // Current paint foreground colour
  background : '#FFF', // Current paint background colour
  brush : null,

  layers : [], // Layers of this map

  dx : 1, // displayed coordinate dx
  dy : 1, // displayed coordinate dy

  width  : 0, // width in #grid
  height : 0, // height in #grid

  table : $('#map')[0], // Map table element

  background_fill : {
    text : arena.lang.map.background,
    foreground : '#000',
    background : '#FFF',
    borderColour : '#000'
  },

  /*------------- Render methods ----------------*/
  
  // Update specified canvas area from layers
  repaint : function(coList) {
    if (coList)
      for (var p = coList.length-1; p >= 0; p--)
        this.repaintCell(coList[p][0], coList[p][1]);
    else
      for ( var y = 0; y < this.height; y++ )
        for ( var x = 0; x < this.width; x++ )
          this.repaintCell(x, y);
	},

  // Update text, foreground, and background of a cell from layers
  repaintCell : function(x, y) {
    var textDrawn = false;
    var foregroundDrawn = false;
    var backgroundDrawn = false;
    var subject = this.cells[y][x];
    // Then cover with layer
    var layers = this.layers;
    var len = layers.length;
    for (var l = len-1; l >= -1; l--) {
      if (l >= 0 && !layers[l].visible) continue;
      var cell = l >= 0 ? layers[l].get(x,y) : this.background_fill;
      if (cell) {
        if (!textDrawn && cell.text) {
          textDrawn = true;
          if (subject.text != cell.text) {
            subject.text = cell.text;
            subject.repaintCellText();
          }
        }
        if (!foregroundDrawn && cell.foreground) {
          foregroundDrawn = true;
          if (subject.foreground != cell.foreground) {
            subject.foreground = cell.foreground;
            subject.repaintCellForeground();
          }
        }
        if (!backgroundDrawn && cell.background) {
          backgroundDrawn = true;
          if (subject.background != cell.background) {
            subject.background = cell.background;
            subject.repaintCellBackground();
          }
        }
        if (textDrawn && foregroundDrawn && backgroundDrawn)
        break;
      }
    }
  },

  /*------------- Highlight methods ----------------*/
  // Set marked/masked properties. mass is arena's state, prop is cell property
  setMarkedMasked : function(mass, prop, newColList) {
    var markedMasked = this[mass];
    var totalArea = markedMasked.concat(newColList); // Area to redraw, ok to duplicate since redrawMark check dirty flag
    // Kill off all marks
    var l = markedMasked.length;
    for (var i = 0; i < l; i++) {
      var m = markedMasked[i];
      var c = this.cells[m[1]][m[0]];
      c[prop] = false;
      c.dirty = true;
    }
    // Redo marks
    this[mass] = newColList;
    l = newColList.length;
    for (var i = 0; i < l; i++) {
      var m = newColList[i];
      var c = this.cells[m[1]][m[0]]
      if (c) {
        c[prop] = true;
        c.dirty = true;
      }
    }
    if (totalArea.length > 0)
      this.redrawMark(totalArea);
  },

  /** Set marked region. Set redraw to false to prevent update of cells */
  setMarked : function(newMarks) {
    this.setMarkedMasked('marked', 'marked', newMarks);
  },

  /** Set masked region. Set redraw to false to prevent update of cells */
  setMasked : function(newSelections) {
    this.setMarkedMasked('masked', 'masked', newSelections);
  },

  /** Redraw marked and masked status of given coordinates */
  redrawMark : function (coList) {
    var l = coList.length;
    for (var i = 0; i < l; i++) { var co = coList[i];
      var cell = this.cells[co[1]][co[0]];
      if (!cell.dirty) continue;
      cell.repaintBorder();
      cell.dirty = false;
    }
  },
  
  /*------------- Layers -----------------------*/
  addLayer : function (layer, index) {
    if (index)
      this.layers.splice(index, 0, layer);
    else
      this.layers.push(layer);
    if (!this.layer)
      this.layer = layer;
  },
  
  removeLayer : function (layer) {
    var layers = this.layers;
    var i = layers.indexOf(layer);
    if (i >= 0) {
      layers.splice(i, 1);
      if (this.layer == layer)
        this.layer = layers.length ? layers[0] : null;
    }
    return i;
  },


  /*------------- Factory methods ----------------*/
  recreate: function(width, height) {
    var map = this;
    var table = map.table;
    var tbody = table.getElementsByTagName('tbody')[0];

    // Clear map
    /*
    for (var y = 0; y < map.height; y++) {
      var row = map.cells[y];
      for (var x = 0; x < map.width; x++)
        row[x].td = null;
    }
    */
    map.cells = [];
    for (y = tbody.getElementsByTagName('tr').length-1; y >= 0; y--)
       table.deleteRow(y);

    // Set new stats
    map.width = width;
    map.height = height;
    map.marked = [];
    map.masked = [];

    // Create cells and borders above cells
    for (y = 0; y < height; y++) {
      var r = this.createCellRow(y, y > 0 ? map.cells[y-1] : null);
      tbody.appendChild(r[0]);
      map.cells[y] = r[1];
    }
    arena.ui.setStatus(arena.lang.command.name_CreateMap + ' '+width+'x'+height);
    map.repaint();
  },

  /** Create a cell row with vertical border. Returns tr and cell array. */
  createCellRow : function(y, lastRow) {
    var tr = document.createElement('tr'), cells = [], td, cell;
    var w = arena.map.width;
    var background = arena.map.background_fill;
    var lastCell = null;
    for (var x = 0; x < w; x++) {
      // Grid cell
      td = document.createElement('td');
      td.setAttribute('onmousedown', 'arena.event.cellPress(event,'+x+','+y+');');
      td.setAttribute('onmouseover', 'arena.event.cellHover(event,'+x+','+y+');');
      td.setAttribute('onmouseup',  'arena.event.cellRelease(event,'+x+','+y+');');
      //if (background) td.innerHTML = background;
      tr.appendChild(td);
      // Model cell
      cell = new arena.Cell(x, y, lastCell, lastRow ? lastRow[x] : null, td);
      cell.text = background.text;
      cell.background = background.background;
      cell.foreground = background.foreground;
      cells[x] = cell;
      cell.repaintAll();
      lastCell = cell;
    }
    return [tr, cells];
  },
}


arena.LayerCell = function(text, foreground, background) {
  this.set(text, foreground, background);
}
arena.LayerCell.prototype = {
  background: null,
  foreground: null,
  text: null,
  set: function(text, foreground, background) {
    if (text && typeof(text) != "string") {
      this.background = text.background;
      this.foreground = text.foreground;
      this.text = text.text;
    } else {
      this.background = background;
      this.foreground = foreground;
      this.text = text;
    }
  },
  setIf: function(text, foreground, background) {
    if (text && typeof(text) != "string") {
      background = text.background;
      foreground = text.foreground;
      text = text.text;
    }
    if (background) this.background = background;
    if (foreground) this.foreground = foreground;
    if (text) this.text = text;
  },
  clone: function(target) {
    if (target) {
      target.background = this.background;
      target.foreground = this.foreground;
      target.text = this.text;
    } else {
      target = new arena.LayerCell(this.text, this.foreground, this.background);
    }
    return target;
  }
}

/**
 * Cell object.
 * Constructor does not put cell to cell list, the factory should do that.
 */
arena.Cell = function(x, y, left, top, td) {
  this.x = x;
  this.y = y;
  this.td = td;
  this.leftCell = left;
  if (left)
    left.rightCell = this;
  this.topCell = top;
  if (top)
    top.bottomCell = this;
}
arena.Cell.prototype = {
  x : undefined,
  y : undefined,
  marked : false,
  masked : false,
  lastText : '',
  lastBorderTop : '',
  lastBorderLeft : '',
  lastBorderBottom : '',
  lastBorderRight : '',
  topCell : null,
  leftCell: null,
  rightCell : null,
  bottomCell : null,
  /*------------------------ Grid update functions ---------------------------*/

  /** Draw border and cell. */
  repaintAll : function() {
    this.repaintBorder();
    this.repaintCellContent();
  },

  /** Draw border style. */
  repaintBorder : function() {
    // FF3.6 with self border, 9x9 cursor random paint: Avg 0.33ms, min 0.04, max 2.5
    // FF3.6 w/o self border, 9x9 cursor random paint: Avg 1.7ms	min 1, max 4
    var border = '';
    border = this.getBorder(this.topCell);
    if (border != this.lastBorderTop) {
      this.td.style.borderTop = border;
      this.lastBorderTop = border;
    }
    border = this.getBorder(this.leftCell);
    if (border != this.lastBorderLeft) {
      this.td.style.borderLeft = border;
      this.lastBorderLeft = border;
    }
    border = this.getBorder(this.bottomCell);
    if (border != this.lastBorderBottom) {
      this.td.style.borderBottom = border;
      this.lastBorderBottom = border;
    }
    border = this.getBorder(this.rightCell);
    if (border != this.lastBorderRight) {
      this.td.style.borderRight = border;
      this.lastBorderRight = border;
    }
  },

  border : {
    mm : '1px solid #808',      // Masked and marked
    marked : '1px solid #F00', // Marked
    masked : '1px solid #00F' // Masked
  },
  
  /** Get border style of the side between this cell and given cell */
  getBorder : function(target) {
    if (target) {
/*     xx mr ms rs
    xx -- -- -- --
    mr mr -- mr --
    ms ms ms -- --
    rs rs ms mr -- */
    
      // If is empty or if target share same state, draw nothing
      if ( (!this.marked && !this.masked) || (this.marked == target.marked && this.masked == target.masked) ) {
        return '';

      // If target is empty, just do our border
      } else if (!target.marked && !target.masked) {
        return this.getBorder(null);

      // We have marked / masked, they don't
      } else if ( this.marked && !target.marked ) {
        return this.border.marked;
      } else if ( this.masked && !target.masked ) {
        return this.border.masked;

      // They got whatever we have
      } else {
        return '';
      }

    } else {
      // Else we are alone
      if (this.marked)
        if (this.masked)
          return this.border.mm; // Masked and marked
        else
          return this.border.marked;
      else
        if (this.masked)
          return this.border.masked;
      return '';
    }
  },

  /** Draw cell content. */
  repaintCellContent : function() {
    this.repaintCellText();
    this.repaintCellForeground();
    this.repaintCellBackground();
  },

  /** Draw cell text. */
  repaintCellText : function() {
    var text = this.text;
    if (this.lastText != text) {
      this.td.innerHTML = text;
      this.lastText = text;
    }
  },

  /** Draw cell foreground */
  repaintCellForeground : function() {
    var frgd = this.foreground;
    if (this.td.style.color != frgd) this.td.style.color = frgd;
  },

  /** Draw cell background */
  repaintCellBackground : function() {
    var bkgd = this.background;
    if (this.td.style.backgroundColor != bkgd) this.td.style.backgroundColor = bkgd;
  },
}