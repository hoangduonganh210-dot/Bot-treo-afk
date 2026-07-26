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
  SLOT_TO_CLICK: 24,             // Ô cái đầu ở hàng 3 (Slot 24)
  
  // Thời gian cấu hình (tính bằng mili-giây)
  DELAY_AFTER_SPAWN: 2000,      // Chờ 2s sau khi spawn mới bắt đầu
  INTERVAL_RETRY_USE_CLOCK: 4000,// Thử kích hoạt Đồng hồ mỗi 4 giây
  DELAY_AFTER_MENU_OPEN: 1500,  // Chờ 1.5s cho GUI đồng bộ item rồi mới click
  RECONNECT_DELAY: 15000,       // Thời gian kết nối lại khi mất mạng
  WEB_PORT: process.env.PORT || 3000 // Port Web Server cho Render 24/7
}

// ===================================================
// WEB SERVER GIỮ BOT ONLINE 24/7 TRÊN RENDER
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

  bot.on('login', () => {
    console.log(`=== [BƯỚC 2] ${CONFIG.USERNAME} ĐÃ KẾT NỐI VÀO LOBBY ===`)
  })

  bot.on('spawn', () => {
    if (inGame) return

    console.log('-> Đã spawn tại sảnh. Chuẩn bị đăng nhập & dùng Đồng hồ...')

    if (actionInterval) clearInterval(actionInterval)

    setTimeout(() => {
      actionInterval = setInterval(() => {
        if (!inGame && !isMenuOpen) {
          console.log('=== [BƯỚC 3] ĐĂNG NHẬP VÀ KÍCH HOẠT ĐỒNG HỒ ===')
          
          // 1. Gửi lệnh đăng nhập
          bot.chat(`/dn ${CONFIG.PASSWORD}`)

          // 2. Chuyển sang ô ĐỒNG HỒ (Slot index 2 trên Hotbar) và Bấm chuột phải
          setTimeout(() => {
            if (!inGame && !isMenuOpen) {
              try {
                bot.setQuickBarSlot(2) // Ô thứ 3 từ trái sang (Index 2)
                bot.activateItem()     // Chuột phải dùng Đồng hồ
                console.log('-> Đã chọn Slot 2 (Đồng hồ) và nhấn chuột phải!')
              } catch (e) {
                console.log('Lỗi khi dùng item:', e.message)
              }
            }
          }, 500)
        }
      }, CONFIG.INTERVAL_RETRY_USE_CLOCK)
    }, CONFIG.DELAY_AFTER_SPAWN)
  })

  // BƯỚC 4: CLICK SLOT 24 KHI MENU MỞ
  bot.on('windowOpen', async (window) => {
    if (inGame) return

    isMenuOpen = true
    // Dừng dùng đồng hồ ngay lập tức khi Menu vừa bật lên
    if (actionInterval) clearInterval(actionInterval) 

    console.log(`-> MENU ĐÃ MỞ: "${window.title || 'GUI'}". Đang chờ load item...`)

    // Chờ GUI đồng bộ item từ Server
    await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_AFTER_MENU_OPEN))

    console.log(`=== [BƯỚC 4] THỰC HIỆN CLICK VÀO Ô THỨ ${CONFIG.SLOT_TO_CLICK} ===`)

    try {
      await bot.clickWindow(CONFIG.SLOT_TO_CLICK, 0, 0)
      console.log(`=== [THÀNH CÔNG] ĐÃ CLICK VÀO SLOT ${CONFIG.SLOT_TO_CLICK}! ===`)

      inGame = true
      isMenuOpen = false

    } catch (err) {
      console.error('[LỖI CLICK]:', err.message || err)
      isMenuOpen = false // Cho phép thử lại nếu lỡ bị lỗi click
    }
  })

  bot.on('respawn', () => {
    console.log('=== THÀNH CÔNG: BOT ĐÃ CHUYỂN SERVER VÀO GAME! ===')
    inGame = true
    isMenuOpen = false
    if (actionInterval) clearInterval(actionInterval)
  })

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
