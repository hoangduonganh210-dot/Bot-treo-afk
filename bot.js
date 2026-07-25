const mineflayer = require('mineflayer')
const http = require('http')

const PASSWORD = 'TrinhHoangYen' 

// 1. Tạo Web Server ảo để Render nhận diện dịch vụ đang chạy 24/7
const PORT = process.env.PORT || 3000
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Bot AFK KingMC đang hoạt động bình thường!')
}).listen(PORT, () => {
  console.log(`[Render] Web server đã mở trên port ${PORT}`)
})

function startBot() {
  console.log('=== TRẠNG THÁI: ĐANG KẾT NỐI TỚI KINGMC VỚI TÊN COOLGAU... ===')
  
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
  let loginInterval
  let menuInterval
  let inGame = false // Đánh dấu bot đã vào hẳn cụm game chính chưa

  bot.on('login', () => {
    console.log('=== TRẠNG THÁI: KẾT NỐI MẠNG THÀNH CÔNG (BOT ONLINE) ===')
  })

  bot.on('spawn', () => {
    // Nếu đã vào cụm game KingSMP rồi thì không lặp lại logic ở Sảnh
    if (inGame) return

    console.log('=== ĐÃ VÀO SẢNH CHỜ: BẮT ĐẦU ĐĂNG NHẬP... ===')
    
    // Đăng nhập lần 1 sau 2.5s
    setTimeout(() => {
      bot.chat(`/dn ${PASSWORD}`)
      console.log('-> Đã gửi lệnh đăng nhập lần 1.')
    }, 2500)

    // Lặp lại gõ /dn mỗi 4 giây cho đến khi vào được game (Chống lag/nuốt lệnh)
    if (loginInterval) clearInterval(loginInterval)
    loginInterval = setInterval(() => {
      if (!inGame) {
        console.log('-> Đang thử lại lệnh đăng nhập /dn...')
        bot.chat(`/dn ${PASSWORD}`)
      }
    }, 4000)

    // Chờ 7s để sảnh load ổn định -> Kích hoạt Đồng Hồ (Chuột phải) & Mở Menu
    setTimeout(() => {
      console.log('=== SẢNH ỔN ĐỊNH: BẮT ĐẦU KÍCH HOẠT ĐỒNG HỒ & MỞ MENU... ===')
      
      bot.activateItem()   // Chuột phải vào Đồng Hồ đang cầm trên tay
      bot.chat('/menu')    // Lệnh dự phòng mở Menu
      bot.chat('/kingsmp') // Lệnh dự phòng vào thẳng server

      // Nếu sau 5s vẫn ở sảnh thì kích hoạt lại Đồng Hồ
      if (menuInterval) clearInterval(menuInterval)
      menuInterval = setInterval(() => {
        if (!inGame) {
          console.log('⚠️ Chưa chuyển server, đang kích hoạt lại Đồng hồ và Menu...');
          bot.activateItem()
          bot.chat('/menu')
          bot.chat('/kingsmp')
        }
      }, 5000)

    }, 7000)

    // Vòng lặp Anti-AFK (Tự nhảy, đi lại, xoay góc nhìn)
    if (afkInterval) clearInterval(afkInterval)
    afkInterval = setInterval(() => {
      if (!bot.entity) return
      
      // Nhảy
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 400)
      
      // Đi tiến & xoay camera
      bot.setControlState('forward', true)
      setTimeout(() => {
        bot.setControlState('forward', false)
        const yaw = bot.entity.yaw + (Math.PI / 2) * (Math.random() > 0.5 ? 1 : -1)
        bot.look(yaw, 0, true)
        
        // Đi sang ngang
        bot.setControlState('right', true)
        setTimeout(() => {
          bot.setControlState('right', false)
        }, 700)
      }, 800)

    }, 25000) // Thực hiện mỗi 25 giây
  })

  // Xử lý khi Menu Chest mở ra
  bot.on('windowOpen', async (window) => {
    if (inGame) return
    console.log('=== MENU ĐÃ MỞ! CHỜ 1.5 GIÂY ĐỂ ĐỒNG BỘ ITEM... ===')
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Ô KingSMP nằm ở Hàng 3, Cột 6 -> Slot ID chính xác là 23
    const TARGET_SLOT = 23 
    
    console.log(`-> Tiến hành click vào ô KingSMP (Slot ID: ${TARGET_SLOT})`)
    
    bot.clickWindow(TARGET_SLOT, 0, 0, (err) => {
      if (err) {
        console.log('[LỖI CLICK MENU]:', err.message)
        bot.chat('/kingsmp')
      } else {
        console.log('=== THÀNH CÔNG: ĐÃ CLICK VÀO KINGSMP! ===')
      }
    })
  })

  // Lắng nghe chat để nhận diện khi đã vào server chính thành công
  bot.on('messagestr', (message) => {
    if (
      message.includes('Đăng nhập thành công') || 
      message.includes('Chuyển máy chủ') || 
      message.includes('KingSMP') ||
      message.includes('Chào mừng')
    ) {
      if (!inGame) {
        console.log('=== XÁC NHẬN: BOT ĐÃ VÀO GAME THÀNH CÔNG! DỪNG CÁC VÒNG LẶP SẢNH. ===')
        inGame = true
        if (loginInterval) clearInterval(loginInterval)
        if (menuInterval) clearInterval(menuInterval)
      }
    }
  })

  bot.on('kicked', (reason) => {
    console.log('Bot bị kick khỏi server. Lý do:', JSON.stringify(reason))
  })

  bot.on('error', (err) => {
    console.log('Lỗi mạng phát sinh:', err.message)
  })

  bot.on('end', () => {
    console.log('Mất kết nối! Đang tự động kết nối lại sau 30 giây...')
    inGame = false
    if (loginInterval) clearInterval(loginInterval)
    if (menuInterval) clearInterval(menuInterval)
    if (afkInterval) clearInterval(afkInterval)
    setTimeout(startBot, 30000)
  })
}

startBot()
