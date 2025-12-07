
// Mobile AI - Screen Context Broadcasting
io.on('connection', (socket) => {
  console.log('📱 Mobile client connected:', socket.id);

  socket.on('mobile-ai:subscribe', () => {
    console.log('📱 Mobile AI subscribed');
    socket.join('mobile-ai');
    
    // Send initial context
    socket.emit('screen:context', {
      page: 'Dashboard',
      action: null,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    console.log('📱 Mobile client disconnected');
  });
});

// Broadcast screen context changes
app.post('/api/screen-context', (req, res) => {
  const { page, action } = req.body;
  io.to('mobile-ai').emit('screen:context', {
    page,
    action,
    timestamp: Date.now()
  });
  res.json({ success: true });
});

