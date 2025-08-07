const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Health check passed',
    timestamp: new Date().toISOString()
  });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log('Try: http://localhost:5001/api/health');
});
