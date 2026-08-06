import { useState, useEffect, useCallback } from 'react';
import {
  Users, Utensils, Dumbbell, TrendingUp, TrendingDown, Activity,
  Search, ChevronLeft, ChevronRight, Crown, BarChart3, Eye,
  LogOut, Shield, RefreshCw, Calendar, Flame, Target, ArrowUpRight,
  ArrowDownRight, Clock, Zap, UserCheck, UserPlus, PieChart, LayoutDashboard
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Legend
} from 'recharts';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/admin';

function api(path, key) {
  return fetch(`${API_BASE}${path}`, {
    headers: { 'x-admin-key': key }
  }).then(r => {
    if (!r.ok) throw new Error(r.status === 401 ? 'unauthorized' : 'api_error');
    return r.json();
  });
}

/* ========== LOGIN ========== */
function LoginScreen({ onLogin }) {
  const [key, setKey] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!key.trim()) return;
    setLoading(true);
    setErr('');
    try {
      await api('/stats', key.trim());
      onLogin(key.trim());
    } catch {
      setErr('Noto\'g\'ri admin kalit. Qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 380, background: 'var(--bg-card)', borderRadius: 24, padding: 40, border: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--neon-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Shield size={32} color="var(--neon)" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>ZenFit Admin Panel</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>Admin kalitni kiriting</p>
        <input
          type="password" placeholder="Admin Secret Key..."
          value={key} onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ width: '100%', marginBottom: 14 }}
        />
        {err && <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>{err}</p>}
        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', padding: '12px 0', borderRadius: 14, border: 'none', background: 'var(--neon)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Tekshirilmoqda...' : 'Kirish'}
        </button>
      </div>
    </div>
  );
}

/* ========== STAT CARD ========== */
function StatCard({ icon: Icon, label, value, sub, color = 'var(--neon)', dimColor = 'var(--neon-dim)' }) {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 20, border: '1px solid var(--border)', flex: 1, minWidth: 200 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: dimColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={22} color={color} />
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
          <p style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', lineHeight: 1.1, marginTop: 2 }}>{value}</p>
          {sub && <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{sub}</p>}
        </div>
      </div>
    </div>
  );
}

