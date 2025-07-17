import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const UsageChart = () => {
  // Generate mock data for the last 30 days
  const generateMockData = () => {
    const dates = [];
    const subtitlesData = [];
    const summariesData = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Generate random but realistic usage data
      subtitlesData.push(Math.floor(Math.random() * 15) + Math.floor(Math.sin(i / 5) * 5) + 5);
      summariesData.push(Math.floor(Math.random() * 10) + Math.floor(Math.cos(i / 7) * 3) + 3);
    }
    
    return { dates, subtitlesData, summariesData };
  };

  const { dates, subtitlesData, summariesData } = generateMockData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
          color: '#9ca3af',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          maxTicksLimit: 8,
          font: {
            size: 11
          }
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Number of Uses',
          color: '#9ca3af',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          beginAtZero: true,
          font: {
            size: 11
          }
        },
        border: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: '#e5e7eb',
          font: {
            size: 13,
            weight: '500'
          },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          generateLabels: function(chart) {
            const original = ChartJS.defaults.plugins.legend.labels.generateLabels;
            const labels = original.call(this, chart);
            
            labels.forEach(label => {
              label.fillStyle = label.strokeStyle;
            });
            
            return labels;
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        intersect: false,
        mode: 'index',
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        padding: 12,
        caretPadding: 8,
        callbacks: {
          title: function(context) {
            return `Date: ${context[0].label}`;
          },
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value} uses`;
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.4, // Smooth curved lines
        borderWidth: 3
      },
      point: {
        radius: 4,
        hoverRadius: 8,
        borderWidth: 2,
        hoverBorderWidth: 3
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart'
    }
  };

  const chartData = {
    labels: dates,
    datasets: [
      {
        label: 'Subtitles',
        data: subtitlesData,
        borderColor: '#00d4ff', // Neon blue
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        pointBorderColor: '#00d4ff',
        pointBackgroundColor: '#00d4ff',
        pointHoverBackgroundColor: '#00d4ff',
        pointHoverBorderColor: '#ffffff',
        fill: false,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 8,
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        shadowColor: 'rgba(0, 212, 255, 0.5)',
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowOffsetY: 2
      },
      {
        label: 'Summaries',
        data: summariesData,
        borderColor: '#ff6b35', // Neon orange
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        pointBorderColor: '#ff6b35',
        pointBackgroundColor: '#ff6b35',
        pointHoverBackgroundColor: '#ff6b35',
        pointHoverBorderColor: '#ffffff',
        fill: false,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 8,
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        shadowColor: 'rgba(255, 107, 53, 0.5)',
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowOffsetY: 2
      }
    ]
  };

  return (
    <div className="usage-chart">
      <div className="chart-header">
        <h3>Track your subtitle and summary generation over the last 30 days</h3>
      </div>
      
      <div className="chart-container">
        <Line 
          data={chartData} 
          options={chartOptions}
        />
      </div>
      
      <div className="chart-stats">
        <div className="stat-item">
          <div className="stat-color subtitles-color"></div>
          <span className="stat-label">Total Subtitles: </span>
          <span className="stat-value">{subtitlesData.reduce((a, b) => a + b, 0)}</span>
        </div>
        <div className="stat-item">
          <div className="stat-color summaries-color"></div>
          <span className="stat-label">Total Summaries: </span>
          <span className="stat-value">{summariesData.reduce((a, b) => a + b, 0)}</span>
        </div>
      </div>
    </div>
  );
};

export default UsageChart;
