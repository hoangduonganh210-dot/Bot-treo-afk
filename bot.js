// Xử lý khi Menu Chest mở ra
  bot.on('windowOpen', async (window) => {
    if (inGame) return
    console.log('=== MENU ĐÃ MỞ! CHỜ 1.5 GIÂY ĐỂ TẢI ITEM... ===')
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Ô KingSMP nằm ở Hàng 3, Cột 6 (Slot ID = 23)
    const TARGET_SLOT = 23 
    
    console.log(`-> Tiến hành click chuột trái vào ô KingSMP (Slot ID: ${TARGET_SLOT})`)
    
    bot.clickWindow(TARGET_SLOT, 0, 0, (err) => {
      if (err) {
        console.log('[LỖI CLICK MENU]:', err.message)
        bot.chat('/kingsmp') // Lệnh dự phòng nếu click tay lỗi
      } else {
        console.log('=== THÀNH CÔNG: ĐÃ CLICK VÀO KINGSMP! ===')
        inGame = true 
        if (loginInterval) clearInterval(loginInterval)
        if (menuInterval) clearInterval(menuInterval)
      }
    })
  })
