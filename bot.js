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

  bot.on('login', () => {
    console.log(`=== [BƯỚC 2] ${CONFIG.USERNAME} ĐÃ KẾT NỐI VÀO LOBBY ===`)
  })

  bot.on('spawn', () => {
    if (inGame) return

    console.log('-> Đã spawn tại sảnh. Tiến hành đăng nhập...')

    // Tự động đăng nhập sau 2.5s spawn
    setTimeout(() => {
      if (!inGame && !isLoggedIn) {
        console.log('=== [BƯỚC 3] GỬI LỆNH ĐĂNG NHẬP ===')
        bot.chat(`/dn ${CONFIG.PASSWORD}`)
      }
    }, 2500)
  })

  // Lắng nghe chat để xác nhận Đăng nhập
  bot.on('messagestr', (message) => {
    console.log('[CHAT SERVER]:', message)

    if (message.includes('Đăng nhập thành công') || message.includes('Bạn đã đăng nhập') || message.includes('thành công')) {
      if (isLoggedIn || inGame) return
      isLoggedIn = true
      console.log('=== ĐÃ ĐĂNG NHẬP THÀNH CÔNG! BẮT ĐẦU MỞ MENU... ===')

      setTimeout(openMenuWithClock, 1500)
    }
  })

  // Hàm cầm Đồng hồ mở Menu
  function openMenuWithClock() {
    if (inGame) return

    console.log('-> Cầm Đồng hồ (Slot 2) và nhấn chuột phải...')
    try {
      bot.setQuickBarSlot(2)
      
      setTimeout(() => {
        bot.activateItem()
      }, 500)
    } catch (err) {
      console.log('Lỗi cầm item:', err.message)
    }
  }

  // BƯỚC 4: LẮNG NGHE KHI ITEM TRONG MENU LOAD XONG RỒI MỚI CLICK
  bot.on('windowOpen', (window) => {
    if (inGame) return

    console.log(`=== [BƯỚC 4] MENU ĐÃ MỞ: "${window.title || 'GUI'}" ===`)

    // Hàm thực hiện click khi item ở slot 24 sẵn sàng
    const tryClickTargetSlot = async () => {
      if (inGame || !bot.currentWindow) return

      const targetItem = window.slots[CONFIG.SLOT_TO_CLICK]
      
      // Nếu Slot 24 đã có item (Không phải ô trống)
      if (targetItem && targetItem.type !== null) {
        const itemName = targetItem.displayName || targetItem.name
        console.log(`=== [ITEM ĐÃ LOAD] Slot ${CONFIG.SLOT_TO_CLICK}: [${itemName}] -> THỰC HIỆN CLICK! ===`)

        try {
          await bot.clickWindow(CONFIG.SLOT_TO_CLICK, 0, 0)
          console.log(`=== [THÀNH CÔNG] ĐÃ CLICK VÀO SLOT ${CONFIG.SLOT_TO_CLICK}! ===`)
        } catch (err) {
          console.error('[LỖI CLICK]:', err.message)
        }
      } else {
        console.log(`-> Slot ${CONFIG.SLOT_TO_CLICK} vẫn đang trống, tiếp tục chờ Server gửi item...`)
      }
    }

    // 1. Thử kiểm tra và click ngay sau khi mở 1 giây
    setTimeout(tryClickTargetSlot, 1000)

    // 2. Nếu server load item chậm, bắt sự kiện updateSlot khi item vừa được gửi đến Slot 24
    window.on('updateSlot', (slot, oldItem, newItem) => {
      if (slot === CONFIG.SLOT_TO_CLICK && newItem) {
        console.log('-> Phát hiện Slot 24 vừa được cập nhật item từ Server!')
        tryClickTargetSlot()
      }
    })
  })

  // Khi chuyển Server thành công
  bot.on('respawn', () => {
    console.log('=== HOÀN TẤT: BOT ĐÃ CHUYỂN SERVER VÀO GAME! ===')
    inGame = true
  })

  bot.on('end', () => {
    console.log(`Mất kết nối! Sẽ kết nối lại sau ${CONFIG.RECONNECT_DELAY / 1000}s...`)
    inGame = false
    isLoggedIn = false
    setTimeout(startBot, CONFIG.RECONNECT_DELAY)
  })

  bot.on('error', (err) => console.log('[LỖI BOT]:', err.message))
}

startBot()