/* ========== CHART COLORS ========== */
const CHART_COLORS = ['#CCFF00', '#22d3ee', '#f59e0b', '#a78bfa', '#ef4444', '#10b981', '#f472b6'];
const chartTooltipStyle = { contentStyle: { background: '#1a1a28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, color: '#f0f0f5' } };

/* ========== DASHBOARD ========== */
function Dashboard({ adminKey }) {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([api('/stats', adminKey), api('/activity', adminKey)]);
      setStats(s);
      setActivity(a);
    } catch { }
    setLoading(false);
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  if (loading || !stats) return <LoadingState />;

  const goalData = (stats.goalDistribution || []).map(g => ({ name: g.goal || 'N/A', value: g.count }));
  const genderData = (stats.genderDistribution || []).map(g => ({ name: g.gender === 'male' ? 'Erkak' : g.gender === 'female' ? 'Ayol' : g.gender || 'N/A', value: g.count }));
  const fitnessData = (stats.fitnessLevelDistribution || []).map(g => ({ name: g.fitness_level || 'N/A', value: g.count }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Dashboard</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>ZenFit platformasi umumiy ko'rsatkichlari</p>
        </div>
        <button onClick={load} style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Yangilash
        </button>
      </div>

      {/* Main Stats */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <StatCard icon={Users} label="Jami Foydalanuvchilar" value={stats.totalUsers} sub={`+${stats.newUsersToday} bugun`} />
        <StatCard icon={UserCheck} label="Bugun Faol" value={stats.activeToday} color="var(--cyan)" dimColor="var(--cyan-dim)" />
        <StatCard icon={UserPlus} label="Bu Hafta Yangi" value={stats.newUsersThisWeek} color="var(--purple)" dimColor="var(--purple-dim)" />
        <StatCard icon={Target} label="O'rtacha Kaloriya Maqsadi" value={Math.round(stats.avgCalorieTarget)} sub="kcal/kun" color="var(--amber)" dimColor="var(--amber-dim)" />
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <StatCard icon={Utensils} label="Jami Ovqat Yozuvlari" value={stats.totalMeals.toLocaleString()} sub={`${stats.totalCaloriesConsumed.toLocaleString()} kcal iste'mol`} color="var(--amber)" dimColor="var(--amber-dim)" />
        <StatCard icon={Dumbbell} label="Jami Mashq Yozuvlari" value={stats.totalWorkouts.toLocaleString()} sub={`${stats.totalCaloriesBurned.toLocaleString()} kcal sarflandi`} color="var(--cyan)" dimColor="var(--cyan-dim)" />
      </div>

      {/* Activity Chart */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 24, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700 }}>Kunlik Faollik (30 kun)</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ovqat yozuvlari va mashqlar soni</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={activity}>
            <defs>
              <linearGradient id="fillMeals" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#CCFF00" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#CCFF00" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillWorkouts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: '#55556a', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fill: '#55556a', fontSize: 10 }} />
            <Tooltip {...chartTooltipStyle} />
            <Area type="monotone" dataKey="meals_count" stroke="#CCFF00" fill="url(#fillMeals)" strokeWidth={2} name="Ovqatlar" />
            <Area type="monotone" dataKey="workouts_count" stroke="#22d3ee" fill="url(#fillWorkouts)" strokeWidth={2} name="Mashqlar" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Signups Chart */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 24, border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Kunlik Ro'yxatdan O'tishlar (30 kun)</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.dailySignups}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: '#55556a', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fill: '#55556a', fontSize: 10 }} allowDecimals={false} />
            <Tooltip {...chartTooltipStyle} />
            <Bar dataKey="count" fill="#CCFF00" radius={[6, 6, 0, 0]} name="Yangi foydalanuvchilar" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Distribution Charts */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { title: 'Maqsad Taqsimoti', data: goalData },
          { title: 'Jins Taqsimoti', data: genderData },
          { title: 'Fitness Daraja', data: fitnessData }
        ].map(chart => (
          <div key={chart.title} style={{ flex: 1, minWidth: 260, background: 'var(--bg-card)', borderRadius: 20, padding: 24, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{chart.title}</p>
            <ResponsiveContainer width="100%" height={200}>
              <RPieChart>
                <Pie data={chart.data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {chart.data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========== USERS LIST ========== */
function UsersList({ adminKey, onViewUser }) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api(`/users?search=${encodeURIComponent(search)}&limit=${limit}&offset=${page * limit}`, adminKey);
      setUsers(r.users);
      setTotal(r.total);
    } catch { }
    setLoading(false);
  }, [adminKey, search, page]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Foydalanuvchilar</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total} ta foydalanuvchi topildi</p>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
        <input
          type="search" placeholder="Ism, username yoki Telegram ID bo'yicha qidirish..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          style={{ width: '100%', paddingLeft: 40 }}
        />
      </div>

      {loading ? <LoadingState /> : (
        <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['ID', 'Ism', 'Username', 'Telegram ID', 'Maqsad', 'Vazn', 'Qo\'shilgan', ''].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-alt)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--neon-text)' }}>#{u.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{u.first_name || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>@{u.username || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-faint)', fontFamily: 'monospace' }}>{u.telegram_id}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8, background: u.goal === 'lose' ? 'var(--red-dim)' : u.goal === 'gain' ? 'var(--cyan-dim)' : 'var(--neon-dim)', color: u.goal === 'lose' ? 'var(--red)' : u.goal === 'gain' ? 'var(--cyan)' : 'var(--neon)' }}>
                      {u.goal || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{u.weight_kg ? `${u.weight_kg} kg` : '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-faint)' }}>{u.created_at ? u.created_at.slice(0, 10) : '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => onViewUser(u.id)} style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card-alt)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Eye size={13} /> Batafsil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card-alt)', color: 'var(--text)', cursor: 'pointer', opacity: page === 0 ? 0.3 : 1 }}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{page + 1} / {pages}</span>
              <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}
                style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card-alt)', color: 'var(--text)', cursor: 'pointer', opacity: page >= pages - 1 ? 0.3 : 1 }}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ========== USER DETAIL ========== */
