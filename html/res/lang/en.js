/********************** JavaScript Arena, english language resource *****************************/

window.arena = {};

arena.lang = {

  tool : {
    name_mask    : 'Mask tool. Used to select area for drawing. Double click to select map.',
    usehint_text     : '[Text] Drag: Draw text in colour.  Shift: Draw text and background.',
    usehint_paint    : '[Brush] Drag: Draw background.  Shift: Draw foreground.',
    usehint_erase    : '[Erase] Drag: Erase from this layer.',
    usehint_mask     : '[Mask] Drag: select area. Ctrl: multi-select, Shift: de-select, both: XOR. Double/Triple Click: select similiar.',
    usehint_maskmove : '[Mask] Drag to move area. Press Ctrl for copy instead of move.',
    usehint_dropper  : '[Dropper] Click: Get text and foreground colour.  Shift: text and background.',

    barhint_NewMap  : 'Create a new map. Will discard existing map.',
    barhint_Export  : 'Export map in various text formats.',
    //barhint_Layer   : 'Click to select layer to draw. Top layer show first.',
    //barhint_UsingLayer : 'You are drawing on this layer.',
    barhint_Foreground : 'Drawing in this foreground colour. Click to fill current mask.',
    barhint_Background : 'Drawing in this background colour. Click to fill current mask.',
    barhint_MapInput   : 'Brush text. Type and press enter to draw text. Press Delete to clear selected map.',
    barhint_Colour   : 'Click to set foreground, Double click to set background, Ctrl/Shift+Click to draw foreground/background.',
    barhint_NoColour : 'No colour : Use lower layer\'s colour.',
    barhint_ReverseColour : 'Reverse colour : Reverse lower layer\'s colour.',
    barhint_Layer  : 'Click to work on current layer.',
    barhint_toolText   : 'Text tool, draw text on current layer. (T)',
    barhint_toolPaint  : 'Brush tool, paint background on current layer. (B)',
    barhint_toolErase  : 'Erase tool, erase stuff from curent layer. (E)',
    barhint_toolMask   : 'Rectangle mask tool, set mask to limit painting and move masked area of current layer. (R)',
    barhint_toolDropper: 'Dropper tool, get colours and text of current cell. (D)',
    barhint_brushSize  : 'Brush size.',
    barhint_viewLayer  : 'View layer list. Layers are independent from each other. Shift+Minus/Plus to move between layers.',
    barhint_viewGlyph  : 'View glyph list.',
    
    barhint_AddLayer : 'Add top layer',
    barhint_DelLayer : 'Delete currnet layer',
    barhint_LayerUp  : 'Move currnet layer up',
    barhint_LayerDown : 'Move currnet layer down',
    barhint_Glyph  : 'Click to set brush text, Ctrl+Click to draw text in current mask.',

    dlghint_CopyIRC : 'Export in IRC syntax.',
    dlghint_CopyBBC : 'Export in BBCode syntax. Text and foreground colour only.',
    dlghint_CopyTxt : 'Export in plain text.',
    dlghint_CopyHtml : 'Export in HTML.',
  },

  command : {
    name_SetMask : 'Set Mask',
    name_SetCell : 'Set',
    name_SetText : 'Set Text',
    name_SetForeground : 'Set Foreground',
    name_SetBackground : 'Set Background',

    name_CreateMap : 'Create Map',
  },

  map : {
    background : '　',
  },
  
  palette : { /** Colour palettle. Same as mIRC. */
    black : '#000',      white: '#FFF',
    grey  : '#666',  lightgrey: '#CCC',
    teal  : '#099',      aqua : '#0FF',
    green : '#090',      lime : '#0F0',
    navy  : '#006',      blue : '#00F',
    purple: '#909',      pink : '#F0F',
    brown : '#600',      red  : '#F00',
    orange: '#F60',     yellow: '#FF0'
  },
  
  glyph : [
    '()', '[]', '<>',
    '樹', '石', '叢',
    '水', '木', '岩',
    '火', '嵐', '漿',
    '牆', '柵', '欄',
    '門', '窗', '幕',
    '箱', '桌', '椅',
    '臺', '櫃', '床',
    '坑', '像', '柱',
    '●', '◆', '★',
    '○', '◇', '☆',
    '■', '□', '※',
    '①', '②', '③',
    '④', '⑤', '⑥',
    '⑦', '⑧', '⑨',
    '─', '╭', '╮',
    '│', '╰', '╯',
    '┌', '┬', '┐',
    '├', '┼', '┤',
    '└', '┴', '┘'
  ],

  io : {
    CopyInstruction : 'Press Ctrl+X to copy.',
  },

  error : {
    NoMask : 'Where should I draw? Please select an area first.',
    CannotOpenWindow : 'Cannot popup window. Please allow popup first.',
  },
}