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
    host: 'sgp.kingmc.vn', // Sử dụng cổng kết nối quốc tế tốt nhất cho Render
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
    
    // BƯỚC 1: Chờ sảnh ổn định 5 giây rồi tự động gõ /dn
    setTimeout(() => {
      bot.chat(`/dn ${PASSWORD}`)
      console.log(`[1/2] Đã gửi lệnh đăng nhập: /dn ******`)
      
      // BƯỚC 2: Chờ tiếp 4 giây để đăng nhập hoàn tất, gõ lệnh chuyển thẳng cụm KingSMP
      setTimeout(() => {
        console.log('[2/2] Đang gửi lệnh di chuyển thẳng vào cụm KingSMP...')
        bot.chat('/server kingsmp')
        console.log('=== CHÚC MỪNG: BOT ĐÃ GỬI LỆNH VÀO SERVER KINGSMP! ===')
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

  bot.on('kicked', (reason) => {
    console.log('Bot bị kick khỏi server. Chi tiết:', reason)
  })

  bot.on('error', (err) => {
    console.log('Lỗi hệ thống mạng:', err.message)
  })

  bot.on('end', () => {
    // Đã chỉnh lên 30 giây để server kịp xóa phiên đăng nhập cũ, sửa lỗi trùng lặp proxy
    console.log('Mất kết nối với server. Đang tự động kết nối lại sau 30 giây để giải phóng Session...')
    hasLoggedIn = false 
    if (afkInterval) clearInterval(afkInterval)
    setTimeout(startBot, 30000) 
  })
}

startBot()
