const mineflayer = require('mineflayer')

// !!! ĐIỀN MẬT KHẨU CỦA BẠN VÀO ĐÂY !!!
const PASSWORD = 'TrinhHoangYen' 

function startBot() {
  console.log('=== ĐANG KẾT NỐI QUA CỔNG SERVER... ===')
  
  const bot = mineflayer.createBot({
    host: 'sgp.kingmc.vn', // Cổng SGP dành cho kết nối quốc tế từ GitHub
    port: 25565,
    username: 'coolgau', 
    version: '1.20.4',
    auth: 'offline',
    connectTimeout: 45000, // Tăng lên 45 giây cho thoải mái thời gian handshake mạng
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
    
    // BƯỚC 1: Chờ hẳn 5 giây để map load xong hoàn toàn rồi mới gửi lệnh đăng nhập
    setTimeout(() => {
      bot.chat(`/dn ${PASSWORD}`)
      console.log(`[1/2] Đã gửi lệnh đăng nhập: /dn ******`)
      
      // BƯỚC 2: Chờ tiếp 4 giây để hệ thống sảnh chuyển bạn vào trạng thái đăng nhập xong
      // Sau đó gõ lệnh trực tiếp để chuyển thẳng sang cụm KingSMP mà không cần bấm chuột phải
      setTimeout(() => {
        console.log('[2/2] Đang gửi lệnh di chuyển thẳng vào cụm KingSMP...')
        bot.chat('/server kingsmp')
        console.log('=== CHÚC MỪNG: BOT ĐÃ GỬI LỆNH VÀO SERVER KINGSMP! ===')
      }, 4000)

    }, 5000)

    // Khởi động vòng lặp AFK chống bị server kick (Nhảy + Xoay người)
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
    console.log('Bot bị kick hoặc từ chối kết nối. Chi tiết lỗi từ server:')
    console.log(reason)
  })

  bot.on('error', (err) => {
    console.log('Lỗi hệ thống mạng:', err.message)
  })

  bot.on('end', () => {
    console.log('Mất kết nối với server. Đang tự động kết nối lại sau 10 giây...')
    hasLoggedIn = false 
    if (afkInterval) clearInterval(afkInterval)
    setTimeout(startBot, 30000) // Tăng thời gian chờ kết nối lại lên 10 giây để tránh bị firewall quét spam IP
  })
}

startBot()
