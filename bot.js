const mineflayer = require('mineflayer')
const http = require('http')

// ===================================================
// THÔNG TIN CẤU HÌNH BOT
// ===================================================
const CONFIG = {
  USERNAME: 'coolgau',           // Tên nhân vật
  PASSWORD: 'TrinhHoangYen',      // Mật khẩu đăng nhập (/dn)
  HOST: 'sgp.kingmc.vn',         // IP Server
  PORT_MC: 25565,                // Port Server
  VERSION: '1.20.4',             // Phiên bản Minecraft
  SLOT_TO_CLICK: 24,             // Ô Slot 24 trong Menu
  RECONNECT_DELAY: 15000,       // Thời gian kết nối lại
  WEB_PORT: process.env.PORT || 3000
}

// ===================================================
// WEB SERVER GIỮ BOT ONLINE 24/7 TRÊN RENDER
// ===================================================
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end(`Bot ${CONFIG.USERNAME} đang hoạt động 24/7 trên Render!`)
}).listen(CONFIG.WEB_PORT, () => {
  console.log(`[Render] Web Server đang lắng nghe ở cổng: ${CONFIG.WEB_PORT}`)
})

// ===================================================
// LOGIC KHỞI TẠO VÀ ĐIỀU KHIỂN BOT
// ===================================================
function startBot() {
  console.log(`=== [BƯỚC 1] ĐANG TẠO BOT: ${CONFIG.USERNAME} ===`)

  const bot = mineflayer.createBot({
    host: CONFIG.HOST,
    port: CONFIG.PORT_MC,
    username: CONFIG.USERNAME,
    version: CONFIG.VERSION,
    auth: 'offline',
    connectTimeout: 60000,
    timeout: 60000
  })

  let inGame = false
  let isLoggedIn = false
  let clockInterval = null

  bot.on('login', () => {
    console.log(`=== [BƯỚC 2] ${CONFIG.USERNAME} ĐÃ KẾT NỐI VÀO LOBBY ===`)
  })

  bot.on('spawn', () => {
    if (inGame) return

    console.log('-> Đã spawn tại sảnh. Tiến hành đăng nhập...')

    // Đăng nhập sau 3s spawn
    setTimeout(() => {
      if (!inGame && !isLoggedIn) {
        console.log('=== [BƯỚC 3] GỬI LỆNH ĐĂNG NHẬP ===')
        bot.chat(`/dn ${CONFIG.PASSWORD}`)
      }
    }, 3000)
  })

  // Lắng nghe chat để xác nhận Đăng nhập
  bot.on('messagestr', (message) => {
    console.log('[CHAT SERVER]:', message)

    if (message.includes('Đăng nhập thành công') || message.includes('Bạn đã đăng nhập') || message.includes('thành công')) {
      if (isLoggedIn || inGame) return
      isLoggedIn = true
      console.log('=== ĐÃ ĐĂNG NHẬP THÀNH CÔNG! CHỜ 3S ĐỂ MỞ MENU... ===')

      // Đợi hẳn 3.5 giây cho server ổn định tránh anti-bot kick
      setTimeout(startUsingClock, 3500)
    }
  })

  // Bắt đầu dùng Đồng hồ (có cơ chế thử lại nhẹ nhàng)
  function startUsingClock() {
    if (inGame || bot.currentWindow) return

    if (clockInterval) clearInterval(clockInterval)

    clockInterval = setInterval(() => {
      if (inGame || bot.currentWindow) {
        clearInterval(clockInterval)
        return
      }

      console.log('-> Cầm Đồng hồ (Slot 2) và nhấn chuột phải...')
      try {
        // Nhảy nhẹ 1 cái để bypass anti-bot
        bot.setControlState('jump', true)
        setTimeout(() => bot.setControlState('jump', false), 200)

        // Chọn Slot 2
        bot.setQuickBarSlot(2)

        // Dùng item sau khi đã chuyển slot 0.8s
        setTimeout(() => {
          if (!inGame && !bot.currentWindow) {
            bot.activateItem()
          }
        }, 800)

      } catch (err) {
        console.log('Lỗi thao tác item:', err.message)
      }
    }, 4000) // Thử lại mỗi 4 giây nếu Menu chưa mở
  }

  // BƯỚC 4: BẮT SỰ KIỆN MENU MỞ VÀ CLICK SLOT 24
  bot.on('windowOpen', (window) => {
    if (inGame) return

    if (clockInterval) clearInterval(clockInterval) // Mở được Menu thì dừng bấm Đồng hồ ngay

    console.log(`=== [BƯỚC 4] MENU ĐÃ MỞ: "${window.title || 'GUI'}" ===`)

    // Hàm kiểm tra và click Slot 24
    const tryClickTargetSlot = async () => {
      if (inGame || !bot.currentWindow) return

      const targetItem = window.slots[CONFIG.SLOT_TO_CLICK]
      
      if (targetItem && targetItem.type !== null) {
        const itemName = targetItem.displayName || targetItem.name
        console.log(`=== [ITEM ĐÃ LOAD] Slot ${CONFIG.SLOT_TO_CLICK}: [${itemName}] -> CLICK! ===`)

        try {
          await bot.clickWindow(CONFIG.SLOT_TO_CLICK, 0, 0)
          console.log(`=== [THÀNH CÔNG] ĐÃ CLICK VÀO SLOT ${CONFIG.SLOT_TO_CLICK}! ===`)
        } catch (err) {
          console.error('[LỖI CLICK]:', err.message)
        }
      } else {
        console.log(`-> Slot ${CONFIG.SLOT_TO_CLICK} chưa load item, đang đợi...`)
      }
    }

    // Thử click sau 1.5s
    setTimeout(tryClickTargetSlot, 1500)

    // Bắt sự kiện khi item load vào Slot 24
    window.on('updateSlot', (slot, oldItem, newItem) => {
      if (slot === CONFIG.SLOT_TO_CLICK && newItem) {
        console.log('-> Slot 24 vừa được server gửi item tới!')
        tryClickTargetSlot()
      }
    })
  })

  // Khi chuyển Server thành công
  bot.on('respawn', () => {
    console.log('=== HOÀN TẤT: BOT ĐÃ CHUYỂN SERVER VÀO GAME! ===')
    inGame = true
    if (clockInterval) clearInterval(clockInterval)
  })

  bot.on('end', () => {
    console.log(`Mất kết nối! Sẽ kết nối lại sau ${CONFIG.RECONNECT_DELAY / 1000}s...`)
    inGame = false
    isLoggedIn = false
    if (clockInterval) clearInterval(clockInterval)
    setTimeout(startBot, CONFIG.RECONNECT_DELAY)
  })

  bot.on('error', (err) => console.log('[LỖI BOT]:', err.message))
}

startBot()
