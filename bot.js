const mineflayer = require('mineflayer')

const PASSWORD = 'TrinhHoangYen' 

function startBot() {
  console.log('=== ĐANG KẾT NỐI QUA CỔNG NƯỚC NGOÀI SGP (ĐÃ BẬT VPN)... ===')
  
  const bot = mineflayer.createBot({
    host: 'sgp.kingmc.vn', // Sử dụng lại cổng Singapore khi đã có VPN
    port: 25565,
    username: 'coolgau', 
    version: '1.20.4',
    auth: 'offline',
    connectTimeout: 30000, // Tăng thời gian chờ lên 30 giây cho mạng VPN ổn định
    timeout: 30000
  })

  let afkInterval
  let hasLoggedIn = false

  bot.on('login', () => {
    console.log('=== BOT ONLINE: ĐÃ VƯỢT TƯỜNG LỬA THÀNH CÔNG ===')
  })

  bot.on('spawn', () => {
    if (hasLoggedIn) return
    hasLoggedIn = true

    console.log('=== ĐÃ VÀO SẢNH, CHỜ 4 GIÂY ĐỂ ĐĂNG NHẬP... ===')
    
    setTimeout(() => {
      bot.chat(`/dn ${PASSWORD}`)
      console.log(`[1/3] Đã gửi lệnh: /dn ******`)
      
      setTimeout(() => {
        console.log('[2/3] Đang click chuột phải mở Menu Sảnh...')
        bot.activateItem() 
      }, 3000)

    }, 4000)

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

  bot.on('windowOpen', async (window) => {
    console.log('[3/3] Phát hiện Giao diện Menu đã mở!')
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
      console.log('Không tìm thấy ô KingSMP.')
    }
  })

  bot.on('kicked', (reason) => console.log('Bot bị kick:', reason))
  bot.on('error', (err) => console.log('Lỗi mạng:', err.message))
  bot.on('end', () => {
    console.log('Đang kết nối lại sau 5 giây...')
    hasLoggedIn = false 
    if (afkInterval) clearInterval(afkInterval)
    setTimeout(startBot, 5000)
  })
}

startBot()
