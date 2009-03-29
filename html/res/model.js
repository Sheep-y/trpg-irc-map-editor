/********************** JavaScript Arena, model code *****************************/
/* Mostly code that manage the map and its objects, relied by the tools.
 * Because the map is created and managed here, code that controla map display
 * are also found here.
 */


function $(eid) { return document.getElementById(eid); }
function sortNumber(a,b) { return a - b; }

arena.tool = null;   // Currently selected map tool
arena.foreground = '#000'; // Current foreground colour
arena.background = '#FFF'; // Current background colour
arena.toolWidth  = '--';   // Displayed tool-related width
arena.toolHeight = '--';   // Displayed tool-related height


/************************* General functions ******************************/

// Find a given xy coordinate in coordinate list. Return -1 if not found, index of coordinate if found
arena.xyInCoList = function(x, y, ary) {
  var l = ary.length;
  for (var i = 0; i < l; i++) { var a = ary[i]; if (a[0] == x && a[1] == y) return i; }
  return -1;
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

// Get two-dimension cell array
arena.getCell = function(cells, x, y, ifNotFound) {
  if (!cells[y]) return ifNotFound;
  var row = cells[y];
  return row[x] ? row[x] : ifNotFound;
}

/************************* Map object *********************************/

arena.Cell = function() {}
arena.Cell.prototype = {
  background: null,
  foreground: null,
  text: null,
}

arena.Layer = function(name) { // Use arena.map.createLayer instead!
  this.name = name;
}
arena.Layer.prototype = {
  name : null,
  map  : null,
  cells : [],
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
    if (!c[y]) {
      if (value === null) return;
      c[y] = [];
    }
    c[y][x] = value;
  },
  createCell : function (x,y) { // Create cell if not exist, and return the cell
    var c = this.get(x,y);
    if (!c) {
      c = new arena.Cell();
      this.set(x, y, c);
    }
    return c;
  },
  trim : function () { // Removes empty cells and rows
    var cells = this.cells[y];
    var h = cells.length;
    if (h <= 0) return;
    for (var y = 0; y < h; y++)
      if (cells[y]) {
        var row = this.cells[y];
        if (!row.length) delete cells[y];
        else {
          var count = 0, w = this.map.width;
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
  setText : function(x,y,value) {
    createCell(x,y).text = value;
  },
  setForeground : function(x,y,value) {
    createCell(x,y).foreground = value;
  },
  setBackground : function(x,y,value) {
    createCell(x,y).background = value;
  }
}

arena.map = { /** Map object. Store background, size, name, etc. */
  title : 'Map 1',
  layerOrder : ['Terrain', 'Effect', 'Object', 'Creature', 'Overlay'],
  layers : [
    new arena.Layer('Terrain' ),
    new arena.Layer('Effect'  ),
    new arena.Layer('Object'  ),
    new arena.Layer('Creature'),
    new arena.Layer('Overlay' ),
  ],

  cells : [],    // Array of array of Cell. Top left is 0, 0. This array is y then x.
  masked : [],   // Array of cells that are masked.
  marked : [],   // Array of cells that are marked by tools, always temporary.

  dx : 1, // displayed coordinate dx
  dy : 1, // displayed coordinate dy

  width  : 0, // width in #grid
  height : 0, // height in #grid

  table : $('map'), // Map table element

  background : {
    text : arena.lang.static.background,
    foreground : '#000',
    background : '#FFF',
    borderColour : '#000'
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
      c[prop] = true;
      c.dirty = true;
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

  /*------------- Factory methods ----------------*/
  recreate: function(width, height) {
    var map = this, table = map.table, tbody = table.getElementsByTagName('tbody')[0];

    // Clear map
    for (var y = 0; y < map.height; y++) { var row = map.cells[y];
      for (var x = 0; x < map.width; x++)
        row[x].td = null;
    }
    arena.cells = [];
    for (y = tbody.getElementsByTagName('tr').length-1; y >= 0; y--)
       table.deleteRow(y);

    // Set new stats
    map.width = width;
    map.height = height;
    map.marked = [];
    map.masked = [];

    // Create cells and borders above cells
    for (y = 0; y < height; y++) {
      var r = this.createCellRow(y);
      tbody.appendChild(r[0]);
      map.cells[y] = r[1];
    }
    arena.ui.setStatus(arena.lang.command.name_CreateMap + ' '+width+'x'+height);
  },

  /** Create a layer at top with given name */
  createLayer : function (name) {
    var l = new arena.Layer(name);
    l.map = this;
    layers.push(l);
    return l;
  },

  /** Create a cell row with vertical border. Returns tr and cell array. */
  createCellRow : function(y) {
    var tr = document.createElement('tr'), cells = [], td, cell;
    var w = arena.map.width;
    var background = arena.map.background.text;
    for (var x = 0; x < w; x++) {
      // Grid cell
      td = document.createElement('td');
      td.setAttribute('onmousedown', 'arena.event.cellPress(event,'+x+','+y+');');
      td.setAttribute('onmouseover', 'arena.event.cellHover(event,'+x+','+y+');');
      td.setAttribute('onmouseup',  'arena.event.cellRelease(event,'+x+','+y+');');
      //if (background) td.innerHTML = background;
      tr.appendChild(td);
      // Model cell
      cell = new arena.Cell(x, y, td);
      cells[x] = cell;
      cell.repaintAll();
    }
    return [tr, cells];
  },
}

/**
 * Cell object.
 * Constructor does not put cell to cell list, the factory should do that.
 */
arena.Cell = function(x, y, td) {
  this.x = x;
  this.y = y;
  this.td = td;
  this.marked = false;
  this.masked = false;
  this.text = null;
  this.foreground = null;
  this.background = null;
  this.dirty = false;
}
arena.Cell.prototype = {
  /*------------------------ Getter/setter---------------------------*/
  getText : function() {
    return this.text === null ? arena.map.background.text : this.text;
  },
  getForeground : function() {
    return this.foreground === null ? arena.map.background.foreground : this.foreground;
  },
  getBackground : function() {
    return this.background === null ? arena.map.background.background : this.background;
  },

  /*------------------------ Grid update functions ---------------------------*/
  /** Update cell
  updateCell : function() {
  },

  /** Draw border and cell. */
  repaintAll : function() {
    this.repaintBorder();
    this.repaintCellContent();
  },

  /** Draw border style. */
  repaintBorder : function() {
    var outline = '';
    if (this.marked)
      if (this.masked)
        outline = '2px solid #8F8'; // Masked and marked
      else
        outline = '2px solid #FF0'; // Temporary marked
    else
      if (this.masked) outline = '2px solid #0FF'; // Masked
    if (this.td.style.outline != outline) this.td.style.outline = outline;
  },

  /** Draw cell content. */
  repaintCellContent : function() {
    this.repaintCellStyle();
    this.repaintCellText();
  },

  /** Draw cell text. */
  repaintCellText : function() {
    var text = this.getText();
    if (this.td.innerHTML != text) this.td.innerHTML = text;
  },

  /** Draw cell style. */
  repaintCellStyle : function() {
    var td = this.td;
    var frgd = this.getForeground();
    var bkgd = this.getBackground();
    if (td.style.backgroundColor != bkgd) td.style.backgroundColor = bkgd;
    if (td.style.color != frgd) td.style.color = frgd;
  },
}