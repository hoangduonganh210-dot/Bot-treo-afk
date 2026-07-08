const mineflayer = require('mineflayer')
const http = require('http')

const PASSWORD = 'TrinhHoangYen' 

// Tạo web server ảo để duy trì hoạt động liên tục trên Render
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
    username: 'HDATHY', 
    version: '1.20.4', 
    auth: 'offline',
    connectTimeout: 60000, 
    timeout: 60000 
  })

  let afkInterval
  let loginInterval
  let hasLoggedIn = false

  bot.on('login', () => {
    console.log('=== TRẠNG THÁI: KẾT NỐI MẠNG THÀNH CÔNG (BOT ONLINE) ===')
  })

  bot.on('spawn', () => {
    if (hasLoggedIn) return
    hasLoggedIn = true

    console.log('=== ĐÃ VÀO SẢNH CHỜ: BẮT ĐẦU ĐĂNG NHẬP AN TOÀN... ===')
    
    // AN TOÀN: Chờ hẳn 4 giây sau khi spawn mới gõ mật khẩu lần đầu (tránh spam gói tin)
    setTimeout(() => {
      bot.chat(`/dn ${PASSWORD}`)
      console.log('-> Đã gửi lệnh đăng nhập lần đầu.')
    }, 4000)

    // Tăng thời gian giãn cách kiểm tra lên 5 giây (thay vì 3 giây) để giảm tần suất gửi lệnh
    loginInterval = setInterval(() => {
      if(!hasLoggedIn) return;
      bot.chat(`/dn ${PASSWORD}`)
    }, 5000)

    // AN TOÀN: Chờ hẳn 10 giây (thay vì 7 giây) để sảnh chính đồng bộ hoàn toàn rồi mới bấm chuột phải mở Menu
    setTimeout(() => {
      if (loginInterval) clearInterval(loginInterval)
      console.log('=== SẢNH ỔN ĐỊNH: BẤM CHUỘT PHẢI MỞ MENU... ===')
      bot.activateItem()
    }, 10000)

    // Chu kỳ Anti-AFK giả lập đi lại nhẹ nhàng chống kick
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

  bot.on('windowOpen', async (window) => {
    console.log('=== MENU ĐÃ MỞ: CHỜ TẢI VẬT PHẨM... ===')
    
    // AN TOÀN: Tăng thời gian chờ lên hẳn 3.5 giây để Custom Head tải xong, tránh bị kẹt ô trống
    await new Promise(resolve => setTimeout(resolve, 3500))

    const TARGET_SLOT = 24 // Ô số 25 trong game (Tính từ số 0)
    
    console.log(`-> Thực hiện click vào ô số 25 (Slot ID: ${TARGET_SLOT})`)
    bot.clickWindow(TARGET_SLOT, 0, 0, (err) => {
      if (err) {
        console.log('[LỖI CLICK]:', err.message)
      } else {
        console.log('=== THÀNH CÔNG: ĐÃ CLICK VÀO Ô 25 ĐỂ VÀO KINGSMP! ===')
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
    console.log('Mất kết nối. Đang tự động kết nối lại sau 40 giây để giải phóng Session...')
    hasLoggedIn = false 
    if (loginInterval) clearInterval(loginInterval)
    if (afkInterval) clearInterval(afkInterval)
    setTimeout(startBot, 40000) // Tăng thời gian kết nối lại lên 40 giây tránh bị tính là DDoS
  })
}

startBot()
