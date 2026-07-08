const mineflayer = require('mineflayer')

// !!! ĐIỀN MẬT KHẨU CỦA BẠN VÀO ĐÂY !!!
const PASSWORD = 'TrinhHoangYen' 

function startBot() {
  console.log('=== ĐANG KẾT NỐI QUA CỔNG SERVER... ===')
  
  const bot = mineflayer.createBot({
    host: 'sgp.kingmc.vn',
    port: 25565,
    username: 'coolgau', 
    version: '1.20.4',
    auth: 'offline',
    connectTimeout: 30000,
    timeout: 30000
  })

  let afkInterval
  let menuClickInterval // Vòng lặp bấm chuột phải cho đến khi mở được menu
  let hasLoggedIn = false

  bot.on('login', () => {
    console.log('=== BOT ONLINE: ĐÃ VƯỢT TƯỜNG LỬA THÀNH CÔNG ===')
  })

  bot.on('spawn', () => {
    if (hasLoggedIn) return
    hasLoggedIn = true

    console.log('=== ĐÃ VÀO SẢNH, CHỜ 4 GIÂY ĐỂ ĐĂNG NHẬP... ===')
    
    // BƯỚC 1: Tự động gõ lệnh /dn
    setTimeout(() => {
      bot.chat(`/dn ${TrinhHoangYen}`)
      console.log(`[1/3] Đã gửi lệnh: /dn TrinhHoangYen`)
      
      // BƯỚC 2: Chờ tiếp 4 giây sau khi đăng nhập rồi tiến hành bấm chuột phải liên tục
      setTimeout(() => {
        console.log('[2/3] Bắt đầu chu kỳ quét hotbar và click chuột phải mở Menu...')
        
        if (menuClickInterval) clearInterval(menuClickInterval)
        
        menuClickInterval = setInterval(() => {
          // Tìm vật phẩm bất kỳ trong 9 ô hotbar (từ ô số 36 đến 44) để cầm lên tay
          for (let i = 36; i < 45; i++) {
            const item = bot.inventory.slots[i]
            if (item) {
              bot.setQuickBarSlot(i - 36) // Cầm vật phẩm đó lên tay
              break
            }
          }
          
          // Thực hiện hành động chuột phải
          bot.activateItem() 
        }, 3000) // Cứ mỗi 3 giây bấm chuột phải 1 lần cho chắc chắn

      }, 4000)

    }, 4000)

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

  // BƯỚC 3: Tự động tìm và click vào ô "KingSMP" dựa trên Tên hoặc Mô tả (Lore)
  bot.on('windowOpen', async (window) => {
    console.log('[3/3] Phát hiện Giao diện Menu đã mở!')
    
    // Hủy bỏ vòng lặp bấm chuột phải ngay khi menu đã mở thành công
    if (menuClickInterval) {
      clearInterval(menuClickInterval)
      menuClickInterval = null
    }
    
    // Đợi 500ms để menu tải đầy đủ dữ liệu từ server
    await new Promise(resolve => setTimeout(resolve, 500))

    const items = window.containerItems()
    let targetSlot = null

    for (const item of items) {
      let name = item.displayName ? item.displayName.toLowerCase() : ''
      let lore = ''
      
      if (item.nbt && item.nbt.value && item.nbt.value.display && item.nbt.value.display.value.Lore) {
        try {
          lore = JSON.stringify(item.nbt.value.display.value.Lore.value).toLowerCase()
        } catch (e) {
          lore = ''
        }
      }

      name = name.replace(/§[0-9a-fk-or]/g, '')
      lore = lore.replace(/§[0-9a-fk-or]/g, '')

      if (name.includes('kingsmp') || lore.includes('kingsmp')) {
        targetSlot = item.slot
        break
      }
    }

    if (targetSlot !== null) {
      console.log(`-> Tìm thấy biểu tượng KingSMP ở ô số: ${targetSlot}. Đang click...`)
      try {
        await bot.clickWindow(targetSlot, 0, 0)
        console.log('=== CHÚC MỪNG: BOT ĐÃ VÀO SERVER KINGSMP THÀNH CÔNG! ===')
      } catch (err) {
        console.log('Lỗi khi tương tác Menu:', err.message)
      }
    } else {
      console.log('Xảy ra lỗi: Không tìm thấy chữ "kingsmp" trong Menu.')
    }
  })

  bot.on('kicked', (reason) => console.log('Bot bị kick:', reason))
  bot.on('error', (err) => console.log('Lỗi mạng:', err.message))
  bot.on('end', () => {
    console.log('Đang kết nối lại sau 5 giây...')
    hasLoggedIn = false 
    if (afkInterval) clearInterval(afkInterval)
    if (menuClickInterval) clearInterval(menuClickInterval)
    setTimeout(startBot, 5000)
  })
}

startBot()
