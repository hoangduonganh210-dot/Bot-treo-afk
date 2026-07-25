const mineflayer = require('mineflayer')
const http = require('http')

const PASSWORD = 'TrinhHoangYen' 

// 1. Web Server ảo để Render nhận diện bot chạy 24/7
const PORT = process.env.PORT || 3000
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Bot AFK KingMC dang chay!')
}).listen(PORT, () => {
  console.log(`[Render] Web server opened on port ${PORT}`)
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
    console.log('=== KẾT NỐI MẠNG THÀNH CÔNG (BOT ONLINE) ===')
  })

  bot.on('spawn', () => {
    if (inGame) return

    console.log('=== VÀO SẢNH: ĐĂNG NHẬP VÀ MỞ MENU (/menu)... ===')

    // 1. Gửi lệnh đăng nhập ban đầu
    setTimeout(() => {
      bot.chat(`/dn ${PASSWORD}`)
      console.log('-> Gửi lệnh /dn...')
    }, 2000)

    // 2. Định kỳ gửi /dn và /menu mỗi 5 giây nếu chưa vào được game
    if (actionInterval) clearInterval(actionInterval)
    actionInterval = setInterval(() => {
      if (inGame) return

      console.log('-> Đang thử lại: Gửi /dn và mở /menu...')
      bot.chat(`/dn ${PASSWORD}`)
      bot.chat('/menu') // Lệnh mở Menu
    }, 5000)

    // 3. Cơ chế Anti-AFK cơ bản
    if (afkInterval) clearInterval(afkInterval)
    afkInterval = setInterval(() => {
      if (!bot.entity) return
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 300)
    }, 20000)
  })

  // 4. LẮNG NGHE SỰ KIỆN MỞ MENU -> CLICK CHUỘT TRÁI VÀO SLOT 24
  bot.on('windowOpen', (window) => {
    if (inGame) return

    console.log(`[BOT] Đã mở giao diện: ${window.title || 'Menu/Chest'}`)

    const slotToClick = 24  // Ô số 24 bạn cần click
    const mouseButton = 0  // 0: Chuột trái
    const clickMode = 0    // 0: Click đơn thông thường

    // Trễ 0.5 giây cho an toàn và tránh bị chống hack/spam block
    setTimeout(() => {
      bot.clickWindow(slotToClick, mouseButton, clickMode, (err) => {
        if (err) {
          console.error(`[LỖI] Không thể click vào ô số 24:`, err.message)
        } else {
          console.log(`=== [BOT] ĐÃ CLICK CHUỘT TRÁI VÀO Ô SỐ 24 THÀNH CÔNG! ===`)
          inGame = true
          if (actionInterval) clearInterval(actionInterval)
        }
      })
    }, 500)
  })

  // 5. Xử lý chuyển server / ngắt kết nối
  bot.on('respawn', () => {
    console.log('=== BOT ĐÃ CHUYỂN SERVER / RESPAWN THÀNH CÔNG! ===')
    inGame = true
    if (actionInterval) clearInterval(actionInterval)
  })

  bot.on('kicked', (reason) => {
    console.log('Bot bị kick khỏi server:', JSON.stringify(reason))
  })

  bot.on('error', (err) => {
    console.log('Lỗi phát sinh:', err.message)
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
