const mineflayer = require('mineflayer')
const http = require('http')

// ==================== CẤU HÌNH BOT ====================
const PASSWORD = 'TrinhHoangYen'
const HOST = 'sgp.kingmc.vn'
const PORT_MC = 25565
const USERNAME = 'coolgau'
const VERSION = '1.20.4'

// Web Server phụ duy trì 24/7 trên Render
const PORT = process.env.PORT || 3000
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('Bot AFK KingMC đang chạy!')
}).listen(PORT, () => {
  console.log(`[Render] Web Server running on port ${PORT}`)
})

function startBot() {
  // ===================================================
  // BƯỚC 1: TẠO BOT
  // ===================================================
  console.log('=== BƯỚC 1: ĐANG TẠO VÀ KHỞI TẠO BOT ===')
  
  const bot = mineflayer.createBot({
    host: HOST,
    port: PORT_MC,
    username: USERNAME,
    version: VERSION,
    auth: 'offline',
    connectTimeout: 60000,
    timeout: 60000
  })

  let actionInterval = null
  let afkInterval = null
  let inGame = false
  let isMenuOpen = false

  // ===================================================
  // BƯỚC 2: JOIN SERVER
  // ===================================================
  bot.on('login', () => {
    console.log('=== BƯỚC 2: BOT ĐÃ JOIN SERVER THÀNH CÔNG (ONLINE) ===')
  })

  bot.on('spawn', () => {
    if (inGame) return

    console.log('-> Đã vào sảnh chờ, chuẩn bị đăng nhập...')

    // Tự động đăng nhập /dn sau khi vào server
    setTimeout(() => {
      if (!inGame) {
        bot.chat(`/dn ${PASSWORD}`)
        console.log(`-> Đã gửi lệnh: /dn ${PASSWORD}`)
      }
    }, 2000)

    // ===================================================
    // BƯỚC 3: DÙNG LỆNH /menu
    // ===================================================
    if (actionInterval) clearInterval(actionInterval)
    actionInterval = setInterval(() => {
      if (!inGame && !isMenuOpen) {
        console.log('=== BƯỚC 3: DÙNG LỆNH /menu ===')
        bot.chat(`/dn ${PASSWORD}`)
        bot.chat('/menu')
      }
    }, 4000)

    // Anti-AFK nhảy nhẹ mỗi 20 giây
    if (afkInterval) clearInterval(afkInterval)
    afkInterval = setInterval(() => {
      if (!bot.entity) return
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 300)
    }, 20000)
  })

  // ===================================================
  // BƯỚC 4: CHỌN VÀO Ô THỨ 24 (ĐẾM TỪ 0)
  // ===================================================
  bot.on('windowOpen', async (window) => {
    if (inGame) return

    isMenuOpen = true
    console.log(`-> Menu đã mở: "${window.title}". Chờ 1.2s để giao diện load...`)

    // Chờ 1.2s để item trong Menu load xong hoàn toàn
    await new Promise(resolve => setTimeout(resolve, 1200))

    try {
      const slotToClick = 24 // Ô thứ 24 (đếm từ 0)
      console.log(`=== BƯỚC 4: CHỌN VÀO Ô THỨ ${slotToClick} (SLOT 24) ===`)
      
      // Click chuột trái (button 0, mode 0) vào ô thứ 24
      await bot.clickWindow(slotToClick, 0, 0)
      console.log(`=== [THÀNH CÔNG] ĐÃ CLICK VÀO Ô THỨ ${slotToClick}! ===`)

      inGame = true
      isMenuOpen = false
      if (actionInterval) clearInterval(actionInterval)
    } catch (err) {
      console.error('[LỖI CLICK Ô 24]:', err.message || err)
      isMenuOpen = false // Reset để thử lại nếu lỗi
    }
  })

  // Xử lý khi chuyển Server thành công
  bot.on('respawn', () => {
    console.log('-> Bot đã Respawn / Chuyển Server thành công!')
    inGame = true
    isMenuOpen = false
    if (actionInterval) clearInterval(actionInterval)
  })

  // Tự động kết nối lại khi bị ngắt kết nối
  bot.on('end', () => {
    console.log('Mất kết nối! Tự động kết nối lại sau 20 giây...')
    inGame = false
    isMenuOpen = false
    if (actionInterval) clearInterval(actionInterval)
    if (afkInterval) clearInterval(afkInterval)
    setTimeout(startBot, 20000)
  })

  bot.on('error', (err) => console.log('Lỗi:', err.message))
  bot.on('kicked', (reason) => console.log('Bị kick:', JSON.stringify(reason)))
}

// Chạy ứng dụng
startBot()
