const mineflayer = require('mineflayer')
const http = require('http')

const PASSWORD = 'TrinhHoangYen' 

// Tạo web server ảo cho Render duy trì hoạt động
const PORT = process.env.PORT || 3000
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Bot AFK dang hoat dong binh thuong!')
}).listen(PORT, () => {
  console.log(`[Render] Web server mo tren cong ${PORT}`)
})

function startBot() {
  console.log('=== TRẠNG THÁI: ĐANG KẾT NỐI TỚI SERVER VỚI TÊN COOLGAU... ===')
  
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
  let isAuthenticated = false // Cờ đánh dấu đã gửi lệnh đăng nhập chưa
  let inGame = false           // Cờ đánh dấu đã vào cụm game chưa

  bot.on('login', () => {
    console.log('=== TRẠNG THÁI: KẾT NỐI MẠNG THÀNH CÔNG (BOT ONLINE) ===')
  })

  bot.on('spawn', () => {
    // Nếu đã vào được cụm game chính rồi thì không chạy lại logic đăng nhập ở sảnh
    if (inGame) return

    console.log('=== ĐÃ VÀO SẢNH CHỜ: BẮT ĐẦU ĐĂNG NHẬP AN TOÀN... ===')
    
    // 1. Gửi lệnh đăng nhập lần đầu sau 2.5 giây
    setTimeout(() => {
      bot.chat(`/dn ${PASSWORD}`)
      console.log('-> Đã gửi lệnh đăng nhập lần 1.')
      isAuthenticated = true
    }, 2500)

    // 2. Nhắc lại lệnh đăng nhập mỗi 4 giây (Phòng trường hợp server bị nuốt lệnh)
    if (loginInterval) clearInterval(loginInterval)
    loginInterval = setInterval(() => {
      if (!inGame) {
        console.log('-> Đang gửi lại lệnh đăng nhập /dn...')
        bot.chat(`/dn ${PASSWORD}`)
      }
    }, 4000)

    // 3. Chờ 7 giây sau khi vào sảnh -> Dùng kết hợp cả Click Item & Gõ thẳng lệnh Server
    setTimeout(() => {
      if (loginInterval) clearInterval(loginInterval) // Dừng lặp đăng nhập
      console.log('=== BẮT ĐẦU CHUYỂN SANG CỤM GAME KINGSMP... ===')
      
      // Mở menu & Gõ lệnh chuyển server trực tiếp
      bot.activateItem() 
      bot.chat('/menu')
      bot.chat('/kingsmp') // Gõ thẳng lệnh dự phòng (Rất nhiều server cho phép gõ thẳng lệnh này)

      // Nếu sau 5s vẫn chưa chuyển server thì kích hoạt lại
      if (menuInterval) clearInterval(menuInterval)
      menuInterval = setInterval(() => {
        if (!inGame) {
          console.log('⚠️ Chưa chuyển được server, đang gửi lại /kingsmp và /menu...');
          bot.activateItem()
          bot.chat('/menu')
          bot.chat('/kingsmp')
        }
      }, 5000)

    }, 7000)

    // 4. Chu kỳ Anti-AFK (Di chuyển xoay góc)
    if (afkInterval) clearInterval(afkInterval)
    afkInterval = setInterval(() => {
      if (!bot.entity) return
      
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 400)
      
      bot.setControlState('forward', true)
      setTimeout(() => {
        bot.setControlState('forward', false)
        const yaw = bot.entity.yaw + (Math.PI / 2) * (Math.random() > 0.5 ? 1 : -1)
        bot.look(yaw, 0, true)
        
        bot.setControlState('right', true)
        setTimeout(() => {
          bot.setControlState('right', false)
        }, 700)
      }, 800)

    }, 25000)
  })

  // Xử lý khi Menu Chest mở ra
  bot.on('windowOpen', async (window) => {
    if (inGame) return
    console.log('=== MENU ĐÃ MỞ! CHỜ 2 GIÂY ĐỂ ĐỒNG BỘ ITEM... ===')
    await new Promise(resolve => setTimeout(resolve, 2000))

    const TARGET_SLOT = 24 // Ô số 25 trong game (Slot ID: 24)
    
    console.log(`-> Tiến hành click vào ô số 25 (Slot ID: ${TARGET_SLOT})`)
    
    bot.clickWindow(TARGET_SLOT, 0, 0, (err) => {
      if (err) {
        console.log('[LỖI CLICK MENU]:', err.message)
        bot.chat('/kingsmp')
      } else {
        console.log('=== ĐÃ CLICK VÀO Ô 25! ===')
        inGame = true // Đánh dấu đã vào game thành công
        if (menuInterval) clearInterval(menuInterval)
      }
    })
  })

  // Nhận diện tin nhắn chat để xác nhận đã vào game hoặc đăng nhập thành công
  bot.on('messagestr', (message) => {
    // console.log('[CHAT]:', message) // Bật dòng này nếu muốn soi chat
    if (message.includes('Đăng nhập thành công') || message.includes('Chuyển máy chủ') || message.includes('KingSMP')) {
      inGame = true
      if (loginInterval) clearInterval(loginInterval)
      if (menuInterval) clearInterval(menuInterval)
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
    isAuthenticated = false 
    inGame = false
    if (loginInterval) clearInterval(loginInterval)
    if (menuInterval) clearInterval(menuInterval)
    if (afkInterval) clearInterval(afkInterval)
    setTimeout(startBot, 30000)
  })
}

startBot()
