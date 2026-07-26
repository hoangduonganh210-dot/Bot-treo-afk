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
  let isMenuOpening = false
  let clockTimeout = null

  bot.on('login', () => {
    console.log(`=== [BƯỚC 2] ${CONFIG.USERNAME} ĐÃ KẾT NỐI VÀO LOBBY ===`)
  })

  bot.on('spawn', () => {
    if (inGame) return

    console.log('-> Đã spawn tại sảnh. Tiến hành đăng nhập...')

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
      console.log('=== ĐÃ ĐĂNG NHẬP THÀNH CÔNG! CHỜ 3S ĐỂ BẤM ĐỒNG HỒ... ===')

      setTimeout(triggerClock, 3000)
    }
  })

  // Hàm bấm Đồng hồ (Đúng 1 lần, chỉ thử lại sau 6s nếu chưa mở được Menu)
  function triggerClock() {
    if (inGame || bot.currentWindow || isMenuOpening) return

    console.log('-> Cầm Đồng hồ (Slot 2) và bấm chuột phải (Duy nhất 1 lần)...')
    isMenuOpening = true

    try {
      bot.setQuickBarSlot(2) // Slot 2 (Ô thứ 3 Hotbar)

      setTimeout(() => {
        if (!inGame && !bot.currentWindow) {
          bot.activateItem()
        }
      }, 500)

      // Hẹn giờ phòng trường hợp bấm trượt, 6 giây sau nếu chưa mở được Menu thì thử lại
      if (clockTimeout) clearTimeout(clockTimeout)
      clockTimeout = setTimeout(() => {
        if (!inGame && !bot.currentWindow) {
          console.log('-> Chưa thấy Menu mở, bấm lại Đồng hồ...')
          isMenuOpening = false
          triggerClock()
        }
      }, 6000)

    } catch (err) {
      console.log('Lỗi dùng item:', err.message)
      isMenuOpening = false
    }
  }

  // BƯỚC 4: BẮT SỰ KIỆN MENU MỜ VÀ CLICK SLOT 24
  bot.on('windowOpen', (window) => {
    if (inGame) return

    isMenuOpening = false
    if (clockTimeout) clearTimeout(clockTimeout) // Hủy ngay lịch bấm lại Đồng hồ!

    console.log(`=== [BƯỚC 4] MENU ĐÃ MỜ THÀNH CÔNG! ===`)

    // Hàm thực hiện click Slot 24
    const doClickSlot = async () => {
      if (inGame || !bot.currentWindow) return

      console.log(`=== THỰC HIỆN CLICK VÀO SLOT ${CONFIG.SLOT_TO_CLICK}... ===`)
      try {
        await bot.clickWindow(CONFIG.SLOT_TO_CLICK, 0, 0)
        console.log(`=== [THÀNH CÔNG] ĐÃ CLICK SLOT ${CONFIG.SLOT_TO_CLICK}! ===`)
      } catch (err) {
        console.error('[LỖI CLICK]:', err.message)
      }
    }

    // Chờ 1.5s cho GUI đồng bộ hoàn toàn rồi click
    setTimeout(doClickSlot, 1500)

    // Bắt thêm sự kiện nếu server load item muộn
    window.on('updateSlot', (slot, oldItem, newItem) => {
      if (slot === CONFIG.SLOT_TO_CLICK && newItem) {
        console.log('-> Slot 24 nhận item mới từ Server!')
        doClickSlot()
      }
    })
  })

  // Khi chuyển Server thành công
  bot.on('respawn', () => {
    console.log('=== HOÀN TẤT: BOT ĐÃ CHUYỂN SERVER VÀO GAME! ===')
    inGame = true
    isMenuOpening = false
    if (clockTimeout) clearTimeout(clockTimeout)
  })

  bot.on('end', () => {
    console.log(`Mất kết nối! Sẽ kết nối lại sau ${CONFIG.RECONNECT_DELAY / 1000}s...`)
    inGame = false
    isLoggedIn = false
    isMenuOpening = false
    if (clockTimeout) clearTimeout(clockTimeout)
    setTimeout(startBot, CONFIG.RECONNECT_DELAY)
  })

  bot.on('error', (err) => console.log('[LỖI BOT]:', err.message))
}

startBot()
