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
  console.log('=== ĐANG KẾT NỐI QUA CỔNG SERVER... ===')
  
  const bot = mineflayer.createBot({
    host: 'sgp.kingmc.vn', 
    port: 25565,
    username: 'coolgau', 
    version: '1.20.4',
    auth: 'offline',
    connectTimeout: 45000,
    timeout: 45000
  })

  let afkInterval
  let hasLoggedIn = false

  bot.on('login', () => {
    console.log('=== BOT ONLINE: KẾT NỐI MẠNG THÀNH CÔNG ===')
  })

  bot.on('spawn', () => {
    if (hasLoggedIn) return
    hasLoggedIn = true

    console.log('=== ĐÃ VÀO SẢNH, CHỜ 5 GIÂY ĐỂ ỔN ĐỊNH BẢN ĐỒ... ===')
    
    // BƯỚC 1: Đăng nhập tài khoản
    setTimeout(() => {
      bot.chat(`/dn ${PASSWORD}`)
      console.log(`[1/3] Đã gửi lệnh đăng nhập: /dn ******`)
      
      // BƯỚC 2: Chờ 4 giây đăng nhập xong, tự động click chuột phải bằng vật phẩm trên tay
      setTimeout(() => {
        console.log('[2/3] Thực hiện bấm chuột phải vào Đồng hồ trên tay để mở Menu...');
        bot.activateItem()
        console.log('-> Đã click chuột phải mở Menu Server!')
      }, 4000)

    }, 5000)

    // Khởi động chu kỳ nhảy AFK chống kick mỗi 30 giây
    if (afkInterval) clearInterval(afkInterval)
    afkInterval = setInterval(() => {
      if (!bot.entity) return
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 500)
      
      const yaw = Math.random() * Math.PI * 2
      const pitch = (Math.random() - 0.5) * Math.PI * 0.5
      bot.look(yaw, pitch)
    }, 30000)
  })

  // BƯỚC 3: Xử lý khi Menu (GUI) được mở ra
  bot.on('windowOpen', async (window) => {
    console.log('[3/3] Giao diện Menu đã mở. Chuẩn bị click vào ô số 25...')
    
    // Chờ 1 giây để Menu load ổn định hoàn toàn
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Ô số 25 trong đếm thông thường tương ứng với Slot ID = 24 trong lập trình (đếm từ 0)
    const TARGET_SLOT = 24 

    console.log(`-> Tiến hành click chuột trái vào ô cố định ID: ${TARGET_SLOT} (Ô thứ 25)`)
    
    // Giả lập click chuột trái (button: 0, mode: 0) vào đúng ô được chỉ định
    bot.clickWindow(TARGET_SLOT, 0, 0, (err) => {
      if (err) {
        console.log('Lỗi khi click vào ô 25:', err.message)
      } else {
        console.log('=== CHÚC MỪNG: BOT ĐÃ CLICK VÀO Ô SỐ 25 THÀNH CÔNG! ===')
      }
    })
  })

  bot.on('kicked', (reason) => {
    console.log('Bot bị kick khỏi server. Chi tiết:', reason)
  })

  bot.on('error', (err) => {
    console.log('Lỗi hệ thống mạng:', err.message)
  })

  bot.on('end', () => {
    console.log('Mất kết nối với server. Đang tự động kết nối lại sau 30 giây để giải phóng Session...')
    hasLoggedIn = false 
    if (afkInterval) clearInterval(afkInterval)
    setTimeout(startBot, 30000) 
  })
}

startBot()