function UserDetail({ adminKey, userId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/users/${userId}`, adminKey).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [adminKey, userId]);

  if (loading || !data) return <LoadingState />;
  const u = data.user;
  const s = data.stats;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
        <ChevronLeft size={16} /> Orqaga
      </button>

      {/* User Info Card */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 28, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, var(--neon-dim), var(--cyan-dim))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: 'var(--neon)' }}>
            {(u.first_name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>{u.first_name || 'Nomalum'}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>@{u.username || '—'} • TG ID: {u.telegram_id}</p>
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>Qo'shilgan: {u.created_at?.slice(0, 10)}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 20 }}>
          {[
            { l: 'Jins', v: u.gender === 'male' ? 'Erkak' : u.gender === 'female' ? 'Ayol' : u.gender || '—' },
            { l: 'Yosh', v: u.age || '—' },
            { l: 'Bo\'y', v: u.height_cm ? `${u.height_cm} sm` : '—' },
            { l: 'Vazn', v: u.weight_kg ? `${u.weight_kg} kg` : '—' },
            { l: 'Maqsad', v: u.goal || '—' },
            { l: 'Faollik', v: u.activity_level || '—' },
            { l: 'Daraja', v: u.fitness_level || '—' },
            { l: 'Kal. Maqsad', v: u.daily_calorie_target ? `${u.daily_calorie_target} kcal` : '—' }
          ].map(i => (
            <div key={i.l} style={{ flex: '1 0 120px', padding: '14px 16px', borderRadius: 14, background: 'var(--bg-card-alt)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{i.l}</p>
              <p style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{i.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <StatCard icon={Utensils} label="Jami Ovqatlar" value={s.totalMeals} sub={`${s.totalCaloriesConsumed.toLocaleString()} kcal`} color="var(--amber)" dimColor="var(--amber-dim)" />
        <StatCard icon={Dumbbell} label="Jami Mashqlar" value={s.totalWorkouts} sub={`${s.totalCaloriesBurned.toLocaleString()} kcal`} color="var(--cyan)" dimColor="var(--cyan-dim)" />
      </div>

      {/* Recent Meals & Workouts */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300, background: 'var(--bg-card)', borderRadius: 20, padding: 20, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>So'nggi Ovqatlar</p>
          {data.recentMeals.length === 0 ? <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Ma'lumot yo'q</p> :
            data.recentMeals.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < data.recentMeals.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{m.emoji || '🍽️'}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{m.logged_at?.slice(0, 16)}</p>
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber)' }}>{m.kcal} kcal</span>
              </div>
            ))
          }
        </div>

        <div style={{ flex: 1, minWidth: 300, background: 'var(--bg-card)', borderRadius: 20, padding: 20, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>So'nggi Mashqlar</p>
          {data.recentWorkouts.length === 0 ? <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Ma'lumot yo'q</p> :
            data.recentWorkouts.map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < data.recentWorkouts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{w.emoji || '🏋️'}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{w.exercise_name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{w.logged_at?.slice(0, 16)}</p>
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)' }}>{w.kcal} kcal</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

/* ========== MEALS LIST ========== */
function MealsList({ adminKey }) {
  const [meals, setMeals] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api(`/meals?limit=${limit}&offset=${page * limit}`, adminKey);
      setMeals(r.meals);
      setTotal(r.total);
    } catch { }
    setLoading(false);
  }, [adminKey, page]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>Ovqat Yozuvlari</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total} ta yozuv</p>
      </div>

      {loading ? <LoadingState /> : (
        <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['', 'Ovqat', 'Foydalanuvchi', 'Kaloriya', 'U/O/Y', 'Sana'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meals.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-alt)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontSize: 20 }}>{m.emoji || '🍽️'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{m.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{m.first_name || '—'} (@{m.username || '—'})</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--amber)' }}>{m.kcal} kcal</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-faint)' }}>{m.carbs || 0}g / {m.protein || 0}g / {m.fat || 0}g</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-faint)' }}>{m.logged_at?.slice(0, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pages > 1 && <Pagination page={page} pages={pages} setPage={setPage} />}
        </div>
      )}
    </div>
  );
}

/* ========== WORKOUTS LIST ========== */
function WorkoutsList({ adminKey }) {
  const [workouts, setWorkouts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api(`/workouts?limit=${limit}&offset=${page * limit}`, adminKey);
      setWorkouts(r.workouts);
      setTotal(r.total);
    } catch { }
    setLoading(false);
  }, [adminKey, page]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>Mashq Yozuvlari</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total} ta yozuv</p>
      </div>

      {loading ? <LoadingState /> : (
        <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['', 'Mashq', 'Foydalanuvchi', 'Kaloriya', 'Setlar', 'Sana'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workouts.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-alt)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontSize: 20 }}>{w.emoji || '🏋️'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{w.exercise_name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{w.first_name || '—'} (@{w.username || '—'})</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--cyan)' }}>{w.kcal} kcal</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{w.sets_completed || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-faint)' }}>{w.logged_at?.slice(0, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pages > 1 && <Pagination page={page} pages={pages} setPage={setPage} />}
        </div>
      )}
    </div>
  );
}

/* ========== SHARED COMPONENTS ========== */
function Pagination({ page, pages, setPage }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderTop: '1px solid var(--border)' }}>
      <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
        style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card-alt)', color: 'var(--text)', cursor: 'pointer', opacity: page === 0 ? 0.3 : 1 }}>
        <ChevronLeft size={16} />
      </button>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{page + 1} / {pages}</span>
      <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}
        style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card-alt)', color: 'var(--text)', cursor: 'pointer', opacity: page >= pages - 1 ? 0.3 : 1 }}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <RefreshCw size={28} color="var(--neon)" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>Yuklanmoqda...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

/* ========== MAIN APP ========== */
export default function App() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('zenfit_admin_key') || '');
  const [page, setPage] = useState('dashboard');
  const [selectedUserId, setSelectedUserId] = useState(null);

  const handleLogin = (key) => {
    sessionStorage.setItem('zenfit_admin_key', key);
    setAdminKey(key);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('zenfit_admin_key');
    setAdminKey('');
  };

  if (!adminKey) return <LoginScreen onLogin={handleLogin} />;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Foydalanuvchilar', icon: Users },
    { id: 'meals', label: 'Ovqatlar', icon: Utensils },
    { id: 'workouts', label: 'Mashqlar', icon: Dumbbell },
  ];

  const renderPage = () => {
    if (selectedUserId) return <UserDetail adminKey={adminKey} userId={selectedUserId} onBack={() => setSelectedUserId(null)} />;
    switch (page) {
      case 'dashboard': return <Dashboard adminKey={adminKey} />;
      case 'users': return <UsersList adminKey={adminKey} onViewUser={(id) => setSelectedUserId(id)} />;
      case 'meals': return <MealsList adminKey={adminKey} />;
      case 'workouts': return <WorkoutsList adminKey={adminKey} />;
      default: return <Dashboard adminKey={adminKey} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--neon)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={22} color="#000" />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>ZenFit</p>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--neon-text)' }}>Admin Panel</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => {
            const active = page === item.id && !selectedUserId;
            return (
              <button key={item.id} onClick={() => { setPage(item.id); setSelectedUserId(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, border: 'none', background: active ? 'var(--neon-dim)' : 'transparent', color: active ? 'var(--neon)' : 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                <item.icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <button onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--red)', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
            <LogOut size={16} /> Chiqish
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        {renderPage()}
      </main>
    </div>
  );
}
