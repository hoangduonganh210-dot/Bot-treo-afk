const mineflayer = require('mineflayer')
const http = require('http')

const PASSWORD = 'TrinhHoangYen' 

// Web Server ảo duy trì Render 24/7
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
  let isMenuOpen = false // Cờ kiểm tra trạng thái Menu đang mở

  bot.on('login', () => {
    console.log('=== KẾT NỐI MẠNG THÀNH CÔNG (BOT ONLINE) ===')
  })

  bot.on('spawn', () => {
    if (inGame) return

    console.log('=== VÀO SẢNH CHỜ: ĐĂNG NHẬP VÀ MỞ MENU ===')

    // Gửi lệnh đăng nhập lần đầu
    setTimeout(() => {
      bot.chat(`/dn ${PASSWORD}`)
      console.log('-> Đã gửi lệnh /dn ban đầu.')
    }, 2000)

    // Nếu chưa vào game VÀ Menu chưa mở thì mới định kỳ gửi lệnh
    if (actionInterval) clearInterval(actionInterval)
    actionInterval = setInterval(() => {
      if (!inGame && !isMenuOpen) {
        console.log('-> Đang gửi /dn và thử mở /menu...')
        bot.chat(`/dn ${PASSWORD}`)
        bot.chat('/menu')
      }
    }, 4000)

    // Anti-AFK
    if (afkInterval) clearInterval(afkInterval)
    afkInterval = setInterval(() => {
      if (!bot.entity) return
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 300)
    }, 20000)
  })

  // LẮNG NGHE SỰ KIỆN MỞ MENU
  bot.on('windowOpen', async (window) => {
    if (inGame) return

    isMenuOpen = true // Đánh dấu Menu đã mở -> Tạm dừng spam /menu
    console.log(`=== MENU ĐÃ MỞ! ĐANG CHỜ 1 GIÂY ĐỂ CLICK SLOT 24... ===`)

    // Chờ 1 giây ổn định giao diện
    await new Promise(resolve => setTimeout(resolve, 1000))

    const slotToClick = 24  // Ô số 24 
    const mouseButton = 0  // Chuột trái
    const clickMode = 0    // Click đơn

    console.log(`-> Tiến hành click chuột trái vào Slot ${slotToClick}...`)
    
    bot.clickWindow(slotToClick, mouseButton, clickMode, (err) => {
      if (err) {
        console.error(`[LỖI CLICK]:`, err.message)
        isMenuOpen = false // Nếu click lỗi thì cho phép mở lại menu
      } else {
        console.log(`=== [THÀNH CÔNG] ĐÃ CLICK SLOT 24 THÀNH CÔNG! ===`)
        inGame = true
        if (actionInterval) clearInterval(actionInterval)
      }
    })
  })

  bot.on('respawn', () => {
    console.log('=== BOT ĐÃ RESPAWN / CHUYỂN SERVER THÀNH CÔNG! ===')
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
    console.log('Mất kết nối! Tự động kết nối lại sau 20 giây...')
    inGame = false
    isMenuOpen = false
    if (actionInterval) clearInterval(actionInterval)
    if (afkInterval) clearInterval(afkInterval)
    setTimeout(startBot, 20000)
  })
}

startBot()
