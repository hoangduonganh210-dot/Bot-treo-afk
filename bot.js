const mineflayer = require('mineflayer')
const http = require('http')

// ===================================================
// THÔNG TIN CẤU HÌNH BOT (THAY ĐỔI TẠI ĐÂY)
// ===================================================
const CONFIG = {
  USERNAME: 'coolgau',           // Tên nhân vật Minecraft
  PASSWORD: 'TrinhHoangYen',      // Mật khẩu đăng nhập (/dn)
  HOST: 'sgp.kingmc.vn',         // IP Server
  PORT_MC: 25565,                // Port Server
  VERSION: '1.20.4',             // Phiên bản Minecraft
  SLOT_TO_CLICK: 24,             // Ô cần click trong /menu (đếm từ 0)
  
  // Thời gian cấu hình (tính bằng mili-giây)
  DELAY_AFTER_LOGIN: 2000,      // Chờ 2s sau khi spawn mới gửi /dn (gửi đúng 1 lần)
  DELAY_BEFORE_MENU: 1500,       // Chờ 1.5s sau /dn rồi mới gửi /menu đầu tiên
  DELAY_AFTER_MENU_OPEN: 1500,  // Thời gian chờ menu load item rồi mới click (1.5s)
  INTERVAL_RETRY_MENU: 3500,    // Thời gian thử lại lệnh /menu nếu chưa mở (3.5s)
  RECONNECT_DELAY: 15000,       // Thời gian chờ kết nối lại khi ngắt mạng (15s)
  WEB_PORT: process.env.PORT || 3000 // Port Web Server cho Render 24/7
}

// ===================================================
// WEB SERVER GIỮ BOT AFK ONLINE 24/7 TRÊN RENDER
// ===================================================
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end(`Bot ${CONFIG.USERNAME} đang hoạt động 24/7 trên Render!`)
}).listen(CONFIG.WEB_PORT, () => {
  console.log(`[Render] Web Server đang lắng nghe ở cổng: ${CONFIG.WEB_PORT}`)
})

// ===================================================
// LOGIC KHỞI TẠO VÀ ĐIỀU KHIỂN BOT
// ===================================================
function startBot() {
  console.log(`=== [BƯỚC 1] ĐANG TẠO BOT: ${CONFIG.USERNAME} ===`)

  const bot = mineflayer.createBot({
    host: CONFIG.HOST,
    port: CONFIG.PORT_MC,
    username: CONFIG.USERNAME,
    version: CONFIG.VERSION,
    auth: 'offline',
    connectTimeout: 60000,
    timeout: 60000
  })

  let actionInterval = null
  let inGame = false
  let isMenuOpen = false
  let hasLoggedIn = false // Cờ đánh dấu đã gửi lệnh đăng nhập 1 lần hay chưa

  // BƯỚC 2: JOIN SERVER
  bot.on('login', () => {
    console.log(`=== [BƯỚC 2] ${CONFIG.USERNAME} ĐÃ KẾT NỐI VÀO LOBBY (${CONFIG.HOST}) ===`)
  })

  bot.on('spawn', () => {
    if (inGame) return

    console.log('-> Đã spawn tại sảnh chờ.')

    // Gửi lệnh đăng nhập (/dn) ĐÚNG 1 LẦN duy nhất
    if (!hasLoggedIn) {
      setTimeout(() => {
        if (!inGame) {
          bot.chat(`/dn ${CONFIG.PASSWORD}`)
          console.log(`-> Đã gửi lệnh đăng nhập duy nhất: /dn ${CONFIG.PASSWORD}`)
          hasLoggedIn = true
        }
      }, CONFIG.DELAY_AFTER_LOGIN)
    }

    // BƯỚC 3: DÙNG LỆNH /menu LIÊN TỤC CHO ĐẾN KHI MỞ MENU
    if (actionInterval) clearInterval(actionInterval)
    
    // Đợi 1 tí sau khi đăng nhập rồi mới bắt đầu vòng lặp gõ /menu
    setTimeout(() => {
      actionInterval = setInterval(() => {
        if (!inGame && !isMenuOpen) {
          console.log('=== [BƯỚC 3] GỬI LỆNH /menu ===')
          bot.chat('/menu')
        }
      }, CONFIG.INTERVAL_RETRY_MENU)
    }, CONFIG.DELAY_AFTER_LOGIN + CONFIG.DELAY_BEFORE_MENU)
  })

  // BƯỚC 4: CHỌN Ô THỨ 24 (ĐẾM TỪ 0)
  bot.on('windowOpen', async (window) => {
    if (inGame) return

    isMenuOpen = true
    console.log(`-> Menu đã mở ("${window.title}"). Chờ ${CONFIG.DELAY_AFTER_MENU_OPEN / 1000}s để load item...`)

    // Chờ GUI đồng bộ vật phẩm từ Server
    await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_AFTER_MENU_OPEN))

    console.log(`=== [BƯỚC 4] THỰC HIỆN CLICK VÀO Ô THỨ ${CONFIG.SLOT_TO_CLICK} ===`)

    try {
      // Click chuột trái (button 0, mode 0) vào Slot 24
      await bot.clickWindow(CONFIG.SLOT_TO_CLICK, 0, 0)
      console.log(`=== [THÀNH CÔNG] ĐÃ CLICK VÀO SLOT ${CONFIG.SLOT_TO_CLICK}! ===`)

      inGame = true
      isMenuOpen = false
      if (actionInterval) clearInterval(actionInterval)

    } catch (err) {
      console.error('[LỖI CLICK]:', err.message || err)
      isMenuOpen = false // Reset trạng thái để thử lại nếu gặp lỗi
    }
  })

  // Tắt vòng lặp Lobby khi đã vào Server thành công
  bot.on('respawn', () => {
    console.log('=== HOÀN TẤT: BOT ĐÃ CHUYỂN SERVER THÀNH CÔNG! ===')
    inGame = true
    isMenuOpen = false
    if (actionInterval) clearInterval(actionInterval)
  })

  // Tự động kết nối lại khi bị disconnect hoặc server restart
  bot.on('end', () => {
    console.log(`Mất kết nối! Sẽ tự động kết nối lại sau ${CONFIG.RECONNECT_DELAY / 1000} giây...`)
    inGame = false
    isMenuOpen = false
    hasLoggedIn = false // Reset cờ đăng nhập khi bị rớt mạng
    if (actionInterval) clearInterval(actionInterval)
    setTimeout(startBot, CONFIG.RECONNECT_DELAY)
  })

  bot.on('error', (err) => console.log('[LỖI BOT]:', err.message))
  bot.on('kicked', (reason) => console.log('[BỊ KICK]:', JSON.stringify(reason)))
}

// Chạy Bot
startBot()
