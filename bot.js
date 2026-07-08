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
      
      // BƯỚC 2: Chờ 4 giây đăng nhập xong, cầm Đồng hồ trên tay và Chuột phải để mở Menu
      setTimeout(() => {
        console.log('[2/3] Đang chuẩn bị mở Menu bằng vật phẩm...');
        
        // Tìm item Đồng hồ (clock) trong túi đồ
        const menuItem = bot.inventory.items().find(item => item.name.includes('clock'))
        
        if (menuItem) {
          // Cầm đồng hồ lên tay chính
          bot.equip(menuItem, 'hand', (err) => {
            if (err) {
              console.log('Lỗi khi cầm đồng hồ:', err.message)
              return
            }
            // Thực hiện hành động chuột phải vào không khí để mở Menu
            bot.activateItem()
            console.log('-> Đã click chuột phải mở Menu Server!')
          })
        } else {
          // Phòng trường hợp không thấy đồng hồ, bot sẽ tự gõ lệnh thay thế (nếu server hỗ trợ)
          console.log('Không tìm thấy Đồng hồ trong túi đồ, thử gõ /menu hoặc /server...')
          bot.chat('/menu') 
        }
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
    
    // Chờ 1 giây để các vật phẩm trong Menu tải xong hoàn toàn
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Tìm khối đất nung màu đỏ (red_terracotta) hoặc vật phẩm có chứa chữ "King5MP" / "kingsmp" trong mô tả (lore)
    const slotToClick = window.slots.find(item => {
      if (!item) return false
      
      // Cách 1: Tìm theo tên hệ thống của vật phẩm (Khối đất nung đỏ)
      const isRedTerracotta = item.name.includes('red_terracotta') || item.name.includes('hardened_clay')
      
      // Cách 2: Tìm theo thông tin hiển thị (nếu cách 1 thay đổi vật phẩm)
      const hasKingSMPName = item.customName && item.customName.includes('King')
      
      return isRedTerracotta || hasKingSMPName
    })

    if (slotToClick) {
      console.log(`-> Tìm thấy cụm KingSMP tại ô số: ${slotToClick.slot}. Tiến hành Click!`)
      
      // Click chuột trái (button: 0, mode: 0) vào ô vật phẩm đó
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
