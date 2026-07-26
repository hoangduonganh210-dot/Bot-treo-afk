const mineflayer = require('mineflayer')
const http = require('http')

// ===================================================
// THÔNG TIN CẤU HÌNH BOT
// ===================================================
const CONFIG = {
  USERNAME: 'coolgau',           // Tên nhân vật Minecraft
  PASSWORD: 'TrinhHoangYen',      // Mật khẩu đăng nhập (/dn)
  HOST: 'sgp.kingmc.vn',         // IP Server
  PORT_MC: 25565,                // Port Server
  VERSION: '1.20.4',             // Phiên bản Minecraft
  SLOT_TO_CLICK: 24,             // Ô cần click trong /menu (đếm từ 0)
  
  // Thời gian cấu hình (tính bằng mili-giây)
  DELAY_AFTER_SPAWN: 2000,      // Chờ 2s sau khi vào lobby mới bắt đầu gửi lệnh
  INTERVAL_RETRY_MENU: 5000,    // Thử lại mỗi 5 giây (tránh bị spam-kick)
  DELAY_AFTER_MENU_OPEN: 1500,  // Thời gian chờ menu load item rồi mới click (1.5s)
  RECONNECT_DELAY: 15000,       // Thời gian chờ kết nối lại (15s)
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

  // BƯỚC 2: JOIN SERVER
  bot.on('login', () => {
    console.log(`=== [BƯỚC 2] ${CONFIG.USERNAME} ĐÃ KẾT NỐI VÀO LOBBY ===`)
  })

  bot.on('spawn', () => {
    if (inGame) return

    console.log('-> Đã spawn tại sảnh chờ. Chuẩn bị chạy tiến trình đăng nhập & mở menu...')

    // Dừng vòng lặp cũ nếu có
    if (actionInterval) clearInterval(actionInterval)

    // Chờ 2s ổn định kết nối rồi bắt đầu vòng lặp
    setTimeout(() => {
      actionInterval = setInterval(() => {
        if (!inGame && !isMenuOpen) {
          console.log('=== [BƯỚC 3] GỬI LỆNH ĐĂNG NHẬP VÀ MỞ MENU ===')
          
          // 1. Luôn gửi lệnh đăng nhập lại phòng trường hợp chưa ăn lệnh
          bot.chat(`/dn ${CONFIG.PASSWORD}`)
          
          // 2. Chờ 500ms rồi mới gửi /menu
          setTimeout(() => {
            if (!inGame && !isMenuOpen) {
              bot.chat('/menu')

              // 3. Chuột phải item slot 0 (La bàn/Cần câu mở menu nếu có)
              try {
                bot.setQuickBarSlot(0)
                bot.activateItem()
              } catch (e) {}
            }
          }, 500)
        }
      }, CONFIG.INTERVAL_RETRY_MENU)
    }, CONFIG.DELAY_AFTER_SPAWN)
  })

  // BƯỚC 4: CHỌN Ô THỨ 24 (ĐẾM TỪ 0)
  bot.on('windowOpen', async (window) => {
    if (inGame) return

    isMenuOpen = true
    console.log(`-> MENU ĐÃ MỞ: "${window.title}". Dừng vòng lặp, chờ load item...`)

    // Dừng ngay việc gửi lệnh
    if (actionInterval) clearInterval(actionInterval)

    // Chờ GUI đồng bộ vật phẩm từ Server
    await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_AFTER_MENU_OPEN))

    console.log(`=== [BƯỚC 4] THỰC HIỆN CLICK VÀO Ô THỨ ${CONFIG.SLOT_TO_CLICK} ===`)

    try {
      await bot.clickWindow(CONFIG.SLOT_TO_CLICK, 0, 0)
      console.log(`=== [THÀNH CÔNG] ĐÃ CLICK VÀO SLOT ${CONFIG.SLOT_TO_CLICK}! ===`)

      inGame = true
      isMenuOpen = false
    } catch (err) {
      console.error('[LỖI CLICK]:', err.message || err)
      isMenuOpen = false // Nếu click lỗi thì mở cờ cho phép thử lại
    }
  })

  // Tắt luồng Lobby khi đã chuyển server thành công
  bot.on('respawn', () => {
    console.log('=== HOÀN TẤT: BOT ĐÃ CHUYỂN SERVER THÀNH CÔNG! ===')
    inGame = true
    isMenuOpen = false
    if (actionInterval) clearInterval(actionInterval)
  })

  // Tự động kết nối lại khi bị disconnect
  bot.on('end', () => {
    console.log(`Mất kết nối! Sẽ kết nối lại sau ${CONFIG.RECONNECT_DELAY / 1000}s...`)
    inGame = false
    isMenuOpen = false
    if (actionInterval) clearInterval(actionInterval)
    setTimeout(startBot, CONFIG.RECONNECT_DELAY)
  })

  bot.on('error', (err) => console.log('[LỖI BOT]:', err.message))
}

startBot()
