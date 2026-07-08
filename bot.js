const mineflayer = require('mineflayer')
const http = require('http')

const PASSWORD = 'TrinhHoangYen' 

// Tạo web server ảo duy trì hoạt động trên Render
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

    console.log('=== ĐÃ VÀO SẢNH CHỜ: BẮT ĐẦU ĐĂNG NHẬP... ===')
    
    // Gửi lệnh đăng nhập chống kẹt
    bot.chat(`/dn ${PASSWORD}`)
    loginInterval = setInterval(() => {
      if(!hasLoggedIn) return;
      bot.chat(`/dn ${PASSWORD}`)
    }, 3000)

    // Chờ 7 giây để sảnh chính ổn định, sau đó chuột phải mở Menu
    setTimeout(() => {
      if (loginInterval) clearInterval(loginInterval)
      console.log('=== TIẾN HÀNH BẤM CHUỘT PHẢI MỞ MENU... ===')
      bot.activateItem()
    }, 7000)

    // Chu kỳ Anti-AFK chủ động đi lại
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
    }, 20000) 
  })

  // NÂNG CẤP CHÍNH: Xử lý click ô số 25 an toàn chống kẹt
  bot.on('windowOpen', async (window) => {
    console.log('=== MENU ĐÃ MỞ: ĐANG ĐỒNG BỘ VẬT PHẨM... ===')
    
    // Tăng thời gian chờ lên 2.5 giây để server gửi đầy đủ dữ liệu Custom Head về bot
    await new Promise(resolve => setTimeout(resolve, 2500))

    // Ô số 25 tính từ góc trái trên xuống tương đương Slot ID = 24 trong code
    const TARGET_SLOT = 24 
    
    // Kiểm tra xem ô đó có vật phẩm thực tế chưa
    const itemInSlot = window.slots[TARGET_SLOT]

    if (itemInSlot) {
      console.log(`-> Đã phát hiện vật phẩm [${itemInSlot.name}] tại ô số 25. Tiến hành Click ngay!`)
      
      // Giả lập click chuột trái (button: 0, mode: 0)
      bot.clickWindow(TARGET_SLOT, 0, 0, (err) => {
        if (err) {
          console.log('[LỖI CLICK]:', err.message)
        } else {
          console.log('=== THÀNH CÔNG: ĐÃ CLICK VÀO Ô 25 ĐỂ VÀO KINGSMP! ===')
        }
      })
    } else {
      console.log('⚠️ CẢNH BÁO: Ô số 25 đang trống rỗng (chưa kịp load vật phẩm). Ép lệnh click cưỡng bức...')
      // Nếu trống, bot vẫn bấm đại vào ô đó phòng trường hợp ẩn item hiển thị
      bot.clickWindow(TARGET_SLOT, 0, 0)
    }
  })

  bot.on('kicked', (reason) => {
    console.log('Bot bị kick khỏi server. Lý do:', JSON.stringify(reason))
  })

  bot.on('error', (err) => {
    console.log('Lỗi mạng phát sinh:', err.message)
  })

  bot.on('end', () => {
    console.log('Mất kết nối. Đang tự động kết nối lại sau 30 giây...')
    hasLoggedIn = false 
    if (loginInterval) clearInterval(loginInterval)
    if (afkInterval) clearInterval(afkInterval)
    setTimeout(startBot, 30000) 
  })
}

startBot()
