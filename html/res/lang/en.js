/********************** JavaScript Arena, english language resource *****************************/

if ( ! arena.lang ) arena.lang = {};

arena.lang.en = {

  tool : {
    usehint_text     : '[Text] Drag: Draw text in colour.  Shift: Draw text and background.',
    usehint_brush    : '[Brush] Drag: Draw background.  Shift: Draw foreground.',
    usehint_eraser   : '[Erase] Drag: Erase from this layer.',
    usehint_mask     : '[Mask] Drag: select area. Ctrl: multi-select, Shift: de-select, both: XOR. Double/Triple Click: select similiar.',
    usehint_maskmove : '[Mask] Drag to move area. Press Ctrl for copy instead of move.',
    usehint_move     : '[Move] Drag: move marked area. Click: select marked area',
    usehint_dropper  : '[Dropper] Click: Get text and foreground colour.  Shift: text and background.',

    barhint_NewMap  : 'Create a new map. Will discard existing map.',
    barhint_ImportExport  : 'Export/Import map.  Long press Ctrl to export with last config.',
    barhint_SaveLoad: 'Save / load map locally in browser',
    barhint_rotateClock : 'Rotate whole map clockwise 90 degree. Ctrl: Anti-clockwise.',
    //barhint_Layer   : 'Click to select layer to draw. Top layer show first.',
    //barhint_UsingLayer : 'You are drawing on this layer.',
    barhint_Foreground : 'Drawing in this foreground colour. Click to fill current mask.',
    barhint_Sync       : 'Sync map to viewers. Double click to setup sharing.',
    barhint_MapInput   : 'Brush text for text tool. Click or press Enter to set text. End text with \'++\' to auto increment text.',
    barhint_Colour     : 'Click to set foreground, Ctrl/Shift+Click to fill foreground/background of selected area.',
    barhint_Undo       : 'Undo last command (Ctrl+Z)',
    barhint_Redo       : 'Redo next command (Ctrl+Y)',
    barhint_Layer      : 'Click to work with this layer. Double-click to toggle visibility. Shift+Minus/Plus to change layer.',
    barhint_toolText   : 'Text tool, draw text on current layer. (T) Press Enter to set text before draw.',
    barhint_toolBrush  : 'Brush tool, paint background on current layer. (B)',
    barhint_toolEraser : 'Eraser tool, erase stuff from curent layer. (E)',
    barhint_toolMask   : 'Rectangle mask tool, limit paint area or move masked area of current layer. (R) Double click: Mask Layer / Reduce mask. (R)',
    barhint_toolMove   : 'Move tool, move similiar area. (M)',
    barhint_toolDropper: 'Dropper tool, get colours and text of current cell. (O)',
    barhint_brushSize  : 'Brush size. (+/-)',

    barhint_AddLayer : 'Add new layer.',
    barhint_DelLayer : 'Delete currnet layer.',
    barhint_LayerUp  : 'Move currnet layer up.',
    barhint_LayerDown : 'Move currnet layer down.',
    barhint_Glyph  : 'Click to set brush text, Ctrl+Click to draw text in current mask.',

    dlghint_TextPrompt : 'Enter text to draw:',
    dlghint_MasterPassword : 'Please enter master password:',
    dlghint_ViewerPassword : 'Please enter viewer password:',
    dlghint_ShareSuccess : 'Map shared, press Ctrl+X to copy link.<br>Click sync button to update map.<br>Double-click it to open sync dialog.',
    dlghint_ShareStatic : '(Static Link)',
    dlghint_ShareDynamic : '(Live Update Link)',

    dlghint_CopyIRC : 'Export in IRC syntax.',
    dlghint_CopyBBC : 'Export in BBCode syntax. Text and foreground colour only.',
    dlghint_CopyTxt : 'Export in plain text.',
    dlghint_CopyHtml : 'Export in HTML.',
    dlghint_CopyJsonZip : 'Export in compressed JSON. Similiar with Json but smaller.',
    dlghint_CopyJson : 'Export in JSON. Layers are preserved, suitable for long-term map storage.',
  },

  ui: {
    initial: '<b>Requires <a href="http://www.microsoft.com/windows/internet-explorer/default.aspx">IE 8+</a>, Latest <a href="http://www.mozilla.com/firefox/">Firefox</a>, or latest <a href="http://www.opera.com/">Opera</a></b>. <a href="http://www.apple.com/safari/">Safari</a> and <a href="http://www.google.com/chrome/">Chrome</a> may fails to save/load. <a href="http://goddessfantasy.net/sheepy/arena/archive/arena.2012-08-19.7z">Download Source</a>.',
  },

  command : {
    undo : "Undo %s.",
    redo : "Redo %s.",

    name_SetMask : 'Set Mask',
    name_SetCell : 'Set',
    name_SetText : 'Set Text',
    name_SetForeground : 'Set Foreground',
    name_SetBackground : 'Set Background',

    name_Erase : 'Erase',
    name_MoveMasked : 'Move Masked',
    name_CopyMasked : 'Copy Masked',
    name_LayerMove     : 'Move Layer ',
    name_LayerDelete   : 'Delete Layer ',
    name_LayerAdd      : 'Create Layer ',
    name_LayerShowHide : 'Show/hide Layer ',

    name_MapRotate : 'Rotate Map ',
    name_CreateMap : 'Create Map',
  },

  map : {
    background : '　',
  },

  io : {
    CopyInstruction : 'Press Ctrl+X to copy.',
    ImportInstruction : 'Paste exported JSON data below.',
    PleaseWait : 'Please wait.',
    autoSaving : "Autosaving...",
    autoSaved : "Autosaved at %s.",
    notSaved : "Map not saved. Discard changes?",
  },

  error : {
    // Not all modules are loaded
    IncompleteLoad: 'Cannot load. Check that browsers is up to date, clear cache, and then refresh.',

    // Drawing error
    NoMask : 'Where should I draw? Please select an area first.',

    // Sync error
    TitleEmpty : 'Title must not be empty.',
    AdminEmpty : 'Master password must not be empty.',
    AdminViewerSame : 'Master password must not be same with viewer password.',
    TitleExists : 'A shared map with same title already exists.',
    MalformedData : 'Malformed data.',

    // S/L error
    NoHost : 'Save/load unavailable (Host not found).',
    NoLocalStorage : 'No LocalStorage facility. Please upgrade browser or enable offline storage.',
    SaveNotFound : 'Cannot find saved map.',

    // I/O error
    CannotRestore : 'Cannot restore map.',
    NoJSON : 'Browser doesn\'t support native JSON, please upgrade.',
    MalformedSave : 'Malformed save data.',
    NoDeflate : 'Cannot load zip library. Please reload.',
  },

  layers : [
    'Terrain',
    'Effects',
    'Objects',
    'Creatures',
    'Overlay',
  ],

  palette : { /** Colour palettle. Same as mIRC. */
  /*
    '1' : '#000',  '0' : '#FFF',    // Black, white
    '11': '#666',  '00': '#CCC',    // Grey, lightgrey
    '88': '#099',  '8' : '#0FF',    // Teal, Aqua
    '33': '#090',  '3' : '#0F0',    // Green, Lime
    '22': '#006',  '2' : '#00F',    // Navy, Blue
    '66': '#909',  '6' : '#F0F',    // Purple, Pink
    '44': '#600',  '4' : '#F00',    // Brown, Red
    '55': '#F60',  '5' : '#FF0'     // Orange, Yellow
    '0' : '#FFF',  '1' : '#000',  '2' : '#00F',  '3' : '#0F0',
    '00': '#CCC',  '11': '#666',  '22': '#006',  '33': '#090',
    '4' : '#F00',  '5' : '#FF0',  '6' : '#F0F',  '7' : '#0FF',
    '44': '#600',  '55': '#F60',  '66': '#909',  '77': '#099',
    */
    '0' : '#FFF',  '1' : '#000',  '2' : '#00F',  '3' : '#0F0',  '4' : '#F00',  '5' : '#FF0',  '6' : '#F0F',  '7' : '#0FF',
    '00': '#CCC',  '11': '#666',  '22': '#006',  '33': '#090',  '44': '#600',  '55': '#F60',  '66': '#909',  '77': '#099',
  },

  glyph : [
    '牆', '柵', '欄', '板',
    '門', '窗', '幕', '布',
    '箱', '櫃', '壇', '臺',
    '椅', '桌', '床', '灶',
    '柱', '坑', '像', '爐',
    '攤', '篷', '堆', '車',
    '民', '兵', '闆', '待',

    '☠', '☥', '♐', '♒',

    '樹', '木', '叢', '花',
    '石', '岩', '磚', '瓦',
    '風', '力', '旋', '渦',
    '水', '泉', '沼', '漿',
    '火', '焰', '光', '暗',
    '陷', '油', '刃', '魔',

    '←', '↑', '↖', '↗',
    '↓', '→', '↙', '↘',
    '●', '◆', '★', '■',
    '○', '◇', '☆', '□',
    '①', '②', '③', '④',
    '⑤', '⑥', '⑦', '⑧', //'⑨',
    '─', '│', '╭', '╮',
    '═', '║', '╰', '╯',
    '╱', '┌', '┬', '┐',
    '╲', '├', '┼', '┤',
    '╳', '└', '┴', '┘'
  ],

  mapping : {
    rotateClock : {
      '─' : '│',    '│' : '─',    '═' : '║',    '║' : '═',
      '╭' : '╮',    '╮' : '╯',    '╯' : '╰',    '╰' : '╭',
      '┌' : '┐',    '┐' : '┘',    '┘' : '└',    '└' : '┌',
      '┬' : '┤',    '┤' : '┴',    '┴' : '├',    '├' : '┬',
      '╔' : '╗',    '╗' : '╝',    '╝' : '╚',    '╚' : '╔',
      '╦' : '╣',    '╣' : '╩',    '╩' : '╠',    '╠' : '╦',
      '╱' : '╲',    '╲' : '╱',    '╴' : '╵',    '╵' : '╶',    '╶' : '╷',    '╷' : '╴',
    },

    rotateHalf : {
      '╭' : '╯',    '╮' : '╰',    '╯' : '╭',    '╰' : '╮',
      '┌' : '┘',    '┐' : '└',    '┘' : '┌',    '└' : '┐',
      '┬' : '┴',    '┤' : '├',    '┴' : '┬',    '├' : '┤',
      '╔' : '╝',    '╗' : '╚',    '╝' : '╔',    '╚' : '╗',
      '╦' : '╩',    '╣' : '╠',    '╩' : '╦',    '╠' : '╣',
      '╴' : '╶',    '╵' : '╷',    '╶' : '╴',    '╷' : '╵',
    },

    rotateAntiClock : {
      '─' : '│',    '│' : '─',    '═' : '║',    '║' : '═',
      '╭' : '╰',    '╮' : '╭',    '╯' : '╮',    '╰' : '╯',
      '┌' : '└',    '┐' : '┌',    '┘' : '┐',    '└' : '┘',
      '┬' : '├',    '┤' : '┬',    '┴' : '┤',    '├' : '┴',
      '╔' : '╚',    '╗' : '╔',    '╝' : '╗',    '╚' : '╝',
      '╦' : '╠',    '╣' : '╦',    '╩' : '╣',    '╠' : '╩',
      '╱' : '╲',    '╲' : '╱',    '╴' : '╷',    '╵' : '╴',    '╶' : '╵',    '╷' : '╶',
    },

    mirrorHorizontal : {
      '╭' : '╮',    '╮' : '╭',    '╯' : '╰',    '╰' : '╯',
      '┌' : '┐',    '┐' : '┌',    '┘' : '└',    '└' : '┘',    '┤' : '├',    '├' : '┤',
      '╔' : '╗',    '╗' : '╔',    '╝' : '╚',    '╚' : '╝',    '╣' : '╠',    '╠' : '╣',
      '╱' : '╲',    '╲' : '╱',    '╴' : '╴',    '╶' : '╴',
    },

    mirrorVertical : {
      '╭' : '╰',    '╮' : '╯',    '╯' : '╮',    '╰' : '╭',
      '┌' : '└',    '┐' : '┘',    '┘' : '┐',    '└' : '┌',    '┬' : '┴',    '┴' : '┬',
      '╔' : '╚',    '╗' : '╝',    '╝' : '╗',    '╚' : '╔',    '╦' : '╩',    '╩' : '╦',
      '╱' : '╲',    '╲' : '╱',    '╵' : '╷',    '╷' : '╵',
    },
  },
}