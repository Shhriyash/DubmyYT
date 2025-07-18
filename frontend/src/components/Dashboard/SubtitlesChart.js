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

const SubtitlesChart = () => {
  // Generate mock data for the last 30 days
  const generateMockData = () => {
    const dates = [];
    const subtitlesData = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Generate random but realistic usage data
      subtitlesData.push(Math.floor(Math.random() * 15) + Math.floor(Math.sin(i / 5) * 5) + 5);
    }
    
    return { dates, subtitlesData };
  };

  const { dates, subtitlesData } = generateMockData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 200,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          lineWidth: 1,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxTicksLimit: 10,
          font: {
            size: 11
          }
        },
        border: {
          display: false
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Number of Subtitles Generated',
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          lineWidth: 1,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
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
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(0, 212, 255, 0.5)',
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
        callbacks: {
          title: function(context) {
            return `Date: ${context[0].label}`;
          },
          label: function(context) {
            return `Subtitles Generated: ${context.parsed.y}`;
          }
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 8,
        borderWidth: 2,
        hoverBorderWidth: 3
      },
      line: {
        borderWidth: 3,
        tension: 0.4
      }
    }
  };

  const chartData = {
    labels: dates,
    datasets: [
      {
        label: 'Subtitles',
        data: subtitlesData,
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        pointBorderColor: '#00d4ff',
        pointBackgroundColor: '#00d4ff',
        pointHoverBackgroundColor: '#00d4ff',
        pointHoverBorderColor: '#ffffff',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 8,
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3
      }
    ]
  };

  const totalSubtitles = subtitlesData.reduce((a, b) => a + b, 0);
  const avgSubtitles = Math.round(totalSubtitles / subtitlesData.length);

  return (
    <div className="single-chart-container subtitles-chart">
      <div className="chart-header">
        <h3 style={{ color: '#00d4ff', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
          Subtitle Generation
        </h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', margin: 0 }}>
          Track your subtitle generation over the last 30 days
        </p>
      </div>
      
      <div className="chart-container">
        <Line 
          data={chartData} 
          options={chartOptions}
        />
      </div>
      
      <div className="chart-stats" style={{ justifyContent: 'space-around', marginTop: '1rem' }}>
        <div className="stat-item">
          <div className="stat-color subtitles-color"></div>
          <span className="stat-label">Total: </span>
          <span className="stat-value">{totalSubtitles}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Daily Avg: </span>
          <span className="stat-value">{avgSubtitles}</span>
        </div>
      </div>
    </div>
  );
};

export default SubtitlesChart;
