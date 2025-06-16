import React from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './Statistics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Mock data (remplace par tes API)
const stats = {
  users: { total: 1200, newThisMonth: 85, pending: 12 },
  products: { total: 340, outOfStock: 7, newThisMonth: 15 },
  articles: { total: 58, newThisMonth: 4 },
  sales: { revenue: 15230.5, orders: 320, avgOrder: 47.6 },
};

const days = Array.from({ length: 30 }, (_, i) => `${i + 1}/05`);
const newUsers = days.map(() => Math.floor(Math.random() * 20) + 5);
const cumUsers = newUsers.reduce((acc, cur, i) => {
  acc.push((acc[i - 1] || 0) + cur);
  return acc;
}, []);

const revenue = days.map(() => Math.floor(Math.random() * 100000) + 50000);
const orders = days.map(() => Math.floor(Math.random() * 50) + 10);

const dataUsers = {
  labels: days,
  datasets: [
    {
      label: 'Nouveaux utilisateurs',
      data: newUsers,
      borderColor: 'var(--accent)',
      backgroundColor: 'rgba(240,2,2,0.3)',
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6
    },
    {
      label: 'Total cumulés',
      data: cumUsers,
      borderColor: 'var(--hover)',
      backgroundColor: 'rgba(48,63,159,0.3)',
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6
    }
  ]
};

const dataSales = {
  labels: days,
  datasets: [
    {
      label: 'CA (FCFA)',
      data: revenue,
      borderColor: 'var(--accent)',
      backgroundColor: 'rgba(240,2,2,0.3)',
      yAxisID: 'y1',
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6
    },
    {
      label: 'Commandes',
      data: orders,
      borderColor: 'var(--hover)',
      backgroundColor: 'rgba(48,63,159,0.3)',
      yAxisID: 'y2',
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6
    }
  ]
};

const dataCategories = {
  labels: ['Électronique','Vêtements','Alimentation','Maison','Autre'],
  datasets: [{
    data: [120,90,150,80,60],
    backgroundColor: [
      'var(--accent)','var(--hover)','#28a745','#ffc107','#17a2b8'
    ],
    hoverOffset: 8
  }]
};

const dataTopProducts = {
  labels: ['A','B','C','D','E'],
  datasets: [{
    label: 'Ventes',
    data: [240,200,180,160,140],
    backgroundColor: 'var(--accent)',
    borderRadius: 6,
    barPercentage: 0.6
  }]
};

const optionsDual = {
  scales: {
    y1: { type:'linear', position:'left', grid:{ drawOnChartArea:false }},
    y2: { type:'linear', position:'right', grid:{ drawOnChartArea:false }}
  },
  plugins: { legend:{ position:'bottom' }},
  animation: { duration: 800, easing: 'easeOutQuart' }
};

const optionsLine = {
  plugins: { legend:{ display:false }},
  animation:{ duration:800, easing:'easeOutQuart' }
};
const optionsPie = {
  plugins:{ legend:{ position:'bottom' }},
  animation:{ animateScale:true }
};
const optionsBar = {
  plugins:{ legend:{ display:false }},
  animation:{ duration:800, easing:'easeOutQuart' }
};

export default function Statistics() {
  return (
    <div className="stats-page">
      <h2 className="stats-title">Tableau de bord – Statistiques</h2>

      <div className="stats-grid">
        <div className="stat-card accent">
          <h3>Utilisateurs</h3>
          <p className="stat-value">{stats.users.total}</p>
          <p>+{stats.users.newThisMonth} ce mois</p>
          <p className="pending">En attente : {stats.users.pending}</p>
        </div>
        <div className="stat-card">
          <h3>Produits</h3>
          <p className="stat-value">{stats.products.total}</p>
          <p>Rupture : {stats.products.outOfStock}</p>
          <p>+{stats.products.newThisMonth} ce mois</p>
        </div>
        <div className="stat-card">
          <h3>Articles</h3>
          <p className="stat-value">{stats.articles.total}</p>
          <p>+{stats.articles.newThisMonth} ce mois</p>
        </div>
        <div className="stat-card accent">
          <h3>Ventes</h3>
          <p className="stat-value">{stats.sales.revenue.toFixed(2)} FCFA</p>
          <p>{stats.sales.orders} commandes</p>
          <p>Moyenne : {stats.sales.avgOrder.toFixed(2)} FCFA</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h4>Utilisateurs (30j)</h4>
          <Line data={dataUsers} options={optionsLine} />
        </div>
        <div className="chart-card">
          <h4>Ventes & commandes</h4>
          <Line data={dataSales} options={optionsDual} />
        </div>
        <div className="chart-card small">
          <h4>Top catégories</h4>
          <Pie data={dataCategories} options={optionsPie} />
        </div>
        <div className="chart-card small">
          <h4>Top produits</h4>
          <Bar data={dataTopProducts} options={optionsBar} />
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-placeholder">Heatmap d’activité</div>
        <div className="chart-placeholder">Timeline récente</div>
      </div>
    </div>
  );
}
