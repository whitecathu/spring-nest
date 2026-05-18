module.exports = {
  "generatedAt": "2026-05-18T07:02:08.114Z",
  "tabs": [
    {
      "id": "home",
      "text": "首页",
      "textEn": "Home",
      "pagePath": "pages/home/index"
    },
    {
      "id": "tools",
      "text": "工具",
      "textEn": "Tools",
      "pagePath": "pages/tools/index"
    },
    {
      "id": "profile",
      "text": "我的",
      "textEn": "Me",
      "pagePath": "pages/profile/index"
    }
  ],
  "categories": [
    {
      "slug": "daily",
      "title": "日常实用",
      "titleEn": "Daily",
      "description": "计算、扫描、天气、记账等随手工具"
    },
    {
      "slug": "time",
      "title": "时间效率",
      "titleEn": "Time",
      "description": "专注、倒计时、日期推算"
    },
    {
      "slug": "text",
      "title": "文本学习",
      "titleEn": "Text",
      "description": "写作、格式化、朗读和复习"
    },
    {
      "slug": "dev",
      "title": "开发辅助",
      "titleEn": "Dev",
      "description": "JSON、编码、颜色和网络查询"
    },
    {
      "slug": "document",
      "title": "文档转换",
      "titleEn": "Docs",
      "description": "Word 与 PDF 本地转换"
    },
    {
      "slug": "random",
      "title": "随机趣味",
      "titleEn": "Random",
      "description": "抽签、随机数和占位文本"
    },
    {
      "slug": "security",
      "title": "安全隐私",
      "titleEn": "Security",
      "description": "密码与敏感内容处理"
    }
  ],
  "tools": [
    {
      "id": "tool-1",
      "type": "tool",
      "title": "计算器",
      "titleEn": "Calculator",
      "description": "极简风格计算器，支持加减乘除、历史记录，让每一次运算都清晰明了。",
      "descriptionEn": "A clean calculator with history and basic arithmetic operations.",
      "category": "日常实用",
      "categoryEn": "Daily Utility",
      "tags": [
        "calculator",
        "math",
        "计算器",
        "数学",
        "效率"
      ],
      "icon": "🔢",
      "route": "/tools/calculator",
      "features": [
        "四则运算",
        "历史记录",
        "键盘快捷输入",
        "一键清零"
      ],
      "featuresEn": [
        "Basic arithmetic",
        "Calculation history",
        "Keyboard shortcuts",
        "One-tap clear"
      ],
      "popularScore": 90,
      "slug": "calculator",
      "miniCategorySlug": "daily",
      "miniCategoryTitle": "日常实用",
      "workbenchType": "quick-calc",
      "homePriority": 92,
      "sensitive": false
    },
    {
      "id": "tool-2",
      "type": "tool",
      "title": "番茄钟",
      "titleEn": "Pomodoro Timer",
      "description": "25 分钟专注 + 5 分钟休息循环，助你快速进入心流状态。",
      "descriptionEn": "25 min focus + 5 min break cycles to help you enter the flow state.",
      "category": "时间效率",
      "categoryEn": "Time & Efficiency",
      "tags": [
        "pomodoro",
        "focus",
        "番茄",
        "专注",
        "学习"
      ],
      "icon": "🍅",
      "route": "/tools/pomodoro",
      "features": [
        "25+5 经典循环",
        "专注/休息自动切换",
        "完成提醒音",
        "简洁无干扰界面"
      ],
      "featuresEn": [
        "25+5 classic cycle",
        "Auto focus/break switch",
        "Completion sound alert",
        "Minimal distraction UI"
      ],
      "popularScore": 95,
      "slug": "pomodoro",
      "miniCategorySlug": "time",
      "miniCategoryTitle": "时间效率",
      "workbenchType": "focus-timer",
      "homePriority": 94,
      "sensitive": false
    },
    {
      "id": "tool-3",
      "type": "tool",
      "title": "单位换算",
      "titleEn": "Unit Converter",
      "description": "支持长度、重量、温度、面积实时换算，操作简单快捷。",
      "descriptionEn": "Real-time conversion for length, weight, temperature, and area units.",
      "category": "日常实用",
      "categoryEn": "Daily Utility",
      "tags": [
        "converter",
        "unit",
        "换算",
        "单位",
        "实用"
      ],
      "icon": "📐",
      "route": "/tools/converter",
      "features": [
        "四大类单位换算",
        "实时计算结果",
        "常用单位覆盖",
        "输入即出结果"
      ],
      "featuresEn": [
        "Four conversion categories",
        "Real-time results",
        "Common units covered",
        "Instant output on input"
      ],
      "popularScore": 85,
      "slug": "converter",
      "miniCategorySlug": "daily",
      "miniCategoryTitle": "日常实用",
      "workbenchType": "quick-calc",
      "homePriority": 90,
      "sensitive": false
    },
    {
      "id": "tool-4",
      "type": "tool",
      "title": "密码生成器",
      "titleEn": "Password Generator",
      "description": "自定义长度与字符类型，一键生成强密码，支持复制。",
      "descriptionEn": "Generate strong passwords with custom length and character types. One-click copy.",
      "category": "安全隐私",
      "categoryEn": "Security & Privacy",
      "tags": [
        "password",
        "security",
        "密码",
        "安全",
        "生成器"
      ],
      "icon": "🔑",
      "route": "/tools/password",
      "features": [
        "自定义长度",
        "多种字符类型",
        "密码强度指示",
        "一键复制"
      ],
      "featuresEn": [
        "Custom length",
        "Multiple character types",
        "Strength indicator",
        "One-click copy"
      ],
      "popularScore": 80,
      "slug": "password",
      "miniCategorySlug": "security",
      "miniCategoryTitle": "安全隐私",
      "workbenchType": "privacy",
      "homePriority": 0,
      "sensitive": true
    },
    {
      "id": "tool-5",
      "type": "tool",
      "title": "二维码生成器",
      "titleEn": "QR Code Generator",
      "description": "输入文本或链接快速生成二维码，支持下载保存。",
      "descriptionEn": "Generate QR codes from text or URLs with download support.",
      "category": "日常实用",
      "categoryEn": "Daily Utility",
      "tags": [
        "qr",
        "code",
        "二维码",
        "生成器",
        "实用"
      ],
      "icon": "📱",
      "route": "/tools/qrcode",
      "features": [
        "文本/链接转二维码",
        "可调尺寸",
        "PNG 下载",
        "即时预览"
      ],
      "featuresEn": [
        "Text/URL to QR code",
        "Adjustable size",
        "PNG download",
        "Instant preview"
      ],
      "popularScore": 75,
      "slug": "qrcode",
      "miniCategorySlug": "daily",
      "miniCategoryTitle": "日常实用",
      "workbenchType": "device-file",
      "homePriority": 84,
      "sensitive": false
    },
    {
      "id": "tool-6",
      "type": "tool",
      "title": "指南针",
      "titleEn": "Compass",
      "description": "支持设备传感器的电子罗盘，桌面端可拖动操作。",
      "descriptionEn": "Electronic compass with device sensor support, draggable on desktop.",
      "category": "日常实用",
      "categoryEn": "Daily Utility",
      "tags": [
        "compass",
        "direction",
        "指南针",
        "方向",
        "实用"
      ],
      "icon": "🧭",
      "route": "/tools/compass",
      "features": [
        "设备传感器支持",
        "桌面拖动操作",
        "角度精确显示",
        "流畅动画"
      ],
      "featuresEn": [
        "Device sensor support",
        "Desktop drag controls",
        "Precise angle display",
        "Smooth animations"
      ],
      "slug": "compass",
      "miniCategorySlug": "daily",
      "miniCategoryTitle": "日常实用",
      "workbenchType": "device-file",
      "homePriority": 0,
      "sensitive": false
    },
    {
      "id": "tool-7",
      "type": "tool",
      "title": "轻量扫描仪",
      "titleEn": "Lite Scanner",
      "description": "拍摄或上传文档，支持多种滤镜调整，下载 PNG 保存。",
      "descriptionEn": "Capture or upload documents with filter adjustments, download as PNG.",
      "category": "日常实用",
      "categoryEn": "Daily Utility",
      "tags": [
        "scanner",
        "camera",
        "扫描",
        "拍照",
        "文档"
      ],
      "icon": "📷",
      "route": "/tools/scanner",
      "features": [
        "摄像头拍摄",
        "图片上传",
        "多种滤镜调整",
        "PNG 下载"
      ],
      "featuresEn": [
        "Camera capture",
        "Image upload",
        "Multiple filter adjustments",
        "PNG download"
      ],
      "popularScore": 70,
      "slug": "scanner",
      "miniCategorySlug": "daily",
      "miniCategoryTitle": "日常实用",
      "workbenchType": "device-file",
      "homePriority": 82,
      "sensitive": false
    },
    {
      "id": "tool-8",
      "type": "tool",
      "title": "微风天气",
      "titleEn": "Breeze Weather",
      "description": "自动定位或搜索城市，查看实时天气和三天预报。",
      "descriptionEn": "Auto-detect or search city for real-time weather and 3-day forecast.",
      "category": "日常实用",
      "categoryEn": "Daily Utility",
      "tags": [
        "weather",
        "forecast",
        "天气",
        "预报",
        "实用"
      ],
      "icon": "🌤️",
      "route": "/tools/weather",
      "features": [
        "自动定位",
        "城市搜索",
        "三天天气预报",
        "实时温度与风力"
      ],
      "featuresEn": [
        "Auto location",
        "City search",
        "3-day forecast",
        "Real-time temp & wind"
      ],
      "popularScore": 88,
      "slug": "weather",
      "miniCategorySlug": "daily",
      "miniCategoryTitle": "日常实用",
      "workbenchType": "device-file",
      "homePriority": 0,
      "sensitive": false
    },
    {
      "id": "tool-9",
      "type": "tool",
      "title": "随机选择器",
      "titleEn": "Random Picker",
      "description": "输入选项，随机抽取一个结果。适合抽签、决定吃什么、小组分配。",
      "descriptionEn": "Enter options and pick one randomly. Great for raffles, deciding what to eat, or group assignments.",
      "category": "趣味工具",
      "categoryEn": "Fun Tools",
      "tags": [
        "random",
        "picker",
        "抽签",
        "随机",
        "选择"
      ],
      "icon": "🎲",
      "route": "/tools/random-picker",
      "features": [
        "逐行输入选项",
        "随机抽取结果",
        "示例数据一键填充",
        "结果可复制"
      ],
      "featuresEn": [
        "One option per line",
        "Random pick result",
        "Sample data fill",
        "Result copying"
      ],
      "popularScore": 75,
      "slug": "random-picker",
      "miniCategorySlug": "random",
      "miniCategoryTitle": "随机趣味",
      "workbenchType": "quick-calc",
      "homePriority": 0,
      "sensitive": false
    },
    {
      "id": "tool-10",
      "type": "tool",
      "title": "倒计时与秒表",
      "titleEn": "Timer & Stopwatch",
      "description": "支持倒计时和秒表两种模式，常用时间快捷设置。",
      "descriptionEn": "Countdown timer and stopwatch with quick time presets.",
      "category": "时间效率",
      "categoryEn": "Time & Efficiency",
      "tags": [
        "timer",
        "stopwatch",
        "倒计时",
        "秒表",
        "计时"
      ],
      "icon": "⏱️",
      "route": "/tools/timer-stopwatch",
      "features": [
        "倒计时+秒表双模式",
        "快捷时间按钮",
        "分圈记录",
        "时间到提醒"
      ],
      "featuresEn": [
        "Timer + Stopwatch dual mode",
        "Quick time presets",
        "Lap recording",
        "Completion alert"
      ],
      "popularScore": 60,
      "slug": "timer-stopwatch",
      "miniCategorySlug": "time",
      "miniCategoryTitle": "时间效率",
      "workbenchType": "focus-timer",
      "homePriority": 0,
      "sensitive": false
    },
    {
      "id": "tool-11",
      "type": "tool",
      "title": "字数统计",
      "titleEn": "Word Counter",
      "description": "实时统计字数、字符数、中文字符、英文单词、行数和段落数。",
      "descriptionEn": "Real-time stats for characters, words, Chinese characters, lines, and paragraphs.",
      "category": "学习写作",
      "categoryEn": "Study & Writing",
      "tags": [
        "word",
        "counter",
        "字数",
        "统计",
        "写作"
      ],
      "icon": "📝",
      "route": "/tools/word-counter",
      "features": [
        "实时统计",
        "中英文分别计数",
        "行数段落统计",
        "结果可复制"
      ],
      "featuresEn": [
        "Real-time stats",
        "Chinese/English separate count",
        "Line & paragraph count",
        "Result copying"
      ],
      "popularScore": 80,
      "slug": "word-counter",
      "miniCategorySlug": "text",
      "miniCategoryTitle": "文本学习",
      "workbenchType": "text-process",
      "homePriority": 0,
      "sensitive": false
    },
    {
      "id": "tool-12",
      "type": "tool",
      "title": "Markdown 预览",
      "titleEn": "Markdown Preview",
      "description": "左侧编辑 Markdown，右侧实时预览渲染效果。",
      "descriptionEn": "Edit Markdown on the left, see rendered preview on the right in real-time.",
      "category": "学习写作",
      "categoryEn": "Study & Writing",
      "tags": [
        "markdown",
        "preview",
        "编辑器",
        "预览",
        "写作"
      ],
      "icon": "📄",
      "route": "/tools/markdown-preview",
      "features": [
        "左右分屏实时预览",
        "支持基础语法",
        "移动端切换视图",
        "一键复制 HTML"
      ],
      "featuresEn": [
        "Side-by-side live preview",
        "Basic syntax support",
        "Mobile view toggle",
        "One-click HTML copy"
      ],
      "popularScore": 65,
      "slug": "markdown-preview",
      "miniCategorySlug": "text",
      "miniCategoryTitle": "文本学习",
      "workbenchType": "text-process",
      "homePriority": 0,
      "sensitive": false
    },
    {
      "id": "tool-13",
      "type": "tool",
      "title": "JSON 格式化",
      "titleEn": "JSON Formatter",
      "description": "格式化、压缩、校验 JSON 数据，快速定位语法错误。",
      "descriptionEn": "Format, minify, and validate JSON data with error highlighting.",
      "category": "开发辅助",
      "categoryEn": "Developer Tools",
      "tags": [
        "json",
        "format",
        "formatter",
        "格式化",
        "开发"
      ],
      "icon": "{ }",
      "route": "/tools/json-formatter",
      "features": [
        "一键格式化",
        "一键压缩",
        "错误定位提示",
        "输入输出互换"
      ],
      "featuresEn": [
        "One-click format",
        "One-click minify",
        "Error location hints",
        "Input/output swap"
      ],
      "popularScore": 78,
      "slug": "json-formatter",
      "miniCategorySlug": "dev",
      "miniCategoryTitle": "开发辅助",
      "workbenchType": "text-process",
      "homePriority": 86,
      "sensitive": true
    },
    {
      "id": "tool-14",
      "type": "tool",
      "title": "Base64 编解码",
      "titleEn": "Base64 Codec",
      "description": "文本与 Base64 互相转换，支持中文和 Unicode 字符。",
      "descriptionEn": "Convert between text and Base64, with full Unicode support.",
      "category": "开发辅助",
      "categoryEn": "Developer Tools",
      "tags": [
        "base64",
        "encode",
        "decode",
        "编码",
        "解码"
      ],
      "icon": "🔐",
      "route": "/tools/base64-codec",
      "features": [
        "编码/解码双向转换",
        "完整 Unicode 支持",
        "输入输出互换",
        "一键复制"
      ],
      "featuresEn": [
        "Encode/decode bidirectional",
        "Full Unicode support",
        "Input/output swap",
        "One-click copy"
      ],
      "popularScore": 60,
      "slug": "base64-codec",
      "miniCategorySlug": "dev",
      "miniCategoryTitle": "开发辅助",
      "workbenchType": "text-process",
      "homePriority": 0,
      "sensitive": true
    },
    {
      "id": "tool-15",
      "type": "tool",
      "title": "URL 编解码",
      "titleEn": "URL Codec",
      "description": "URL 编码与解码转换，处理特殊字符和中文链接。",
      "descriptionEn": "Encode and decode URLs, handling special characters and Chinese links.",
      "category": "开发辅助",
      "categoryEn": "Developer Tools",
      "tags": [
        "url",
        "encode",
        "decode",
        "编码",
        "链接"
      ],
      "icon": "🔗",
      "route": "/tools/url-codec",
      "features": [
        "encodeURIComponent",
        "decodeURIComponent",
        "错误提示",
        "一键复制"
      ],
      "featuresEn": [
        "encodeURIComponent",
        "decodeURIComponent",
        "Error hints",
        "One-click copy"
      ],
      "popularScore": 55,
      "slug": "url-codec",
      "miniCategorySlug": "dev",
      "miniCategoryTitle": "开发辅助",
      "workbenchType": "text-process",
      "homePriority": 0,
      "sensitive": true
    },
    {
      "id": "tool-16",
      "type": "tool",
      "title": "颜色转换器",
      "titleEn": "Color Converter",
      "description": "HEX、RGB、HSL 颜色格式互转，附带春日主题色板。",
      "descriptionEn": "Convert between HEX, RGB, and HSL color formats with spring-themed palette.",
      "category": "趣味工具",
      "categoryEn": "Fun Tools",
      "tags": [
        "color",
        "converter",
        "颜色",
        "转换",
        "调色"
      ],
      "icon": "🎨",
      "route": "/tools/color-converter",
      "features": [
        "HEX/RGB/HSL 互转",
        "颜色取色器",
        "春日推荐色板",
        "一键复制颜色值"
      ],
      "featuresEn": [
        "HEX/RGB/HSL conversion",
        "Color picker",
        "Spring palette",
        "One-click color copy"
      ],
      "popularScore": 60,
      "slug": "color-converter",
      "miniCategorySlug": "random",
      "miniCategoryTitle": "随机趣味",
      "workbenchType": "text-process",
      "homePriority": 0,
      "sensitive": false
    },
    {
      "id": "tool-17",
      "type": "tool",
      "title": "日期计算器",
      "titleEn": "Date Calculator",
      "description": "计算两个日期之间的天数差，或从某日期推算 N 天后的日期。",
      "descriptionEn": "Calculate the days between two dates, or find the date N days from a given date.",
      "category": "时间效率",
      "categoryEn": "Time & Efficiency",
      "tags": [
        "date",
        "calculator",
        "日期",
        "计算",
        "倒计时"
      ],
      "icon": "📅",
      "route": "/tools/date-calculator",
      "features": [
        "日期差计算",
        "日期推算",
        "显示星期",
        "一键填今天"
      ],
      "featuresEn": [
        "Date difference",
        "Date offset",
        "Day of week display",
        "Quick fill today"
      ],
      "popularScore": 75,
      "slug": "date-calculator",
      "miniCategorySlug": "time",
      "miniCategoryTitle": "时间效率",
      "workbenchType": "quick-calc",
      "homePriority": 0,
      "sensitive": false
    },
    {
      "id": "tool-18",
      "type": "tool",
      "title": "文本对比",
      "titleEn": "Text Diff",
      "description": "逐行对比两段文本，高亮显示新增和删除的内容，支持差异统计。",
      "descriptionEn": "Compare two texts line by line with highlighted additions and deletions, plus diff statistics.",
      "category": "学习写作",
      "categoryEn": "Study & Writing",
      "tags": [
        "diff",
        "text",
        "compare",
        "对比",
        "文本",
        "差异"
      ],
      "icon": "📋",
      "route": "/tools/text-diff",
      "features": [
        "逐行文本对比",
        "高亮新增和删除",
        "差异统计",
        "一键复制差异"
      ],
      "featuresEn": [
        "Line-by-line comparison",
        "Highlight additions & deletions",
        "Diff statistics",
        "One-click diff copy"
      ],
      "popularScore": 70,
      "slug": "text-diff",
      "miniCategorySlug": "text",
      "miniCategoryTitle": "文本学习",
      "workbenchType": "text-process",
      "homePriority": 0,
      "sensitive": false
    },
    {
      "id": "tool-19",
      "type": "tool",
      "title": "随机文本生成",
      "titleEn": "Lorem Ipsum Generator",
      "description": "快速生成 Lorem Ipsum 占位文本，可自定义段落数和每段句数。",
      "descriptionEn": "Generate Lorem Ipsum placeholder text with configurable paragraphs and sentences.",
      "category": "学习写作",
      "categoryEn": "Study & Writing",
      "tags": [
        "lorem",
        "ipsum",
        "placeholder",
        "占位",
        "文本",
        "生成"
      ],
      "icon": "📃",
      "route": "/tools/lorem-generator",
      "features": [
        "自定义段落数",
        "自定义每段句数",
        "经典开头选项",
        "字数/字符统计"
      ],
      "featuresEn": [
        "Custom paragraph count",
        "Custom sentences per paragraph",
        "Classic opener option",
        "Word/character count"
      ],
      "popularScore": 60,
      "slug": "lorem-generator",
      "miniCategorySlug": "text",
      "miniCategoryTitle": "文本学习",
      "workbenchType": "text-process",
      "homePriority": 0,
      "sensitive": false
    },
    {
      "id": "tool-20",
      "type": "tool",
      "title": "IP 查询",
      "titleEn": "IP Address Lookup",
      "description": "查看您的公网 IP 地址及地理位置、运营商、时区等详细信息。",
      "descriptionEn": "View your public IP address with geolocation, ISP, timezone, and other details.",
      "category": "开发辅助",
      "categoryEn": "Developer Tools",
      "tags": [
        "ip",
        "lookup",
        "address",
        "查询",
        "地址",
        "网络"
      ],
      "icon": "🌐",
      "route": "/tools/ip-lookup",
      "features": [
        "自动获取公网 IP",
        "地理位置信息",
        "运营商/时区显示",
        "地图跳转链接"
      ],
      "featuresEn": [
        "Auto public IP lookup",
        "Geolocation info",
        "ISP & timezone display",
        "Map link"
      ],
      "popularScore": 72,
      "slug": "ip-lookup",
      "miniCategorySlug": "dev",
      "miniCategoryTitle": "开发辅助",
      "workbenchType": "device-file",
      "homePriority": 0,
      "sensitive": false
    },
    {
      "id": "tool-21",
      "type": "tool",
      "title": "小费计算器",
      "titleEn": "Tip Calculator",
      "description": "快速计算小费金额和分账，支持自定义小费比例和多人分账。",
      "descriptionEn": "Quickly calculate tips and split bills. Supports custom tip percentages and multi-person splitting.",
      "category": "日常实用",
      "categoryEn": "Daily Utility",
      "tags": [
        "tip",
        "calculator",
        "bill",
        "split",
        "小费",
        "分账",
        "计算器"
      ],
      "icon": "💰",
      "route": "/tools/tip-calculator",
      "features": [
        "常用小费比例预设",
        "自定义比例",
        "多人分账",
        "实时计算"
      ],
      "featuresEn": [
        "Common tip presets",
        "Custom percentage",
        "Multi-person split",
        "Real-time calculation"
      ],
      "popularScore": 70,
      "slug": "tip-calculator",
      "miniCategorySlug": "daily",
      "miniCategoryTitle": "日常实用",
      "workbenchType": "quick-calc",
      "homePriority": 0,
      "sensitive": false
    },
    {
      "id": "tool-22",
      "type": "tool",
      "title": "大小写转换",
      "titleEn": "Case Converter",
      "description": "快速转换文本大小写格式，支持大写、小写、首字母大写、句首大写等多种模式。",
      "descriptionEn": "Quickly convert text case formats. Supports uppercase, lowercase, title case, sentence case, and more.",
      "category": "学习写作",
      "categoryEn": "Study & Writing",
      "tags": [
        "case",
        "converter",
        "text",
        "大小写",
        "转换",
        "文本"
      ],
      "icon": "Aa",
      "route": "/tools/case-converter",
      "features": [
        "六种转换模式",
        "实时预览",
        "一键复制",
        "字数统计"
      ],
      "featuresEn": [
        "Six conversion modes",
        "Live preview",
        "One-click copy",
        "Word count"
      ],
      "popularScore": 68,
      "slug": "case-converter",
      "miniCategorySlug": "text",
      "miniCategoryTitle": "文本学习",
      "workbenchType": "text-process",
      "homePriority": 0,
      "sensitive": false
    },
    {
      "id": "tool-23",
      "type": "tool",
      "title": "随机数生成",
      "titleEn": "Random Number",
      "description": "生成指定范围内的随机数，支持批量生成和常用范围预设。",
      "descriptionEn": "Generate random numbers in a range. Supports batch generation and quick presets.",
      "category": "趣味工具",
      "categoryEn": "Fun Tools",
      "tags": [
        "random",
        "number",
        "generator",
        "随机",
        "数",
        "生成器"
      ],
      "icon": "🎲",
      "route": "/tools/random-number",
      "features": [
        "自定义范围",
        "批量生成（最多100个）",
        "快捷预设",
        "生成历史记录"
      ],
      "featuresEn": [
        "Custom range",
        "Batch generation (up to 100)",
        "Quick presets",
        "Generation history"
      ],
      "popularScore": 72,
      "slug": "random-number",
      "miniCategorySlug": "random",
      "miniCategoryTitle": "随机趣味",
      "workbenchType": "quick-calc",
      "homePriority": 0,
      "sensitive": false
    },
    {
      "id": "tool-24",
      "type": "tool",
      "title": "BMI 计算器",
      "titleEn": "BMI Calculator",
      "description": "输入身高体重，快速计算 BMI 指数，查看健康范围和建议。",
      "descriptionEn": "Enter height and weight to calculate BMI, view health range and suggestions.",
      "category": "日常实用",
      "categoryEn": "Daily Utility",
      "tags": [
        "bmi",
        "calculator",
        "health",
        "健康",
        "体重",
        "计算器"
      ],
      "icon": "⚖️",
      "route": "/tools/bmi-calculator",
      "features": [
        "快速 BMI 计算",
        "健康范围指示",
        "体重建议",
        "支持公制单位"
      ],
      "featuresEn": [
        "Quick BMI calculation",
        "Health range indicator",
        "Weight suggestions",
        "Metric units support"
      ],
      "popularScore": 72,
      "slug": "bmi-calculator",
      "miniCategorySlug": "daily",
      "miniCategoryTitle": "日常实用",
      "workbenchType": "quick-calc",
      "homePriority": 0,
      "sensitive": false
    },
    {
      "id": "tool-25",
      "type": "tool",
      "title": "文字朗读",
      "titleEn": "Text to Speech",
      "description": "输入文字即可朗读，支持多种语言和语速调节，让文字开口说话。",
      "descriptionEn": "Enter text and have it read aloud. Supports multiple languages and speed adjustment.",
      "category": "趣味工具",
      "categoryEn": "Fun Tools",
      "tags": [
        "tts",
        "speech",
        "voice",
        "朗读",
        "语音",
        "文字转语音"
      ],
      "icon": "🔊",
      "route": "/tools/text-to-speech",
      "features": [
        "多种语言支持",
        "语速可调节",
        "一键朗读",
        "暂停与继续"
      ],
      "featuresEn": [
        "Multiple language support",
        "Adjustable speed",
        "One-click speak",
        "Pause & resume"
      ],
      "popularScore": 68,
      "slug": "text-to-speech",
      "miniCategorySlug": "random",
      "miniCategoryTitle": "随机趣味",
      "workbenchType": "text-process",
      "homePriority": 0,
      "sensitive": false
    },
    {
      "id": "tool-26",
      "type": "tool",
      "title": "Word 转 PDF",
      "titleEn": "Word to PDF",
      "description": "上传 .docx 文件，在浏览器本地生成 PDF，尽量保留文本、标题、表格和图片。",
      "descriptionEn": "Upload a .docx file and generate a PDF locally in the browser, preserving text, headings, tables, and images as much as possible.",
      "category": "文档转换",
      "categoryEn": "Document Conversion",
      "tags": [
        "word",
        "docx",
        "pdf",
        "document",
        "文档",
        "转换",
        "本地处理"
      ],
      "icon": "PDF",
      "route": "/tools/word-to-pdf",
      "features": [
        "拖拽上传",
        "本地转换",
        "PDF 下载",
        "复杂排版限制提示"
      ],
      "featuresEn": [
        "Drag-and-drop upload",
        "Local conversion",
        "PDF download",
        "Clear layout limitation notes"
      ],
      "popularScore": 86,
      "slug": "word-to-pdf",
      "miniCategorySlug": "document",
      "miniCategoryTitle": "文档转换",
      "workbenchType": "device-file",
      "homePriority": 80,
      "sensitive": true
    },
    {
      "id": "tool-27",
      "type": "tool",
      "title": "PDF 转 Word",
      "titleEn": "PDF to Word",
      "description": "上传文本型 PDF，在浏览器本地提取文字并生成 .docx，适合整理可复制文本。",
      "descriptionEn": "Upload a text-based PDF, extract text locally in the browser, and generate a .docx file for editable text cleanup.",
      "category": "文档转换",
      "categoryEn": "Document Conversion",
      "tags": [
        "pdf",
        "word",
        "docx",
        "document",
        "文档",
        "转换",
        "文本提取"
      ],
      "icon": "DOC",
      "route": "/tools/pdf-to-word",
      "features": [
        "PDF 文本提取",
        "逐页保留标题",
        "DOCX 下载",
        "扫描件友好提示"
      ],
      "featuresEn": [
        "PDF text extraction",
        "Page headings preserved",
        "DOCX download",
        "Friendly scanned-file hint"
      ],
      "popularScore": 84,
      "slug": "pdf-to-word",
      "miniCategorySlug": "document",
      "miniCategoryTitle": "文档转换",
      "workbenchType": "device-file",
      "homePriority": 78,
      "sensitive": true
    },
    {
      "id": "tool-28",
      "type": "tool",
      "title": "复习小筑",
      "titleEn": "Review Nest",
      "description": "把 txt、md、csv、json、zip、rar、docx 题库和兼容式 doc 文本整理成可搜索、可复习、可导出的本地学习卡片。",
      "descriptionEn": "Turn txt, md, csv, json, zip, rar, docx, and best-effort doc question banks into searchable, reviewable local study cards.",
      "category": "学习写作",
      "categoryEn": "Study & Writing",
      "tags": [
        "question bank",
        "review",
        "study",
        "docx",
        "rar",
        "题库",
        "刷题",
        "背答案",
        "错题本"
      ],
      "icon": "QB",
      "route": "/tools/question-bank-importer",
      "features": [
        "本地文件解析",
        "压缩包题库导入",
        "刷题与背答案模式",
        "错题本与收藏",
        "JSON 导出"
      ],
      "featuresEn": [
        "Local file parsing",
        "Archive question bank import",
        "Quiz and memorization modes",
        "Wrong-book and favorites",
        "JSON export"
      ],
      "popularScore": 89,
      "slug": "question-bank-importer",
      "miniCategorySlug": "text",
      "miniCategoryTitle": "文本学习",
      "workbenchType": "local-data",
      "homePriority": 98,
      "sensitive": true
    },
    {
      "id": "tool-29",
      "type": "tool",
      "title": "本地记账",
      "titleEn": "Local Bookkeeping",
      "description": "快速记录收入和支出，按月查看结余、分类占比和明细，并导出 CSV 备份。",
      "descriptionEn": "Track income and expenses, review monthly balance, category totals, and export CSV backups.",
      "category": "日常实用",
      "categoryEn": "Daily Utility",
      "tags": [
        "bookkeeping",
        "expense",
        "income",
        "budget",
        "记账",
        "账本",
        "支出",
        "收入",
        "预算",
        "本地存储"
      ],
      "icon": "¥",
      "route": "/tools/bookkeeping",
      "features": [
        "本地保存收支记录",
        "月度结余统计",
        "支出分类占比",
        "搜索筛选明细",
        "CSV 导出备份"
      ],
      "featuresEn": [
        "Local transaction storage",
        "Monthly balance summary",
        "Expense category breakdown",
        "Search and filter details",
        "CSV backup export"
      ],
      "popularScore": 87,
      "slug": "bookkeeping",
      "miniCategorySlug": "daily",
      "miniCategoryTitle": "日常实用",
      "workbenchType": "local-data",
      "homePriority": 96,
      "sensitive": true
    }
  ]
};
