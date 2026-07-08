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
  console.log('=== TRẠNG THÁI: ĐANG KẾT NỐI TỚI SERVER... ===')
  
  const bot = mineflayer.createBot({
    host: 'sgp.kingmc.vn', 
    port: 25565,
    username: 'coolgau', 
    version: '1.20.4', 
    auth: 'offline',
    connectTimeout: 60000, 
    timeout: 60000 // Tăng timeout lên 60 giây tránh bị out khi server chuyển cụm lag
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

    console.log('=== ĐÃ VÀO SẢNH CHỜ: BẮT ĐẦU ĐĂNG NHẬP... ===')
    
    // Gửi lệnh đăng nhập chống kẹt
    bot.chat(`/dn ${PASSWORD}`)
    loginInterval = setInterval(() => {
      if(!hasLoggedIn) return;
      bot.chat(`/dn ${PASSWORD}`)
    }, 3000)

    // Chờ 7 giây để tải xong hoàn toàn sảnh chính, sau đó click chuột phải mở Menu
    setTimeout(() => {
      if (loginInterval) clearInterval(loginInterval)
      console.log('=== TIẾN HÀNH BẤM CHUỘT PHẢI MỞ MENU... ===')
      bot.activateItem()
    }, 7000)

    // NÂNG CẤP: Chu kỳ Anti-AFK chủ động (Giả lập người thật đi lại)
    if (afkInterval) clearInterval(afkInterval)
    afkInterval = setInterval(() => {
      if (!bot.entity) return

      // Hành động 1: Nhảy lên tại chỗ
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 500)
      
      // Hành động 2: Xoay camera ngẫu nhiên
      const yaw = Math.random() * Math.PI * 2
      const pitch = (Math.random() - 0.5) * Math.PI * 0.5
      bot.look(yaw, pitch)

      // NÂNG CẤP CHÍNH: Ép bot di chuyển tiến/lùi để thay đổi tọa độ khối (Qua mặt Anti-AFK)
      bot.setControlState('forward', true)
      setTimeout(() => {
        bot.setControlState('forward', false)
        bot.setControlState('back', true)
        setTimeout(() => bot.setControlState('back', false), 600)
      }, 600)

    }, 20000) // Rút ngắn thời gian xuống 20 giây một lần để tăng độ nhạy liên tục
  })

  // Lắng nghe sự kiện mở giao diện rương để click ô số 25
  bot.on('windowOpen', async (window) => {
    console.log('=== MENU ĐÃ MỞ: CHUẨN BỊ CLICK VÀO Ô SỐ 25 ===')
    await new Promise(resolve => setTimeout(resolve, 1500))

    const TARGET_SLOT = 24 // Ô số 25 trong game (Tính từ 0)
    
    bot.clickWindow(TARGET_SLOT, 0, 0, (err) => {
      if (err) console.log('[LỖI CLICK]:', err.message)
      else console.log('=== THÀNH CÔNG: ĐÃ CLICK VÀO Ô 25 ĐỂ VÀO KINGSMP! ===')
    })
  })

  bot.on('kicked', (reason) => {
    console.log('Bot bị kick khỏi server. Lý do:', JSON.stringify(reason))
  })

  bot.on('error', (err) => {
    console.log('Lỗi mạng phát sinh:', err.message)
  })

  bot.on('end', () => {
    console.log('Mất kết nối. Đang giải phóng Session và tự động kết nối lại sau 30 giây...')
    hasLoggedIn = false 
    if (loginInterval) clearInterval(loginInterval)
    if (afkInterval) clearInterval(afkInterval)
    setTimeout(startBot, 30000) // Giữ nguyên 30 giây để tránh bị kick do spam đăng nhập
  })
}

startBot()
