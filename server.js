const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_KEY = (process.env.SUPABASE_KEY || '').trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TABLE = 'pawndata';

async function dbGet(key) {
  const { data, error } = await supabase.from(TABLE).select('value').eq('key', key).single();
  if (error || !data) return null;
  return data.value;
}

async function dbSet(key, value) {
  const { error } = await supabase.from(TABLE).upsert({ key, value }, { onConflict: 'key' });
  if (error) throw new Error(error.message);
}

// 读取数据
app.get('/api/data', async (req, res) => {
  try {
    const orders = await dbGet('beauty_orders') || [];
    const clinics = await dbGet('beauty_clinics') || [];
    res.json({ orders, clinics });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 保存数据
app.post('/api/data', async (req, res) => {
  try {
    const { orders, clinics } = req.body;
    if (orders !== undefined) await dbSet('beauty_orders', orders);
    if (clinics !== undefined) await dbSet('beauty_clinics', clinics);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 测试连接
app.get('/api/test', async (req, res) => {
  try {
    const { data, error } = await supabase.from(TABLE).select('key').limit(1);
    if (error) return res.json({ ok: false, message: error.message });
    res.json({ ok: true, message: '数据库连接正常' });
  } catch (e) {
    res.json({ ok: false, message: e.message });
  }
});

// 备份
app.get('/api/backup', async (req, res) => {
  try {
    const orders = await dbGet('beauty_orders') || [];
    const clinics = await dbGet('beauty_clinics') || [];
    res.setHeader('Content-Disposition', `attachment; filename="beauty_backup_${new Date().toISOString().slice(0,10)}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ orders, clinics }, null, 2));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  💄 MORODOK 医美贷款管理系统`);
  console.log(`${'═'.repeat(50)}`);
  console.log(`  访问地址: http://localhost:${PORT}`);
  console.log(`${'═'.repeat(50)}\n`);
});
