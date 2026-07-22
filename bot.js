const mineflayer = require('mineflayer')
const http = require('http')

const PASSWORD = 'bill1906' 

// Tạo web server ảo cho Render duy trì hoạt động
const PORT = process.env.PORT || 3000
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Bot AFK dang hoat dong binh thuong!')
}).listen(PORT, () => {
  console.log(`[Render] Web server mo tren cong ${PORT}`)
})

function startBot() {
  console.log('=== TRẠNG THÁI: ĐANG KẾT NỐI TỚI SERVER VỚI TÊN HDATHY... ===')
  
  const bot = mineflayer.createBot({
    host: 'sgp.kingmc.vn', 
    port: 25565,
    username: 'Zwetvn1808', // ĐÃ ĐỔI THÀNH TÊN COOLGAU THEO YÊU CẦU
    version: '1.20.4', 
    auth: 'offline',
    connectTimeout: 60000, 
    timeout: 60000 
  })

  let afkInterval
  let loginInterval
  let menuInterval
  let hasLoggedIn = false
  let menuOpened = false

  bot.on('login', () => {
    console.log('=== TRẠNG THÁI: KẾT NỐI MẠNG THÀNH CÔNG (BOT ONLINE) ===')
  })

  bot.on('spawn', () => {
    if (hasLoggedIn) return
    hasLoggedIn = true
    menuOpened = false

    console.log('=== ĐÃ VÀO SẢNH CHỜ: BẮT ĐẦU ĐĂNG NHẬP AN TOÀN... ===')
    
    // Đăng nhập thong thả sau 5 giây để tránh bị Anti-bot quét tốc độ
    setTimeout(() => {
      bot.chat(`/dn ${PASSWORD}`)
      console.log('-> Đã gửi lệnh đăng nhập lần đầu.')
    }, 5000)

    // Giãn cách thời gian nhắc lại lệnh đăng nhập lên 6 giây an toàn
    loginInterval = setInterval(() => {
      if(!hasLoggedIn || menuOpened) return;
      bot.chat(`/dn ${PASSWORD}`)
    }, 6000)

    // Chờ hẳn 12 giây để sảnh chính đồng bộ hoàn toàn rồi mới kích hoạt Menu
    setTimeout(() => {
      if (loginInterval) clearInterval(loginInterval)
      console.log('=== SẢNH ỔN ĐỊNH: ÉP LỆNH MỞ MENU CHỌN SERVER... ===')
      
      bot.activateItem() 
      bot.chat('/menu')
      bot.chat('/server')

      // Kiểm tra định kỳ mỗi 6 giây nếu Menu lỗi chưa mở thì gửi lại lệnh
      menuInterval = setInterval(() => {
        if (!menuOpened && hasLoggedIn) {
          console.log('⚠️ Menu chưa mở, đang gửi lại lệnh kích hoạt...');
          bot.activateItem()
          bot.chat('/menu')
        }
      }, 6000)

    }, 12000)

    // NÂNG CẤP: Chu kỳ Anti-AFK nâng cao (Di chuyển đổi góc 90 độ thực tế)
    if (afkInterval) clearInterval(afkInterval)
    afkInterval = setInterval(() => {
      if (!bot.entity) return
      
      // 1. Nhảy lên
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 400)
      
      // 2. Đi tiến 0.8 giây
      bot.setControlState('forward', true)
      setTimeout(() => {
        bot.setControlState('forward', false)
        
        // Xoay góc nhìn sang phải 90 độ ngẫu nhiên
        const yaw = bot.entity.yaw + (Math.PI / 2) * (Math.random() > 0.5 ? 1 : -1)
        bot.look(yaw, 0, true)
        
        // 3. Đi ngang (sang phải hoặc trái) để dịch chuyển vị trí thực tế trên block
        bot.setControlState('right', true)
        setTimeout(() => {
          bot.setControlState('right', false)
        }, 700)
      }, 800)

    }, 25000) // 25 giây thực hiện một chuỗi di chuyển thật
  })

  // Xử lý click ô số 25 khi Menu mở
  bot.on('windowOpen', async (window) => {
    menuOpened = true
    if (menuInterval) clearInterval(menuInterval)
    
    console.log('=== MENU ĐÃ MỞ! CHỜ 4 GIÂY ĐỂ ĐỒNG BỘ ĐẦU NGƯỜI CHƠI... ===')
    await new Promise(resolve => setTimeout(resolve, 4000))

    const TARGET_SLOT = 24 // Ô số 25 trong game
    
    console.log(`-> Tiến hành click chuột trái vào ô số 25 (Slot ID: ${TARGET_SLOT})`)
    
    bot.clickWindow(TARGET_SLOT, 0, 0, (err) => {
      if (err) {
        console.log('[LỖI CLICK]:', err.message)
        bot.chat('/server kingsmp') // Dự phòng gõ lệnh chat thẳng nếu click lỗi
      } else {
        console.log('=== HOÀN THÀNH: ĐÃ CLICK VÀO Ô 25 ĐỂ VÀO KINGSMP! ===')
      }
    })
  })

  bot.on('kicked', (reason) => {
    console.log('Bot bị kick khỏi server. Lý do:', JSON.stringify(reason))
  })

  bot.on('error', (err) => {
    console.log('Lỗi mạng phát sinh:', err.message)
  })

  bot.on('end', () => {
    console.log('Mất kết nối mạng. Đang tự động kết nối lại sau 45 giây để reset hoàn toàn IP/Session...')
    hasLoggedIn = false 
    menuOpened = false
    if (loginInterval) clearInterval(loginInterval)
    if (menuInterval) clearInterval(menuInterval)
    if (afkInterval) clearInterval(afkInterval)
    setTimeout(startBot, 45000) // Tăng lên 45 giây để tránh bị dính spam rate-limit của cổng game
  })
}

startBot()
