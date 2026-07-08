const mineflayer = require('mineflayer')
const http = require('http')

// Mật khẩu chính xác của bạn
const PASSWORD = 'TrinhHoangYen' 

// BẮT BUỘC CHO RENDER: Tạo một server web ảo để Render không quét lỗi tắt bot
const PORT = process.env.PORT || 3000
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Bot AFK dang hoat dong binh thuong!')
}).listen(PORT, () => {
  console.log(`[Render] Web server mo tren cong ${PORT}`)
})

function startBot() {
  console.log('=== TRẠNG THÁI: ĐANG KẾT NỐI TỚI SERVER... ===')
  
  const bot = mineflayer.createBot({
    host: 'sgp.kingmc.vn', 
    port: 25565,
    username: 'HDATHY', // ĐÃ ĐỔI: Tên tài khoản mới của bot
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

    console.log('=== ĐÃ VÀO SẢNH CHỜ: BẮT ĐẦU ĐĂNG NHẬP... ===')
    
    // Đăng nhập an toàn sau 4 giây
    setTimeout(() => {
      bot.chat(`/dn ${PASSWORD}`)
      console.log('-> Đã gửi lệnh đăng nhập lần đầu.')
    }, 4000)

    // Nhắc lại lệnh đăng nhập phòng lag
    loginInterval = setInterval(() => {
      if(!hasLoggedIn || menuOpened) return;
      bot.chat(`/dn ${PASSWORD}`)
    }, 5000)

    // Chờ 10 giây để sảnh chính tải xong thế giới
    setTimeout(() => {
      if (loginInterval) clearInterval(loginInterval)
      console.log('=== SẢNH ỔN ĐỊNH: TIẾN HÀNH MỞ MENU CHỌN SERVER... ===')
      
      bot.activateItem() 
      bot.chat('/menu')
      bot.chat('/server')

      // Vòng lặp kiểm tra: Cứ mỗi 5 giây nếu thấy Menu chưa mở, bot sẽ tự gõ lại lệnh để kích hoạt
      menuInterval = setInterval(() => {
        if (!menuOpened && hasLoggedIn) {
          console.log('⚠️ Phát hiện Menu chưa mở thành công, đang thử gõ lại lệnh kích hoạt...');
          bot.activateItem()
          bot.chat('/menu')
          bot.chat('/server')
        }
      }, 5000)

    }, 10000)

    // Chu kỳ AFK chủ động giả lập đi lại
    if (afkInterval) clearInterval(afkInterval)
    afkInterval = setInterval(() => {
      if (!bot.entity) return
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 500)
      
      const yaw = Math.random() * Math.PI * 2
      const pitch = (Math.random() - 0.5) * Math.PI * 0.5
      bot.look(yaw, pitch)

      bot.setControlState('forward', true)
      setTimeout(() => {
        bot.setControlState('forward', false)
        bot.setControlState('back', true)
        setTimeout(() => bot.setControlState('back', false), 600)
      }, 600)
    }, 25000) 
  })

  // Xử lý khi Giao diện rương (Menu) được kích hoạt thành công
  bot.on('windowOpen', async (window) => {
    menuOpened = true
    if (menuInterval) clearInterval(menuInterval)
    
    console.log('=== THÀNH CÔNG: MENU ĐÃ MỞ! ĐANG CHỜ TẢI VẬT PHẨM... ===')
    
    // Chờ ổn định 3.5 giây để tránh lỗi click vào ô trống rỗng
    await new Promise(resolve => setTimeout(resolve, 3500))

    const TARGET_SLOT = 24 // Ô số 25 trong game (Tính từ số 0)
    
    console.log(`-> Thực hiện click chuột trái vào ô số 25 (Slot ID: ${TARGET_SLOT})`)
    
    bot.clickWindow(TARGET_SLOT, 0, 0, (err) => {
      if (err) {
        console.log('[LỖI CLICK]:', err.message)
        bot.chat('/server kingsmp')
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
    console.log('Mất kết nối. Đang tự động kết nối lại sau 40 giây...')
    hasLoggedIn = false 
    menuOpened = false
    if (loginInterval) clearInterval(loginInterval)
    if (menuInterval) clearInterval(menuInterval)
    if (afkInterval) clearInterval(afkInterval)
    setTimeout(startBot, 40000) 
  })
}

startBot()
