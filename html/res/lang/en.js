/********************** JavaScript Arena, english language resource *****************************/

window.arena = {};

arena.lang = {

  tool : {
    name_mask    : 'Mask tool. Used to select area for drawing. Double click to select map.',
    usehint_mask     : '[Mask] Drag: select area. Ctrl: multi-select, Shift: de-select, both: XOR. Double/Triple Click: select similiar.',
    usehint_maskmove : '[Mask] Drag to move area. Press Ctrl for copy instead of move.',

    barhint_NewMap  : 'Create a new map. Will discard existing map.',
    barhint_Export  : 'Export map in various text formats.',
    barhint_CopyIRC : 'Export in IRC syntax.',
    barhint_CopyBBC : 'Export in BBCode syntax. Text and foreground colour only.',
    barhint_CopyTxt : 'Export in plain text.',
    barhint_CopyHtml : 'Export in HTML.',
    barhint_Foreground : 'Foreground colour. Click to draw in current mask.',
    barhint_Background : 'Background colour. Click to draw in current mask.',
    barhint_MapInput   : 'Brush text. Type and press enter to draw text. Press Delete to clear selected map.',
    barhint_Text   : 'Set current mask with brush text.',
    barhint_Set    : 'Set current mask with brush text, foreground colour, and background colour.',
    barhint_Colour : 'Click to set foreground, Double click to set background, Ctrl/Alt+Click to draw foreground/background.',
    barhint_Glyph  : 'Click to set brush text, Ctrl+Click to draw text in current mask.',
  },

  command : {
    name_SetMask : 'Set Mask',
    name_SetCell : 'Set',
    name_SetText : 'Set Text',
    name_SetForeground : 'Set Foreground',
    name_SetBackground : 'Set Background',

    name_CreateMap : 'Create Map',
  },

  static : { // Static resource: default palette and background, for example.
    background : '　',

    palette : { /** Colour palettle. Follow mIRC. */
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
  },

  io : {
    CopyInstruction : 'Press Ctrl+X to copy.',
  },

  error : {
    NoMask : 'Where should I draw? Please select an area first.',
    CannotOpenWindow : 'Cannot popup window. Please allow popup first.',
  },
}