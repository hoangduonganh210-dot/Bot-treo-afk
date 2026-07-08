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
      
      // BƯỚC 2: Chờ 4 giây đăng nhập xong, click chuột phải luôn vì đồng hồ đã cầm sẵn trên tay
      setTimeout(() => {
        console.log('[2/3] Thực hiện bấm chuột phải vào Đồng hồ trên tay để mở Menu...');
        
        // Kích hoạt vật phẩm đang cầm trên tay (Chuột phải)
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
    console.log('[3/3] Giao diện Menu đã mở. Đang tìm kiếm cụm KingSMP...')
    
    // Chờ 1 giây để giao diện đồng bộ vật phẩm ổn định
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Tìm ô chứa khối Đất nung đỏ (red_terracotta) hoặc có tên chứa chữ "King"
    const slotToClick = window.slots.find(item => {
      if (!item) return false
      
      const isRedTerracotta = item.name.includes('red_terracotta') || item.name.includes('hardened_clay')
      const hasKingSMPName = item.customName && item.customName.includes('King')
      
      return isRedTerracotta || hasKingSMPName
    })

    if (slotToClick) {
      console.log(`-> Tìm thấy cụm KingSMP tại ô số: ${slotToClick.slot}. Tiến hành Click!`)
      
      // Click chuột trái vào ô vật phẩm đó để vào cụm
      bot.clickWindow(slotToClick.slot, 0, 0, (err) => {
        if (err) console.log('Lỗi khi click vào Menu:', err.message)
        else console.log('=== CHÚC MỪNG: BOT ĐÃ CLICK VÀO CỔNG KINGSMP THÀNH CÔNG! ===')
      })
    } else {
      console.log('Không tìm thấy biểu tượng KingSMP trong Menu. Thử gõ lệnh khẩn cấp...')
      bot.chat('/server kingsmp')
    }
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
