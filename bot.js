const mineflayer = require('mineflayer')
const http = require('http')

const PASSWORD = 'TrinhHoangYen' 

// Web Server ảo cho Render
const PORT = process.env.PORT || 3000
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Bot AFK KingMC dang chay!')
}).listen(PORT, () => {
  console.log(`[Render] Web server listening on port ${PORT}`)
})

function startBot() {
  console.log('=== TRẠNG THÁI: KẾT NỐI TỚI KINGMC (COOLGAU)... ===')
  
  const bot = mineflayer.createBot({
    host: 'sgp.kingmc.vn', 
    port: 25565,
    username: 'coolgau',
    version: '1.20.4', 
    auth: 'offline',
    connectTimeout: 60000, 
    timeout: 60000 
  })

  let afkInterval
  let actionInterval
  let inGame = false

  bot.on('login', () => {
    console.log('=== KẾT NỐI MẠNG THÀNH CÔNG ===')
  })

  bot.on('spawn', () => {
    if (inGame) return

    console.log('=== VÀO SẢNH: THỰC HIỆN ĐĂNG NHẬP & CHUYỂN SERVER ===')

    // 1. Thao tác đăng nhập
    setTimeout(() => {
      bot.chat(`/dn ${PASSWORD}`)
      console.log('-> Gửi lệnh /dn...')
    }, 2000)

    // 2. Vòng lặp liên tục thử vào game mỗi 5 giây cho đến khi thành công
    if (actionInterval) clearInterval(actionInterval)
    actionInterval = setInterval(() => {
      if (inGame) return

      console.log('-> Đang thử gõ /dn và mở Menu/Chuyển server...')
      bot.chat(`/dn ${PASSWORD}`)

      // Chuyển sang cầm ô Đồng Hồ trên hotbar (Thường là slot 4 hoặc 2/3)
      try {
        bot.setQuickBarSlot(4) // Ô số 5 trên thanh hotbar
      } catch (e) {}

      // Chuột phải dùng Đồng Hồ
      bot.activateItem()

      // Lệnh dự phòng chat thẳng
      bot.chat('/menu')
      bot.chat('/kingsmp')
      bot.chat('/server kingsmp')
    }, 5000)

    // Anti-AFK
    if (afkInterval) clearInterval(afkInterval)
    afkInterval = setInterval(() => {
      if (!bot.entity) return
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 300)
    }, 20000)
  })

  // Khi Menu Chest mở ra -> Tự động Click ô KingSMP (Slot 23)
  bot.on('windowOpen', async (window) => {
    console.log('=== MENU ĐÃ MỞ! ĐANG CLICK Ô KINGSMP (SLOT 23)... ===')
    await new Promise(resolve => setTimeout(resolve, 1000))

    const TARGET_SLOT = 23 // Hàng 3, Cột 6
    
    bot.clickWindow(TARGET_SLOT, 0, 0, (err) => {
      if (!err) {
        console.log('=== ĐÃ CLICK THÀNH CÔNG Ô 23! ===')
      } else {
        console.log('[LỖI CLICK]:', err.message)
      }
    })
  })

  // Khi nhận thấy đã đổi thế giới / chuyển server
  bot.on('respawn', () => {
    console.log('=== BOT ĐÃ CHUYỂN SẢNH / RESPAWN THÀNH CÔNG! ===')
    inGame = true
    if (actionInterval) clearInterval(actionInterval)
  })

  bot.on('kicked', (reason) => {
    console.log('Bot bị kick:', JSON.stringify(reason))
  })

  bot.on('error', (err) => {
    console.log('Lỗi:', err.message)
  })

  bot.on('end', () => {
    console.log('Mất kết nối! Đang tự động kết nối lại sau 20 giây...')
    inGame = false
    if (actionInterval) clearInterval(actionInterval)
    if (afkInterval) clearInterval(afkInterval)
    setTimeout(startBot, 20000)
  })
}

startBot()
