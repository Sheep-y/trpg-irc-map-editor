/********************** JavaScript Arena, Chinese language resource *****************************/

if ( ! arena.lang ) arena.lang = {};

arena.lang.zh = {

  tool : {
    usehint_text     : '[文字] 拖移：以目前顏色繪制文字。 Shift：繪制文字及底色。',
    usehint_brush    : '[色刷] 拖移：繪制底色。 Shift：繪制文字顏色。',
    usehint_eraser   : '[像皮擦] 拖移: 從目前圖層抺除。',
    usehint_mask     : '[遮罩] 拖移：選擇區塊。 Ctrl：多重選擇, Shift：反選擇, Ctrl+Shift：XOR. 雙按/三按：選取類近。',
    usehint_maskmove : '[遮罩] 拖移：移動區塊。 Ctrl：複制區塊。',
    usehint_move     : '[移動] 拖移：移動區塊。 點擊: 選取目前區塊。',
    usehint_dropper  : '[取色器] 點擊：從圖層提取文字及文字顏色。 Shift：文字及底色。 Crtl：從地圖提取。',

    barhint_NewMap   : '創建新地圖。現有地圖將被丟棄。',
    barhint_ImportExport  : '輸出/載入地圖, 長按 Ctrl 以上次設定輸出。',
    barhint_SaveLoad : '從瀏覽器儲存或讀取地圖。',
    barhint_rotateClock : '將地圖順時針方向旋轉 90 度。　Ctrl：逆時針。',
    //barhint_Layer   : 'Click to select layer to draw. Top layer show first.',
    //barhint_UsingLayer : 'You are drawing on this layer.',
    barhint_Foreground : '目前的繪圖顏色。',
    barhint_Sync       : '同步地圖給觀眾。雙按可以設定共享選項。',
    barhint_MapInput   : '文字工具的文字。 按下或 Enter：設定文字。 以 ++ 結尾會自動提升文字。',
    barhint_Colour     : '按：使用此色, Ctrl/Shift+按: 填充遮罩區域的文字顏色/背景顏色。',
    barhint_Undo       : '復原上一指令 (Ctrl+Z)。',
    barhint_Redo       : '重做下一指令 (Ctrl+Y)。',
    barhint_Layer      : '按：使用此圖層工作, 雙按：顯示/隱藏圖層。 Shift+加/減：切換工作圖層。',
    barhint_toolText   : '文字工具, 在目前圖層繪下文字 (T)。　Enter：設定文字。',
    barhint_toolBrush  : '色刷工具, 在目前圖層繪上色彩 (B)。',
    barhint_toolEraser : '像皮擦工具, 從目前圖層擦走東西 (E)。',
    barhint_toolMask   : '長方型遮罩工具, 限制繪圖區域或移動目前圖層的遮罩區域 (R)。 雙按: 以圖層作遮罩 / 降低遮罩密度。',
    barhint_toolMove   : '移動工具, 移動類近區域 (M)。',
    barhint_toolDropper: '取色器, 從格子提取文字和顏色 (O)。',
    barhint_brushSize  : '筆刷大小 (+/-)。',

    barhint_AddLayer : '新增圖層。',
    barhint_DelLayer : '刪除目前圖層。',
    barhint_LayerUp  : '將目前圖層移上。',
    barhint_LayerDown : '將目前圖層移落。',
    barhint_Glyph  : '按:設定文子工具使用的文字 Ctrl+按: 以文字填充遮罩區域。',

    dlghint_TextPrompt : '輸入要繪畫的文字：',
    dlghint_MasterPassword : '輸入主控密碼：',
    dlghint_ViewerPassword : '輸入觀眾密碼：',
    dlghint_ShareSuccess : '地圖已經共烹，按 Ctrl+X 複制連結。<br>按下同步按錄可以更新地圖。<br>雙按它開啓同步視窗。',
    dlghint_ShareStatic : '（靜態連結）',
    dlghint_ShareDynamic : '（動態更新連結）',

    dlghint_CopyIRC : '以 IRC 格式輸出。',
    dlghint_CopyBBC : '以 BBCode 格式輸出, 不帶背景色。',
    dlghint_CopyTxt : '以純文字格式輸出, 不帶顏色。',
    dlghint_CopyHtml : '以 HTML 格式輸出。',
    dlghint_CopyJsonZip : '以壓縮過的 JSON 格式輸出. 類似 JSON, 不過更細。',
    dlghint_CopyJson : '以 JSON 格式輸出, 保留圖層資訊, 適合長久儲存或轉移資料。',
  },

  ui: {
    initial: '<b>需求 <a href="http://www.microsoft.com/windows/internet-explorer/default.aspx">IE 8+</a>，最新版<a href="http://www.mozilla.com/firefox/">火狐</a>，或最新版<a href="http://www.opera.com/">Opera</a></b>。<a href="http://www.apple.com/safari/">Safari</a>和<a href="http://www.google.com/chrome/">Chrome</a>可能不能儲存讀取。<a href="https://github.com/Sheep-y/trpg-irc-map-editor/">首頁</a>。',
  },

  command : {
    undo : "復原 %s。",
    redo : "重做 %s。",

    name_SetMask : '設定遮罩 ',
    name_SetCell : '設定 ',
    name_SetText : '設定文字 ',
    name_SetForeground : '設定前景色 ',
    name_SetBackground : '設定背景色 ',

    name_Erase : '清除',
    name_MoveMasked : '移動所選',
    name_CopyMasked : '複制所選',
    name_LayerMove     : '調動圖層 ',
    name_LayerDelete   : '刪除圖層 ',
    name_LayerAdd      : '創建圖層 ',
    name_LayerShowHide : '顯示/隱藏圖層 ',

    name_MapRotate : '旋轉地圖 ',
    name_CreateMap : '創建地圖 ',
  },

  map : {
    background : '　',
  },

  io : {
    CopyInstruction : '按 Ctrl+X 提取。',
    ImportInstruction : '將 JSON 資料貼到這兒。',
    PleaseWait : '請稍候。',
    autoSaving : "自動儲存中...",
    autoSaved : "已於 %s 自動儲存。",
    notSaved : "未儲存地圖。放棄改動？",
  },

  error : {
    // Not all modules are loaded
    IncompleteLoad: '無法載入。請確保瀏覽器是最新的，清取快取，並重新載入。',

    // Drawing error
    NoMask : '請先選擇一片區域。',

    // Sync error
    TitleEmpty : '標題不能為空。',
    AdminEmpty : '主密碼不能為空。',
    AdminViewerSame : '主密碼不能相同於觀看密碼。',
    TitleExists : '同名地圖已經存在。',

    // S/L error
    NoHost : '無法讀存地圖（Host not found）。',
    NoLocalStorage : '沒有 LocalStorage 功能。請升級瀏覽器。',
    SaveNotFound : '找不到存檔',

    // I/O error
    CannotRestore : '無法恢復地圖',
    NoJSON : '瀏覽器不支援原生 JSON，請升級。',
    MalformedSave : '資料損毁',
    NoDeflate : '無法載入解壓程序庫。請重新載入。',
  },

  layers : [
    '地型',
    '效應',
    '物件',
    '單位',
    '覆蓋',
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